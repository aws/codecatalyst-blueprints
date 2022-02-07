import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-issues',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
  ],
  peerDeps: [
    'projen',
  ],
  description: 'This is a representation of a caws issue.',
  packageName: '@caws-blueprint-component/caws-issue',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    'ts-node'
  ],
});

project.synth();
