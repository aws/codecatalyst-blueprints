import { ProjenBlueprintComponent } from '@amazon-codecatalyst/blueprint-util.projen-blueprint-component';

const project = new ProjenBlueprintComponent({
  defaultReleaseBranch: 'main',
  name: 'cli',
  copyrightOwner: 'Amazon.com',
  deps: [
    '@aws-sdk/client-s3',
    '@aws-sdk/client-cloudfront',
    '@aws-sdk/client-sts',
    '@aws-sdk/client-codecatalyst',
    'ajv',
    'pino',
    'yargs',
    'ts-node',
    'axios',
    'esbuild',
    'pino-pretty',
    'typescript',
    'jmespath',
    'deepmerge',
  ],
  peerDeps: [],
  description: 'This is a cli utility used for blueprint development.',
  packageName: '@amazon-codecatalyst/blueprint-util.cli',
  devDeps: [
    '@amazon-codecatalyst/blueprint-util.projen-blueprint-component',
    '@types/jest',
    '@types/pino',
    '@types/yargs',
    '@types/jmespath',
    'pino-pretty',
    'ts-jest',
    'ts-loader',
    'ts-json-schema-generator',
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

const makeAssessmentSchemaScript = 'make-assessment-schemas';
project.addTask(makeAssessmentSchemaScript, {
  steps: [
    {
      say: 'generate full assessment schema',
      exec: "npx ts-json-schema-generator --path 'src/assessment/models.ts' --type BlueprintAssessmentObject > src/assessment/__generated__/blueprint-assessment-object-schema.json",
    },
    {
      say: 'generate partial assessment schema',
      exec: "npx ts-json-schema-generator --path 'src/assessment/models.ts' --type PartialBlueprintAssessmentObject > src/assessment/__generated__/partial-blueprint-assessment-object-schema.json",
    },
  ],
});
project.setScript('build', `yarn ${makeAssessmentSchemaScript} && npx projen build`);

project.synth();
