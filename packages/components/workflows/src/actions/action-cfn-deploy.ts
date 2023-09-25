import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton } from './action';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';

export interface DeployInputConfiguration {
  Artifacts: string[];
  Sources?: string[];
  [key: string]: any;
}

export interface CfnDeployActionConfiguration {
  ComputeName?: 'Linux.x86-64.Large' | 'Linux.x86-64.XLarge' | 'Linux.x86-64.2XLarge' | string;
  Parameters: {
    [key: string]: string;
    name: string;
    region: string;
    template: string;
    capabilities: string;
  };
}

export interface CfnDeployActionParameters {
  inputs: DeployInputConfiguration;
  environment: WorkflowEnvironment;
  configuration: {
    computeName?: 'Linux.x86-64.Large' | 'Linux.x86-64.XLarge' | 'Linux.x86-64.2XLarge' | string;
    parameters: {
      /**
       * stackName
       */
      name: string;
      region: string;
      /**
       * pathToCfnTemplate
       */
      template: string;
      capabilities?: string[];
    } & Partial<{
      'tags'?: string;
      'notification-arns'?: string;
      'monitor-alarm-arns'?: string;
      'parameter-overrides'?: string;
      'role-arn'?: string;
      'monitor-timeout-in-minutes'?: string;
      'timeout-in-minutes'?: string;
      'termination-protection'?: string;
      'disable-rollback': string;
      'no-fail-on-empty-changeset'?: string;
      'no-delete-failed-changeset'?: string;
      'no-execute-changeset'?: string;
    }>;
  };
  actionName: string;
}

export function addGenericCloudFormationDeployAction(
  params: CfnDeployActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, environment, configuration } = params;
  const actionName = (params.actionName || 'DeployCloudFormationStack').replace(new RegExp('-', 'g'), '_');

  const capabilities = (configuration.parameters.capabilities || ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND']).join(',');
  const ComputeName = configuration.computeName;
  const cfnDeployActionConfig: CfnDeployActionConfiguration = {
    Parameters: {
      ...configuration.parameters,
      capabilities: capabilities,
    },
    ComputeName,
  };
  const cfnDeployAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    Inputs: inputs,
    Environment: environment,
    Configuration: cfnDeployActionConfig,
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cfnDeployAction;
  return actionName;
}
