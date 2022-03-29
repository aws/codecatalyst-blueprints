import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowDefinition, getDefaultActionIdentifier, ActionIdentifierAlias, DeployActionConfiguration } from '..';
import { EnvironmentConfiguration, generateEnvironment } from './build-action';

export function addGenericCloudFormationDeployAction(params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  stackName: string;
  region: string;
  pathToCfnTemplate: string;
  environment: EnvironmentConfiguration;

  compute?: string;
  actionName?: string;
  InputArtifacts?: string[];
  capabilities?: string[];
  Configuration?: {
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
  };
}): string {
  const { blueprint, workflow, stackName, region, pathToCfnTemplate } = params;
  const actionName = params.actionName || 'DeployCloudFormationStack';
  const InputArtifacts = params.InputArtifacts || ['AutoDiscoveryArtifact'];
  const cfnDeployActionConfig: DeployActionConfiguration = {
    Parameters: {
      region: region,
      template: pathToCfnTemplate,
      name: stackName,
      capabilities: (params.capabilities || ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND']).join(','),
      ...params.Configuration,
    },
    Environment: generateEnvironment(params.environment),
  };

  const cfnDeployAction = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.deploy, blueprint.context.environmentId),
    compute: params.compute || 'Linux.x86-64.Large',
    InputArtifacts,
    Configuration: cfnDeployActionConfig,
  };
  workflow.Actions[actionName] = cfnDeployAction;
  return actionName;
}
