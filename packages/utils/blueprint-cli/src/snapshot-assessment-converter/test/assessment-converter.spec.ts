import fs from 'fs';
import path from 'path';

import * as pino from 'pino';

import {
  convertToAssessmentObjects,
  createAssessmentObject,
  getDefaultAssessmentObject,
  loadFile,
  loadUserDefinedConfiguration,
  snapshotConfigurationsExist,
  trimString,
  validateAssessmentObject,
} from '../assessment-converter';
import { BlueprintAssessmentObject } from '../model';
import * as validAssessmentObject from './valid-assessment-object.json';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

const currentDirectory = path.join(process.cwd(), '../../blueprints/sam-serverless-app/');
const outputDirectory = '/src/snapshot-assessment-converter/test';

describe('Verifies that the output blueprint assessment object is valid', () => {
  beforeEach(() => {
    // mock pino log to silence logs in terminal
    jest.spyOn(log, 'info').mockImplementation(() => {});
    jest.spyOn(log, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Test function 'convertToAssessmentObjects' success case", () => {
    const filePath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test/assessments/defaults.json');
    const directoryPath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test');

    afterAll(() => {
      if (fs.existsSync(filePath)) {
        fs.rmdirSync(directoryPath, { recursive: true });
      }
    });

    it('should return the path to assessment objects directory', () => {
      const pathToConfiguration = path.join(
        currentDirectory,
        'src/snapshot-assessment-converter/test/config/user-defined-assessment-configuration.json',
      );
      const pathToAssessmentObjectsDirectory = convertToAssessmentObjects(log, currentDirectory, outputDirectory, pathToConfiguration, false, false);
      expect(pathToAssessmentObjectsDirectory).toBe(path.join(currentDirectory, '/src/snapshot-assessment-converter/test/assessments'));
    });
  });

  describe("Test function 'loadUserDefinedConfiguration' success case", () => {
    const filePath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test/config/user-defined-assessment-configuration.json');
    const directoryPath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test');

    afterAll(() => {
      if (fs.existsSync(filePath)) {
        fs.rmdirSync(directoryPath, { recursive: true });
      }
    });

    it('should return user-defined configuration', () => {
      generateDefaultConfiguration();

      const pathToUserDefinedConfiguration = path.join(
        currentDirectory,
        'src/snapshot-assessment-converter/test/config/user-defined-assessment-configuration.json',
      );

      const userDefinedConfiguration = loadUserDefinedConfiguration(log, pathToUserDefinedConfiguration);
      expect(userDefinedConfiguration!.toString()).toBe(validAssessmentObject.toString());
    });
  });

  describe("Test function 'loadFile' failed case", () => {
    it('should throw a loading error', () => {
      expect(() => {
        loadFile(log, '');
      }).toThrow();
    });
  });

  describe("Test function 'snapshotConfigurationsExist' success case", () => {
    it('should able to find snapshot configurations', () => {
      const snapshotConfigurationsFolderPath = path.join(currentDirectory, 'src/snapshot-configurations');
      expect(snapshotConfigurationsExist(snapshotConfigurationsFolderPath)).toBe(true);
    });
  });

  describe("Test function 'snapshotConfigurationsExist' failed case", () => {
    it('should throw a loading error', () => {
      expect(snapshotConfigurationsExist('')).toBe(false);
    });
  });

  describe("Test function 'createAssessmentObject' success case", () => {
    const filePath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test/assessments/defaults.json');
    const directoryPath = path.join(currentDirectory, 'src/snapshot-assessment-converter/test');

    afterAll(() => {
      if (fs.existsSync(filePath)) {
        fs.rmdirSync(directoryPath, { recursive: true });
      }
    });

    it('should create a valid assessment object', () => {
      generateDefaultConfiguration();

      const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
      const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));

      createAssessmentObject(
        log,
        currentDirectory,
        defaultSnapshotConfigurationFilePath,
        packageJson,
        outputDirectory,
        true,
        true,
        validAssessmentObject as BlueprintAssessmentObject,
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create a valid assessment object', () => {
      generateDefaultConfiguration();

      const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
      const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));

      createAssessmentObject(
        log,
        currentDirectory,
        defaultSnapshotConfigurationFilePath,
        packageJson,
        outputDirectory,
        true,
        false,
        validAssessmentObject as BlueprintAssessmentObject,
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create a valid assessment object', () => {
      generateDefaultConfiguration();

      const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
      const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));

      createAssessmentObject(
        log,
        currentDirectory,
        defaultSnapshotConfigurationFilePath,
        packageJson,
        outputDirectory,
        false,
        true,
        validAssessmentObject as BlueprintAssessmentObject,
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create a valid assessment object', () => {
      generateDefaultConfiguration();

      const defaultSnapshotConfigurationFilePath = path.join(currentDirectory, '/src/defaults.json');
      const packageJson = loadFile(log, path.join(currentDirectory, '/package.json'));

      createAssessmentObject(
        log,
        currentDirectory,
        defaultSnapshotConfigurationFilePath,
        packageJson,
        outputDirectory,
        false,
        false,
        validAssessmentObject as BlueprintAssessmentObject,
      );
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe("Test function 'getDefaultAssessmentObject' success case", () => {
    it('should return default assessment object', () => {
      const assessmentObject = getDefaultAssessmentObject();
      expect(assessmentObject.toString()).toBe(validAssessmentObject.toString());
    });
  });

  describe("Test function 'trimString' success case", () => {
    const entropyLength = 5;

    it('should trim the string to have a length of (64 - entropy length - 1) or less', () => {
      const trimmedString = trimString('1234567890123456789012345678901234567890123456789012345678901234567890');
      expect(trimmedString.length).toBe(64 - entropyLength - 1);
    });
  });

  describe("Test function 'validateAssessmentObject' failed case", () => {
    it('should throw a validation error', () => {
      expect(() => {
        validateAssessmentObject(log, {});
      }).toThrow();
    });
  });

  describe("Test function 'createFile' success case", () => {
    it('should throw a validation error', () => {
      expect(() => {
        validateAssessmentObject(log, {});
      }).toThrow();
    });
  });
});

const generateDefaultConfiguration = (): void => {
  const pathToConfigFolder = path.join(currentDirectory, outputDirectory, '/config');
  if (fs.existsSync(pathToConfigFolder)) {
    log.info('Configuration folder found, skip creating default configuration files');
  } else {
    log.info('Configuration folder not found, creating default configuration files');
    createFile(pathToConfigFolder, '/user-defined-assessment-configuration.json', validAssessmentObject);
  }
};

export const createFile = (pathToFolder: string, fileName: string, jsonObject: object): void => {
  if (!fs.existsSync(pathToFolder)) {
    fs.mkdirSync(pathToFolder, { recursive: true });
  }
  const pathToFile = path.join(pathToFolder, fileName);
  const jsonObjectString = JSON.stringify(jsonObject, null, 2);
  fs.writeFileSync(pathToFile, jsonObjectString);
};
