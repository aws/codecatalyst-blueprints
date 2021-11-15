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
          image:
            'image: 012802407964.dkr.ecr.us-west-2.amazonaws.com/barsecrrepo-2a53e09ae3b25e5624c746d11fe76a3d2f1df790:live_universal_100',
          mountSources: true,
        },
      },
    ],
  };
}
