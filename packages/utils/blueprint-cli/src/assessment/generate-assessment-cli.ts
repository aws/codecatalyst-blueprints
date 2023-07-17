import * as fs from 'fs';
import * as path from 'path';
import pino from 'pino';
import * as yargs from 'yargs';
import { createAssessment } from './create-assessment';
import { deriveBlueprintTarget } from './derive-blueprint-target';
import { BlueprintAssessmentObject } from './models';
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

/**
 * CLI wrapper for general purpose use. Invoked by the CLI tooling
 * @param log - pino logger
 * @param cliOptions - cli options
 * @returns BlueprintAssessmentObject
 */
export const generateAssessmentCLI = (
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
