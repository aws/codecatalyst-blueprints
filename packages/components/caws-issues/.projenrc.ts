import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-issues',
  copyrightOwner: 'Amazon.com',
  deps: [],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint'],
  description: 'This is a representation of a caws issues.',
  packageName: '@amazon-codecatalyst/blueprint-component.issues',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
