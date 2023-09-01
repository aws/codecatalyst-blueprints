import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
  copyrightOwner: 'Amazon.com',
  description:
    'This is a top level namespaced re-export of the base blueprint and all the blueprint components. This npm package re-exports various blueprint components for easy single package consumption.',
  packageName: '@amazon-codecatalyst/blueprints',
  devDeps: ['@caws-blueprint-util/projen-blueprint-component'],
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-workspaces',
    '@caws-blueprint-component/caws-environments',
    '@caws-blueprint-component/caws-issues',
  ],
  peerDeps: ['projen'],
});

project.synth();
