import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { EnvironmentDefinition } '@caws-blueprint-component/caws-environments';
import {
  WorkflowDefinition,
  InputsDefinition,
  OutputDefinition,
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  ActionDefiniton,
  Environment,
  AutoDiscoverReportDefinition,
} from '..';

export interface Connection {
  /**
   * The name of the account connection.
   */
  Name: string;

  /**
   * The name of the role in the account connection.
   */
  Role: string;
}

export interface BuildInputConfiguration {
  Sources: string[];
  Variables?: { [key: string]: string };
  Artifacts?: string[];
  // [key: string]: any;
}

export interface BuildOutputConfiguration {
  AutoDiscoverReports: AutoDiscoverReportDefinition;
  Variables?: string[];
  Artifacts?: {
    Name: string;
    Files: string[];
  }[];
  // [key: string]: any;
}

export interface EnvironmentConfiguration {
  Name: string;
  Connections: Connection[];
}

export const generateOutput = (params: BuildOutputConfiguration): OutputDefinition => {
  const outputs: OutputDefinition = {
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

export const generateEnvironment = (params: { Name: string; Connections: Connection[] }): Environment => {
  const { Name, Connections } = params;
  return {
    Name,
    Connections: Connections.map(connection => {
      return {
        Name: connection.Name,
        Role: connection.Role,
      };
    }),
  };
};

export const addGenericBuildAction = (params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  input: BuildInputConfiguration;
  output: BuildOutputConfiguration;
  steps: string[];
  environment?: EnvironmentConfiguration;
  actionName?: string;
  dependsOn?: string[];
}): string => {
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
    buildAction.Environment = generateEnvironment(params.environment);
  }
  if (params.dependsOn) {
    buildAction.DependsOn = params.dependsOn;
  }

  const actionName = (params.actionName || 'Build').replace(new RegExp('-', 'g'), '_');
  workflow.Actions[actionName] = buildAction;
  return actionName;
};
