import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

import * as pino from 'pino';
import * as yargs from 'yargs';

import { BlueprintAssessmentObjectSchema, MinimalBlueprintAssessmentObject, FullBlueprintAssessmentObject } from './constants';
import { BlueprintAssessmentObject, ScheduleType } from './model';

export interface ConvertOptions extends yargs.Arguments {
  pathToConfiguration: string;
  useLatest: boolean;
}

const currentDirectory = process.cwd();

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string, useLatest: boolean): string => {
  generateDefaultConfiguration(log);

  const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
  const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));
  const snapshotConfigurationsFolderPath = path.join(currentDirectory, '/src/snapshot-configurations');
  const assessmentObjects: object[] = [];

  if (snapshotConfigurationsExist(snapshotConfigurationsFolderPath)) {
    log.info('Snapshot configurations folder found');
    try {
      const snapshotConfigurationsFileNames = fs.readdirSync(snapshotConfigurationsFolderPath);
      snapshotConfigurationsFileNames.forEach(snapshotConfigurationsFileName => {
        log.info(`Creating assessment object using snapshot configuration '${snapshotConfigurationsFileName}'`);
        const snapshotConfigurationFilePath = path.join(snapshotConfigurationsFolderPath, snapshotConfigurationsFileName);

        const assessmentObject = createAssessmentObject(log, snapshotConfigurationFilePath, userDefinedConfiguration, packageJson, useLatest);

        assessmentObjects.push(assessmentObject);
      });
    } catch (error) {
      log.error(`Can not read snapshot configuration file. Detailed error: \n\n ${error}`);
      process.exit(1);
    }
  } else {
    log.info('Snapshot configuration not found, converting to assessment object using only default snapshot configuration');
  }

  log.info('Creating assessment object using default snapshot configuration (defaults.json)');
  const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
  const defaultAssessmentObject = createAssessmentObject(log, defaultSnapshotConfigurationFilePath, userDefinedConfiguration, packageJson, useLatest);
  assessmentObjects.push(defaultAssessmentObject);

  validateAssessmentObjects(log, assessmentObjects);

  const assessmentObjectsString = JSON.stringify(assessmentObjects, null, 2);
  const pathToAssessmentObjectsDirectory = path.join(currentDirectory, '/src/snapshot-assessment-converter/assessments');
  const pathToAssessmentObjectsFile = path.join(pathToAssessmentObjectsDirectory, '/assessment-objects.json');
  if (!fs.existsSync(pathToAssessmentObjectsDirectory)) {
    fs.mkdirSync(pathToAssessmentObjectsDirectory, { recursive: true });
  }
  fs.writeFileSync(pathToAssessmentObjectsFile, assessmentObjectsString);

  return pathToAssessmentObjectsFile;
};

const loadUserDefinedConfiguration = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): BlueprintAssessmentObject => {
  let userDefinedConfigurationBuffer: Buffer;

  try {
    userDefinedConfigurationBuffer = fs.readFileSync(pathToUserDefinedConfiguration);
    log.info('User-defined assessment configuration found');
  } catch (error) {
    log.error(`User-defined assessment configuration file can not be found at the specified path. Please make sure the path is valid and the file is a valid json file. \n
    Specified path: ${pathToUserDefinedConfiguration}`);
    process.exit(1);
  }

  try {
    const userDefinedConfiguration = JSON.parse(userDefinedConfigurationBuffer.toString());
    return userDefinedConfiguration;
  } catch (error) {
    log.error(`Error parsing user-defined assessment configuration. Please make sure it is a valid json object. \n
    Detailed error: \n\n ${error}`);
    process.exit(1);
  }
};

const loadFile = (log: pino.BaseLogger, pathToFile: string): object => {
  const fileName = path.basename(pathToFile);
  try {
    const fileBuffer = fs.readFileSync(pathToFile);
    log.info(`${fileName} found`);
    return JSON.parse(fileBuffer.toString());
  } catch (error) {
    log.error(`${fileName} can not be found in the specified path. Please make sure the specified path is correct. \n
    Specified path: ${pathToFile}`);
    process.exit(1);
  }
};

const snapshotConfigurationsExist = (snapshotConfigurationsFolderPath: string): boolean => {
  try {
    const fileStatus = fs.statSync(snapshotConfigurationsFolderPath);
    return fileStatus.isDirectory();
  } catch (error) {
    return false;
  }
};

