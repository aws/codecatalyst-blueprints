import fs from 'fs';
import path from 'path';

import * as pino from 'pino';
import * as yargs from 'yargs';

export interface ConvertOptions extends yargs.Arguments {
  pathToConfiguration: string;
}

export interface BlueprintAssessmentObject {
  spaceName: string;
  name: string;
  blueprintName: string;
  blueprintVersion?: string;
  schedule: {
    scheduleType: ScheduleType;
    cronSchedule?: string;
  };
  timeoutInMinutes: number;
  stepConfigurations: {
    createStep: {
      assessmentProjectName: string;
      blueprintOptionsOverrides?: string;
    };
    workflowsStep?: {
      timeoutInMinutes?: number;
      verifyWorkflowsExist?: BlueprintHealthAssessmentWorkflowRequirement[];
      verifyWorkflowRunsSucceed?: BlueprintHealthAssessmentWorkflowRequirement[];
    };
    cleanupStep?: {
      timeoutInMinutes?: number;
      cleanupWorkflows: BlueprintHealthAssessmentCleanupWorkflow[];
    };
    devEnvironmentStep?: {
      devEnvironmentConfigurations: BlueprintHealthAssessmentDevEnvironmentIDEConfiguration[];
    };
  };
}

export interface BlueprintHealthAssessmentWorkflowRequirement {
  workflowNameRegex: string;
  expectedCount: number;
}

export interface BlueprintHealthAssessmentCleanupWorkflow {
  workflowNameRegex: string;
}

export interface BlueprintHealthAssessmentDevEnvironmentIDEConfiguration {
  sourceRepositoryRegex: string;
  sourceBranchName?: string;
  alias: string;
  instanceType: DevEnvironmentInstanceType;
  inactivityTimeoutMinutes: number;
  ides: IdeConfiguration[];
  persistentStorage: DevEnvironmentPeristentStorage;
  startDevEnvironmentOnCreate?: boolean;
  validateDevEnvironment?: BlueprintHealthAssessmentValidateDevEnvironmentConfiguration[];
}

export interface IdeConfiguration {
  name?: DevEnvironmentIdes;
  runtime?: DevEnvironmentCloud9Runtimes;
}

export interface BlueprintHealthAssessmentValidateDevEnvironmentConfiguration {
  validateDevEnvironment: boolean;
  validatePostStartEvents?: boolean;
}

export enum ScheduleType {
  ONCE = 'ONCE',
  CONTINUOUS = 'CONTINUOUS',
}

export enum DevEnvironmentInstanceType {
  DEV_STANDARD1_SMALL = 'dev.standard1.small',
  DEV_STANDARD1_MEDIUM = 'dev.standard1.medium',
  DEV_STANDARD1_LARGE = 'dev.standard1.large',
  DEV_STANDARD2_XLARGE = 'dev.standard2.xlarge',
}

export enum DevEnvironmentIdes {
  CLOUD9 = 'Cloud9',
}

export enum DevEnvironmentCloud9Runtimes {
  VERSION_2_5_1 = 'public.ecr.aws/q6e8p2q0/cloud9-ide-runtime:2.5.1',
  LATEST = 'public.ecr.aws/q6e8p2q0/cloud9-ide-runtime:latest',
}

export enum DevEnvironmentPeristentStorage {
  GB_16 = 16,
  GB_32 = 32,
  GB_64 = 64,
}

//const currentDirectory = process.cwd();
const currentDirectory = path.join(process.cwd(), '/../../blueprints/sam-serverless-app');

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): string => {
  const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
  const packageJson = loadPackageJson(log, path.join(currentDirectory, '/package.json'));
  const snapshotConfigurationsFolderPath = path.join(currentDirectory, '/src/snapshot-configurations');
  const assessmentObjects: object[] = [];

  if (snapshotConfigurationsExist(snapshotConfigurationsFolderPath)) {
    log.info('Snapshot configurations exist');
    try {
      const snapshotConfigurationsFileNames = fs.readdirSync(snapshotConfigurationsFolderPath);
      snapshotConfigurationsFileNames.forEach(snapshotConfigurationsFileName => {
        log.info(`Creating assessment object using snapshot configuration '${snapshotConfigurationsFileName}'`);
        const snapshotConfigurationsFilePath = path.join(snapshotConfigurationsFolderPath, snapshotConfigurationsFileName);

        const assessmentObject = createAssessmentObject(log, snapshotConfigurationsFilePath, userDefinedConfiguration, packageJson);

        assessmentObjects.push(assessmentObject);
      });
    } catch (error) {
      log.error('Error reading folder:', error);
    }
  } else {
    log.info('Snapshot configuration folder not found, converting to assessment object using only default snapshot configuration');
  }

  log.info('Creating assessment object using default snapshot configuration (defaults.json)');
  const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
  const defaultAssessmentObject = createAssessmentObject(log, defaultSnapshotConfigurationFilePath, userDefinedConfiguration, packageJson);
  assessmentObjects.push(defaultAssessmentObject);

  const assessmentObjectsString = JSON.stringify(assessmentObjects, null, 2);
  const pathToAssessmentObjects = './assessment-objects.json';
  fs.writeFileSync(pathToAssessmentObjects, assessmentObjectsString);

  return pathToAssessmentObjects;
};

