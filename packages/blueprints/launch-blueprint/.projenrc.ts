import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import { NpmAccess } from 'projen/lib/javascript/node-package';

const project = new ProjenBlueprint({
  authorName: 'Amazon Web Services',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.launch-blueprint',
  displayName: 'Launch with CodeCatalyst',
  description: 'Clones the provided repository into CodeCatalyst',
  name: 'launch-blueprint',
  defaultReleaseBranch: 'main',
  npmAccess: NpmAccess.PUBLIC,
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
    'yaml',
    '@amazon-codecatalyst/blueprints.blueprint',
    'projen',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
  ],

  devDeps: [
    'ts-node',
    'typescript',
    '@amazon-codecatalyst/blueprint-util.projen-blueprint',
    '@amazon-codecatalyst/blueprint-util.cli',
    '@types/yaml',
  ],
  keywords: ['project-launcher', 'blueprint'],
  homepage: '',
});

project.synth();
