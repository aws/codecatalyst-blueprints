import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import deepmerge from 'deepmerge';
import pino from 'pino';
import * as yargs from 'yargs';
import { deriveBlueprintTarget } from './derive-blueprint-target';
import { BlueprintAssessmentObject, ScheduleType } from './models';
import { validateAssessment } from './validate-assessment';

export interface GenerateAssessmentCLIOptions extends yargs.Arguments {
  wizardOption: string;
  version?: string;
  configuration?: string;
  continuous: boolean;
  packageJson: string;

  /**
   * output file
   */
  out?: string;
}

export interface MinimalAssessmentDefault {
  name: string;
  schedule: {
    scheduleType: ScheduleType;
  };
  timeoutInMinutes: number;
  stepConfigurations: {
    createStep: {
      assessmentProjectName: string;
      blueprintOptionsOverrides: any;
    };
  };
}
export interface BlueprintTarget {
  package: string;
  version: string;
  space: string;
}

/**
 * helper function to create a sanitized project name derived from the blueprint
 */
const createDefaultProjectName = (log: pino.BaseLogger, blueprint: BlueprintTarget, assessmentName: string): string => {
  // it must be between 3 and 63 characters;
  const maxlength = 60;

  const hash = (input: string, length?: number): string => {
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .slice(0, length || 5);
  };

  const targetHash = hash(`${blueprint.package}-${blueprint.space}-${blueprint.version}-${assessmentName}`, 5);
  const invalidChars = ['@', '\\', '/', '`', "'", '"', ' ', '.'];
  const defaultProjectName = `${targetHash}_${blueprint.package.split('.').pop()}_${assessmentName}`
    .replace(new RegExp(`[${invalidChars.join('\\')}]`, 'g'), '-')
    .substring(0, maxlength);
  log.info(`Generated fallback project target name: ${defaultProjectName}`);
  return defaultProjectName;
};

/**
 * CLI wrapper for general purpose use. Invoked by the CLI tooling
 * @param log - pino logger
 * @param cliOptions - cli options
 * @returns BlueprintAssessmentObject
 */
export const generateAssessment = (
  log: pino.BaseLogger,
  cliOptions: GenerateAssessmentCLIOptions,
): {
  assessment: BlueprintAssessmentObject;
  out: string;
} => {
  const wizardOptions = JSON.parse(fs.readFileSync(cliOptions.wizardOption).toString());
  const wizardOptionsFileTitle = path.basename(cliOptions.wizardOption);
  log.info(`Specifying wizard option overrides from ${cliOptions.wizardOption}`);

  let additionalAssessmentConfiguration: Partial<BlueprintAssessmentObject> = {};
  if (cliOptions.configuration) {
    additionalAssessmentConfiguration = JSON.parse(fs.readFileSync(cliOptions.configuration).toString());
    const { validationResult, reasons } = validateAssessment(additionalAssessmentConfiguration, {
      fullSchema: false,
    });
    if (!validationResult) {
      log.error(`Parital assessment configuration at ${cliOptions.configuration} does not pass validation`);
      log.error(JSON.stringify(reasons));
      throw new Error('Assessment Validation Error');
    }
  }

  const blueprintTarget = deriveBlueprintTarget(
    log,
    {
      spaceName: additionalAssessmentConfiguration.spaceName,
      blueprintName: additionalAssessmentConfiguration.blueprintVersion,
      blueprintVersion: cliOptions.version || additionalAssessmentConfiguration.blueprintVersion,
    },
    cliOptions.packageJson,
  );

  const assessment = createAssessment(log, {
    continuous: cliOptions.continuous,
    wizardOptions,
    assessment: {
      name: additionalAssessmentConfiguration.name || wizardOptionsFileTitle,
      additionalConfig: additionalAssessmentConfiguration,
    },
    blueprint: blueprintTarget,
  });

  const out = cliOptions.out || `./assessments/jobs/${wizardOptionsFileTitle}`;
  const { validationResult, reasons } = validateAssessment(assessment, {
    fullSchema: true,
  });
  if (validationResult) {
    log.info(`Full Assessment at ${out} is passes schema validation. See BlueprintAssessmentObject`);
  } else {
    log.error(`Full Assessment at ${out} does NOT pass schema validation. See BlueprintAssessmentObject`);
    log.error(JSON.stringify(reasons, null, 2));
  }

  return {
    assessment,
    out,
  };
};

/**
 * transparently invoked by generateAssessment with destructured cli options
 * @param log
 * @param options
 * @returns BlueprintAssessmentObject
 */
export const createAssessment = (
  log: pino.BaseLogger,
  options: {
    continuous: boolean;
    wizardOptions: any;
    assessment: {
      name: string;
      additionalConfig: any;
    };
    blueprint: BlueprintTarget;
  },
): BlueprintAssessmentObject => {
  const defaultAssessmentObject = createDefaultAssessmentObject(log, {
    blueprint: options.blueprint,
    assessment: {
      name: options.assessment.name,
      schedule: {
        scheduleType: ScheduleType.ONCE,
      },
      timeoutInMinutes: 60,
      stepConfigurations: {
        createStep: {
          assessmentProjectName: createDefaultProjectName(log, options.blueprint, options.assessment.name),
          blueprintOptionsOverrides: {},
        },
      },
    },
  });

  const assessmentObject = deepmerge.all(
    [
      defaultAssessmentObject,
      options.assessment.additionalConfig,
      {
        stepConfigurations: {
          createStep: {
            blueprintOptionsOverrides: JSON.stringify(options.wizardOptions),
          },
        },
      },
    ],
    {
      arrayMerge(target, source, _options) {
        if (source) {
          return source;
        }
        return target;
      },
    },
  ) as BlueprintAssessmentObject;

  if (options.continuous) {
    assessmentObject.schedule.scheduleType = ScheduleType.CONTINUOUS;
  } else {
    assessmentObject.schedule.scheduleType = ScheduleType.ONCE;
  }
  return assessmentObject;
};

const createDefaultAssessmentObject = (
  _log: pino.BaseLogger,
  options: {
    blueprint: BlueprintTarget;
    assessment: MinimalAssessmentDefault;
  },
): BlueprintAssessmentObject => {
  return {
    spaceName: options.blueprint.space,
    blueprintName: options.blueprint.package,
    blueprintVersion: options.blueprint.version,

    name: options.assessment.name,
    schedule: options.assessment.schedule,
    timeoutInMinutes: options.assessment.timeoutInMinutes,
    stepConfigurations: options.assessment.stepConfigurations,
  };
};
