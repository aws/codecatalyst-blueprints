import * as path from 'path';

import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
// import { ActionDefiniton } from '..';
import { ComputeDefintion } from './compute';
import { SourceDefiniton } from './sources';
import { TriggerDefiniton } from './triggers';
// import { SourceDefiniton, TriggerDefiniton, ActionDefiniton } from '..';

export enum RunModeDefiniton {
  PARALLEL = 'PARALLEL',
  QUEUED = 'QUEUED',
  SUPERSEDED = 'SUPERSEDED',
}

export interface WorkflowDefinition {
  Name: string;
  SchemaVersion?: string;
  RunMode?: RunModeDefiniton;
  Sources?: SourceDefiniton;
  Triggers?: TriggerDefiniton[];
  Compute?: ComputeDefintion;
  Actions?: {
    [id: string]: any;
  };
}

export const workflowLocation = '.codecatalyst/workflows';

export class Workflow extends Component {
  constructor(blueprint: Blueprint, sourceRepository: SourceRepository, workflow: WorkflowDefinition | any) {
    super(blueprint);

    const indendedWorkflowLocation = `${workflowLocation}/${workflow.Name}.yaml`;
    const workflowPath = path.join(sourceRepository.relativePath, indendedWorkflowLocation);
    // last write wins
    sourceRepository.project.tryRemoveFile(workflowPath);

    new YamlFile(blueprint, path.join(sourceRepository.relativePath, indendedWorkflowLocation), {
      marker: false,
      obj: {
        ...workflow,
      },
    });
  }
}
