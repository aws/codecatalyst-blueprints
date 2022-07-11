export type SourceType = 'SOURCE_REPOSITORY';
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
  ComputeName?: 'Linux.x86-64.Large' | 'Linux.x86-64.XLarge' | 'Linux.x86-64.2XLarge' | string;
  Parameters: {
    [key: string]: string;
    name: string;
    region: string;
    template: string;
    capabilities: string;
  };
}

export interface ActionDefiniton {
  Identifier?: string;
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
  SchemaVersion?: string;
  RunMode?: RunModeDefiniton;
  Sources?: SourceDefiniton;
  Triggers?: TriggerDefiniton[];
  Actions: {
    [id: string]: ActionDefiniton;
  };
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
  [key: string]: any;
  Sources?: string[];
  Variables?: InputVariable[];
  Artifacts?: string[];
}

export interface Artifact {
  Name: string;
  Files: string[];
}

export interface SuccessCriteriaDefinition {
  PassRate?: number;
  LineCoverage?: number;
  BranchCoverage?: number;
  Vulnerabilities?: {
    Severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
    Number: number;
  };
}

export interface AutoDiscoverReportDefinition {
  Enabled?: boolean;
  ReportNamePrefix?: string;
  ExcludePaths?: string[];
  IncludePaths?: string[];
  SuccessCriteria?: SuccessCriteriaDefinition;
}

export interface OutputDefinition {
  [key: string]: any;
  Artifacts?: Artifact[];
  Reports?: string[];
  AutoDiscoverReports?: AutoDiscoverReportDefinition;
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
