import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import {
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  ActionDefiniton,
  ComputeConfiguration,
  OutputDefinition,
  InputsDefinition,
} from './action';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';

export interface KubernetesDeployActionConfiguration {
  Namespace: string;
  Region: string;
  Cluster: string;
  Manifests: string;
}

export interface KubernetesDeployActionYamlOutput {
  Namesapce: string;
  Region: string;
  Cluster: string;
  Manifests: string;
}

// Convert all provided data types to JSON strings for 1PA ingestion
export const convertYamlInputToString = (paramterInput: KubernetesDeployActionConfiguration): KubernetesDeployActionYamlOutput => {
  const stringifiedInput: KubernetesDeployActionYamlOutput = {
    Namesapce: paramterInput.Namespace,
    Region: paramterInput.Region,
    Cluster: paramterInput.Cluster,
    Manifests: paramterInput.Manifests
  };
  return stringifiedInput;
};

export interface KubernetesDeployActionParameters {
  inputs: InputsDefinition;
  outputs?: OutputDefinition;
  environment: WorkflowEnvironment;
  computeName?: ComputeConfiguration;
  configuration: KubernetesDeployActionConfiguration;
  actionName: string;
  dependsOn?: string[];
}

export function addGenericKubernetesDeployAction(
  params: KubernetesDeployActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
  
): string {
  const { workflow, configuration, environment, computeName, inputs, blueprint, dependsOn, outputs } = params
  const actionName = (params.actionName || 'DeployCdkStack').replace(new RegExp('-', 'g'), '_');
  
  const kubernetesDeployAction: ActionDefiniton = { 
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.kubernetesDeploy, blueprint.context.environmentId),
    Inputs: inputs,
    Outputs: outputs,
    Environment: environment,
    DependsOn: dependsOn,
    Compute: computeName,
    Configuration: convertYamlInputToString(configuration),

  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = kubernetesDeployAction;
  return actionName
}
