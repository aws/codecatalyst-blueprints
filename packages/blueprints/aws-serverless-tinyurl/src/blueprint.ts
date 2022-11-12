import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, SourceFile, SubstitionAsset, StaticAsset } from '@caws-blueprint-component/caws-source-repositories';
import {
  Workflow,
  ComputeType,
  ComputeFleet,
  WorkflowBuilder,
  TriggerType,
  convertToWorkflowEnvironment,
} from '@caws-blueprint-component/caws-workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally. They will become the defaults for the wizard.
 */
export interface Options extends ParentOptions {
  /**
   * Name for your deployment environment. You can add more environments once the project is created
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
       * @inlinePolicy ./inline-deploy-policy.json
       */
      cdkRole: Role<['CDK Bootstrap', 'CDK Deploy']>;
    }>;
  }>;

  /**
   * @displayName Code Repository name
   * @collapsed true
   */
  code: {
    /**
     * @displayName Code Repository name
     * @validationRegex /(?!.*\.git$)^[a-zA-Z0-9_.-]{3,100}$/
     * @validationMessage Must contain only alphanumeric characters, periods (.), underscores (_), dashes (-) and be between 3 and 100 characters in length. Cannot end in .git or contain spaces
     */
    repositoryName: string;
  };

  /**
   * @displayName Advanced
   * @collapsed true
   */
  advanced: {
    /**
     * The name of the Cloudformation stack to deploy the application's resources
     * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,128}$/
     * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
     * @displayName Stack name
     * @defaultEntropy 5
     */
    stackName: string;

    /**
     * AWS region to deploy the application's resources
     * @displayName AWS region
     */
    region: 'us-east-1' | 'us-west-2';
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
  protected readonly sourceRepository: SourceRepository;
  protected readonly stackName: string;
  protected readonly region: string;
  protected readonly account: string | undefined;

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
      environment: options_.environment,
      code: {
        repositoryName: options_.code.repositoryName,
      },
      advanced: {
        stackName: options_.advanced.stackName,
        region: options_.advanced.region,
      },
    };
    const options = Object.assign(typeCheck, options_);
    this.repositoryName = this.sanitizePath(options.code.repositoryName);
    this.stackName = options.advanced.stackName;
    this.region = options.advanced.region;
    this.account = options.environment.awsAccountConnection?.id;
    this.options = options;
    console.log(options);

    // add a repository
    this.sourceRepository = new SourceRepository(this, { title: this.repositoryName });

    const SUBSTITUTION_ASSETS = this.getSubstitutionAssets();

    const tinyUrlApp = new SubstitionAsset(SUBSTITUTION_ASSETS.TinyUrlApp);
    new SourceFile(
      this.sourceRepository,
      SUBSTITUTION_ASSETS.TinyUrlApp,
      tinyUrlApp.subsitite({
        stackName: this.stackName,
        account: this.account,
        region: this.region,
      }),
    );

    this.createAssets(Object.values(this.getCDKStaticAssets()));
    this.createAssets(Object.values(this.getLambdaStaticAssets()));
    this.createAssets(Object.values(this.getParentStaticAssets()));

    this.createEnvironmentPlusCDWorkflow(this.options.environment, 'main', this.region, this.stackName);
  }

  private sanitizePath(path: string) {
    return path.replace(/\.|\/| /g, '');
  }

  private createSourceFile(sourceFile: string, staticAssetFile: string) {
    new SourceFile(this.sourceRepository, sourceFile, new StaticAsset(staticAssetFile).toString());
  }

  private createAssets(sourceFiles: string[]) {
    for (const sourceFile of sourceFiles) {
      this.createSourceFile(sourceFile, sourceFile);
    }
  }

  private getCDKStaticAssets() {
    return {
      TinyUrlRootStack: 'cdk/src/main/java/com/amazonaws/serverless/TinyUrlRootStack.java',
      TinyUrlAppStack: 'cdk/src/main/java/com/amazonaws/serverless/TinyUrlAppStack.java',
      TinyUrlCanaryStack: 'cdk/src/main/java/com/amazonaws/serverless/TinyUrlCanaryStack.java',
      cdkJson: 'cdk/cdk.json',
      pomXml: 'cdk/pom.xml',
    };
  }

  private getLambdaStaticAssets() {
    return {
      CreateUrlRequestHandler: 'lambda/src/main/java/com/amazonaws/serverless/lambda/CreateUrlRequestHandler.java',
      GetUrlRequestHandler: 'lambda/src/main/java/com/amazonaws/serverless/lambda/GetUrlRequestHandler.java',
      HandlerConstants: 'lambda/src/main/java/com/amazonaws/serverless/lambda/HandlerConstants.java',
      UrlDataService: 'lambda/src/main/java/com/amazonaws/serverless/lambda/UrlDataService.java',
      CreateUrlRequestHandlerTest: 'lambda/src/test/java/com/amazonaws/serverless/lambda/CreateUrlRequestHandlerTest.java',
      GetUrlRequestHandlerTest: 'lambda/src/test/java/com/amazonaws/serverless/lambda/CreateUrlRequestHandlerTest.java',
      TestConstants: 'lambda/src/test/java/com/amazonaws/serverless/lambda/TestConstants.java',
      UrlDataServiceTest: 'lambda/src/test/java/com/amazonaws/serverless/lambda/UrlDataServiceTest.java',
      cdkJson: 'lambda/cdk.json',
      pomXml: 'lambda/pom.xml',
    };
  }

  private getParentStaticAssets() {
    return {
      indexHtml: 'site-contents/index.html',
      testScript: 'testscripts/nodejs/node_modules/index.js',
      cdkJson: 'cdk.json',
      pomXml: 'pom.xml',
      readMe: 'README.md',
    };
  }

  private getSubstitutionAssets() {
    return {
      TinyUrlApp: 'cdk/src/main/java/com/amazonaws/serverless/TinyUrlApp.java',
    };
  }

  private getActions() {
    return {
      'aws/build': ['@v1', '-beta'],
      'aws/managed-test': ['@v1', '-gamma'],
      'aws/cdk-bootstrap': ['@v1', '-gamma'],
      'aws/cdk-deploy': ['@v1', '-gamma'],
    };
  }

  private getActionMapping(action: WorkflowActionIdEnum): string {
    const [vz, ext] = this.getActions()[action];
    return `${action}${this.options.environment.environmentType === 'PRODUCTION' ? '' : ext}${vz}`;
  }

  private createEnvironmentPlusCDWorkflow(environmentOption: EnvironmentDefinition<any>, branch?: string, region?: string, stackName?: string) {
    const env = new Environment(this, environmentOption);

    const cdWorkflowBuilder: WorkflowBuilder = new WorkflowBuilder(this, {
      Name: 'build-and-release',
      Triggers: [
        {
          Type: TriggerType.PUSH,
          Branches: [branch || 'main'],
        },
      ],
      Actions: {
        Build: {
          Identifier: this.getActionMapping(WorkflowActionIdEnum.BuildAndPackage),
          Inputs: {
            Sources: ['WorkflowSource'],
          },
          Outputs: {
            AutoDiscoverReports: {
              ReportNamePrefix: 'rpt',
              Enabled: true,
            },
            Artifacts: [
              {
                Name: 'build_artifact',
                Files: ['**/*'],
              },
            ],
          },
          Configuration: {
            Steps: [{ Run: 'mvn package' }],
          },
          Compute: {
            Type: ComputeType.LAMBDA,
            Fleet: ComputeFleet.LINUX_X86_64_LARGE,
          },
        },
        CDKBootstrapAction: {
          Identifier: this.getActionMapping(WorkflowActionIdEnum.CDKBootstrap),
          DependsOn: ['Build'],
          Inputs: {
            Artifacts: ['build_artifact'],
          },
          Timeout: 10,
          Configuration: {
            Region: region || 'us-east-1',
          },
          Environment: convertToWorkflowEnvironment(env),
        },
        CDKDeploy: {
          Identifier: this.getActionMapping(WorkflowActionIdEnum.CDKDeploy),
          DependsOn: ['CDKBootstrapAction'],
          Inputs: {
            Artifacts: ['build_artifact'],
          },
          Timeout: 15,
          Configuration: {
            StackName: `${stackName}`,
            Region: region || 'us-east-1',
          },
          Outputs: {
            Artifacts: [
              {
                Name: 'cdk_artifact',
                Files: ['cdk.out/*'],
              },
            ],
          },
          Environment: convertToWorkflowEnvironment(env),
        },
      },
    });

    new Workflow(this, this.sourceRepository, cdWorkflowBuilder.getDefinition());
  }
}

enum WorkflowActionIdEnum {
  BuildAndPackage = 'aws/build',
  Test = 'aws/managed-test',
  CDKBootstrap = 'aws/cdk-bootstrap',
  CDKDeploy = 'aws/cdk-deploy',
}
