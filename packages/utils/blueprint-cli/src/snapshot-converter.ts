import fs from 'fs';
import path from 'path';

import * as pino from 'pino';
import * as yargs from 'yargs';

export interface ConvertOptions extends yargs.Arguments {
  pathToConfiguration: string;
}

/**
 * Converts configurations to BHS assessment objects.
 */
export const convertToAssessmentObjects = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): string => {
  const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
  const snapshotConfigurationsFolderPath = '../../blueprints/sam-serverless-app/src/snapshot-configurations'; //TODO: make this generic to accept different blueprints
  const assessmentObjects: any[] = [];

  if (snapshotConfigurationsExist(snapshotConfigurationsFolderPath)) {
    try {
      const snapshotConfigurationsFileNames = fs.readdirSync(snapshotConfigurationsFolderPath);
      snapshotConfigurationsFileNames.forEach(snapshotConfigurationsFileName => {
        const snapshotConfigurationsFilePath = path.join(snapshotConfigurationsFolderPath, snapshotConfigurationsFileName);
        const snapshotConfigurationBuffer = fs.readFileSync(snapshotConfigurationsFilePath);
        const snapshotConfiguration = JSON.parse(snapshotConfigurationBuffer.toString());

        const assessmentObject = createAssessmentObject(log, snapshotConfiguration, userDefinedConfiguration);
        assessmentObjects.push(assessmentObject);
      });
    } catch (error) {
      console.error('Error reading folder:', error);
    }
  } else {
    log.info('Snapshot configuration folder not found, converting to assessment object using default snapshot configuration');
  }

  const defaultAssessmentObject = createDefaultAssessmentObject(log, userDefinedConfiguration);
  assessmentObjects.push(defaultAssessmentObject);

  const assessmentObjectsString = JSON.stringify(assessmentObjects, null, 2);
  const pathToAssessmentObjects = '../assessment-objects.json.out'; //TODO: decide a directory to put assessment objects
  fs.writeFileSync(pathToAssessmentObjects, assessmentObjectsString);

  return pathToAssessmentObjects;
};

const loadUserDefinedConfiguration = (log: pino.BaseLogger, pathToUserDefinedConfiguration: string): any => {
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

const snapshotConfigurationsExist = (snapshotConfigurationsFolderPath: string): any => {
  try {
    const fileStatus = fs.statSync(snapshotConfigurationsFolderPath);
    return fileStatus.isDirectory();
  } catch (error) {
    return false;
  }
};

const createAssessmentObject = (log: pino.BaseLogger, snapshotConfiguration: any, userDefinedConfiguration: any): Promise<any> => {
  // TODO: do conversion here
  const assessmentObject = {
    ...snapshotConfiguration,
    ...userDefinedConfiguration,
  };

  log.info(`assessmentObject: ${assessmentObject}`);

  return assessmentObject;
};

const createDefaultAssessmentObject = (log: pino.BaseLogger, userDefinedConfiguration: any): Promise<any> => {
  try {
    const pathToDefaultSnapshotConfiguration = '../../blueprints/sam-serverless-app/src/defaults.json'; //TODO: make this generic to accept different blueprints
    const defaultSnapshotConfigurationBuffer = fs.readFileSync(pathToDefaultSnapshotConfiguration);
    const defaultSnapshotConfiguration = JSON.parse(defaultSnapshotConfigurationBuffer.toString());

    // TODO: do conversion here
    const assessmentObject = {
      ...defaultSnapshotConfiguration,
      ...userDefinedConfiguration,
    };

    return assessmentObject;
  } catch (error) {
    log.error('Default snapshot configuration not found');
    throw new Error('Default snapshot configuration can not be found');
  }
};
