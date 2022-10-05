import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';

const blueprint = new ProjenBlueprint({
  authorName: 'blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@caws-blueprint/blueprints.deploy-test',
  name: 'deploy-test',
  displayName: 'Deploy Test Blueprint [Internal]',
  defaultReleaseBranch: 'main',
  license: 'MIT',
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
    '@caws-blueprint/blueprints.blueprint',
    'projen',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-environments',
  ],
  description: 'This is a test blueprint used for validating the deployment service of blueprint resources.',
  devDeps: ['ts-node', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
  keywords: ['no-tag'],
  homepage: '',
  mediaUrls: [
    'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
  ],
});
blueprint.synth();
