import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import { NpmAccess } from 'projen/lib/javascript/node-package';

const project = new ProjenBlueprint({
  authorName: 'Amazon Web Services',
  publishingOrganization: 'blueprints',
  packageName: '@amazon-codecatalyst/blueprints.gen-ai-chatbot',
  displayName: 'LLM Playground',
  description: 'Create your own private LLM playground in minutes with code you can instantly customize and deploy.',
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
    'semver',
    '@amazon-codecatalyst/blueprint-component.workflows',
    '@amazon-codecatalyst/blueprint-component.source-repositories',
    '@amazon-codecatalyst/blueprint-component.environments',
    '@amazon-codecatalyst/blueprint-component.issues',
  ],

  devDeps: ['ts-node', 'typescript', '@amazon-codecatalyst/blueprint-util.projen-blueprint', '@amazon-codecatalyst/blueprint-util.cli'],
  keywords: ['log-in-protected', 'private', 'genai', 'bedrock', 'chatbot', 'blueprint-publisher', 'external-blueprint', 'blueprint'],
  homepage: '',
});

project.synth();
