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
    if (!environment.title || (
      environment?.title.length < 3 || environment?.title.length > 63)) {
      throw new Error('Environment title length must be between 3 and 63 characters');
    }
    const regex = /^[a-zA-Z0-9]+(?:[-_\\.][a-zA-Z0-9]+)*$/;
    if (!regex.test(environment.title)) {
      throw new Error(`Environment title does not match regular expression: ${regex}`);
    }
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
