import { WorkspaceDefinition } from '../workspace-definition';

export class SampleWorkspaces {
  static readonly default: WorkspaceDefinition = {
    schemaVersion: '2.0.0',
    metadata: {
      name: 'aws-universal',
      version: '1.0.1',
      displayName: 'AWS Universal',
      description: 'Stack with AWS Universal Tooling',
      tags: ['aws', 'a12'],
      projectType: 'aws',
    },
    components: [
      {
        name: 'aws-runtime',
        container: {
          image: 'public.ecr.aws/d8s8g4g8/a893fn7923fnoe:latest',
          mountSources: true,
        },
      },
    ],
  };
}
