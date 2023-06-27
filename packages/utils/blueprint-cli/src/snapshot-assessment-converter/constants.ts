import { ScheduleType, DevEnvironmentInstanceType, DevEnvironmentIdes, DevEnvironmentCloud9Runtimes, DevEnvironmentPeristentStorage } from './model';

export const MinimalBlueprintAssessmentObject: Record<string, any> = {
  spaceName: 'sample-space-name',
  name: 'sample-assessment-name',
  blueprintName: 'sample-blueprint-name',
  schedule: {
    scheduleType: ScheduleType.ONCE,
  },
  timeoutInMinutes: 60,
  stepConfigurations: {
    createStep: {
      assessmentProjectName: 'sample-assessment-project-name',
    },
  },
};

export const FullBlueprintAssessmentObject: Record<string, any> = {
  spaceName: 'sample-space-name',
  name: 'sample-assessment-name',
  blueprintName: 'sample-blueprint-name',
  blueprintVersion: 'sample-blueprint-version',
  schedule: {
    scheduleType: ScheduleType.ONCE,
    cronSchedule: '0 * * * *',
  },
  timeoutInMinutes: 60,
  stepConfigurations: {
    createStep: {
      assessmentProjectName: 'sample-assessment-project-name',
      blueprintOptionsOverrides: {},
    },
    workflowsStep: {
      timeoutInMinutes: 60,
      verifyWorkflowsExist: [
        {
          workflowNameRegex: '[(A-Z)(a-z)]',
          expectedCount: 1,
        },
      ],
      verifyWorkflowRunsSucceed: [
        {
          workflowNameRegex: '[(A-Z)(a-z)]',
          expectedCount: 1,
        },
      ],
    },
    cleanupStep: {
      timeoutInMinutes: 60,
      cleanupWorkflows: [
        {
          workflowNameRegex: '[(A-Z)(a-z)]',
        },
      ],
    },
    devEnvironmentStep: {
      devEnvironmentConfigurations: [
        {
          sourceRepositoryRegex: '[(A-Z)(a-z)]',
          sourceBranchName: 'sample-source-branch-name',
          alias: 'sample-alias',
          instanceType: DevEnvironmentInstanceType.DEV_STANDARD1_MEDIUM,
          inactivityTimeoutMinutes: 60,
          ides: [
            {
              name: DevEnvironmentIdes.CLOUD9,
              runtime: DevEnvironmentCloud9Runtimes.LATEST,
            },
          ],
          persistentStorage: DevEnvironmentPeristentStorage.GB_16,
          startDevEnvironmentOnCreate: true,
          validateDevEnvironment: [
            {
              validateDevEnvironment: true,
              validatePostStartEvents: true,
            },
          ],
        },
      ],
    },
  },
};

export const BlueprintAssessmentObjectSchema: Record<string, any> = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    properties: {
      spaceName: { type: 'string' },
      name: { type: 'string' },
      blueprintName: { type: 'string' },
      blueprintVersion: { type: 'string' },
      schedule: {
        type: 'object',
        properties: {
          scheduleType: {
            default: 'ONCE',
            enum: ['ONCE', 'CONTINUOUS'],
          },
          cronSchedule: { type: 'string' },
        },
        required: ['scheduleType'],
      },
      timeoutInMinutes: { type: 'number' },
      stepConfigurations: {
        type: 'object',
        properties: {
          createStep: {
            type: 'object',
            properties: {
              assessmentProjectName: { type: 'string' },
              blueprintOptionsOverrides: { type: 'object' },
            },
            required: ['assessmentProjectName'],
          },
          workflowsStep: {
            type: 'object',
            properties: {
              timeoutInMinutes: { type: 'number' },
              verifyWorkflowsExist: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    workflowNameRegex: { type: 'string' },
                    expectedCount: { type: 'number' },
                  },
                  required: ['workflowNameRegex', 'expectedCount'],
                },
              },
              verifyWorkflowRunsSucceed: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    workflowNameRegex: { type: 'string' },
                    expectedCount: { type: 'number' },
                  },
                  required: ['workflowNameRegex', 'expectedCount'],
                },
              },
            },
          },
          cleanupStep: {
            type: 'object',
            properties: {
              timeoutInMinutes: { type: 'number' },
              cleanupWorkflows: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    workflowNameRegex: { type: 'string' },
                  },
                  required: ['workflowNameRegex'],
                },
              },
            },
            required: ['cleanupWorkflows'],
          },
          devEnvironmentStep: {
            type: 'object',
            properties: {
              devEnvironmentConfigurations: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'object',
                  properties: {
                    sourceRepositoryRegex: { type: 'string' },
                    sourceBranchName: { type: 'string' },
                    alias: { type: 'string' },
                    instanceType: {
                      default: 'dev.standard1.medium',
                      enum: ['dev.standard1.small', 'dev.standard1.medium', 'dev.standard1.large', 'dev.standard2.xlarge'],
                    },
                    inactivityTimeoutMinutes: { type: 'number' },
                    ides: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            default: 'Cloud9',
                            enum: ['Cloud9'],
                          },
                          runtime: {
                            default: 'public.ecr.aws/q6e8p2q0/cloud9-ide-runtime:latest',
                            enum: ['public.ecr.aws/q6e8p2q0/cloud9-ide-runtime:latest', 'public.ecr.aws/q6e8p2q0/cloud9-ide-runtime:2.5.1'],
                          },
                        },
                      },
                    },
                    persistentStorage: {
                      default: 16,
                      enum: [16, 32, 64],
                    },
                    startDevEnvironmentOnCreate: { type: 'boolean' },
                    validateDevEnvironment: {
                      type: 'array',
                      minItems: 1,
                      items: {
                        type: 'object',
                        properties: {
                          validateDevEnvironment: { type: 'boolean' },
                          validatePostStartEvents: { type: 'boolean' },
                        },
                        required: ['validateDevEnvironment'],
                      },
                    },
                  },
                  required: ['sourceRepositoryRegex', 'alias', 'instanceType', 'inactivityTimeoutMinutes', 'ides', 'persistentStorage'],
                },
              },
            },
            required: ['devEnvironmentConfigurations'],
          },
        },
        required: ['createStep'],
      },
    },
    required: ['spaceName', 'name', 'blueprintName', 'schedule', 'timeoutInMinutes', 'stepConfigurations'],
  },
};
