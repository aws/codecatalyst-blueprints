import { Component, YamlFile } from 'projen';

import { Blueprint } from '@caws-blueprint/caws.blueprint';
import { EnvironmentDefinition } from './environment-definition';

export * from './environment-definition';

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
