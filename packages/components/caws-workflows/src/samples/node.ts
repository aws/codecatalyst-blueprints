import {WorkflowDefinition} from '..';

export class NodeWorkflowDefinitionSamples {
  public static readonly build: WorkflowDefinition = {
    Name: 'build',

    Triggers: [
      {
        Type: 'Push',

        Branches: ['main'],
      },
    ],

    Actions: {
      Build: {
        Identifier: 'aws/managed-test@v1',

        OutputArtifacts: [],

        Configuration: {
          Steps: [{Run: 'npm install'}, {Run: 'npm run build'}],
        },
      },
    },
  };
}
