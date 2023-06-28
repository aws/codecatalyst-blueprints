export const BlueprintAssessmentObjectSchema: Record<string, any> = {
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
};
