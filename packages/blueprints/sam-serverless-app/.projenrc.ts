import { ProjenBlueprint } from '@caws-blueprint-util/blueprint-projen';
const project = new ProjenBlueprint({
  "defaultReleaseBranch": "main",
  "name": "sam-serverless-application",
  "copyrightOwner": 'Amazon.com',

  "projenrcTs": true,
  "sampleCode": false,
  "github": false,
  "eslint": false,
  "jest": false,
  "minNodeVersion": "12.x",
  "npmignoreEnabled": true,
  "authorName": 'caws-blueprints',

  "tsconfig": {
    "compilerOptions": {
      "esModuleInterop": true,
      "noImplicitAny": false
    }
  },
  "deps": [
    "@caws-blueprint/blueprints.blueprint",
    "@caws-blueprint-component/caws-workflows",
    "@caws-blueprint-component/caws-source-repositories",
    "@caws-blueprint-component/caws-workspaces",
    "@caws-blueprint-component/caws-environments"
  ],
  "description": "This blueprint generates a serverless application model (SAM) project. The project will contain source code and configuration files to build and deploy your SAM application",
  "packageName": "@caws-blueprint/blueprints.sam-serverless-application",
  "publishingOrganization": "blueprints",
  "devDeps": [
    "ts-node",
    "typescript",
    "@caws-blueprint-util/blueprint-projen",
    "@caws-blueprint-util/blueprint-cli"
  ],
  "keywords": ["blueprint", "sam", "lambda", "python", "node", "nodejs", "java", "serverless"],
  "homepage": "https://aws.amazon.com/",
  "mediaUrls": ["https://media.amazonwebservices.com/blog/2018/sam_squirrel_1.jpg"],
  "displayName": "Serverless Application Model (SAM) Blueprint"
});

project.synth();
