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
      assessmentProjectName: string; // limit to 64 characters or less
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
