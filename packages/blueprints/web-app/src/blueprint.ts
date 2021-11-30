import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
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
 */
export interface Options extends ParentOptions {
  /**
     * The name of the application.
     */
  name: string;
  /**
     * Options for the Frontend Application
     */
  frontend: {
    /**
         * The name of the Frontend Application
         */
    name: string;
    /**
         * The relative path of the Frontend Application
         * @advanced
         */
    outdir: string;
    /**
         * The license of the Frontend Application
         * See https://github.com/projen/projen/tree/main/license-text
         */
    license?: 'MIT' | 'Apache-2.0';
  };
  backend: {
    /**
         * The name of the Backend Application
         */
    name: string;
    /**
         * The relative path of the Backend Application
         * @advanced
         */
    outdir: string;
    /**
         * The license of the Backend Application
         * See https://github.com/projen/projen/tree/main/license-text
         */
    license?: 'MIT' | 'Apache-2.0';
  };
  /**
     * Specifies the default release branch
     * @advanced
     */
  defaultReleaseBranch: string;
  /**
     * AWS Account ID
     */
  awsAccountId: string;
  /**
     * awsRegion
     */
  awsRegion: string;
  /**
     * S3 Bucket that will host the React Web App
     */
  s3BucketName: string;
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

    this.createFrontend(this, repository);
    this.createStacks(this, repository);
  }

  private createFrontend(parent: Project, repo: SourceRepository): web.ReactTypeScriptProject {
    const project = new web.ReactTypeScriptProject({
      parent,
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

  private createStacks(parent: Project, repo: SourceRepository): Project {
    const project = new AwsCdkTypeScriptApp({
      parent,
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
    const s3BucketName = this.getUniqueS3BucketName(this.options.s3BucketName);
    const sourceCode = getStackDefinition(stackName, s3BucketName, this.options, lambdaOptions);
    createClass(project.outdir, project.srcdir, 'main.ts', sourceCode);

    const testCode = getStackTestDefintion(project.appEntrypoint, stackName);
    createClass(project.outdir, project.testdir, 'main.test.ts', testCode);

    return project;
  }

  private getUniqueS3BucketName(s3BucketName: string) {
    return `${s3BucketName.toLowerCase()}-${this.getSecondSinceEpoch()}`;
  }

  private getSecondSinceEpoch() {
    return Math.floor(Date.now() / 1000);
  }
}
