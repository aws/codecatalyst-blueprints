import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'amazon-codecatalyst',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.code-commit-mirroring',
  name: 'code-commit-mirroring',
  displayName: 'Mirror to CodeCommit',
  description: 'This blueprint adds a CodeCommit mirroring workflow',
  defaultReleaseBranch: 'main',
  license: 'Apache-2.0',
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
  copyrightOwner: 'amazon-codecatalyst',
  deps: [
    'projen',
    '@amazon-codecatalyst/blueprints.blueprint',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.dev-environments',
    '@amazon-codecatalyst/blueprint-component.environments',
    '@amazon-codecatalyst/blueprint-component.issues',
  ],
  devDeps: [
    'ts-node@^10',
    'typescript',
    '@amazon-codecatalyst/blueprint-util.projen-blueprint',
    '@amazon-codecatalyst/blueprint-util.cli',
    'fast-xml-parser',
  ],
  keywords: ['code-commit', 'codecatalyst', 'workflow', 'mirror', 'existing-project'],
  homepage: '',
});

project.synth();
