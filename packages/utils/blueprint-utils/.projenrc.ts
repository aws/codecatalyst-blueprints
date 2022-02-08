import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'blueprint-utils',
  copyrightOwner: 'Amazon.com',
  deps: [],
  peerDeps: [
    'projen',
  ],
  description: 'This is a collection of utility functions that help with building blueprints.',
  packageName: '@caws-blueprint-util/blueprint-utils',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    'ts-node'
  ],
});

project.synth();
