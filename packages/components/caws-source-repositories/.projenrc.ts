import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: ['decamelize', 'camelcase', 'glob', 'globule', 'mustache', 'minimatch', 'ini'],
  peerDeps: ['projen', '@caws-blueprint/blueprints.blueprint'],
  description: 'This is a representation of a source repository.',
  packageName: '@caws-blueprint-component/caws-source-repositories',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node', '@types/minimatch', '@types/globule'],
});

project.synth();
