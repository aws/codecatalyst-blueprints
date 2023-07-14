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
});
