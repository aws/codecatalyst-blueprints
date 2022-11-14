import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-environments',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: [],
  peerDeps: ['projen', '@caws-blueprint/blueprints.blueprint'],
  description: 'This is a representation of a caws issue.',
  packageName: '@caws-blueprint-component/caws-environments',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node'],
});

project.synth();
