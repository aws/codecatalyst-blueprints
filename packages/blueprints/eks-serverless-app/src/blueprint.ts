import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';
import { FileTemplateContext } from './models';
import { assets } from './assets';

import { AccountConnection, Environment, EnvironmentDefinition, Role } from '@caws-blueprint-component/caws-environments';
import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';

import { SampleFile } from 'projen';
import { addGenericBranchTrigger, emptyWorkflow, RunModeDefiniton, Workflow, WorkflowDefinition } from '@caws-blueprint-component/caws-workflows';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
export interface Options extends ParentOptions {
  /**
   * Name for your deployment environment. You can add more environments once the project is created
   * @displayName Environment
   * @collapsed false
   */
  environment: EnvironmentDefinition<{
    /**
     * An AWS account connection is required by the project workflow to deploy to aws.
     * @displayName AWS account connection
     * @collapsed false
     */
    awsAccountConnection: AccountConnection<{
      /**
       * This is the role that will be used to deploy the application. It should have access to deploy all of your resources. See the Readme for more information.
       * @displayName Deploy role
       */
      deployRole: Role<['CDK Deploy']>;

      /**
       * This is the role that allows build actions to access and write to Amazon S3, where your serverless application package is stored.
       * @displayName Build role
       */
      bootstrapRole: Role<['CDK Bootstrap']>;
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
    sourceRepositoryName: string;
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;
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
    options.code.sourceRepositoryName = sanitizePath(options.code.sourceRepositoryName);
    this.options = options;

    this.repository = new SourceRepository(this, {
      title: this.options.code.sourceRepositoryName || 'eks-app',
    });
  }

  override synth(): void {
    // create an MDE workspace
    new Workspace(this, this.repository, SampleWorkspaces.default);

    // create an environment
    new Environment(this, this.options.environment);

    const context: FileTemplateContext = {
      repositoryRelativePath: this.repository.relativePath,
    };
    for (const fileTemplate of assets.filesToCreate) {
      new SampleFile(this, fileTemplate.resolvePath(context), { contents: fileTemplate.resolveContent(context) });
    }

    // create the build and release workflow
    const workflowName = 'eks-deploy-workflow';
    this.createWorkflow({
      name: workflowName,
      outputArtifactName: 'build_result',
    });

    // generate the readme
    const readmeContent = `
    ## This Project:

    This project is an implementation of this EKS tutorial: https://aws.amazon.com/getting-started/guides/deploy-webapp-eks/
    `;
    new SourceFile(this.repository, 'README.md', readmeContent);

    super.synth();
  }

  createWorkflow(params: { name: string; outputArtifactName: string }): void {
    const { name } = params;

    const defaultBranch = 'main';
    const region = 'us-west-2';
    const schemaVersion = '1.0';
    const runMode = RunModeDefiniton.PARALLEL;

    const workflowDefinition: WorkflowDefinition = {
      ...emptyWorkflow,
      SchemaVersion: schemaVersion,
      Name: name,
      RunMode: runMode,
      Compute: undefined,
    };

    addGenericBranchTrigger(workflowDefinition, [defaultBranch]);

    workflowDefinition.Actions = workflowDefinition.Actions || {};
    workflowDefinition.Actions['CDKBootstrap'] = {
      Identifier: this.generateCdkBootstrapIdentifier(),
      Configuration: {
        Region: region,
      },
      Environment: {
        Name: this.options.environment.name || ' ',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.bootstrapRole?.name || ' ',
          },
        ],
      },
      Outputs: {
        Artifacts: [
          {
            Name: 'cdk_bootstrap_artifacts',
            Files: ['**/*'],
          },
        ],
      },
      Inputs: {
        Sources: ['WorkflowSource'],
      },
    };
    workflowDefinition.Actions['CDKDeploy'] = {
      Identifier: this.generateCdkDeployIdentifier(),
      Configuration: {
        Region: region,
        StackName: 'EksStack',
      },
      Environment: {
        Name: this.options.environment.name || ' ',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.deployRole?.name || ' ',
          },
        ],
      },
      Inputs: {
        Artifacts: ['cdk_bootstrap_artifacts'],
        Sources: [],
      },
    };

    new Workflow(this, this.repository, workflowDefinition);
  }

  generateCdkBootstrapIdentifier(): string {
    if (this.context.environmentId === 'prod') {
      return 'aws/cdk-bootstrap@v1';
    }
    return 'aws/cdk-bootstrap-gamma@v1';
  }

  generateCdkDeployIdentifier(): string {
    if (this.context.environmentId === 'prod') {
      return 'aws/cdk-deploy@v1';
    }
    return 'aws/cdk-deploy-gamma@v1';
  }
}

/**
 * removes all '.' '/' and ' ' characters
 */
function sanitizePath(path: string) {
  return path.replace(/\.|\/| /g, '');
}
