import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { ActionDefiniton, ActionIdentifierAlias, ComputeConfiguration, InputsDefinition, getDefaultActionIdentifier } from './action';
import { WorkflowDefinition } from '../workflow/workflow';

export interface PublishBlueprintActionConfiguration {
  ArtifactPackagePath: string;
  PackageJSONPath: string;
  InputArtifactName: string;
  TimeoutInSeconds?: string;
}

export interface PublishBlueprintActionParameters {
  actionName: string;
  inputs: InputsDefinition;
  configuration: PublishBlueprintActionConfiguration;
  dependsOn?: string[];
  computeName?: ComputeConfiguration;
}

export function addGenericPublishBlueprintAction(
  params: PublishBlueprintActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, inputs, dependsOn, computeName, configuration } = params;
  const actionName = (params.actionName || 'PublishBlueprint').replace(new RegExp('-', 'g'), '_');

  const publishBlueprintAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.publishBlueprint, blueprint.context.environmentId),
    Inputs: inputs,
    DependsOn: dependsOn,
    Compute: computeName,
    Configuration: configuration,
  };

  params.workflow.Actions = params.workflow.Actions || {};
  params.workflow.Actions[actionName] = publishBlueprintAction;

  return actionName;
}
