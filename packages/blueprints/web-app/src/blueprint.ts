import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, makeValidFolder, SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import {
  ActionIdentifierAlias,
  BuildActionConfiguration,
  Step,
  StageDefinition,
  Workflow,
  WorkflowDefinition,
  getDefaultActionIdentifier,
  Artifacts,
  Reports,
} from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@caws-blueprint/blueprints.blueprint';
import { createBackend } from './backend/create-backend';
import defaults from './defaults.json';
import { createFrontend } from './frontend/create-frontend';
import { generateReadmeContents } from './readme-contents';

// Projen version string used when creating the webapp
export const PROJEN_VERSION = '0.52.18';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 */
export interface Options extends ParentOptions {

  /**
   * The blueprint will create a new environment used for deployment.
   */
  stages: StageDefinition[];

  /**
    * @displayName Repository and folder names
    * @collapsed true
    */
  webappOptions: {
    /**
     * @displayName Source Repository Name
     * @validationRegex /^[a-zA-Z0-9_.-]{1,100}$(?<!.git$)/
     * @validationMessage Must contain only alphanumeric characters, periods (.), underscores (_), dashes (-) and be up to 100 characters in length. Cannot end in .git or contain spaces
     */
    repositoryName: string;

    /**
     * @displayName Frontend folder
     * @validationRegex /^[a-zA-Z0-9_-]+$/
     * @validationMessage Must contain only alphanumeric characters, underscores (_), and dashes (-)
     */
    reactFolderName: string;

    /**
     * @displayName Backend folder
     * @validationRegex /^[a-zA-Z0-9_-]+$/
     * @validationMessage Must contain only alphanumeric characters, underscores (_), and dashes (-)
     */
    nodeFolderName: string;
  };


