import * as path from 'path';

import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
import { WorkflowDefinition } from './models';

export * from './actions';
export * from './models';
export * from './samples/node';
export * from './factories/index';
export * from './factories/build-action';
export * from './factories/cfn-deploy-action';
export * from './factories/test-reports-action';

export class Workflow extends Component {
  constructor(blueprint: Blueprint, sourceRepository: SourceRepository, workflow: WorkflowDefinition) {
    super(blueprint);

    new YamlFile(blueprint, path.join(sourceRepository.relativePath, `.aws/workflows/${workflow.Name}.yaml`), {
      marker: false,
      obj: {
        ...workflow,
      },
    });
  }
}
