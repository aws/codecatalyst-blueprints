import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'Amazon Web Services',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.serverless-tinyurl',
  name: 'serverless-tinyurl',
  displayName: 'AWS Serverless Tiny URL Application in Java',
  defaultReleaseBranch: 'main',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: true,
  jest: true,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  blueprintSnapshotConfiguration: {
    snapshotGlobs: ['**', '!environments/**', '!aws-account-to-environment/**'],
  },
  blueprintHealthConfiguration: {},
  copyrightOwner: 'caws-blueprints',
  deps: [
    '@amazon-codecatalyst/blueprints.blueprint',
    'projen',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.environments',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.workspaces',
  ],
  description:
    'This blueprint creates a serverless Tiny URL Java Web Application using AWS Lambda, Amazon S3, Amazon API Gateway and Amazon DynamoDB. This project also includes canary tests using Cloudwatch Synthetics.',
  devDeps: ['ts-node', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
  keywords: [
    'tiny-url application',
    'serverless',
    'api-gateway',
    'lambda',
    'dynamodb',
    'cloudformation',
    's3',
    'cloudwatch-synthetics',
    'cdk',
    'dava',
    'fullstack',
  ],
  homepage: '',
  mediaUrls: [
    'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
  ],
});
project.package.addDevDeps('ts-node@^10');

project.synth();
