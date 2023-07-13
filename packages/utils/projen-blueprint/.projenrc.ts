import * as fs from 'fs';
import { typescript } from 'projen';

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'projen-blueprint',
  projenrcTs: true,
  sampleCode: false,
  eslint: true,
  github: false,
  jest: false,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  license: 'Apache-2.0',
  copyrightOwner: 'Amazon.com',
  peerDeps: ['projen', '@caws-blueprint-util/blueprint-cli'],
  description: 'This is a projen blueprint. This defines the project configuration a blueprint project.',
  packageName: '@caws-blueprint-util/projen-blueprint',
  devDeps: ['projen', 'ts-node@^10'],
});

project.addDevDeps('@types/node@^18');

// keep consistent versions
const version = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
project.package.addVersion(version || '0.0.0');

// modify bumping tasks
project.removeTask('release');
project.removeTask('bump');
project.addTask('bump', {
  exec: 'npm version patch -no-git-tag-version --no-workspaces-update',
});

project.package.addField('preferGlobal', true);

// set custom scripts
project.setScript('projen', 'npx projen --no-post');
project.setScript('npm:publish', 'yarn bump && yarn build && yarn package && yarn npm:push');
project.setScript('npm:push', 'yarn npm publish');

project.synth();
