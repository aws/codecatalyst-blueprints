import { ProjenBlueprintComponent } from '@caws-blueprint-util/projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'blueprint-cli',
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: ['pino', 'yargs', 'ts-node', 'axios', 'pino-pretty', 'typescript'],
  peerDeps: [],
  description: 'This is a cli utility used for blueprint development.',
  packageName: '@caws-blueprint-util/blueprint-cli',
  devDeps: [
    '@caws-blueprint-util/projen-blueprint-component',
    '@types/jest',
    '@types/pino',
    '@types/yargs',
    'pino-pretty',
    'ts-jest',
    'ts-loader',
    'ts-node',
  ],
  bin: {
    blueprint: 'lib/index.js',
  },
});

project.synth();
