import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Component } from 'projen';

import * as YAML from 'yaml';
import { WorkspaceDefinition } from './workspace-definition';

export * from './workspace-definition';
export * from './samples/index';
export * from './events/post-start-event';
export class Workspace extends Component {
  constructor(blueprint: Blueprint, sourceRepository: SourceRepository, workspace: WorkspaceDefinition) {
    super(blueprint);

    new SourceFile(
      sourceRepository,
      'devfile.yaml',
      YAML.stringify(workspace, {
        indent: 2,
      }),
    );
  }
}
