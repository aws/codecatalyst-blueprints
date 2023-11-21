import { SourceFile, SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import * as sdk from '@aws/codecatalyst-workflows-sdk';
import { Component } from 'projen';
import * as YAML from 'yaml';
import { WorkflowDefinition } from './workflow/workflow-definition';

export const workflowLocation = '.codecatalyst/workflows';
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

  /**
   * Options for generating the YAML string, this comes from yaml.stringify
   */
  YAMLOptions?: YAML.DocumentOptions & YAML.SchemaOptions & YAML.ParseOptions & YAML.CreateNodeOptions & YAML.ToStringOptions;
}

export class Workflow extends Component {
  constructor(
    blueprint: Blueprint,
    sourceRepository: SourceRepository,
    workflow: WorkflowDefinition | sdk.Workflow | any,
    options?: WorkflowOptions,
  ) {
    super(blueprint);

    /**
     * Since we can pass in any object. Make sure it is parsable.
     */
    workflow = JSON.parse(JSON.stringify(workflow));
    let yamlContent = YAML.stringify(workflow, {
      indent: 2,
      lineWidth: 0,
      ...options?.YAMLOptions,
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
