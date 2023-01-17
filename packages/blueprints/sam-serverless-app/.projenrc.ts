import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';
const project = new ProjenBlueprint({
  defaultReleaseBranch: 'main',
  name: 'sam-serverless-application',
  copyrightOwner: 'Amazon.com',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: true,
  jest: true,
  blueprintSnapshotConfiguration: {
    snapshotGlobs: ['**', '!environments/**', '!aws-account-to-environment/**'],
  },
  npmignoreEnabled: true,
  authorName: 'Amazon Web Services',
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-workspaces',
    '@caws-blueprint-component/caws-environments',
    'projen',
  ],
  description:
    'This blueprint creates a project that leverages  a serverless application model (SAM) to quickly create and deploy an API. You can choose Java or Python as the programming language',
  packageName: '@caws-blueprint/blueprints.sam-serverless-application',
  publishingOrganization: 'blueprints',
  devDeps: ['@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli', '@types/jest', 'ts-jest', 'ts-node', 'typescript'],
  keywords: ['sam', 'aws lambda', 'python', 'java', 'serverless'],
  homepage: 'https://aws.amazon.com/',
  mediaUrls: ['https://media.amazonwebservices.com/blog/2018/sam_squirrel_1.jpg'],
  displayName: 'Serverless application model (SAM) API',
});

project.synth();
