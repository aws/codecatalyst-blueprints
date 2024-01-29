import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'codecatalyst-secrets',
  copyrightOwner: 'Amazon.com',
  deps: [],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint'],
  description: 'This is a representation of a codecatalyst secret.',
  packageName: '@amazon-codecatalyst/blueprint-component.secrets',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
