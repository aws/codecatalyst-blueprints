import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component } from 'projen';
// import { ActionDefiniton } from '..';
import * as YAML from 'yaml';
import { ComputeDefintion } from './compute';
import { SourceDefiniton } from './sources';
import { TriggerDefiniton } from './triggers';

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
    const workflowPath = `${workflowLocation}/${workflow.Name}.yaml`;

    new SourceFile(
      sourceRepository,
      workflowPath,
      YAML.stringify(workflow, {
        indent: 2,
      }),
    );
  }
}
