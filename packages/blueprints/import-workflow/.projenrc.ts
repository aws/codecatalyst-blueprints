import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.import-workflow',
  description: 'Create workflows that import blueprints into this space',
  name: 'import-workflow',
  displayName: 'Import Workflow',
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
  keywords: ['blueprint-importer', 'blueprint-publisher'],
  homepage: '',
});

project.synth();
