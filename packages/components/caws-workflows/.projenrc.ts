import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workflows',
  copyrightOwner: 'Amazon.com',
  deps: ['yaml'],
  peerDeps: [
    'projen',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
    '@amazon-codecatalyst/blueprints.blueprint',
  ],
  description: 'This is a representation of a caws workflow.',
  packageName: '@amazon-codecatalyst/blueprint-component.workflows',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
