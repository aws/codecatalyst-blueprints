import {ProjenBlueprint} from '@caws-blueprint-util/projen-blueprint';

const blueprint = new ProjenBlueprint({
  defaultReleaseBranch: 'main',
  name: 'web-app',
  displayName: 'Web application',
  authorName: 'caws-blueprints',
  copyrightOwner: 'Amazon.com',
  projenrcTs: true,

  /* Runtime dependencies of this blueprint. */
  deps: [
    'projen',
    '@caws-blueprint/blueprints.blueprint',
    '@caws-blueprint-component/caws-source-repositories',
    '@caws-blueprint-util/blueprint-utils',
    '@caws-blueprint-component/caws-workflows',
    '@caws-blueprint-component/caws-environments',
    '@caws-blueprint-component/caws-workspaces',
  ],
  /* The description is a short string that helps people understand the purpose of the blueprint. */
  description: 'This blueprint creates and deploys a web application.',
  /* The "name" in package.json. In form @caws-blueprints/:organization.:name */
  packageName: '@caws-blueprint/blueprints.web-app',
  publishingOrganization: 'blueprints',
  /* Build dependencies for this module. */
  devDeps: [
    'ts-node',
    '@caws-blueprint-util/blueprint-cli',
    '@caws-blueprint-util/projen-blueprint',
  ],
  /* Add release management to this project. */
  // release: undefined,
  keywords: ['blueprint', 'webapp', 'typescript', 'react', 'node'],
  homepage: 'https://aws.amazon.com/',
  /* Add media url links to this project */
  mediaUrls: [
    'https://d1.awsstatic.com/logos/aws-logo-lockups/poweredbyaws/PB_AWS_logo_RGB_stacked_REV_SQ.91cd4af40773cbfbd15577a3c2b8a346fe3e8fa2.png',
  ],
});

blueprint.synth();
