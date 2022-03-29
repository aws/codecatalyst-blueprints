import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowDefinition, getDefaultActionIdentifier, ActionIdentifierAlias, DeployActionConfiguration, ActionDefiniton } from '..';
import { EnvironmentConfiguration, generateEnvironment } from './build-action';

export interface DeployInputConfiguration {
  Artifacts: string[];
  Sources?: string[];
  [key: string]: any;
}

export function addGenericCloudFormationDeployAction(params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  inputs: DeployInputConfiguration;
  environment: EnvironmentConfiguration;
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
  actionName?: string;
}): string {
  const { blueprint, workflow, inputs, environment, configuration } = params;
  const actionName = params.actionName || 'DeployCloudFormationStack';
  const capabilities = (configuration.parameters.capabilities || ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND']).join(',');
  const ComputeName = configuration.computeName;
  const cfnDeployActionConfig: DeployActionConfiguration = {
    Parameters: {
      ...configuration.parameters,
      capabilities: capabilities,
    },
    ComputeName,
  };
  const cfnDeployAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    Inputs: inputs,
    Environment: generateEnvironment(environment),
    Configuration: cfnDeployActionConfig,
  };
  workflow.Actions[actionName] = cfnDeployAction;
  return actionName;
}
