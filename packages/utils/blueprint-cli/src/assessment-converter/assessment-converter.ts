import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

import * as pino from 'pino';
import * as yargs from 'yargs';

import { BlueprintAssessmentObjectSchema } from './constants';
import { BlueprintAssessmentObject, ScheduleType } from './models';

export interface ConvertOptions extends yargs.Arguments {
  continuous: boolean;
  useLatest: boolean;
  wizardOptionsFolderPath: string;
  configurationsFilePath?: string;
}

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (
  log: pino.BaseLogger,
  rootDirectory: string,
  outputDirectoryFromRoot: string,
  continuous: boolean,
  useLatest: boolean,
  wizardOptionsFolderPath: string,
  configurationsFilePath?: string,
): string => {
  const configurations = loadFile(log, configurationsFilePath);
  const packageJson = loadFile(log, path.join(rootDirectory, '/package.json'));
  const outputDirectory = path.join(rootDirectory, outputDirectoryFromRoot);

  if (folderExists(wizardOptionsFolderPath)) {
    log.info('Wizard options folder found');
    const wizardOptionsFileNames = loadFolder(log, wizardOptionsFolderPath);

    wizardOptionsFileNames.forEach(wizardOptionsFileName => {
      log.info(`Creating assessment object using wizard options '${wizardOptionsFileName}'`);
      const wizardOptionsFilePath = path.join(wizardOptionsFolderPath, wizardOptionsFileName);
      const wizardOptions = loadFile(log, wizardOptionsFilePath);
      createAssessmentObject(log, outputDirectory, continuous, useLatest, packageJson, wizardOptions, wizardOptionsFileName, configurations);
    });
  } else {
    log.info('Snapshot configuration not found, converting to assessment object using only default wizard options');
  }

  const defaultWizardOptionsFileName = 'defaults.json';
  log.info(`Creating assessment object using default wizard options (${defaultWizardOptionsFileName})`);
  const defaultWizardOptionsFilePath = path.join(rootDirectory, `/src/${defaultWizardOptionsFileName}`);
  const defaultWizardOptions = loadFile(log, defaultWizardOptionsFilePath);
  createAssessmentObject(
    log,
    outputDirectory,
    continuous,
    useLatest,
    packageJson,
    defaultWizardOptions,
    defaultWizardOptionsFileName,
    configurations,
  );

  const assessmentObjectsFolderPath = path.join(rootDirectory, outputDirectoryFromRoot);
  return assessmentObjectsFolderPath;
};

export const loadFile = (log: pino.BaseLogger, filePath?: string): object | undefined => {
  if (!filePath) {
    return undefined;
  }

  const fileName = path.basename(filePath);
  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(filePath);
  } catch (error) {
    log.error(`File '${fileName}' can not be found in the specified path. Please make sure the specified path is correct. \n
    Specified path: ${filePath}`);
    throw new Error('File not found');
  }

  try {
    return JSON.parse(fileBuffer.toString());
  } catch (error) {
    log.error(`'Failed to parse file ${fileName}' to json object. Please make sure the file is a valid json file. \n
    Specified path: ${filePath}`);
    throw new Error('Error parsing file to json object');
  }
};

export const folderExists = (folderPath: string): boolean => {
  try {
    const status = fs.statSync(folderPath);
    return status.isDirectory();
  } catch (error) {
    return false;
  }
};

export const loadFolder = (log: pino.BaseLogger, folderPath: string): string[] => {
  try {
    return fs.readdirSync(folderPath);
  } catch (error) {
    log.error(`Failed to read folder path '${folderPath}'. \n Detailed error: \n ${error}`);
    throw new Error('Failed to read folder path');
  }
};

