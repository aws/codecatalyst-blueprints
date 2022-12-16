import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton, ComputeConfiguration, OutputDefinition, InputsDefinition } from './action';

export interface CdkBootstrapActionConfiguration {
  Region: string;
}

export interface CdkBootstrapActionParameters {
  inputs: InputsDefinition;
  outputs: OutputDefinition;
  environment: WorkflowEnvironment;
  computeName?: ComputeConfiguration;
  configuration: CdkBootstrapActionConfiguration;
  actionName: string;
}

export function addGenericCdkBootstrapAction(
  params: CdkBootstrapActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, outputs, environment, configuration, computeName } = params;
  const actionName = (params.actionName || 'BootstrapCdkStack').replace(new RegExp('-', 'g'), '_');

  const cdkBootstrapAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.cdkBootstrap, blueprint.context.environmentId),
    Inputs: inputs,
    Outputs: outputs,
    Environment: environment,
    Compute: computeName,
    Configuration: configuration,
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cdkBootstrapAction;
  return actionName;
}