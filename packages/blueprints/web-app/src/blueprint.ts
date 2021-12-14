import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow, ActionDefiniton, BuildActionConfiguration, Step, WorkflowDefinition } from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import { awscdk, AwsCdkTypeScriptApp, Project, SourceCode, web } from 'projen';

import defaults from './defaults.json';
import { helloWorldLambdaCallback } from './hello-world-lambda';
import { createLambda } from './lambda-generator';
import { getStackDefinition, getStackTestDefintion } from './stack';
import { createClass } from './stack-generator';

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
   * The name of the application
   */
  name: string;
  /**
   * Options for the frontend Application
   */
  frontend: {
    /**
     * The name of the frontend Application
     */
    name: string;
    /**
     * The relative path of the frontend Application
     * @advanced
     */
    outdir: string;
    /**
     * The license of the frontend Application
     */
    license?: 'MIT' | 'Apache-2.0';
    /**
     * S3 Bucket that will host the React Web App
     */
    s3BucketName: string;
  };
  backend: {
    /**
     * The name of the backend Application
     */
    name: string;
    /**
     * The relative path of the backend Application
     * @advanced
     */
    outdir: string;
    /**
     * The license of the backend Application
     */
    license?: 'MIT' | 'Apache-2.0';
  };
  /**
   * Specifies the default release branch
   * @advanced
   */
  defaultReleaseBranch: string;
  /**
   * AWS account id
   */
  awsAccountId: string;
  /**
   * AWS region
   */
  awsRegion: string;
  /**
   * The role ARN to use when building and deploying
   */
  buildDeployAndStackRoleArn: string;
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);
    this.options = options;

    const repository = new SourceRepository(this, {
      title: this.options.name,
    });
    new Workspace(this, repository, SampleWorkspaces.default);

    this.createFrontend(repository);
    this.createStacks(repository);
    this.createWorkflow(repository);
  }

  private createFrontend(repo: SourceRepository): web.ReactTypeScriptProject {
    const project = new web.ReactTypeScriptProject({
      parent: this,
      name: `${this.options.frontend.name}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${repo.relativePath}/${this.options.frontend.outdir}`,
      defaultReleaseBranch: this.options.defaultReleaseBranch,
      license: this.options.frontend.license,
    });

    // Issue: NPM build crawls up the dependency tree and sees a conflicting version of eslint
    //  that is incompatible with create-react-app (i.e react=scripts). We skip the preflight check
    //  to prevent blocking warnings.
    const dotenvFile = new SourceCode(project, '.env');
    dotenvFile.line('SKIP_PREFLIGHT_CHECK=true');

    return project;
  }

  private createStacks(repo: SourceRepository): Project {
    const project = new AwsCdkTypeScriptApp({
      parent: this,
      cdkVersion: '1.95.2',
      name: `${this.options.backend.name}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${repo.relativePath}/${this.options.backend.outdir}`,
      appEntrypoint: 'main.ts',
      defaultReleaseBranch: this.options.defaultReleaseBranch,
      cdkDependencies: [
        '@aws-cdk/core',
        '@aws-cdk/aws-lambda',
        '@aws-cdk/aws-apigateway',
        '@aws-cdk/aws-s3',
        '@aws-cdk/aws-s3-deployment',
        '@aws-cdk/aws-cloudfront',
      ],
      sampleCode: false,
      lambdaAutoDiscover: true,
      license: this.options.frontend.license,
    });

    const lambdaName = `${this.options.name}Lambda`;
    const lambdaOptions: awscdk.LambdaFunctionOptions = createLambda(project, lambdaName, helloWorldLambdaCallback);

    const stackName = `${this.options.name}Stack`;
    const frontendS3BucketName = this.getUniqueS3BucketName(this.options.frontend.s3BucketName);
    const sourceCode = getStackDefinition(stackName, frontendS3BucketName, this.options, lambdaOptions);
    createClass(project.outdir, project.srcdir, 'main.ts', sourceCode);

    const testCode = getStackTestDefintion(project.appEntrypoint, stackName);
    createClass(project.outdir, project.testdir, 'main.test.ts', testCode);

    return project;
  }

  // TODO: A temporary hack for deploying cdk apps through workflows.
  private createWorkflow(repository: SourceRepository) {
    new Workflow(
      this,
      repository,
      {
        Name: 'buildAndDeploy',
        Triggers: [
          {
            Type: 'push',
            Branches: [this.options.defaultReleaseBranch],
          },
        ],
        Actions: {
          BuildAndDeploy: {
            Identifier: 'aws-actions/cawsbuildprivate-build@v1',
            Configuration: {
              ActionRoleArn: this.options.buildDeployAndStackRoleArn,
              Steps: [
                { Run: `cd ./${this.options.frontend.outdir} && npm install && npm run build` },
                { Run: `cd ../${this.options.backend.outdir} && npm install && npm run build` },
                { Run: 'npm run env -- cdk bootstrap' },
                { Run: 'npm run env -- cdk deploy --require-approval never' },
              ] as Step[],
            } as BuildActionConfiguration,
          } as ActionDefiniton,
        },
      } as WorkflowDefinition,
    );
  }

  private getUniqueS3BucketName(s3BucketName: string) {
    return `${s3BucketName.toLowerCase()}-${this.getSecondSinceEpoch()}`;
  }

  private getSecondSinceEpoch() {
    return Math.floor(Date.now() / 1000);
  }
}
