import * as path from 'path';

import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';

import { WorkspaceDefinition } from './workspace-definition';

export * from './workspace-definition';
export * from './samples/index';

export class Workspace extends Component {
  constructor(
    blueprint: Blueprint,
    sourceRepository: SourceRepository,
    workspace: WorkspaceDefinition,
  ) {
    super(blueprint);

    new YamlFile(blueprint, path.join(sourceRepository.relativePath, 'devfile.yaml'), {
      obj: {
        ...workspace,
      },
      marker: false,
    });
  }
}
