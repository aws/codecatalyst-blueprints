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
import { generateConfigJson } from './default-config';
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
   * Customize your project's repositiory name.
   */
  repositoryName: string;

  /**
   * Name of the folder for the frontend stack, such as react or ui.
   */
  reactFolderName: string;

  /**
   * Name of the folder for the backend stack, such as node or api.
   */
  nodeFolderName: string;

  /**
   * The configurations for your workflow
   */
  workflow: {
    /**
     * Add deployment stages.
     */
    stages: StageDefinition[];
  };

  /**
   * @collapsed true
   */
  advanced: {
    /**
     * How many lambdas would you like to create?
     */
    lambdaNames: string[];
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
  // protected readonly frontend: web.ReactTypeScriptProject;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);
    this.options = options;
    const { repositoryName, reactFolderName, nodeFolderName } = options;
    this.repositoryName = makeValidFolder(repositoryName);
    this.reactFolderName = makeValidFolder(reactFolderName);
    this.nodeFolderName = makeValidFolder(nodeFolderName);

    this.stackName = makeValidFolder(this.repositoryName.toLowerCase(), {invalidChars: ['-']});
    this.stackName = this.stackName.charAt(0).toUpperCase() + this.stackName.slice(1) + 'Stack';

    if(!options.advanced.lambdaNames || !options.advanced.lambdaNames.length) {
      options.advanced.lambdaNames = ['defaultLambdaHandler'];
    }

    this.repository = new SourceRepository(this, {
      title: this.repositoryName,
    });

    createFrontend(this.repository, this.reactFolderName, {
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
      lambdas: this.options.advanced.lambdaNames,
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
    this.createWorkflow();

    new Workspace(this, this.repository, SampleWorkspaces.default);
    for (const stage of this.options.workflow.stages) {
      new Environment(this, stage.environment);
    }

    new SourceFile(this.repository, 'README.md', generateReadmeContents(this.reactFolderName, this.nodeFolderName));
    new SourceFile(this.repository, 'GETTING_STARTED.md', "How to get started with this web application");

    const defaultConfig = generateConfigJson(`${this.options.repositoryName}ApiStack`);
    new SourceFile(this.repository, `${this.reactFolderName}/src/config.json`, JSON.stringify(defaultConfig, null, 2));
  }

  // override synth(): void {
  //   new SampleFile(this, path.join(this.repository.relativePath, 'README.md'), {
  //     contents: readmeContents,
  //   });

  //   const rootPackageJson: string = generatePackageJson(
  //     this.options.reactFolderName,
  //     this.options.nodeFolderName,
  //   );
  //   new SampleFile(this, path.join(this.repository.relativePath, 'package.json'), {
  //     contents: rootPackageJson,
  //   });

  //

  //   super.synth();
  // }

  // private createBackend(): awscdk.AwsCdkTypeScriptApp {
    // const project = new awscdk.AwsCdkTypeScriptApp({
    //   parent: this,
    //   cdkVersion: '1.95.2',
    //   name: `${this.options.nodeFolderName}`,
    //   authorEmail: 'caws@amazon.com',
    //   authorName: 'codeaws',
    //   outdir: `${this.repository.relativePath}/${this.options.nodeFolderName}`,
    //   appEntrypoint: 'main.ts',
    //   cdkDependencies: [
    //     '@aws-cdk/core',
    //     '@aws-cdk/aws-lambda',
    //     '@aws-cdk/aws-apigateway',
    //     '@aws-cdk/aws-s3',
    //     '@aws-cdk/aws-s3-deployment',
    //     '@aws-cdk/aws-cloudfront',
    //   ],
    //   devDeps: ['cdk-assets'],
    //   context: {
    //     '@aws-cdk/core:newStyleStackSynthesis': 'true',
    //   },
    //   sampleCode: false,
    //   lambdaAutoDiscover: true,
    //   defaultReleaseBranch: 'main',
    // });

  //   const lambdaName = `${this.options.repositoryName}Lambda`;
  //   const lambdaOptions: awscdk.LambdaFunctionOptions = createLambda(
  //     project,
  //     lambdaName,
  //     helloWorldLambdaCallback,
  //   );

    // const stackName = `${this.options.repositoryName}`;
    // const sourceCode = getStackDefinition(stackName, this.options, lambdaOptions);
    // createClass(project.outdir, project.srcdir, 'main.ts', sourceCode);

    // const testCode = getStackTestDefintion(project.appEntrypoint, stackName);
    // createClass(project.outdir, project.testdir, 'main.test.ts', testCode);

  //   return project;
  // }

  // // TODO: A temporary hack for deploying cdk apps through workflows.
  private createWorkflow() {
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

    this.options.workflow.stages.forEach((stage: StageDefinition) => {
      this.createDeployAction(stage, workflowDefinition);
    });

    new Workflow(this, this.repository, workflowDefinition);
  }

  private createDeployAction(stage: any, workflow: WorkflowDefinition) {
    const AUTO_DISCOVERY_ARTIFACT_NAME = 'AutoDiscoveryArtifact';

    workflow.Actions[`Build_${stage.environment.title}`] = {
      Identifier: getDefaultActionIdentifier(
        ActionIdentifierAlias.build,
        this.context.environmentId,
      ),
      Configuration: {
        ActionRoleArn: stage.role,
        Steps: [
          { Run: `export awsAccountId=${this.getIdFromArn(stage.role)}` },
          { Run: `export awsRegion=${stage.region}` },
          { Run: `cd ./${this.nodeFolderName} && yarn && yarn build` },
          {
            Run: `npx cdk bootstrap aws://${this.getIdFromArn(stage.role)}/${
              stage.region
            }`,
          },
          {
            Run: `yarn deploy:copy-config`,
          },
          { Run: 'cd ..' },
          { Run: `cd ./${this.reactFolderName} && yarn && yarn build` },
          { Run: 'cd ..' },
          { Run: `cd ./${this.nodeFolderName}` },
          {
            Run: `npx cdk deploy ${this.stackName} --require-approval never --outputs-file config.json`,
          },
          // TODO - a hack to get the cloudformation url to show up under build outputs
          {
            Run: `eval $(jq -r \'.${this.stackName} | to_entries | .[] | .key + "=" + (.value | @sh) \' \'config.json\')`,
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
