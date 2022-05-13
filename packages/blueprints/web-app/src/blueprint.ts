import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, makeValidFolder, SourceFile, StaticAsset } from '@caws-blueprint-component/caws-source-repositories';
import {
  emptyWorkflow,
  Workflow,
  WorkflowDefinition,
  addGenericBuildAction,
  addGenericBranchTrigger,
} from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
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
   * @displayName Environment
   * @collapsed false
   */
  environment: EnvironmentDefinition<{
    /**
     * AWS accounts are needed for deployment. You can move forward without adding an AWS account but the web application will not deploy.
     * @displayName AWS account connection
     * @collapsed false
     */
    awsAccountConnection: AccountConnection<{
      /**
       * This is the role that will be used to deploy the web application. It should have access to bootstrap and deploy all of your resources.
       * @displayName CDK Role
       */
      cdkRole: Role<['CDK Bootstrap', 'CDK Deploy']>;
    }>;
  }>;

  /**
   * @displayName Code Repository and folder names
   * @collapsed true
   */
  webappOptions: {
    /**
     * @displayName Code Repository Name
     * @validationRegex /(?!.*\.git$)^[a-zA-Z0-9_.-]{1,100}$/
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
   * @displayName Advanced
   * @collapsed true
   */
  advanced: {
    /**
     * Lambda function name must be unqiue to the AWS account it's being deployed to.
     * @validationRegex /^[a-zA-Z0-9]{1,56}$/
     * @validationMessage Must contain only alphanumeric characters, underscores (_)
     * @displayName Lambda function name
     * @defaultEntropy 5
     */
    lambdaName: string;

    /**
     * The name of the Cloudformation stack to deploy the application's resources
     * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,128}$/
     * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
     * @displayName Cloudformation stack name
     * @defaultEntropy 5
     */
    stackName: string;
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
  protected readonly frontendStackName: string;
  protected readonly backendStackName: string;
  protected readonly reactFolderName: string;
  protected readonly nodeFolderName: string;
  protected readonly repository: SourceRepository;

  constructor(options_: Options) {
    super(options_);

    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);
    this.options = options;

    const { repositoryName, reactFolderName, nodeFolderName } = options.webappOptions;
    this.repositoryName = makeValidFolder(repositoryName);
    this.reactFolderName = makeValidFolder(reactFolderName);
    this.nodeFolderName = makeValidFolder(nodeFolderName);

    const stackNameBase = options.advanced.stackName.charAt(0).toUpperCase() + options.advanced.stackName.slice(1);
    this.frontendStackName = this.applySuffix(stackNameBase, 'FrontendStack', 128);
    this.backendStackName = this.applySuffix(stackNameBase, 'BackendStack', 128);
    const s3BucketName = options.advanced.stackName.toLowerCase();

    let lambdaNames: string[] = [options.advanced.lambdaName || 'defaultLambdaHandler'];
    lambdaNames = lambdaNames.map(lambdaName => `${lambdaName[0].toUpperCase()}${lambdaName.slice(1)}`);

    this.repository = new SourceRepository(this, {
      title: this.repositoryName,
    });

    createFrontend(this.repository, this.reactFolderName, lambdaNames, stackNameBase, {
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
    new SourceFile(this.repository, `${this.reactFolderName}/package-lock.json`, new StaticAsset('frontend/package-lock.json').toString());

    createBackend(
      {
        repository: this.repository,
        folder: this.nodeFolderName,
        frontendfolder: this.reactFolderName,
        stackNameBase: stackNameBase,
        backendStackName: this.backendStackName,
        frontendStackName: this.frontendStackName,
        s3BucketName: s3BucketName,
        lambdas: lambdaNames,
      },
      {
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
        devDeps: ['cdk-assets', 'projen@0.52.18'],
        context: {
          '@aws-cdk/core:newStyleStackSynthesis': 'true',
        },
        github: false,
        sampleCode: false,
        lambdaAutoDiscover: true,
        defaultReleaseBranch: 'main',
      },
    );
    new SourceFile(this.repository, `${this.nodeFolderName}/package-lock.json`, new StaticAsset('backend/package-lock.json').toString());

    new Workspace(this, this.repository, SampleWorkspaces.default);
    new Environment(this, options.environment);
    this.createWorkflow(options.environment);

    new SourceFile(this.repository, 'README.md', generateReadmeContents(this.reactFolderName, this.nodeFolderName));
    new SourceFile(this.repository, 'GETTING_STARTED.md', 'How to get started with this web application');
  }

  private createWorkflow(
    environment: EnvironmentDefinition<{
      awsAccountConnection: AccountConnection<{
        cdkRole: Role<['CDK Bootstrap', 'CDK Deploy']>;
      }>;
    }>,
  ) {
    const workflowDefinition: WorkflowDefinition = {
      ...emptyWorkflow,
      Name: 'buildAssets',
    };
    this.createDeployAction(environment, workflowDefinition);
    new Workflow(this, this.repository, workflowDefinition);
  }

  private createDeployAction(
    environment: EnvironmentDefinition<{
      awsAccountConnection: AccountConnection<{
        cdkRole: Role<['CDK Bootstrap', 'CDK Deploy']>;
      }>;
    }>,
    workflow: WorkflowDefinition,
  ) {
    const roleARN = environment.awsAccountConnection?.cdkRole?.arn || '<<PUT_YOUR_ROLE_ARN_HERE>>';
    const accountId = environment.awsAccountConnection?.id || '<<PUT_YOUR_ACCOUNT_NUMBER_HERE>>';
    const actionName = `build_and_deploy_into_${environment.name}`;

    addGenericBranchTrigger(workflow, ['main']);

    /**
     * In this case we do a deployment directly from a build action rather than calling cdk synth and then deploying the cloudformation template in another action. This is optional and just done for convienence.
     */
    addGenericBuildAction({
      blueprint: this,
      workflow,
      actionName,
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || '<<PUT_YOUR_ACCOUNT_CONNECTION_NAME_HERE>>',
            Role: this.options.environment.awsAccountConnection?.cdkRole?.name || '<<PUT_YOUR_CONNECTION_ROLE_NAME_HERE>>',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
        Variables: {
          CONNECTED_ACCOUNT_ID: accountId,
          CONNECTED_ROLE_ARN: roleARN,
          REGION: 'us-west-2',
        },
      },
      output: {
        AutoDiscoverReports: {
          ReportNamePrefix: 'AutoDiscovered',
          IncludePaths: ['**/*'],
          Enabled: true,
          ExcludePaths: ['*/node_modules/**/*'],
        },
        Variables: ['CloudFrontURL'],
      },
      steps: [
        'export awsAccountId=${CONNECTED_ACCOUNT_ID}',
        'export roleArn=${CONNECTED_ROLE_ARN}',
        'export region=${REGION}',
        `mkdir -p ./${this.reactFolderName}/build && touch ./${this.reactFolderName}/build/.keep`,
        'npm install -g yarn',
        `cd ./${this.nodeFolderName} && yarn && yarn build`,
        'npx cdk bootstrap aws://${CONNECTED_ACCOUNT_ID}/us-west-2',
        'yarn deploy:copy-config',
        'cd ..',
        `cd ./${this.reactFolderName} && yarn && yarn build`,
        'cd ..',
        `cd ./${this.nodeFolderName}`,
        `npx cdk deploy ${this.frontendStackName} --require-approval never --outputs-file config.json`,

        // this step is a hack to get the cloudfront url from the cdk output
        `eval $(jq -r \'.${this.frontendStackName} | to_entries | .[] | .key + "=" + (.value | @sh) \' \'config.json\')`,
      ],
    });
  }

  applySuffix(str: string, suffix: string, maxLength: number): string {
    const stringLength = str.length + suffix.length;
    if (stringLength <= maxLength) {
      return str + suffix;
    }
    return str.slice(0, -(stringLength - maxLength)) + suffix;
  }
}
