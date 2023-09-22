import { SourceFile, SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
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
