import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'codecatalyst-source-repositories',
  copyrightOwner: 'Amazon.com',
  description:
    'This is a top level namespaced re-export of the base blueprint and all the blueprint components. This npm package re-exports various blueprint components for easy single package consumption.',
  packageName: '@amazon-codecatalyst/blueprints',
  devDeps: ['@amazon-codecatalyst/blueprint-util.projen-blueprint-component'],
  deps: [
    '@amazon-codecatalyst/blueprints.blueprint',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.dev-environments',
    '@amazon-codecatalyst/blueprint-component.environments',
  ],
  peerDeps: ['projen'],
});

project.synth();
