import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, SourceFile, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';
import {
  Workflow,
  convertToWorkflowEnvironment,
  getDefaultActionIdentifier,
  ActionIdentifierAlias,
  WorkflowDefinition,
  emptyWorkflow,
  ComputeType,
  ComputeFleet,
  addGenericCompute,
  addGenericBranchTrigger,
  addGenericBuildAction,
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
     * The name of the Frontend Cloudformation stack to deploy the application's resources
     * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,128}$/
     * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
     * @displayName Frontend Stack Name
     * @defaultEntropy 5
     */
    frontendStackName: string;

    /**
     * The name of the Backend Cloudformation stack to deploy the application's resources
     * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,128}$/
     * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
     * @displayName Backend Stack Name
     * @defaultEntropy 5
     */
    backendStackName: string;

    /**
     * Enter the Region to deploy
     * @displayName AWS Region
     * @validationRegex /(us(-gov)?|ap|ca|cn|eu|sa)-(central|(north|south)?(east|west)?)-\d/
     * @validationMessage Must be a valid region.
     */
    region: string;
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
  protected readonly frontendStackName: string;
  protected readonly backendStackName: string;
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
        frontendStackName: options_.advanced.frontendStackName,
        backendStackName: options_.advanced.backendStackName,
        region: options_.advanced.region,
      },
    };
    const options = Object.assign(typeCheck, options_);
    this.repositoryName = this.sanitizePath(options.code.repositoryName);
    this.frontendStackName = options.advanced.frontendStackName;
    this.backendStackName = options.advanced.backendStackName;
    this.region = options.advanced.region;
    this.account = options.environment.awsAccountConnection?.id;
    this.options = options;

    const frontendInfraSourceFolder = 'frontend/infra-typescript';
    const frontendReactSourceFolder = 'frontend/app-react-typescript';
    const backendSourceFolder = 'backend';

    // add a repository
    this.sourceRepository = new SourceRepository(this, { title: this.repositoryName });

    const frontendFrameworkFolder = frontendReactSourceFolder + '/**';
    SubstitionAsset.findAll(frontendFrameworkFolder).forEach(asset => {
      new SourceFile(this.sourceRepository, `frontend/${asset.path().replace(`${frontendReactSourceFolder}/`, '')}`, asset.toString());
    });

    const frontendInfraFolder = frontendInfraSourceFolder + '/**';
    SubstitionAsset.findAll(frontendInfraFolder).forEach(asset => {
      new SourceFile(
        this.sourceRepository,
        `frontend/cdk/${asset.path().replace(`${frontendInfraSourceFolder}/`, '')}`,
        asset.subsitite({
          frontend_stack_name: this.frontendStackName,
          bp_aws_account: this.account,
          bp_aws_region: this.region,
        }),
      );
    });

    const backendFolder = backendSourceFolder + '/**';
    SubstitionAsset.findAll(backendFolder).forEach(asset => {
      new SourceFile(
        this.sourceRepository,
        `backend/${asset.path().replace(`${backendSourceFolder}/`, '')}`,
        asset.subsitite({
          backend_stack_name: this.backendStackName,
          bp_aws_account: this.account,
          bp_aws_region: this.region,
        }),
      );
    });

    this.createWorkflow();
  }

  private sanitizePath(path: string) {
    return path.replace(/\.|\/| /g, '');
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
    getDefaultActionIdentifier(ActionIdentifierAlias.build);
    const [vz, ext] = this.getActions()[action];
    return `${action}${this.options.environment.environmentType === 'PRODUCTION' ? '' : ext}${vz}`;
  }

  private createWorkflow() {
    const schemaVersion = '1.0';
    const defaultBranch = 'main';
    const env = new Environment(this, this.options.environment);

    const workflowDefinition: WorkflowDefinition = {
      ...emptyWorkflow,
      SchemaVersion: schemaVersion,
      Name: 'main_fullstack_workflow',
    };
    addGenericCompute(workflowDefinition, ComputeType.LAMBDA, ComputeFleet.LINUX_X86_64_LARGE);
    addGenericBranchTrigger(workflowDefinition, [defaultBranch]);

    // To build the backend artifacts
    addGenericBuildAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: 'BackendBuildAndPackage',
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.cdkRole?.name || ' ',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
      },
      output: {
        AutoDiscoverReports: {
          ReportNamePrefix: 'rpt',
          Enabled: true,
        },
        Artifacts: [
          {
            Name: 'backend_build_artifacts',
            Files: ['**/*'],
          },
        ],
      },
      steps: ["find * -maxdepth 0 -name 'backend' -prune -o -exec rm -rf '{}' ';'", 'mv backend/* .', 'mvn package -Dmaven.test.skip'],
    });

    // To verify the backend unit tests
    addGenericBuildAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: 'BackendTest',
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.cdkRole?.name || ' ',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
      },
      output: {
        AutoDiscoverReports: {
          IncludePaths: ['backend/**/*'],
          ExcludePaths: ['*/.aws/workflows/*'],
          ReportNamePrefix: 'Report',
          Enabled: true,
        },
        Artifacts: [
          {
            Name: 'backend_test_artifacts',
            Files: ['**/*'],
          },
        ],
      },
      steps: ['cd backend', 'mvn test', 'echo "No Test Coverage step defined"'],
    });

    // To bootstrap and deploy the backend service
    workflowDefinition.Actions = {
      ...workflowDefinition.Actions,
      BackendCDKBootstrapAction: {
        Identifier: this.getActionMapping(WorkflowActionIdEnum.CDKBootstrap),
        Inputs: {
          Artifacts: ['backend_build_artifacts'],
        },
        DependsOn: ['BackendTest', 'BackendBuildAndPackage'],
        Configuration: {
          Region: this.region || 'us-east-1',
        },
        Environment: convertToWorkflowEnvironment(env),
      },
      BackendCDKDeploy: {
        Identifier: this.getActionMapping(WorkflowActionIdEnum.CDKDeploy),
        Inputs: {
          Artifacts: ['backend_build_artifacts'],
        },
        DependsOn: ['BackendCDKBootstrapAction'],
        Configuration: {
          StackName: `${this.backendStackName}`,
          Region: this.region || 'us-east-1',
          Context: `{"stack_name": "${this.backendStackName}"}`,
        },
        Environment: convertToWorkflowEnvironment(env),
      },
    };

    // To build the frontend artifacts
    addGenericBuildAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: 'FrontendBuildAndPackage',
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.cdkRole?.name || ' ',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
      },
      dependsOn: ['BackendCDKDeploy'],
      output: {
        AutoDiscoverReports: {
          IncludePaths: ['backend/**/*'],
          ExcludePaths: ['*/.aws/workflows/*'],
          ReportNamePrefix: 'rpt',
          Enabled: true,
        },
        Artifacts: [
          {
            Name: 'frontend_build_artifacts',
            Files: ['**/*'],
          },
        ],
      },
      steps: [
        'mv frontend frontend-src',
        'cd frontend-src',
        'npm install',
        'echo "REACT_APP_SERVICE_URL=/t" > ".env"',
        'npm run build',
        'mkdir -p cdk/frontend/build',
        'mv build/* cdk/frontend/build/',
        'mkdir -p cdk/frontend/build/canary',
        'mv canary/* cdk/frontend/build/canary',
        "find * -maxdepth 0 -name 'cdk' -prune -o -exec rm -rf '{}' ';'",
        'mv cdk/* .',
        'cd ..',
        "find * -maxdepth 0 -name 'frontend-src' -prune -o -exec rm -rf '{}' ';'",
        'mv frontend-src/* .',
      ],
    });

    // To verify the frontend unit tests
    addGenericBuildAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: 'FrontendTest',
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.cdkRole?.name || ' ',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
      },
      output: {
        AutoDiscoverReports: {
          IncludePaths: ['frontend/coverage/*'],
          ReportNamePrefix: 'CLOVERXML',
          Enabled: true,
        },
      },
      steps: ['cd frontend', 'npm install', 'npm test -- --coverage --watchAll=false;'],
    });

    // To bootstrap and deploy the frontend
    workflowDefinition.Actions = {
      ...workflowDefinition.Actions,
      FrontendCDKDeploy: {
        Identifier: this.getActionMapping(WorkflowActionIdEnum.CDKDeploy),
        Inputs: {
          Artifacts: ['frontend_build_artifacts'],
        },
        DependsOn: ['FrontendTest', 'FrontendBuildAndPackage'],
        Configuration: {
          StackName: `${this.frontendStackName}`,
          Region: this.region || 'us-east-1',
          Context: `{"stack_name": "${this.frontendStackName}", "api_domain": "\${BackendCDKDeploy.ApiDomain}", "api_stage": "\${BackendCDKDeploy.ApiStage}"}`,
        },
        Environment: convertToWorkflowEnvironment(env),
      },
    };

    new Workflow(this, this.sourceRepository, workflowDefinition);
  }
}

enum WorkflowActionIdEnum {
  CDKBootstrap = 'aws/cdk-bootstrap',
  CDKDeploy = 'aws/cdk-deploy',
}
