import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

import * as pino from 'pino';
import * as yargs from 'yargs';

import { BlueprintAssessmentObjectSchema } from './constants';
import { BlueprintAssessmentObject, ScheduleType } from './model';

export interface ConvertOptions extends yargs.Arguments {
  pathToConfiguration: string;
  continuous: boolean;
  useLatest: boolean;
}

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (
  log: pino.BaseLogger,
  currentDirectory: string,
  outputDirectory: string,
  pathToUserDefinedConfiguration: string,
  continuous: boolean,
  useLatest: boolean,
): string => {
  const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
  const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));
  const snapshotConfigurationsFolderPath = path.join(currentDirectory, '/src/snapshot-configurations');

  if (snapshotConfigurationsExist(snapshotConfigurationsFolderPath)) {
    log.info('Snapshot configurations folder found');
    let snapshotConfigurationsFileNames: string[];
    try {
      snapshotConfigurationsFileNames = fs.readdirSync(snapshotConfigurationsFolderPath);
    } catch (error) {
      log.error(`Can not read snapshot configuration file. Detailed error: \n\n ${error}`);
      throw new Error('Can not read snapshot configuration file');
    }

    snapshotConfigurationsFileNames.forEach(snapshotConfigurationsFileName => {
      log.info(`Creating assessment object using snapshot configuration '${snapshotConfigurationsFileName}'`);
      const snapshotConfigurationFilePath = path.join(snapshotConfigurationsFolderPath, snapshotConfigurationsFileName);
      createAssessmentObject(
        log,
        currentDirectory,
        snapshotConfigurationFilePath,
        packageJson,
        outputDirectory,
        continuous,
        useLatest,
        userDefinedConfiguration,
      );
    });
  } else {
    log.info('Snapshot configuration not found, converting to assessment object using only default snapshot configuration');
  }

  log.info('Creating assessment object using default snapshot configuration (defaults.json)');
  const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
  createAssessmentObject(
    log,
    currentDirectory,
    defaultSnapshotConfigurationFilePath,
    packageJson,
    outputDirectory,
    continuous,
    useLatest,
    userDefinedConfiguration,
  );

  const pathToAssessmentObjectsDirectory = path.join(currentDirectory, outputDirectory, '/assessments');
  return pathToAssessmentObjectsDirectory;
};

export const loadUserDefinedConfiguration = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): BlueprintAssessmentObject | undefined => {
  let userDefinedConfigurationBuffer: Buffer;
  try {
    userDefinedConfigurationBuffer = fs.readFileSync(pathToUserDefinedConfiguration);
    log.info('User-defined assessment configuration found');
  } catch (error) {
    log.info('User-defined assessment configuration file can not be found at the specified path, using default configuration');
    return undefined;
  }

  try {
    const userDefinedConfiguration = JSON.parse(userDefinedConfigurationBuffer.toString());
    return userDefinedConfiguration;
  } catch (error) {
    log.error(`Error parsing user-defined assessment configuration. Please make sure it is a valid json object. \n
    Detailed error: \n\n ${error}`);
    throw new Error('Error parsing user-defined assessment configuration');
  }
};

export const loadFile = (log: pino.BaseLogger, pathToFile: string): object => {
  const fileName = path.basename(pathToFile);
  try {
    const fileBuffer = fs.readFileSync(pathToFile);
    log.info(`${fileName} found`);
    return JSON.parse(fileBuffer.toString());
  } catch (error) {
    log.error(`'${fileName}' can not be found in the specified path. Please make sure the specified path is correct. \n
    Specified path: ${pathToFile}`);
    throw new Error(`'${fileName}' not found`);
  }
};

export const snapshotConfigurationsExist = (snapshotConfigurationsFolderPath: string): boolean => {
  try {
    const fileStatus = fs.statSync(snapshotConfigurationsFolderPath);
    return fileStatus.isDirectory();
  } catch (error) {
    return false;
  }
};

