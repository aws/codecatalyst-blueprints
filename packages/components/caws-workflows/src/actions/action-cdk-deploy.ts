import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton, ComputeConfiguration, OutputDefinition, InputsDefinition } from './action';

export interface CdkDeployActionConfiguration {
  StackName: string;
  Region?: string;
  Tags?: string;
  Context?: string;
  CfnOutputVariables?: string;
  CdkRootPath?: string;
}

export interface CdkDeployActionParameters {
  inputs: InputsDefinition;
  outputs: OutputDefinition;
  environment: WorkflowEnvironment;
  computeName?: ComputeConfiguration;
  configuration: CdkDeployActionConfiguration;
  actionName: string;
}

export function addGenericCdkDeployAction(
  params: CdkDeployActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, outputs, environment, configuration, computeName } = params;
  const actionName = (params.actionName || 'DeployCdkStack').replace(new RegExp('-', 'g'), '_');

  const cdkDeployAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.cdkDeploy, blueprint.context.environmentId),
    Inputs: inputs,
    Outputs: outputs,
    Environment: environment,
    Compute: computeName,
    Configuration: configuration,
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cdkDeployAction;
  return actionName;
}
