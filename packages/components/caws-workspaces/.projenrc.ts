import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workspaces',
  copyrightOwner: 'Amazon.com',
  deps: ['yaml'],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint', '@amazon-codecatalyst/blueprint-component.source-repositories'],
  description: 'This is a representation of a caws development environment workspace.',
  packageName: '@amazon-codecatalyst/blueprint-component.workspaces',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
