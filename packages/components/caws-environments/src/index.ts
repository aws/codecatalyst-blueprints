import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';

export interface EnvironmentDefinition {
  /**
   * The title of the environment.
   */
  title: string;

  /**
   * Environment description.
   */
  description?: string;
}

export class Environment extends Component {
  constructor(blueprint: Blueprint, environment: EnvironmentDefinition) {
    super(blueprint);
    new YamlFile(
      blueprint,
      `environments/${environment.title}.yaml`,
      {
        obj: {
          ...environment,
          type: 'environment',
        },
      },
    );
  }
}