const loadUserDefinedConfiguration = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): BlueprintAssessmentObject => {
  try {
    const userDefinedConfigurationBuffer = fs.readFileSync(pathToUserDefinedConfiguration);
    log.info(`User-defined configuration found, configuration body: \n ${userDefinedConfigurationBuffer}`);
    return JSON.parse(userDefinedConfigurationBuffer.toString());
  } catch (error) {
    log.error('User-defined configuration file not found');
    throw new Error(`User-defined configuration file can not be found at the specified path. Please make sure the path is valid and the file exists. \n
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
): object => {
  const snapshotConfigurationFileName = path.basename(snapshotConfigurationFilePath);

  try {
    const snapshotConfigurationBuffer = fs.readFileSync(snapshotConfigurationFilePath);
    const snapshotConfiguration = JSON.parse(snapshotConfigurationBuffer.toString());

    //const assessmentObject: BlueprintAssessmentObject = JSON.parse(JSON.stringify(DEFAULT_ASSESSMENT_OBJECT));
    const assessmentObject: BlueprintAssessmentObject = getDefaultAssessmentObject();

    // parse configuration
    if (packageJson.name) {
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
    }

    if (userDefinedConfiguration.name) {
      assessmentObject.name = userDefinedConfiguration.name + '-' + getEntropy(5);
    }

    if (userDefinedConfiguration.blueprintVersion) {
      assessmentObject.blueprintVersion = userDefinedConfiguration.blueprintVersion;
    }

    if (userDefinedConfiguration.schedule) {
      if (userDefinedConfiguration.schedule.scheduleType) {
        assessmentObject.schedule.scheduleType = userDefinedConfiguration.schedule.scheduleType;
      }
      if (userDefinedConfiguration.schedule.cronSchedule) {
        assessmentObject.schedule.cronSchedule = userDefinedConfiguration.schedule.cronSchedule;
      }
    }

    if (userDefinedConfiguration.timeoutInMinutes) {
      assessmentObject.timeoutInMinutes = userDefinedConfiguration.timeoutInMinutes;
    }

    assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides = snapshotConfiguration;

    if (userDefinedConfiguration.stepConfigurations) {
      if (userDefinedConfiguration.stepConfigurations.createStep) {
        if (userDefinedConfiguration.stepConfigurations.createStep.assessmentProjectName) {
          assessmentObject.stepConfigurations.createStep.assessmentProjectName =
            userDefinedConfiguration.stepConfigurations.createStep.assessmentProjectName + '-' + getEntropy(5);
        }
        if (userDefinedConfiguration.stepConfigurations.createStep.blueprintOptionsOverrides) {
          assessmentObject.stepConfigurations.createStep.blueprintOptionsOverrides =
            userDefinedConfiguration.stepConfigurations.createStep.blueprintOptionsOverrides;
        }
      }
      if (userDefinedConfiguration.stepConfigurations.workflowsStep) {
        assessmentObject.stepConfigurations.workflowsStep = {};
        if (userDefinedConfiguration.stepConfigurations.workflowsStep.timeoutInMinutes) {
          assessmentObject.stepConfigurations.workflowsStep.timeoutInMinutes =
            userDefinedConfiguration.stepConfigurations.workflowsStep.timeoutInMinutes;
        }
        if (userDefinedConfiguration.stepConfigurations.workflowsStep.verifyWorkflowsExist) {
          assessmentObject.stepConfigurations.workflowsStep.verifyWorkflowsExist = [];
          const userDefinedVerifyWorkflowsExistList: BlueprintHealthAssessmentWorkflowRequirement[] =
            userDefinedConfiguration.stepConfigurations.workflowsStep.verifyWorkflowsExist;
          for (let userDefinedVerifyWorkflowsExistItem of userDefinedVerifyWorkflowsExistList) {
            if (userDefinedVerifyWorkflowsExistItem.workflowNameRegex && userDefinedVerifyWorkflowsExistItem.expectedCount) {
              assessmentObject.stepConfigurations.workflowsStep.verifyWorkflowsExist.push({
                workflowNameRegex: userDefinedVerifyWorkflowsExistItem.workflowNameRegex,
                expectedCount: userDefinedVerifyWorkflowsExistItem.expectedCount,
              });
            }
          }
        }

        if (userDefinedConfiguration.stepConfigurations.workflowsStep.verifyWorkflowRunsSucceed) {
          assessmentObject.stepConfigurations.workflowsStep.verifyWorkflowRunsSucceed = [];
          const userDefinedVerifyWorkflowRunsSucceedList: BlueprintHealthAssessmentWorkflowRequirement[] =
            userDefinedConfiguration.stepConfigurations.workflowsStep.verifyWorkflowRunsSucceed;
          for (let userDefinedVerifyWorkflowRunsSucceedItem of userDefinedVerifyWorkflowRunsSucceedList) {
            if (userDefinedVerifyWorkflowRunsSucceedItem.workflowNameRegex && userDefinedVerifyWorkflowRunsSucceedItem.expectedCount) {
              assessmentObject.stepConfigurations.workflowsStep.verifyWorkflowRunsSucceed.push({
                workflowNameRegex: userDefinedVerifyWorkflowRunsSucceedItem.workflowNameRegex,
                expectedCount: userDefinedVerifyWorkflowRunsSucceedItem.expectedCount,
              });
            }
          }
        }
      }

      if (userDefinedConfiguration.stepConfigurations.cleanupStep) {
        assessmentObject.stepConfigurations.cleanupStep = {
          cleanupWorkflows: [],
        };

        if (userDefinedConfiguration.stepConfigurations.cleanupStep.timeoutInMinutes) {
          assessmentObject.stepConfigurations.cleanupStep.timeoutInMinutes = userDefinedConfiguration.stepConfigurations.cleanupStep.timeoutInMinutes;
        }
        if (userDefinedConfiguration.stepConfigurations.cleanupStep.cleanupWorkflows) {
          const userDefinedCleanupWorkflowsList: BlueprintHealthAssessmentCleanupWorkflow[] =
            userDefinedConfiguration.stepConfigurations.cleanupStep.cleanupWorkflows;
          for (let userDefinedCleanupWorkflowsItem of userDefinedCleanupWorkflowsList) {
            if (userDefinedCleanupWorkflowsItem.workflowNameRegex) {
              assessmentObject.stepConfigurations.cleanupStep.cleanupWorkflows.push({
                workflowNameRegex: userDefinedCleanupWorkflowsItem.workflowNameRegex,
              });
            }
          }
        }
      }

      if (userDefinedConfiguration.stepConfigurations.devEnvironmentStep) {
        assessmentObject.stepConfigurations.devEnvironmentStep = {
          devEnvironmentConfigurations: [],
        };
        if (userDefinedConfiguration.stepConfigurations.devEnvironmentStep.devEnvironmentConfigurations) {
          const userDefinedDevEnvironmentConfigurationsList: BlueprintHealthAssessmentDevEnvironmentIDEConfiguration[] =
            userDefinedConfiguration.stepConfigurations.devEnvironmentStep.devEnvironmentConfigurations;
          for (let userDefinedDevEnvironmentConfigurationsItem of userDefinedDevEnvironmentConfigurationsList) {
            const requiredDevEnvironmentConfigurations = [
              'sourceRepositoryRegex',
              'alias',
              'instanceType',
              'inactivityTimeoutMinutes',
              'persistentStorage',
            ];

            requiredDevEnvironmentConfigurations.forEach(requiredDevEnvironmentConfiguration => {
              if (!userDefinedDevEnvironmentConfigurationsItem.hasOwnProperty(requiredDevEnvironmentConfiguration)) {
                log.error(
                  `Element ${requiredDevEnvironmentConfiguration} not found. Please make sure it is included in 'devEnvironmentConfigurations'.`,
                );
                process.exit(1);
              }
            });

            const ides: IdeConfiguration[] = [];
            if (userDefinedDevEnvironmentConfigurationsItem.ides) {
              for (let userDefinedIde of userDefinedDevEnvironmentConfigurationsItem.ides) {
                const ide: IdeConfiguration = {};
                if (userDefinedIde.name) {
                  ide.name = userDefinedIde.name;
                }
                if (userDefinedIde.runtime) {
                  ide.runtime = userDefinedIde.runtime;
                }
                ides.push(ide);
              }
            }

            assessmentObject.stepConfigurations.devEnvironmentStep.devEnvironmentConfigurations.push({
              sourceRepositoryRegex: userDefinedDevEnvironmentConfigurationsItem.sourceRepositoryRegex,
              alias: userDefinedDevEnvironmentConfigurationsItem.alias,
              instanceType: userDefinedDevEnvironmentConfigurationsItem.instanceType,
              inactivityTimeoutMinutes: userDefinedDevEnvironmentConfigurationsItem.inactivityTimeoutMinutes,
              ides: ides,
              persistentStorage: userDefinedDevEnvironmentConfigurationsItem.persistentStorage,
            });
          }
        }
      }
    }

    return assessmentObject;
  } catch (error) {
    log.error(`Actual error message: ${error}`);
    log.error(`${snapshotConfigurationFileName} not found`);
    throw new Error(`${snapshotConfigurationFileName} can not be found in the specified path. Please make sure the specified path is correct and the file exists. \n
    Specified path: ${snapshotConfigurationFilePath} \n`);
  }
};

const getEntropy = (length?: number) => (Math.random() + 1).toString(36).slice(2, 2 + (length || 5));

const getDefaultAssessmentObject = (): BlueprintAssessmentObject => {
  return {
    spaceName: '',
    name: 'default-assessment-name' + '-' + getEntropy(5),
    blueprintName: '',
    schedule: {
      scheduleType: ScheduleType.ONCE,
    },
    timeoutInMinutes: 60,
    stepConfigurations: {
      createStep: {
        assessmentProjectName: 'default-assessment-project-name' + '-' + getEntropy(5),
      },
    },
  };
};