const createAssessmentObject = (
  log: pino.BaseLogger,
  snapshotConfigurationFilePath: string,
  userDefinedConfiguration: BlueprintAssessmentObject,
  packageJson: any,
  useLatest: boolean,
): object => {
  try {
    const snapshotConfigurationBuffer = fs.readFileSync(snapshotConfigurationFilePath);
    const snapshotConfiguration = JSON.parse(snapshotConfigurationBuffer.toString());
    const snapshotConfigurationBaseName = path.basename(snapshotConfigurationFilePath);
    const snapshotConfigurationName = snapshotConfigurationBaseName.substring(0, snapshotConfigurationBaseName.lastIndexOf('.'));

    const assessmentObject: BlueprintAssessmentObject = getDefaultAssessmentObject();

    // parse configuration
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

    if (userDefinedConfiguration.name) {
      assessmentObject.name = userDefinedConfiguration.name + '_' + getEntropy(entropyLength);
    } else {
      assessmentObject.name = assessmentObject.blueprintName + '_' + snapshotConfigurationName + '_' + getEntropy(entropyLength);
    }

    if (useLatest) {
      assessmentObject.blueprintVersion = packageJson.version;
    } else {
      if (userDefinedConfiguration.blueprintVersion) {
        assessmentObject.blueprintVersion = userDefinedConfiguration.blueprintVersion;
      }
    }

    if (userDefinedConfiguration.schedule) {
      assessmentObject.schedule.scheduleType = userDefinedConfiguration.schedule.scheduleType;

      if (userDefinedConfiguration.schedule.cronSchedule) {
        assessmentObject.schedule.cronSchedule = userDefinedConfiguration.schedule.cronSchedule;
      }
    }

    if (userDefinedConfiguration.timeoutInMinutes) {
      assessmentObject.timeoutInMinutes = userDefinedConfiguration.timeoutInMinutes;
    }

    let trimmedAssessmentProjectName = trimString(assessmentObject.blueprintName + '_' + snapshotConfigurationName);
    assessmentObject.stepConfigurations.createStep.assessmentProjectName = trimmedAssessmentProjectName + '_' + getEntropy(entropyLength);
    assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides = snapshotConfiguration;

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

    return assessmentObject;
  } catch (error) {
    log.error(`Something went wrong while creating assessment object. Detailed error: ${error}`);
    process.exit(1);
  }
};

const getDefaultAssessmentObject = (): BlueprintAssessmentObject => {
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

const trimString = (str: string): string => {
  const stringLength = str.length;
  const wantedStringLength = 64 - entropyLength - 1;
  if (stringLength > wantedStringLength) {
    str = str.substring(0, wantedStringLength);
  }

  return str;
};

const validateAssessmentObjects = (log: pino.BaseLogger, assessmentObjects: object[]): void => {
  const ajv = new Ajv();
  const validate = ajv.compile(BlueprintAssessmentObjectSchema);
  const isValid = validate(assessmentObjects);
  if (isValid) {
    log.info('Converted blueprint assessment object is valid');
  } else {
    log.error(`The converted blueprint assessment object is not valid. Please make sure all the fields are filled properly. \n
    Detailed error: \n\n ${JSON.stringify(validate.errors)}`);
    process.exit(1);
  }
};

const generateDefaultConfiguration = (log: pino.BaseLogger): void => {
  try {
    const pathToConfigFolder = path.join(currentDirectory, 'src/snapshot-assessment-converter/config');
    if (fs.existsSync(pathToConfigFolder)) {
      log.info('Configuration folder found, skip creating default configuration files');
    } else {
      log.info('Configuration folder not found, creating default configuration files');

      createFile(log, pathToConfigFolder, '/minimal.json', MinimalBlueprintAssessmentObject);
      createFile(log, pathToConfigFolder, '/full.json', FullBlueprintAssessmentObject);
      createFile(log, pathToConfigFolder, '/user-defined-assessment-configuration.json', MinimalBlueprintAssessmentObject);
    }
  } catch (error) {
    log.error(`Error accessing config folder. Detailed error: \n\n ${error}`);
    process.exit(1);
  }
};

const createFile = (log: pino.BaseLogger, pathToFolder: string, fileName: string, jsonObject: object): void => {
  try {
    fs.mkdirSync(pathToFolder, { recursive: true });
    const pathToFile = path.join(pathToFolder, fileName);
    const jsonObjectString = JSON.stringify(jsonObject, null, 2);
    fs.writeFileSync(pathToFile, jsonObjectString);
  } catch (error) {
    log.error(`Error making directory or writing to file. Detailed error: \n\n ${error}`);
    process.exit(1);
  }
};
