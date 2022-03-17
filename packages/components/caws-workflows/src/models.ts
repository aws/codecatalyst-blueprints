import { EnvironmentDefinition } from '@caws-blueprint-component/caws-environments';

export type WorkflowRuntimeLanguage = 'sam-python';

export type SourceType = 'SOURCE_REPOSITORY'

export type EnvironmentConnectionType = 'aws';

export enum PullRequestEvent {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  MERGED = 'MERGED',
  REVISION = 'REVISION',
}

export enum RunModeDefiniton {
  PARALLEL = 'PARALLEL',
  QUEUED = 'QUEUED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum TriggerType {
  MANUAL = 'MANUAL',
  PUSH = 'PUSH',
  PULLREQUEST = 'PULLREQUEST',
}

/*
export enum Identifier {
  'aws/action-extensions-hello-world@v1',
  'aws/build@v1',
  'aws/cawsbuildprivate-build@v1',
  'aws/cawscfnprivate-deploy@v1',
  'aws/cawstest@v1',
  'aws/cfn-deploy-temp@v1',
  'aws/cloudformation-deploy@v1',
  'aws/codebuild-run-build@v1',
  'aws/codebuild-run-integration_tests@v1',
  'aws/codebuild-run-test@v1',
  'aws/codebuild-run-tests@v1',
  'aws/deployteam-dev@v1',
  'aws/ecs-deploy@v1',
  'aws/ecs-render-task-definition@v1',
  'aws/github-actions-runner@v1',
  'aws/managed-test@v1',
  'aws/s3-deploy@v1',
  'aws/workflows-mock@v1',
}
*/

export interface Step {
  Run: string;
}

export interface Artifacts {
  Name: string;
  Files: string[];
}

export interface BuildActionConfiguration {
  ActionRoleArn?: string;
  Steps?: Step[];
}

export interface DeployActionConfiguration {
  ActionRoleArn: string;
  DeploymentEnvironment: string;
  Parameters: {
    name: string;
    region: string;
    'role-arn': string;
    template: string;
    capabilities: string;
  };
}

export interface ActionDefiniton {
  Identifier?: string; // | Identifier;
  Configuration?: BuildActionConfiguration | DeployActionConfiguration;
  DependsOn?: string[];
  Inputs?: InputsDefinition;
  Outputs?: OutputDefinition;
  Environment?: Environment;
}

export interface TriggerDefiniton {
  Type: TriggerType;
  Branches?: string[];
  Events?: PullRequestEvent[];
  SourceName?: string;
}

export interface WorkflowDefinition {
  Name?: string;
  SchemaVersion?: Number;
  RunMode?: RunModeDefiniton;
  Sources?: SourceDefiniton;
  Triggers?: TriggerDefiniton[];
  Actions: {
    [id: string]: ActionDefiniton;
  };
  DeployCloudFormationStack?: any;
}

export interface StageDefinition {
  environment: EnvironmentDefinition;
  role: string;
  accountid: string;
  region: string;
}

export interface CfnStageDefinition extends StageDefinition {
  stackRoleArn: string;
}

export interface SourceDefiniton {
  Type: SourceType;
  RepositoryName: string;
  branch: string;
}

export interface InputVariable {
  Name: string;
  Value: string;
}

export interface InputsDefinition {
  Sources?: string[];
  Variables?: InputVariable[];
  Artifacts?: string[];
}

export interface Artifact {
  Name: string;
  Files: string;
}

export interface AutoDiscoverReportDefinition {
  Enabled?: boolean;
  ReportNamePrefix?: string;
  IncludePaths?: string;
}

export interface OutputDefinition {
  Artifacts?: Artifact[];
  Reports?: string[];
  AutoDiscoverReports?: AutoDiscoverReportDefinition[];
  Variables?: string[];
}

export interface ConnectionDefinition {
  Name: string;
  Role: string;
}

export interface Environment {
  Name: string;
  Connections: ConnectionDefinition[];
}