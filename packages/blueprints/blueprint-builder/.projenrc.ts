import {ProjenBlueprint} from '@caws-blueprint-util/blueprint-projen'

const blueprint = new ProjenBlueprint({
  defaultReleaseBranch: 'main',
  name: 'blueprint-builder',
  license: 'MIT',
  projenrcTs: true,
  sampleCode: false,
  github: false,
  eslint: false,
  jest: false,
  npmignoreEnabled: true,
  projenDuringBuild: false,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
  copyrightOwner: 'Amazon.com',
  /* Runtime dependencies of this blueprint. */
  deps: [
    'projen@0.31.0',
    'camelcase@1.x',
    'decamelize@5.0.x',
    'typescript@4.x',
    '@caws-blueprint/caws.blueprint@0.x',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-util/blueprint-utils',
    '@caws-blueprint-util/blueprint-projen'
  ],
  /* The description is a short string that helps people understand the purpose of the blueprint. */
  description: 'Use this to build additional blueprints from existing blueprints.',
  /* The "name" in package.json. In form @caws-blueprints/:organization.:name */
  packageName: '@caws-blueprint/caws.blueprint-builder',
  publishingOrganization: 'caws',
  /* Build dependencies for this module. */
  devDeps: [
    'ts-node', 
    '@caws-blueprint-tool/blueprint-cli'
  ],
  /* Add release management to this project. */
  // release: undefined,
  keywords: ['blueprint'],
  homepage: 'https://aws.amazon.com/',
  /* Add media url links to this project */
  mediaUrls: ['https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_stacked_REV_SQ.91cd4af40773cbfbd15577a3c2b8a346fe3e8fa2.png'],
});
blueprint.synth();
