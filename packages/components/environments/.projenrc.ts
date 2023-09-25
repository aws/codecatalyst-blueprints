import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'codecatalyst-environments',
  copyrightOwner: 'Amazon.com',
  deps: [],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint'],
  description: 'This is a representation of a codecatalyst environment.',
  packageName: '@amazon-codecatalyst/blueprint-component.environments',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
