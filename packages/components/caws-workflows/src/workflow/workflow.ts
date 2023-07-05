import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Component } from 'projen';
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

    /**
     * Since we can pass in any object. Make sure it is parsable.
     */
    workflow = JSON.parse(JSON.stringify(workflow));
    let yamlContent = YAML.stringify(workflow, {
      indent: 2,
    });
    if (options?.commented) {
      yamlContent = yamlContent.split('\n').map(commentLine).join('\n');
    }
    if (options?.additionalComments) {
      yamlContent = [options.additionalComments.map(commentLine).join('\n'), yamlContent].join('\n');
    }

    const indendedWorkflowLocation = `${workflowLocation}/${workflow.Name || 'no-name-workflow'}.yaml`;
    new SourceFile(sourceRepository, indendedWorkflowLocation, yamlContent);
  }
}

function commentLine(line: string) {
  return '# ' + line;
}
