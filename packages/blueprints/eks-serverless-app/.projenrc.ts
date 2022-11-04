import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'caws-blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@caws-blueprint/blueprints.eks-serverless-app',
  name: 'eks-serverless-app',
  defaultReleaseBranch: 'main',
  license: 'MIT',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: false,
  jest: false,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  copyrightOwner: 'Amazon.com',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-workspaces',
    '@caws-blueprint-component/caws-environments',
  ],
  description:
    'This blueprint generates an EKS application project. The project will contain source code and configuration files to build and deploy your EKS service',
  devDeps: ['ts-node', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
  keywords: ['blueprint', 'eks', 'python', 'java', 'serverless'],
  homepage: 'https://aws.amazon.com/',
  displayName: 'EKS',
});

project.synth();
