import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';
const project = new ProjenBlueprint({
  defaultReleaseBranch: 'main',
  name: 'sam-serverless-application',
  copyrightOwner: 'Amazon.com',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: false,
  jest: true,
  npmignoreEnabled: true,
  authorName: 'Amazon Web Services',
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  deps: [

  ],
  description:
    'This blueprint creates a project that leverages  a serverless application model (SAM) to quickly create and deploy an API. You can choose Java, TypeScript, or Phython as the programming language',
  packageName: '@caws-blueprint/blueprints.sam-serverless-application',
  publishingOrganization: 'blueprints',
  devDeps: ['@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli', '@types/jest', 'ts-jest', 'ts-node', 'typescript'],
  keywords: ['blueprint', 'sam', 'lambda', 'python', 'node', 'nodejs', 'java', 'serverless'],
  homepage: 'https://aws.amazon.com/',
  mediaUrls: ['https://media.amazonwebservices.com/blog/2018/sam_squirrel_1.jpg'],
  displayName: 'Serverless application model (SAM) API',
});

project.synth();
