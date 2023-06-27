import * as path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import * as yaml from 'js-yaml';
import { Component, TextFile } from 'projen';
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

export interface WorkflowOptions {
  /**
   * Additional comments to be added to the top of the generated .yaml file of the workflow.
   * The comments will be shown on top of the workflow definitions.
   * Example value: ['Foo', 'Bar']
   */
  additionalComments?: string[];
  /**
   * Determine if the workflow will be generated as commented out entirely
   */
  commented?: boolean;
}

export const workflowLocation = '.codecatalyst/workflows';

export class Workflow extends Component {
  constructor(blueprint: Blueprint, sourceRepository: SourceRepository, workflow: WorkflowDefinition | any, options?: WorkflowOptions) {
    super(blueprint);

    const indendedWorkflowLocation = `${workflowLocation}/${workflow.Name}.yaml`;
    const workflowPath = path.join(sourceRepository.relativePath, indendedWorkflowLocation);

    sourceRepository.project.tryRemoveFile(workflowPath);
    let yamlContent = yaml.dump(workflow).split('\n');
    if (options?.commented) {
      yamlContent = yamlContent.map(commentLine);
    }
    if (options?.additionalComments) {
      yamlContent = [...options.additionalComments.map(commentLine), ...yamlContent];
    }
    new TextFile(blueprint, workflowPath, {
      marker: false,
      lines: yamlContent,
    });
  }
}

function commentLine(line: string) {
  return '# ' + line;
}
