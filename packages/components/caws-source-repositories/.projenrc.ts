import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    'decamelize',
    "camelcase",
  ],
  peerDeps: [
    'projen',
  ],
  description: 'This is a representation of a source repository.',
  packageName: '@caws-blueprint-component/caws-source-repositories',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    'ts-node'
  ],
});

project.synth();
