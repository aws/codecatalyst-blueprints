import * as fs from 'fs';
import { typescript } from 'projen';

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'projen-blueprint-component',
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
  peerDeps: ['projen'],
  description: 'This is a projen blueprint component. This defines the project configuration a for a blueprint component project.',
  packageName: '@amazon-codecatalyst/blueprint-util.projen-blueprint-component',
  devDeps: ['projen', 'ts-node'],
});

// keep consistent versions
const version = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
project.package.addVersion(version || '0.0.0');

// force node types
project.addDevDeps('@types/node@^18');

// modify bumping tasks
project.removeTask('release');
project.removeTask('bump');
project.addTask('bump', {
  exec: 'npm version patch -no-git-tag-version --no-workspaces-update',
});

project.package.addField('preferGlobal', true);

// set custom scripts
project.setScript('projen', 'npx projen --no-post');


project.setScript(
  'component:package',
  [
    'yarn build',
    'yarn package',
  ].join(' && '),
);

project.setScript(
  'npm:push',
  [
    'yarn bump',
    'yarn component:package',
    'yarn npm:publish',
  ].join(' && '),
);
project.setScript('npm:publish', 'npm publish dist/js/*.tgz');

project.synth();