export const createAssessmentObject = (
  log: pino.BaseLogger,
  currentDirectory: string,
  snapshotConfigurationFilePath: string,
  packageJson: any,
  outputDirectory: string,
  continuous: boolean,
  useLatest: boolean,
  userDefinedConfiguration?: BlueprintAssessmentObject,
): void => {
  const assessmentObject: BlueprintAssessmentObject = getDefaultAssessmentObject();

  try {
    const snapshotConfigurationBuffer = fs.readFileSync(snapshotConfigurationFilePath);
    const snapshotConfiguration = JSON.parse(snapshotConfigurationBuffer.toString());
    const snapshotConfigurationBaseName = path.basename(snapshotConfigurationFilePath);
    const snapshotConfigurationName = snapshotConfigurationBaseName.substring(0, snapshotConfigurationBaseName.lastIndexOf('.'));

    // parse configurations
    const fullBlueprintName = packageJson.name;
    const firstDelimiter = '/';
    const indexOfFirstDelimiter = fullBlueprintName.indexOf(firstDelimiter);
    const nameWithSpaceAndBlueprint = fullBlueprintName.substring(indexOfFirstDelimiter + 1);
    const secondDelimiter = '.';
    const spaceName = nameWithSpaceAndBlueprint.substring(0, nameWithSpaceAndBlueprint.indexOf(secondDelimiter));
    const indexOfSecondDelimiter = nameWithSpaceAndBlueprint.indexOf(secondDelimiter);
    const blueprintName = nameWithSpaceAndBlueprint.substring(indexOfSecondDelimiter + 1);
    assessmentObject.spaceName = spaceName;
    assessmentObject.blueprintName = blueprintName;

    assessmentObject.name = assessmentObject.blueprintName + '_' + snapshotConfigurationName + '_' + getEntropy(entropyLength);
    if (useLatest) {
      assessmentObject.blueprintVersion = packageJson.version;
    }
    if (continuous) {
      assessmentObject.schedule.scheduleType = ScheduleType.CONTINUOUS;
    }

    let trimmedAssessmentProjectName = trimString(assessmentObject.blueprintName + '_' + snapshotConfigurationName);
    assessmentObject.stepConfigurations.createStep.assessmentProjectName = trimmedAssessmentProjectName + '_' + getEntropy(entropyLength);
    assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides = snapshotConfiguration;

    if (userDefinedConfiguration) {
      if (userDefinedConfiguration.name) {
        assessmentObject.name = userDefinedConfiguration.name + '_' + getEntropy(entropyLength);
      }

      if (useLatest) {
        assessmentObject.blueprintVersion = packageJson.version;
      } else {
        if (userDefinedConfiguration.blueprintVersion) {
          assessmentObject.blueprintVersion = userDefinedConfiguration.blueprintVersion;
        }
      }

      if (userDefinedConfiguration.schedule) {
        if (continuous) {
          assessmentObject.schedule.scheduleType = ScheduleType.CONTINUOUS;
        } else {
          assessmentObject.schedule.scheduleType = userDefinedConfiguration.schedule.scheduleType;
        }

        if (userDefinedConfiguration.schedule.cronSchedule) {
          assessmentObject.schedule.cronSchedule = userDefinedConfiguration.schedule.cronSchedule;
        }
      }

      if (userDefinedConfiguration.timeoutInMinutes) {
        assessmentObject.timeoutInMinutes = userDefinedConfiguration.timeoutInMinutes;
      }

      if (userDefinedConfiguration.stepConfigurations) {
        if (userDefinedConfiguration.stepConfigurations.createStep) {
          if (userDefinedConfiguration.stepConfigurations.createStep.assessmentProjectName) {
            trimmedAssessmentProjectName = trimString(userDefinedConfiguration.stepConfigurations.createStep.assessmentProjectName);
            assessmentObject.stepConfigurations.createStep.assessmentProjectName = trimmedAssessmentProjectName + '_' + getEntropy(entropyLength);
          }
          if (userDefinedConfiguration.stepConfigurations.createStep.blueprintOptionsOverrides) {
            assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides =
              userDefinedConfiguration.stepConfigurations.createStep.blueprintOptionsOverrides;
          }
        }

        if (userDefinedConfiguration.stepConfigurations.workflowsStep) {
          assessmentObject.stepConfigurations.workflowsStep = { ...userDefinedConfiguration.stepConfigurations.workflowsStep };
        }

        if (userDefinedConfiguration.stepConfigurations.cleanupStep) {
          assessmentObject.stepConfigurations.cleanupStep = { ...userDefinedConfiguration.stepConfigurations.cleanupStep };
        }

        if (userDefinedConfiguration.stepConfigurations.devEnvironmentStep) {
          assessmentObject.stepConfigurations.devEnvironmentStep = { ...userDefinedConfiguration.stepConfigurations.devEnvironmentStep };
        }
      }
    }
  } catch (error) {
    log.error(`Something went wrong while creating assessment object. Detailed error: \n ${error}`);
    throw new Error('Error creating assessment object');
  }

  validateAssessmentObject(log, assessmentObject);

  const assessmentObjectString = JSON.stringify(assessmentObject, null, 2);
  const pathToAssessmentObjectDirectory = path.join(currentDirectory, outputDirectory, '/assessments');
  const assessmentObjectFullFileName = path.basename(snapshotConfigurationFilePath);
  const pathToAssessmentObjectFile = path.join(pathToAssessmentObjectDirectory, assessmentObjectFullFileName);
  if (!fs.existsSync(pathToAssessmentObjectDirectory)) {
    fs.mkdirSync(pathToAssessmentObjectDirectory, { recursive: true });
  }
  fs.writeFileSync(pathToAssessmentObjectFile, assessmentObjectString);
};

export const getDefaultAssessmentObject = (): BlueprintAssessmentObject => {
  return {
    spaceName: '',
    name: '',
    blueprintName: '',
    schedule: {
      scheduleType: ScheduleType.ONCE,
    },
    timeoutInMinutes: 60,
    stepConfigurations: {
      createStep: {
        assessmentProjectName: '',
      },
    },
  };
};

const getEntropy = (length?: number) => (Math.random() + 1).toString(36).slice(2, 2 + (length || entropyLength));

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
