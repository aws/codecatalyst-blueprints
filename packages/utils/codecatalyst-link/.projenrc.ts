import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'codecatalyst-link',
  copyrightOwner: 'Amazon.com',
  deps: ['yargs', 'pino'],
  peerDeps: [],
  description: 'This is a cli utility used for opening projects in CodeCatalyst.',
  packageName: '@amazon-codecatalyst/open-in-codecatalyst',
  devDeps: [
    '@amazon-codecatalyst/blueprint-util.projen-blueprint-component',
    '@types/jest',
    '@types/pino',
    '@types/yargs',
    'pino-pretty',
    'ts-jest',
    'ts-loader',
    'ts-node',
  ],
  bin: {
    'codecatalyst-link': 'lib/index.js',
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
