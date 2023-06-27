import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'Amazon Web Services',
  publishingOrganization: 'blueprints',
  packageName: '@caws-blueprint/blueprints.serverless-tinyurl',
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
  copyrightOwner: 'caws-blueprints',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    'projen',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-environments',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-component/caws-workspaces',
  ],
  description:
    'This blueprint creates a serverless Tiny URL Java Web Application using AWS Lambda, Amazon S3, Amazon API Gateway and Amazon DynamoDB. This project also includes canary tests using Cloudwatch Synthetics.',
  devDeps: ['ts-node', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
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
