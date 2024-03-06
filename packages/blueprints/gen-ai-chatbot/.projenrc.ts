import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import { NpmAccess } from 'projen/lib/javascript/node-package';

const project = new ProjenBlueprint({
  authorName: 'blueprints',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.gen-ai-chatbot',
  displayName: 'Bedrock GenAI Chatbot',
  description: 'This blueprint generates an environment that enables customers to quickly setup a chatbot.',
  name: 'gen-ai-chatbot',
  defaultReleaseBranch: 'main',
  npmAccess: NpmAccess.PUBLIC,
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
    'ipaddr.js@^2.1.0',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
  ],

  devDeps: ['ts-node', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
  keywords: ['genai', 'bedrock', 'chatbot', 'blueprint-publisher', 'external-blueprint', 'blueprint'],
  homepage: '',
});

project.synth();
