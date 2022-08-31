// import { WorkflowEnvironment } from "../models/workflow-environment";
// import { BuildActionConfiguration } from "./action-build";
// import { CfnDeployActionConfiguration } from "./action-cfn-deploy";
// import { TestActionConfiguration } from "./action-test-reports";

import { WorkflowEnvironment } from '../environment/workflow-environment';
import { BuildActionConfiguration } from './action-build';
import { CfnDeployActionConfiguration } from './action-cfn-deploy';
import { TestActionConfiguration } from './action-test-reports';

export enum ActionIdentifierAlias {
  build = 'build',
  deploy = 'deploy',
  test = 'test',
}

const ACTION_IDENTIFIERS: { [key: string]: { default: string; prod: string } } = {
  build: {
    default: 'aws/build-beta@v1',
    prod: 'aws/build@v1',
  },
  test: {
    default: 'aws/managed-test-gamma@v1',
    prod: 'aws/managed-test@v1',
  },
  deploy: {
    default: 'aws/cfn-deploy-gamma@v1',
    prod: 'aws/cfn-deploy@v1',
  },
};

export function getDefaultActionIdentifier(alias: ActionIdentifierAlias, environmentIdentifier: string = 'default'): string | undefined {
  return ACTION_IDENTIFIERS[alias]?.[environmentIdentifier] ?? ACTION_IDENTIFIERS[alias]?.default;
}

type TypeSupportedActions = BuildActionConfiguration | CfnDeployActionConfiguration | TestActionConfiguration;
export interface ActionDefiniton {
  Identifier?: string;
  Configuration?: TypeSupportedActions;
  DependsOn?: string[];
  Inputs?: InputsDefinition;
  Outputs?: OutputDefinition;
  Environment?: WorkflowEnvironment;
}

/**
 * Standard action input
 */
export interface InputsDefinition {
  [key: string]: any;
  Sources?: string[];
  Variables?: InputVariable[];
  Artifacts?: string[];
}

export interface InputVariable {
  Name: string;
  Value: string;
}

/**
 * Standard action output
 */
export interface OutputDefinition {
  [key: string]: any;
  Artifacts?: Artifact[];
  Reports?: string[];
  AutoDiscoverReports?: AutoDiscoverReportDefinition;
  Variables?: string[];
}

export interface Artifact {
  Name: string;
  Files: string[];
}

export interface AutoDiscoverReportDefinition {
  Enabled?: boolean;
  ReportNamePrefix?: string;
  ExcludePaths?: string[];
  IncludePaths?: string[];
  SuccessCriteria?: SuccessCriteriaDefinition;
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
