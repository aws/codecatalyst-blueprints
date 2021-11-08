import { TypeScriptProject } from 'projen';
import * as fs from 'fs';

const project = new TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'projen-blueprint',
  projenrcTs: true,
  sampleCode: false,
  eslint: false,
  github: false,
  jest: false,
  npmignoreEnabled: true,
  projenDuringBuild: false,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  license: 'MIT',
  copyrightOwner: 'Amazon.com',
  peerDeps: [
    'projen@*',
    "@caws-blueprint-tool/blueprint-cli@^1.0.3"
  ],
  description: 'This is a projen blueprint. This defines the project configuration a blueprint project.',
  packageName: '@caws-blueprint-util/blueprint-projen',
  devDeps: ['ts-node'],
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
project.setScript("npm:push", 'yarn publish ./dist/js/*$npm_package_version.tgz');

project.synth();