import { WorkflowDefinition } from '../workflow/workflow';

export const emptyWorkflow: WorkflowDefinition = {
  Name: 'build',
  SchemaVersion: '1.0',
  Triggers: [],
  Actions: {},
};
