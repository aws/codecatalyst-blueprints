import { TriggerType } from '../workflow/triggers';
import { WorkflowDefinition } from '../workflow/workflow';

export class NodeWorkflowDefinitionSamples {
  public static readonly build: WorkflowDefinition = {
    Name: 'build',
    Triggers: [
      {
        Type: TriggerType.PUSH,
        Branches: ['main'],
      },
    ],
    Actions: {
      Build: {
        Identifier: 'aws/managed-test@v1',
        Configuration: {
          Steps: [{ Run: 'npm install' }, { Run: 'npm run build' }],
        },
      },
    },
  };
}
