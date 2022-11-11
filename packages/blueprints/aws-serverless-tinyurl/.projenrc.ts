import { ProjenBlueprint } from '@caws-blueprint-util/projen-blueprint';

const project = new ProjenBlueprint({
  authorName: 'caws-blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@caws-blueprint/blueprints.aws-serverless-tinyurl',
  name: 'aws-serverless-tinyurl',
  displayName: 'AWS Serverless Tiny URL Application in Java',
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
    'This blueprint creates a serverless Tiny URL Java Web Application built in Java using AWS Lambda, Amazon S3, Amazon API Gateway and Amazon DynamoDB. This project also includes canary tests using Cloudwatch Synthetics.',
  devDeps: ['ts-node', 'typescript', '@caws-blueprint-util/projen-blueprint', '@caws-blueprint-util/blueprint-cli'],
  keywords: ['blueprint'],
  homepage: '',
  mediaUrls: [
    'https://w7.pngwing.com/pngs/147/242/png-transparent-amazon-com-logo-amazon-web-services-amazon-elastic-compute-cloud-amazon-virtual-private-cloud-cloud-computing-text-orange-logo.png',
  ],
});
project.package.addDevDeps('ts-node@^10');

project.synth();
