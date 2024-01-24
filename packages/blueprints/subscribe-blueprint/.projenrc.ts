import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.subscribe-blueprint',
  displayName: 'Subscribe to external blueprint',
  description: 'Import external NPM packages as custom blueprints',
  name: 'subscribe-blueprint',
  defaultReleaseBranch: 'main',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: true,
  jest: false,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  copyrightOwner: 'blueprints',
  deps: [
    '@amazon-codecatalyst/blueprints.blueprint',
    'projen',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
  ],

  devDeps: ['ts-node', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
  keywords: ['blueprint-subscriber', 'blueprint-publisher', 'blueprint'],
  homepage: '',
});

project.synth();
