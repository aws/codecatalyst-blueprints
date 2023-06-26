import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-workflows',
  copyrightOwner: 'Amazon.com',
  deps: ['js-yaml@^4'],
  peerDeps: [
    'projen',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-environments',
    '@caws-blueprint/blueprints.blueprint',
  ],
  description: 'This is a representation of a caws workflow.',
  packageName: '@caws-blueprint-component/caws-workflows',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component', 'ts-node'],
});

project.synth();
