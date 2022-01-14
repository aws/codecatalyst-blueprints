import {ProjenBlueprint} from '@caws-blueprint-util/blueprint-projen';

const blueprint = new ProjenBlueprint({
  defaultReleaseBranch: 'main',
  name: 'blueprint',
  projenrcTs: true,
  displayName: 'Empty Project',
  authorName: 'caws-blueprints',
  copyrightOwner: 'Amazon.com',
  /* Runtime dependencies of this blueprint. */
  peerDeps: ['projen'],
  /* The description is a short string that helps people understand the purpose of the blueprint. */
  description:
    'This is a base blueprint that creates an empty project. All blueprints extend from this blueprint at some level.',
  /* The "name" in package.json. In form @caws-blueprints/:organization.:name */
  packageName: '@caws-blueprint/blueprints.blueprint',
  publishingOrganization: 'blueprints',
  /* Build dependencies for this module. */
  devDeps: [
    'ts-node',
    '@caws-blueprint-util/blueprint-cli',
    '@caws-blueprint-util/blueprint-projen',
  ],
  /* Add release management to this project. */
  // release: undefined,
  keywords: ['blueprint'],
  homepage: 'https://aws.amazon.com/',
  /* Add media url links to this project */
  mediaUrls: [
    'https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_stacked_REV_SQ.91cd4af40773cbfbd15577a3c2b8a346fe3e8fa2.png',
  ],
});

blueprint.synth();
