import * as pino from 'pino';
import { createAssessment } from './create-assessment';
import { ScheduleType } from './models';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

const isolatedCreateAssessmentOptions = {
  blueprint: {
    package: 'my-npm-package',
    version: 'package-version-string',
    space: 'example-space',
  },
  assessment: {
    name: 'test-assessment-name',
    additionalConfig: {},
  },
  wizardOptions: {},
  continuous: false,
};

describe(createAssessment.name, () => {
  beforeEach(() => {
    // mock pino log to silence logs in terminal during test
    jest.spyOn(log, 'info').mockImplementation(() => {});
    jest.spyOn(log, 'error').mockImplementation(() => {});
  });

  it('should use the blueprint to create the assessment target', () => {
    const updatedBlueprintTarget = {
      package: 'my-better-package',
      version: 'my-better-version',
      space: 'my-better-space',
    };
    const assessment = createAssessment(log, {
      ...isolatedCreateAssessmentOptions,
      blueprint: updatedBlueprintTarget,
    });

    expect(assessment.blueprintName).toBe(updatedBlueprintTarget.package);
    expect(assessment.blueprintVersion).toBe(updatedBlueprintTarget.version);
    expect(assessment.spaceName).toBe(updatedBlueprintTarget.space);
  });

  it('should change the assessment name based on the assessment.name', () => {
    const assessment = createAssessment(log, {
      ...isolatedCreateAssessmentOptions,
      assessment: {
        ...isolatedCreateAssessmentOptions.assessment,
        name: 'my-better-name',
      },
    });

    expect(assessment.name).toBe('my-better-name');
  });

  it('should use the additonal configuration to override any keys on the resultant object', () => {
    const assessment = createAssessment(log, {
      ...isolatedCreateAssessmentOptions,
      assessment: {
        ...isolatedCreateAssessmentOptions.assessment,
        additionalConfig: {
          timeoutInMinutes: 900,
        },
      },
    });

    expect(assessment.timeoutInMinutes).toBe(900);
  });

  it('should be set to continuous mode', () => {
    const assessment = createAssessment(log, {
      ...isolatedCreateAssessmentOptions,
      continuous: true,
    });

    expect(assessment.schedule.scheduleType).toBe(ScheduleType.CONTINUOUS);
  });

  //   afterEach(() => {
  //     jest.restoreAllMocks();
  //   });

  //   describe("Test function 'convertToAssessmentObjects' success case: with wizard options", () => {
  //     const fileName = 'defaults.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should return the path to assessment objects directory', () => {
  //       const wizardOptionsFolderPath = path.join(rootDirectory, '/src/snapshot-configurations');
  //       const assessmentObjectsFolderPath = convertToAssessmentObjects(
  //         log,
  //         rootDirectory,
  //         outputDirectoryFromRoot,
  //         true,
  //         true,
  //         wizardOptionsFolderPath,
  //       );
  //       expect(assessmentObjectsFolderPath).toBe(outputDirectory);
  //     });
  //   });

  //   describe("Test function 'convertToAssessmentObjects' success case: with wizard options containing 'defaults.json'", () => {
  //     const fileName = 'defaults.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should return the path to assessment objects directory', () => {
  //       writeToFile(log, validAssessmentObject, directoryToRemove, fileName);
  //       const wizardOptionsFolderPath = directoryToRemove;
  //       const assessmentObjectsFolderPath = convertToAssessmentObjects(
  //         log,
  //         rootDirectory,
  //         outputDirectoryFromRoot,
  //         true,
  //         true,
  //         wizardOptionsFolderPath,
  //       );
  //       expect(assessmentObjectsFolderPath).toBe(outputDirectory);

  //       const targetFilePath = path.join(assessmentObjectsFolderPath, 'defaults_fromSrcFolder.json');
  //       expect(fs.existsSync(targetFilePath)).toBe(true);
  //     });
  //   });

  //   describe("Test function 'convertToAssessmentObjects' success case: without wizard options", () => {
  //     const fileName = 'defaults.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should return the path to assessment objects directory', () => {
  //       const assessmentObjectsFolderPath = convertToAssessmentObjects(log, rootDirectory, outputDirectoryFromRoot, true, true, '');
  //       expect(assessmentObjectsFolderPath).toBe(outputDirectory);
  //     });
  //   });

  //   describe("Test function 'loadFile' success case: without input", () => {
  //     it('should return undefined if no input is given', () => {
  //       expect(loadFile(log)).toBe(undefined);
  //     });
  //   });

  //   describe("Test function 'loadFile' success case: with input", () => {
  //     it('should return an object if input is given', () => {
  //       const result = loadFile(log, path.join(rootDirectory, '/package.json'));
  //       expect(typeof result).toBe('object');
  //     });
  //   });

  //   describe("Test function 'loadFile' failed case: invalid path", () => {
  //     it('should throw an error if input path is invalid', () => {
  //       expect(() => {
  //         loadFile(log, '/some/invalid/path/to/file.json');
  //       }).toThrow();
  //     });
  //   });

  //   describe("Test function 'loadFile' failed case: invalid file", () => {
  //     const fileName = 'invalid.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should throw an error if input file is invalid', () => {
  //       if (!fs.existsSync(outputDirectory)) {
  //         fs.mkdirSync(outputDirectory, { recursive: true });
  //       }

  //       fs.writeFileSync(filePath, 'some-invalid-json-string');

  //       expect(() => {
  //         loadFile(log, filePath);
  //       }).toThrow();
  //     });
  //   });

  //   describe("Test function 'folderExists' success case", () => {
  //     it('should return true for valid folder path', () => {
  //       expect(folderExists(rootDirectory)).toBe(true);
  //     });
  //   });

  //   describe("Test function 'folderExists' failed case", () => {
  //     it('should return false for invalid folder path', () => {
  //       expect(folderExists('')).toBe(false);
  //     });
  //   });

  //   describe("Test function 'loadFolder' success case", () => {
  //     it('should return a list of strings if input path is valid', () => {
  //       const result = loadFolder(log, rootDirectory);
  //       expect(typeof result).toBe('object');
  //     });
  //   });

  //   describe("Test function 'loadFolder' failed case", () => {
  //     it('should throw an error if input path is invalid', () => {
  //       expect(() => {
  //         loadFolder(log, '/some/invalid/path/to/folder');
  //       }).toThrow();
  //     });
  //   });

  //   describe("Test function 'createAssessmentObject' success case", () => {
  //     const fileName = 'defaults.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should create a valid assessment object at the specified path', () => {
  //       const packageJson = loadFile(log, path.join(rootDirectory, '/package.json'));
  //       const defaultWizardOptionsFilePath = path.join(rootDirectory, `/src/${fileName}`);
  //       const defaultWizardOptions = loadFile(log, defaultWizardOptionsFilePath);

  //       createAssessmentObject(log, outputDirectory, true, true, packageJson, defaultWizardOptions, fileName, validAssessmentObject);
  //       expect(fs.existsSync(filePath)).toBe(true);

  //       const object = loadFile(log, filePath);
  //       expect(object).toMatchObject(<BlueprintAssessmentObject>{});
  //     });
  //   });

  //   describe("Test function 'getDefaultAssessmentObject' success case", () => {
  //     it('should return default assessment object', () => {
  //       const packageJson = loadFile(log, path.join(rootDirectory, '/package.json'));
  //       const wizardOptionsFileName = 'defaults.json';
  //       const wizardOptionsFileTitle = wizardOptionsFileName.substring(0, wizardOptionsFileName.lastIndexOf('.'));

  //       const object = getDefaultAssessmentObject(packageJson, wizardOptionsFileTitle);
  //       expect(object).toMatchObject(<BlueprintAssessmentObject>{});
  //     });
  //   });

  //   describe("Test function 'getEntropy' success case", () => {
  //     it('should return different strings for multiple calls', () => {
  //       const result1 = getEntropy();
  //       const result2 = getEntropy();
  //       const result3 = getEntropy();

  //       expect(result1).not.toEqual(result2);
  //       expect(result1).not.toEqual(result3);
  //       expect(result2).not.toEqual(result3);
  //     });
  //   });

  //   describe("Test function 'trimString' success case", () => {
  //     const entropyLength = 5;

  //     it('should trim the string to have a length of (64 - entropy length - 1) or less', () => {
  //       const trimmedString = trimString('1234567890123456789012345678901234567890123456789012345678901234567890');
  //       expect(trimmedString.length).toBe(64 - entropyLength - 1);
  //     });
  //   });

  //   describe("Test function 'validateAssessmentObject' success case", () => {
  //     it('should not throw an error if input is valid', () => {
  //       expect(() => {
  //         validateAssessmentObject(log, validAssessmentObject);
  //       }).not.toThrow();
  //     });
  //   });

  //   describe("Test function 'validateAssessmentObject' failed case", () => {
  //     it('should throw an error if input is invalid', () => {
  //       expect(() => {
  //         validateAssessmentObject(log, {});
  //       }).toThrow();
  //     });
  //   });

  //   describe("Test function 'writeToFile' success case", () => {
  //     const fileName = 'valid-assessment-object.json';
  //     const filePath = path.join(outputDirectory, fileName);

  //     afterAll(() => {
  //       if (fs.existsSync(filePath)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should create the file at the specified path', () => {
  //       writeToFile(log, validAssessmentObject, outputDirectory, fileName);

  //       const jsonObject = loadFile(log, path.join(outputDirectory, fileName));
  //       expect(jsonObject!.toString()).toBe(validAssessmentObject.toString());
  //     });
  //   });

  //   describe("Test function 'writeToFile' failed case: invalid directory", () => {
  //     it('should throw an error if directory is invalid', () => {
  //       expect(() => {
  //         writeToFile(log, validAssessmentObject, '', 'some-file.json');
  //       }).toThrow();
  //     });
  //   });

  //   describe("Test function 'writeToFile' failed case: invalid file name", () => {
  //     afterAll(() => {
  //       if (folderExists(outputDirectory)) {
  //         fs.rmdirSync(directoryToRemove, { recursive: true });
  //       }
  //     });

  //     it('should throw an error if file name is invalid', () => {
  //       expect(() => {
  //         writeToFile(log, validAssessmentObject, outputDirectory, '');
  //       }).toThrow();
  //     });
  //   });
});
