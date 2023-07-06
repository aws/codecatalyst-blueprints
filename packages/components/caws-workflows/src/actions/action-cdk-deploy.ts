import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import {
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  ActionDefiniton,
  ComputeConfiguration,
  OutputDefinition,
  InputsDefinition,
  convertInputsToJsonString,
} from './action';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow';

export interface CdkDeployActionConfiguration {
  StackName: string;
  Region?: string;
  Tags?: { [key: string]: string };
  Context?: { [key: string]: string };
  CfnOutputVariables?: string[];
  CdkRootPath?: string;
}

// Need this as the current 1PAs can only take in JSON strings
export interface CdkDeployActionYamlOutput {
  StackName: string;
  Region?: string;
  Tags?: string;
  Context?: string;
  CfnOutputVariables?: string;
  CdkRootPath?: string;
}

// Convert all provided data types to JSON strings for 1PA ingestion
export const convertYamlInputToString = (paramterInput: CdkDeployActionConfiguration): CdkDeployActionYamlOutput => {
  const stringifiedInput: CdkDeployActionYamlOutput = {
    StackName: paramterInput.StackName,
    Region: typeof paramterInput.Region === 'undefined' ? undefined : paramterInput.Region,
    CdkRootPath: typeof paramterInput.CdkRootPath === 'undefined' ? undefined : paramterInput.CdkRootPath,
    Tags: typeof paramterInput.Tags === 'undefined' ? undefined : convertInputsToJsonString(paramterInput.Tags),
    Context: typeof paramterInput.Context === 'undefined' ? undefined : convertInputsToJsonString(paramterInput.Context),
    CfnOutputVariables:
      typeof paramterInput.CfnOutputVariables === 'undefined' ? undefined : convertInputsToJsonString(paramterInput.CfnOutputVariables),
  };
  return stringifiedInput;
};

export interface CdkDeployActionParameters {
  inputs: InputsDefinition;
  outputs?: OutputDefinition;
  environment: WorkflowEnvironment;
  computeName?: ComputeConfiguration;
  configuration: CdkDeployActionConfiguration;
  actionName: string;
  dependsOn?: string[];
}

export function addGenericCdkDeployAction(
  params: CdkDeployActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string {
  const { blueprint, workflow, inputs, outputs, environment, configuration, computeName, dependsOn } = params;
  const actionName = (params.actionName || 'DeployCdkStack').replace(new RegExp('-', 'g'), '_');

  const cdkDeployAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.cdkDeploy, blueprint.context.environmentId),
    Inputs: inputs,
    Outputs: outputs,
    Environment: environment,
    DependsOn: dependsOn,
    Compute: computeName,
    Configuration: convertYamlInputToString(configuration),
  };
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = cdkDeployAction;
  return actionName;
}
