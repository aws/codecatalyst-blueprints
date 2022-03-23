import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
import { EnvironmentDefinition } from './environment-definition';

export class Environment extends Component {
  constructor(blueprint: Blueprint, environment: EnvironmentDefinition<any>) {
    super(blueprint);
    new YamlFile(
      blueprint,
      `environments/${environment.environmentName}.yaml`,
      {
        obj: {
          ...environment,
          type: 'environment',
        },
      },
    );
  }
}
