import { TypeScriptProject } from 'projen';
import * as fs from 'fs';

const project = new TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'caws-source-repositories',
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
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@caws-blueprint/blueprints.blueprint',
    'decamelize',
    "camelcase",
  ],
  peerDeps: [
    'projen',
  ],
  description: 'This is a representation of a source repository.',
  packageName: '@caws-blueprint-component/caws-source-repositories',
  devDeps: [
    'ts-node'
  ],
});

// keep consistent versions
const version = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
project.package.addVersion(version || '0.0.0');

// modify bumping tasks
project.removeTask('bump');
project.addTask('bump', {
  exec: 'npm version patch -no-git-tag-version',
});

project.package.addField('preferGlobal', true);

// set custom scripts
project.setScript('projen', 'npx projen --no-post');
project.setScript('npm:publish', 'yarn bump && yarn build && yarn package && yarn npm:push');
project.setScript("npm:push", 'yarn npm publish');

project.synth();
