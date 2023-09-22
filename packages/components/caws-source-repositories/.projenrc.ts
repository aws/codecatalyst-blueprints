import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
  copyrightOwner: 'Amazon.com',
  deps: ['decamelize', 'camelcase', 'glob', 'mustache', 'minimatch'],
  peerDeps: ['projen', '@amazon-codecatalyst/blueprints.blueprint'],
  description: 'This is a representation of a source repository.',
  packageName: '@amazon-codecatalyst/blueprint-component.source-repositories',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component', 'ts-node', '@types/jest'],
  jest: true,
});

project.synth();
