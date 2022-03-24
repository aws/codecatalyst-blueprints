import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workspaces',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: ['@caws-blueprint/blueprints.blueprint', '@caws-blueprint-component/caws-source-repositories'],
  peerDeps: ['projen'],
  description: 'This is a representation of a caws development environment workspace.',
  packageName: '@caws-blueprint-component/caws-workspaces',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node'],
});

project.synth();
