import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton } from './action';

export interface CdkBootstrapInputConfiguration {
  Artifacts?: string[];
  Sources?: string[];
  [key: string]: any;
}

export interface CdkBootstrapActionConfiguration {
  [key: string]: string | undefined;
  Region: string;
  CloudFormationExecutionPolicies?: string;
}

export interface CdkBootstrapActionParameters {
  inputs: CdkBootstrapInputConfiguration;
  environment: WorkflowEnvironment;
  computeName?: 'Linux.x86-64.Large' | 'Linux.x86-64.XLarge' | 'Linux.x86-64.2XLarge' | string;
  configuration: CdkBootstrapActionConfiguration;
  actionName: string;
}

export function addGenericCdkBootstrapAction(
  params: CdkBootstrapActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, environment, configuration, computeName } = params;
  const actionName = (params.actionName || 'BootstrapCdkStack').replace(new RegExp('-', 'g'), '_');

  const cdkBootstrapAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.cdkBootstrap, blueprint.context.environmentId),
    Inputs: inputs,
    Environment: environment,
    Compute: computeName,
    Configuration: configuration,
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cdkBootstrapAction;
  return actionName;
}
