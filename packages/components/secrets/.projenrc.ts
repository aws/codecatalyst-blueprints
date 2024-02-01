import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';
import { NpmAccess } from 'projen/lib/javascript/node-package';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  npmAccess: NpmAccess.PUBLIC,
  name: 'codecatalyst-secrets',
  copyrightOwner: 'Amazon.com',
  deps: ['@amazon-codecatalyst/blueprints.blueprint'],
  peerDeps: ['projen'],
  description: 'This is a representation of a codecatalyst secret.',
  packageName: '@amazon-codecatalyst/blueprint-component.secrets',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node'],
});

project.synth();
