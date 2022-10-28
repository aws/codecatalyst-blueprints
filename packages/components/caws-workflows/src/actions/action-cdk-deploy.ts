import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton } from './action';

export interface CdkDeployInputConfiguration {
  Artifacts?: string[];
  Sources?: string[];
  [key: string]: any;
}

export interface CdkDeployActionConfiguration {
  [key: string]: string | undefined;
  StackName: string;
  Region?: string;
  Tags?: string;
  Context?: string;
  CfnOutputVariables?: string;
  CdkRootLocation?: string;
}

export interface CdkDeployActionParameters {
  inputs: CdkDeployInputConfiguration;
  environment: WorkflowEnvironment;
  computeName?: 'Linux.x86-64.Large' | 'Linux.x86-64.XLarge' | 'Linux.x86-64.2XLarge' | string;
  configuration: CdkDeployActionConfiguration;
  actionName: string;
}

export function addGenericCdkDeployAction(
  params: CdkDeployActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, environment, configuration, computeName } = params;
  const actionName = (params.actionName || 'DeployCdkStack').replace(new RegExp('-', 'g'), '_');

  const cdkDeployAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.cdkDeploy, blueprint.context.environmentId),
    Inputs: inputs,
    Environment: environment,
    Compute: computeName,
    Configuration: configuration,
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cdkDeployAction;
  return actionName;
}
