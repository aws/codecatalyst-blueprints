import { EnvironmentDefinition } from '@caws-blueprint-component/caws-environments';

export interface Variables {
  Name: string;
  Value: string;
}

export interface OutputVariables {
  Name: string;
}

export interface Step {
  Run: string;
}

export interface Artifacts {
  Name: string;
  Files: string[];
}

export interface TestResult {
  ReferenceArtifact: string;
  Format: string;
  SuccessThresholds?: {
    PassRate: number;
  };
}

export interface Reports {
  Name: string;
  TestResults: TestResult[];
}

export interface BuildActionConfiguration {
  ActionRoleArn?: string;
  Variables?: Variables[];
  Steps?: Step[];
  Artifacts?: Artifacts[];
  Reports?: Reports[];
  Uses?: ActionUses;
  OutputVariables?: OutputVariables[];
}

export interface DeployActionConfiguration {
  CodeAwsRoleARN: string;
  StackRoleARN: string;
  StackName: string;
  StackRegion: string;
  TemplatePath: string;
  EnvironmentName: string;
  Parameters: [];
  RollbackConfiguration: {
    MonitorAlarmARNs: [];
  };
}

export interface ActionUses {
  Compute?: string;
  Environment: string;
  Connections?: EnvironmentConnection[];
}

export type EnvironmentConnectionType = 'aws';

export interface EnvironmentConnection {
  Name: string;
  Type: EnvironmentConnectionType;
  Role: string;
}

export interface ActionDefiniton {
  DependsOn?: string[];
  Identifier?: string;
  InputArtifacts?: string[];
  OutputArtifacts?: string[];
  Configuration?: BuildActionConfiguration | DeployActionConfiguration;
}

export interface TriggerDefiniton {
  Type: string;
  Branches?: string[];
  Events?: string[];
}

export interface WorkflowDefinition {
  Name: string;
  Triggers?: TriggerDefiniton[];
  Actions: {
    [id: string]: ActionDefiniton;
  };
  DeployCloudFormationStack?: any;
}

export type WorkflowRuntimeLanguage = 'sam-python';

export interface StageDefinition {
  environment: EnvironmentDefinition;
  role: string;
}

export interface CfnStageDefinition extends StageDefinition {
  stackRoleArn: string;
}

export enum PullRequestEvent {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
  REVISION = 'revision',
}
