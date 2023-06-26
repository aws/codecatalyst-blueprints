import fs from 'fs';
import path from 'path';

import * as pino from 'pino';
import * as yargs from 'yargs';

import {
  BlueprintAssessmentObject,
  // BlueprintHealthAssessmentWorkflowRequirement,
  // BlueprintHealthAssessmentCleanupWorkflow,
  // BlueprintHealthAssessmentDevEnvironmentIDEConfiguration,
  // IdeConfiguration,
  ScheduleType,
} from './model';

export interface ConvertOptions extends yargs.Arguments {
  pathToConfiguration: string;
  useLatest: boolean;
}
//const currentDirectory = process.cwd();
const currentDirectory = path.join(process.cwd(), '/../../blueprints/sam-serverless-app');

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string, useLatest: boolean): string => {
  const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
  const packageJson = loadPackageJson(log, path.join(currentDirectory, '/package.json'));
  const snapshotConfigurationsFolderPath = path.join(currentDirectory, '/src/snapshot-configurations');
  const assessmentObjects: object[] = [];

  if (snapshotConfigurationsExist(snapshotConfigurationsFolderPath)) {
    log.info('Snapshot configurations found');
    try {
      const snapshotConfigurationsFileNames = fs.readdirSync(snapshotConfigurationsFolderPath);
      snapshotConfigurationsFileNames.forEach(snapshotConfigurationsFileName => {
        log.info(`Creating assessment object using snapshot configuration '${snapshotConfigurationsFileName}'`);
        const snapshotConfigurationFilePath = path.join(snapshotConfigurationsFolderPath, snapshotConfigurationsFileName);

        const assessmentObject = createAssessmentObject(log, snapshotConfigurationFilePath, userDefinedConfiguration, packageJson, useLatest);

        assessmentObjects.push(assessmentObject);
      });
    } catch (error) {
      log.error('Error reading folder:', error);
    }
  } else {
    log.info('Snapshot configuration not found, converting to assessment object using only default snapshot configuration');
  }

  log.info('Creating assessment object using default snapshot configuration (defaults.json)');
  const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
  const defaultAssessmentObject = createAssessmentObject(log, defaultSnapshotConfigurationFilePath, userDefinedConfiguration, packageJson, useLatest);
  assessmentObjects.push(defaultAssessmentObject);

  const assessmentObjectsString = JSON.stringify(assessmentObjects, null, 2);
  const pathToAssessmentObjectsDirectory = './src/snapshot-assessment-converter/assessments';
  const pathToAssessmentObjectsFile = `${pathToAssessmentObjectsDirectory}/assessment-objects.json`;
  if (!fs.existsSync(pathToAssessmentObjectsDirectory)) {
    fs.mkdirSync(pathToAssessmentObjectsDirectory, { recursive: true });
  }

  // create folder: /src/snapshot-assessment-converter/
  // In that folder, we have two folders:
  // Input: config/config.json + config/minimal.json + config/full.json
  // Output: assessments/assessment-objects.json

  fs.writeFileSync(pathToAssessmentObjectsFile, assessmentObjectsString);

  return pathToAssessmentObjectsFile;
};

const loadUserDefinedConfiguration = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): BlueprintAssessmentObject => {
  try {
    const userDefinedConfigurationBuffer = fs.readFileSync(pathToUserDefinedConfiguration);
    log.info('User-defined assessment configuration found');
    return JSON.parse(userDefinedConfigurationBuffer.toString());
  } catch (error) {
    log.error('User-defined assessment configuration not found');
    throw new Error(`User-defined assessment configuration file can not be found at the specified path. Please make sure the path is valid and the file exists. \n
    Specified path: ${pathToUserDefinedConfiguration} \n`);
  }
};

const loadPackageJson = (log: pino.BaseLogger, pathToPackageJson: string): object => {
  try {
    const packageJsonBuffer = fs.readFileSync(pathToPackageJson);
    log.info('package.json found');
    return JSON.parse(packageJsonBuffer.toString());
  } catch (error) {
    log.error('package.json not found');
    throw new Error(`package.json can not be found in the specified path. Please make sure the specified path is correct. \n
    Specified path: ${pathToPackageJson} \n`);
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

    // TODO: use instanceof (or similar function) to check if the final shape is valid
    // if (assessmentObject instanceof BlueprintAssessmentObject){
    // }

    log.info('This is placeholder log');

    return assessmentObject;
  } catch (error) {
    throw new Error(`Something went wrong while creating assessment object. Error: ${error}`);
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
