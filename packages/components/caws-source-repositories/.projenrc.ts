import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
  copyrightOwner: 'Amazon.com',
  deps: ['decamelize', 'camelcase', 'globule', 'mustache', 'minimatch', 'ini'],
  peerDeps: ['projen', '@caws-blueprint/blueprints.blueprint'],
  description: 'This is a representation of a source repository.',
  packageName: '@caws-blueprint-component/caws-source-repositories',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node', '@types/jest'],
  jest: true,
});

project.synth();
