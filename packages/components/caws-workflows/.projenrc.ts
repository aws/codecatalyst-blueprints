import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workflows',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-environments',
  ],
  peerDeps: ['projen'],
  description: 'This is a representation of a caws workflow.',
  packageName: '@caws-blueprint-component/caws-workflows',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    'ts-node'
  ],
});

project.synth();
