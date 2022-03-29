import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import {
  WorkflowDefinition,
  InputsDefinition,
  OutputDefinition,
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  ActionDefiniton,
  Environment,
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

export const generateOutput = (params: { outputVariables?: string[]; autoDiscoverReports?: boolean }): OutputDefinition => {
  const { outputVariables, autoDiscoverReports } = params;
  const outputs: OutputDefinition = {};
  if (outputVariables) {
    outputs.Variables = outputVariables;
  }
  if (autoDiscoverReports) {
    outputs.AutoDiscoverReports = {
      ReportNamePrefix: 'AutoDiscovered',
      IncludePaths: ['**/*'],
      Enabled: true,
    };
  }
  return outputs;
};

export const generateInputs = (params: { sources: string[]; variables: { [key: string]: string } }): InputsDefinition => {
  const { sources, variables } = params;
  const Variables = Object.keys(variables || {}).map(key => {
    return {
      Name: key,
      Value: variables[key],
    };
  });
  const inputs: InputsDefinition = {
    Sources: sources,
  };
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

export interface BuildInputConfiguration {
  sources: string[];
  variables?: { [key: string]: string };
  artifacts?: string[];
}
export interface BuildOutputConfiguration {
  autoDiscoverReports: boolean;
  variables?: string[];
}
export interface EnvironmentConfiguration {
  Name: string;
  Connections: Connection[];
}

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
  const { blueprint, workflow, steps } = params;

  const buildAction: ActionDefiniton = {
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.build, blueprint.context.environmentId),
    Inputs: generateInputs({
      sources: params.input.sources,
      variables: params.input.variables || {},
    }),
    Outputs: generateOutput({
      outputVariables: params.output.variables,
      autoDiscoverReports: params.output.autoDiscoverReports,
    }),
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
  const actionName = params.actionName || 'Build';
  workflow.Actions[actionName] = buildAction;
  return actionName;
};
