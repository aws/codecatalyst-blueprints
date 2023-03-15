import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, SourceFile, SubstitionAsset } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow } from '@caws-blueprint-component/caws-workflows';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import { makeWorkflowDefintion } from './create-workflow';
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
       * @inlinePolicy ./policies/cdk-policy.json
       * @trustPolicy ./policies/trust-policy.json
       */
      cdkRole: Role<['codecatalyst*']>;
    }>;
  }>;

  /**
   * @displayName Code Repository name
   * @collapsed false
   */
  code: {
    /**
     * @displayName Code Repository name
     * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,128}$/
     * @validationMessage Must contain only alphanumeric characters, periods (.), underscores (_) and dashes(-) up to a total length of 128 characters
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
     * @validationMessage Must be a valid region.
     */
    region: 'us-west-2' | 'us-east-1' | 'ap-southeast-2' | 'ap-northeast-1' | 'eu-west-1' | 'ap-south-1';
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;

  protected readonly sourceRepository: SourceRepository;

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
      advanced: {
        ...defaults.advanced,
        region: defaults.advanced.region as Options['advanced']['region'],
      },
    };
    const options = Object.assign(typeCheck, options_);
    this.options = options;

    const frontendInfraSourceFolder = 'frontend/infra-typescript';
    const frontendReactSourceFolder = 'frontend/app-react-typescript';
    const frontendCanarySourceFolder = 'frontend/canary';
    const backendSourceFolder = 'backend';

    const accountId = options.environment.awsAccountConnection?.id ?? '<<PUT_YOUR_AWS_ACCOUNT_ID>>';
    this.sourceRepository = new SourceRepository(this, { title: this.options.code.repositoryName });

    // copy frontend code
    const frontendFrameworkFolder = frontendReactSourceFolder + '/**';
    SubstitionAsset.findAll(frontendFrameworkFolder).forEach(asset => {
      new SourceFile(this.sourceRepository, `frontend/${asset.path().replace(`${frontendReactSourceFolder}/`, '')}`, asset.toString());
    });

    // copy frontend canary
    const frontendCanaryFolder = frontendCanarySourceFolder + '/**';
    SubstitionAsset.findAll(frontendCanaryFolder).forEach(asset => {
      new SourceFile(this.sourceRepository, `frontend/canary/${asset.path().replace(`${frontendCanarySourceFolder}/`, '')}`, asset.toString());
    });

    // copy frontend infra
    const frontendInfraFolder = frontendInfraSourceFolder + '/**';
    SubstitionAsset.findAll(frontendInfraFolder).forEach(asset => {
      new SourceFile(
        this.sourceRepository,
        `frontend/cdk/${asset.path().replace(`${frontendInfraSourceFolder}/`, '')}`,
        asset.substitute({
          frontend_stack_name: this.options.advanced.frontendStackName,
          bp_aws_account: accountId,
          bp_aws_region: this.options.advanced.region,
        }),
      );
    });

    const backendFolder = backendSourceFolder + '/**';
    SubstitionAsset.findAll(backendFolder).forEach(asset => {
      new SourceFile(
        this.sourceRepository,
        `backend/${asset.path().replace(`${backendSourceFolder}/`, '')}`,
        asset.substitute({
          tbl_tiny_url: `${this.options.advanced.backendStackName}_tbl_tiny_url`,
          backend_stack_name: this.options.advanced.backendStackName,
          bp_aws_account: accountId,
          bp_aws_region: this.options.advanced.region,
        }),
      );
    });

    // connect an account via the environment construct
    const environment = new Environment(this, this.options.environment);

    // create the workflow
    const workflowDefinition = makeWorkflowDefintion(this, environment, {
      workflowName: 'main_fullstack_workflow',
      stacks: {
        frontend: options.advanced.frontendStackName,
        backend: options.advanced.backendStackName,
        region: options.advanced.region,
      },
    });
    new Workflow(this, this.sourceRepository, workflowDefinition);
  }
}
