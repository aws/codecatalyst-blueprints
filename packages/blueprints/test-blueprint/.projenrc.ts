import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.test-blueprint',
  name: 'test-blueprint',
  displayName: 'Test Blueprint [Internal]',
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
  description: 'This is a test blueprint used for testing various blueprint systems',
  devDeps: ['ts-node', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
  keywords: ['no-tag'],
  homepage: '',
  mediaUrls: [
    'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
  ],
});

// ============================================================
/**
 * We override the default synth command to ALWAYS build a cache and the AST in order to be able to accurately display blueprint internal files for ease of front-end debugging.
 */
project.setScript(
  'blueprint:synth',
  'yarn build:lib && blueprint drive-synth --blueprint ./ --outdir ./synth --default-options ./src/defaults.json --additional-options ./src/wizard-configurations --additionalOptionOverrides ./src/wizard-configurations $*',
);

project.setScript(
  'blueprint:resynth',
  'yarn build:lib && blueprint drive-resynth --blueprint ./ --outdir ./synth --default-options ./src/defaults.json --additional-options ./src/wizard-configurations $*',
);

project.synth();
