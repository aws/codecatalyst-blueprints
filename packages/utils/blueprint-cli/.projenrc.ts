import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'blueprint-cli',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@aws-sdk/client-s3',
    '@aws-sdk/client-cloudfront',
    '@aws-sdk/client-sts',
    'pino',
    'yargs',
    'ts-node',
    'axios',
    'pino-pretty',
    'typescript',
    'jmespath',
  ],
  peerDeps: [],
  description: 'This is a cli utility used for blueprint development.',
  packageName: '@caws-blueprint-util/blueprint-cli',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    '@types/jest',
    '@types/pino',
    '@types/yargs',
    '@types/jmespath',
    'pino-pretty',
    'ts-jest',
    'ts-loader',
    'ts-node',
  ],
  bin: {
    blueprint: 'lib/index.js',
  },
  jest: true,
  tsconfig: {
    compilerOptions: {
      lib: ['es2019', 'dom'],
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
});

project.synth();
