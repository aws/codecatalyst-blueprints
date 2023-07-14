import * as crypto from 'crypto';
import deepmerge from 'deepmerge';
import pino from 'pino';
import { BlueprintTarget } from './derive-blueprint-target';
import { BlueprintAssessmentObject, ScheduleType } from './models';

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