  /**
   * @displayName Lambda function name
   * @collapsed true
   */
  advanced: {
    /**
     * Lambda function name must be unique in the AWS account you are deploying to.
     * @validationRegex /^[a-zA-Z0-9]{1,56}$/
     * @validationMessage Must contain only alphanumeric characters, underscores (_)
     * @displayName Lambda function
     * @defaultEntroy
     */
    lambdaName: string;
  };


}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;
  protected readonly repositoryName: string;
  protected readonly stackName: string;
  protected readonly reactFolderName: string;
  protected readonly nodeFolderName: string;
  protected readonly repository: SourceRepository;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);
    this.options = options;
    const { repositoryName, reactFolderName, nodeFolderName } = options.webappOptions;
    this.repositoryName = makeValidFolder(repositoryName);
    this.reactFolderName = makeValidFolder(reactFolderName);
    this.nodeFolderName = makeValidFolder(nodeFolderName);

    this.stackName = makeValidFolder(this.repositoryName.toLowerCase(), { invalidChars: ['-'] });
    this.stackName = this.stackName.charAt(0).toUpperCase() + this.stackName.slice(1) + 'Stack';

    let lambdaNames: string[] = [options.advanced.lambdaName || 'defaultLambdaHandler'];
    lambdaNames = lambdaNames.map(lambdaName => `${lambdaName[0].toUpperCase()}${lambdaName.slice(1)}`);

    this.repository = new SourceRepository(this, {
      title: this.repositoryName,
    });

    createFrontend(this.repository, this.reactFolderName, lambdaNames, this.stackName, {
      name: this.reactFolderName,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      defaultReleaseBranch: 'main',
      deps: ['axios'],
      github: false,
      devDeps: ['jest-junit'],
      gitignore: ['junit.xml'],
      tsconfig: {
        include: ['src/**/loaders.d.ts'],
        compilerOptions: {
          module: 'CommonJS',
          noUnusedLocals: false,
          noImplicitAny: false,
        },
      },
    });

    createBackend({
      repository: this.repository,
      folder: this.nodeFolderName,
      frontendfolder: this.reactFolderName,
      stackName: this.stackName,
      lambdas: lambdaNames,
    }, {
      name: this.nodeFolderName,
      cdkVersion: '1.95.2',
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      appEntrypoint: 'main.ts',
      cdkDependencies: [
        '@aws-cdk/assert',
        '@aws-cdk/aws-lambda',
        '@aws-cdk/aws-apigateway',
        '@aws-cdk/aws-s3',
        '@aws-cdk/aws-s3-deployment',
        '@aws-cdk/aws-cloudfront',
        '@aws-cdk/core',
      ],
      devDeps: [
        'cdk-assets',
        'projen@0.52.18',
      ],
      context: {
        '@aws-cdk/core:newStyleStackSynthesis': 'true',
      },
      github: false,
      sampleCode: false,
      lambdaAutoDiscover: true,
      defaultReleaseBranch: 'main',
    });

    new Workspace(this, this.repository, SampleWorkspaces.default);
    (options.stages || []).forEach((stage, index) => {
      if (!stage.environment.title) {
        stage.environment.title = `stage_${index}`;
      }
      this.createWorkflow(stage);
      new Environment(this, stage.environment);
    });

    new SourceFile(this.repository, 'README.md', generateReadmeContents(this.reactFolderName, this.nodeFolderName));
    new SourceFile(this.repository, 'GETTING_STARTED.md', 'How to get started with this web application');
  }

  private createWorkflow(stage: StageDefinition) {
    const workflowDefinition: WorkflowDefinition = {
      Name: 'buildAssets',
      Triggers: [
        {
          Type: 'push',
          Branches: ['main'],
        },
      ],
      Actions: {},
    };

    this.createDeployAction(stage, workflowDefinition);
    new Workflow(this, this.repository, workflowDefinition);
  }

  private createDeployAction(stage: StageDefinition, workflow: WorkflowDefinition) {
    const AUTO_DISCOVERY_ARTIFACT_NAME = 'AutoDiscoveryArtifact';

    workflow.Actions[`Build_${stage?.environment.title}`] = {
      Identifier: getDefaultActionIdentifier(
        ActionIdentifierAlias.build,
        this.context.environmentId,
      ),
      Configuration: {
        ActionRoleArn: stage.role,
        Steps: [
          { Run: `export awsAccountId=${this.getIdFromArn(stage.role)}` },
          { Run: 'export awsRegion=us-west-2' },
          { Run: `mkdir -p ./${this.reactFolderName}/build && touch ./${this.reactFolderName}/build/.keep` },
          { Run: 'npm install -g yarn' },
          { Run: `cd ./${this.nodeFolderName} && yarn && yarn build` },
          {
            Run: `npx cdk bootstrap aws://${this.getIdFromArn(stage.role)}/us-west-2`,
          },
          {
            Run: 'yarn deploy:copy-config',
          },
          { Run: 'cd ..' },
          { Run: `cd ./${this.reactFolderName} && yarn && yarn build` },
          { Run: 'cd ..' },
          { Run: `cd ./${this.nodeFolderName}` },
          {
            Run: `npx cdk deploy ${this.stackName}Frontend --require-approval never --outputs-file config.json`,
          },
          // TODO - a hack to get the cloudformation url to show up under build outputs
          {
            Run: `eval $(jq -r \'.${this.stackName}Frontend | to_entries | .[] | .key + "=" + (.value | @sh) \' \'config.json\')`,
          },
        ] as Step[],
        Artifacts: [
          { Name: AUTO_DISCOVERY_ARTIFACT_NAME, Files: ['**/*'] },
        ] as Artifacts[],
        Reports: [
          { Name: 'AutoDiscovered', AutoDiscover: true, TestResults: [{ ReferenceArtifact: AUTO_DISCOVERY_ARTIFACT_NAME }] },
        ] as unknown as Reports[],
        OutputVariables: [{ Name: 'CloudFrontURL' }],
      } as BuildActionConfiguration,
      OutputArtifacts: [AUTO_DISCOVERY_ARTIFACT_NAME],
    };
  }

  private getIdFromArn(arnRole: string) {
    return arnRole.split(':')[4] || 'REPLACE_ME_AWS_ACCOUNT_NUMBER';
  }
}
