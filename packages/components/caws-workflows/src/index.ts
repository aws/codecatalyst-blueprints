import * as path from 'path';

import {Component, YamlFile} from 'projen';

import {Blueprint} from '@caws-blueprint/caws.blueprint';
import {SourceRepository} from '@caws-blueprint-component/caws-source-repositories';
import {WorkflowDefinition} from './workflow-definition';

export * from './example';
export * from './workflow-definition';
export * from './samples/node';

export class Workflow extends Component {
  constructor(
    blueprint: Blueprint,
    sourceRepository: SourceRepository,
    workflow: WorkflowDefinition,
  ) {
    super(blueprint);

    new YamlFile(
      blueprint,
      path.join(sourceRepository.relativePath, `.aws/workflows/${workflow.Name}.yaml`),
      {
        obj: {
          ...workflow,
        },
      },
    );
  }
}