export const createAssessmentObject = (
  log: pino.BaseLogger,
  outputDirectory: string,
  continuous: boolean,
  useLatest: boolean,
  packageJson: any,
  wizardOptions: any,
  wizardOptionsFileName: string,
  configurations?: any,
): void => {
  const wizardOptionsFileTitle = wizardOptionsFileName.substring(0, wizardOptionsFileName.lastIndexOf('.'));
  const assessmentObject: BlueprintAssessmentObject = getDefaultAssessmentObject(packageJson, wizardOptionsFileTitle);

  if (configurations) {
    if (configurations.spaceName) {
      assessmentObject.spaceName = configurations.spaceName;
    }

    if (configurations.name) {
      assessmentObject.name = configurations.name + '_' + getEntropy(entropyLength);
    }

    if (configurations.blueprintName) {
      assessmentObject.blueprintName = configurations.blueprintName;
    }

    if (configurations.blueprintVersion) {
      assessmentObject.blueprintVersion = configurations.blueprintVersion;
    }

    if (configurations.schedule) {
      assessmentObject.schedule = { ...configurations.schedule };
    }

    if (configurations.timeoutInMinutes) {
      assessmentObject.timeoutInMinutes = configurations.timeoutInMinutes;
    }

    if (configurations.stepConfigurations) {
      if (configurations.stepConfigurations.createStep) {
        if (configurations.stepConfigurations.createStep.assessmentProjectName) {
          const trimmedAssessmentProjectName = trimString(configurations.stepConfigurations.createStep.assessmentProjectName);
          assessmentObject.stepConfigurations.createStep.assessmentProjectName = trimmedAssessmentProjectName + '_' + getEntropy(entropyLength);
        }

        if (configurations.stepConfigurations.createStep.blueprintOptionsOverrides) {
          assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides =
            configurations.stepConfigurations.createStep.blueprintOptionsOverrides;
        }
      }

      if (configurations.stepConfigurations.workflowsStep) {
        assessmentObject.stepConfigurations.workflowsStep = { ...configurations.stepConfigurations.workflowsStep };
      }

      if (configurations.stepConfigurations.cleanupStep) {
        assessmentObject.stepConfigurations.cleanupStep = { ...configurations.stepConfigurations.cleanupStep };
      }

      if (configurations.stepConfigurations.devEnvironmentStep) {
        assessmentObject.stepConfigurations.devEnvironmentStep = { ...configurations.stepConfigurations.devEnvironmentStep };
      }
    }
  }

  if (continuous) {
    assessmentObject.schedule.scheduleType = ScheduleType.CONTINUOUS;
  }
  if (useLatest) {
    assessmentObject.blueprintVersion = packageJson.version;
  }
  if (wizardOptions) {
    assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides = wizardOptions;
  }

  validateAssessmentObject(log, assessmentObject);

  writeToFile(log, assessmentObject, outputDirectory, wizardOptionsFileName);
};

export const getDefaultAssessmentObject = (packageJson: any, wizardOptionsFileTitle: string): BlueprintAssessmentObject => {
  const fullBlueprintName = packageJson.name;
  const firstDelimiter = '/';
  const indexOfFirstDelimiter = fullBlueprintName.indexOf(firstDelimiter);
  const nameWithSpaceAndBlueprint = fullBlueprintName.substring(indexOfFirstDelimiter + 1);
  const secondDelimiter = '.';
  const spaceName = nameWithSpaceAndBlueprint.substring(0, nameWithSpaceAndBlueprint.indexOf(secondDelimiter));
  const indexOfSecondDelimiter = nameWithSpaceAndBlueprint.indexOf(secondDelimiter);
  const blueprintName = nameWithSpaceAndBlueprint.substring(indexOfSecondDelimiter + 1);

  let trimmedAssessmentProjectName = trimString(blueprintName + '_' + wizardOptionsFileTitle);

  return {
    spaceName,
    name: blueprintName + '_' + wizardOptionsFileTitle + '_' + getEntropy(entropyLength),
    blueprintName,
    schedule: {
      scheduleType: ScheduleType.ONCE,
    },
    timeoutInMinutes: 60,
    stepConfigurations: {
      createStep: {
        assessmentProjectName: trimmedAssessmentProjectName + '_' + getEntropy(entropyLength),
      },
    },
  };
};

export const getEntropy = (length?: number) => (Math.random() + 1).toString(36).slice(2, 2 + (length || entropyLength));

const entropyLength = 5;

export const trimString = (str: string): string => {
  const stringLength = str.length;
  const wantedStringLength = 64 - entropyLength - 1;
  if (stringLength > wantedStringLength) {
    str = str.substring(0, wantedStringLength);
  }

  return str;
};

export const validateAssessmentObject = (log: pino.BaseLogger, assessmentObject: object): void => {
  const ajv = new Ajv();
  const validate = ajv.compile(BlueprintAssessmentObjectSchema);
  const isValid = validate(assessmentObject);
  if (isValid) {
    log.info('The converted blueprint assessment object is valid');
  } else {
    log.error(`The converted blueprint assessment object is not valid. Please make sure all the fields are filled properly. \n
    Detailed error: \n\n ${JSON.stringify(validate.errors)}`);
    throw new Error('Converted blueprint assessment object not valid');
  }
};

export const writeToFile = (log: pino.BaseLogger, jsonObject: object, outputDirectory: string, fileName: string): void => {
  const jsonObjectString = JSON.stringify(jsonObject, null, 2);

  if (!fs.existsSync(outputDirectory)) {
    try {
      fs.mkdirSync(outputDirectory, { recursive: true });
    } catch (error) {
      log.error(`Failed to create folder in the specified path. Please make sure the specified path is valid. \n
      Specified path: ${outputDirectory}`);
      throw new Error('Failed to create folder');
    }
  }
  const outputFilePath = path.join(outputDirectory, fileName);

  try {
    fs.writeFileSync(outputFilePath, jsonObjectString);
  } catch (error) {
    log.error(`Failed to write to file '${outputFilePath}'. \n Detailed error: \n ${error}`);
    throw new Error('Failed to write to file');
  }
};
