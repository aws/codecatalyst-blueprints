import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import {
  ActionDefiniton,
  ActionIdentifierAlias,
  AutoDiscoverReportDefinition,
  getDefaultActionIdentifier,
  InputsDefinition,
  OutputDefinition,
} from './action';
import { WorkflowEnvironment } from '../environment/workflow-environment';
import { WorkflowDefinition } from '../workflow/workflow-definition';

export interface BuildActionConfiguration {
  ActionRoleArn?: string;
  Steps?: Step[];
}
interface Step {
  Run: string;
}

export interface BuildActionConfiguration {
  Steps?: Step[];
}

/**
 * The input of a build action
 */
export interface BuildInputConfiguration {
  Sources: string[];
  Variables?: { [key: string]: string };
  Artifacts?: string[];
  // [key: string]: any;
}

/**
 * The output of a build action
 */
export interface BuildOutputConfiguration {
  AutoDiscoverReports?: AutoDiscoverReportDefinition;
  Variables?: string[];
  Artifacts?: {
    Name: string;
    Files: string[];
  }[];
  // [key: string]: any;
}

export const generateOutput = (params: BuildOutputConfiguration): OutputDefinition => {
  const outputs: OutputDefinition = {
    AutoDiscoverReports: {
      Enabled: false,
    },
    ...params,
  };
  return outputs;
};

export const generateInputs = (params: BuildInputConfiguration): InputsDefinition => {
  const inputs: InputsDefinition = {
    ...params,
    Variables: undefined,
  };
  const Variables = Object.keys(params.Variables || {}).map(key => {
    return {
      Name: key,
      Value: (params.Variables || {})[key],
    };
  });
  if (Variables.length) {
    inputs.Variables = Variables;
  }
  return inputs;
};

export interface BuildActionParameters {
  input: BuildInputConfiguration;
  output: BuildOutputConfiguration;
  steps: string[];
  actionName: string;
  environment?: WorkflowEnvironment;
  dependsOn?: string[];
}

export const addGenericBuildAction = (
  params: BuildActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
): string => {
  const { blueprint, workflow, steps, input, output } = params;

  const buildAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
    Inputs: generateInputs(input),
    Outputs: generateOutput(output),
    Configuration: {
      Steps: steps.map(step => {
        return {
          Run: step,
        };
      }),
    },
  };
  if (params.environment) {
    buildAction.Environment = params.environment;
  }
  if (params.dependsOn) {
    buildAction.DependsOn = params.dependsOn;
  }

  const actionName = (params.actionName || 'Build').replace(new RegExp('-', 'g'), '_');
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = buildAction;
  return actionName;
};
