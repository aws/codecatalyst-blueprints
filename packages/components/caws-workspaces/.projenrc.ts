import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workspaces',
  copyrightOwner: 'Amazon.com',
  deps: ['yaml'],
  peerDeps: ['projen', '@caws-blueprint/blueprints.blueprint', '@caws-blueprint-component/caws-source-repositories'],
  description: 'This is a representation of a caws development environment workspace.',
  packageName: '@amazon-codecatalyst/blueprint-component.workspaces',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node'],
});

project.synth();
