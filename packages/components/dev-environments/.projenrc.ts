import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'codecatalyst-dev-environments',
  copyrightOwner: 'Amazon.com',
  deps: ['yaml'],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint', '@amazon-codecatalyst/blueprint-component.source-repositories'],
  description: 'This is a representation of a codecatalyst development environment workspace (MDE).',
  packageName: '@amazon-codecatalyst/blueprint-component.dev-environments',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
