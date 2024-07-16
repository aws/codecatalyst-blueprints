import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

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
    snapshotGlobs: ['**', '!environments/**', '!aws-account-to-environment/**', '!src/**/DANGER-hard-delete-deployed-resources.yaml'],
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
    '@amazon-codecatalyst/blueprints.blueprint',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.dev-environments',
    '@amazon-codecatalyst/blueprint-component.environments',
    'projen',
    'ts-deepmerge',
  ],
  description:
    'This blueprint creates a project that leverages a serverless application model (SAM) to quickly create and deploy an API. You can choose Java, TypeScript, or Python as the programming language',
  packageName: '@amazon-codecatalyst/blueprints.sam-serverless-application',
  publishingOrganization: 'blueprints',
  peerDeps: ['@amazon-codecatalyst/blueprint-util.cli'],
  devDeps: [
    '@amazon-codecatalyst/blueprint-util.projen-blueprint',
    '@amazon-codecatalyst/blueprint-util.cli',
    '@types/jest',
    'ts-jest',
    'ts-node',
    'typescript',
    'pino',
    '@types/pino',
  ],
  keywords: ['sam', 'aws lambda', 'python', 'node', 'nodejs', 'java', 'serverless'],
  homepage: 'https://aws.amazon.com/',
  mediaUrls: ['https://media.amazonwebservices.com/blog/2018/sam_squirrel_1.jpg'],
  displayName: 'Serverless application model (SAM) API',
});

project.synth();
