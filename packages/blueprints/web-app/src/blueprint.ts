import { Environment, EnvironmentDefinition } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow, WorkflowDefinition } from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@caws-blueprint/caws.blueprint';
import { java, web } from 'projen';

import defaults from './defaults.json';

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
   * Enivroments to deploy into.
   */
  environments: EnvironmentDefinition[];

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
     * The artifactId of the backend java application
     */
    artifactId: string;

    /**
     * The groupId of the backend java Application
     */
    groupId: string;
  };
  /**
   * Specify the contents of the repository README.md
   * @input textarea
   * @advanced
   */
  readme: string;

  /**
   * Specifies the default release branch
   * @advanced
   */
  defaultReleaseBranch: string;
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  private readonly frontendRepository: SourceRepository;
  private readonly backendRepository: SourceRepository;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);

    options.environments.forEach(envDef => {
      new Environment(this, envDef);
    });

    this.frontendRepository = new SourceRepository(this, {
      title: options.frontend.name,
    });

    new web.ReactTypeScriptProject({
      outdir: this.frontendRepository.relativePath,
      parent: this,
      name: options.frontend.outdir,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      defaultReleaseBranch: options.defaultReleaseBranch,
      license: options.frontend.license,
    });

    this.backendRepository = new SourceRepository(this, {
      title: options.backend.name,
    });

    new Workspace(this, this.backendRepository, SampleWorkspaces.default);

    new java.JavaProject({
      outdir: this.backendRepository.relativePath,
      parent: this,
      name: options.backend.name,
      groupId: options.backend.groupId,
      artifactId: options.backend.artifactId,
      version: '1.0.0',
    });

    new Workflow(
      this,
      this.frontendRepository,
      this.createWorkflowDefintion({
        branch: options.defaultReleaseBranch,
        ActionRoleArn: 'MY_ACTION_ROLE_ARN',
        S3_BUCKET: 'MY_S3_BUCKET_VAR_VALUE',
        CodeAwsRoleARN: 'MY_CAWS_ROLE_ARN',
        StackRoleARN: 'MY_STACK_ROLE_ARN',
      }),
    );

    new Workflow(
      this,
      this.backendRepository,
      this.createWorkflowDefintion({
        branch: options.defaultReleaseBranch,
        ActionRoleArn: 'MY_ACTION_ROLE_ARN',
        S3_BUCKET: 'MY_S3_BUCKET_VAR_VALUE',
        CodeAwsRoleARN: 'MY_CAWS_ROLE_ARN',
        StackRoleARN: 'MY_STACK_ROLE_ARN',
      }),
    );
  }

  protected createWorkflowDefintion(options: {
    branch: string;
    ActionRoleArn: string;
    S3_BUCKET: string;
    CodeAwsRoleARN: string;
    StackRoleARN: string;
  }): WorkflowDefinition {
    return {
      Name: 'release',
      Triggers: [
        {
          Type: 'Push',
          Branches: [options.branch],
        },
      ],
      Actions: {
        BuildBackend: {
          Identifier: 'aws/build@v1',
          OutputArtifacts: ['buildArtifact'],
          Configuration: {
            ActionRoleArn: options.ActionRoleArn,
            Variables: [
              {
                Name: 'S3_BUCKET',
                Value: options.S3_BUCKET,
              },
            ],
            Steps: [
              {
                Run: 'sam build',
              },
              {
                Run: 'sam package --template-file .aws-sam/build/template.yaml --s3-bucket $S3_BUCKET --output-template-file template-packaged.yaml --region us-west-2',
              },
            ],
            Artifacts: [
              {
                Name: 'buildArtifact',
                Files: ['template-packaged.yaml'],
              },
            ],
          },
        },
      },
      DeployCloudFormationStack: {
        DependsOn: ['buildArtifact'],
        Identifier: 'aws/cloudformation-deploy@v1',
        InputArtifacts: ['BuildArtifact'],
        Configuration: {
          CodeAwsRoleARN: options.CodeAwsRoleARN,
          StackRoleARN: options.StackRoleARN,
          StackName: 'serverless-api-stack',
          StackRegion: 'us-west-2',
          TemplatePath: 'buildArtifact::template-packaged.yaml',
        },
      },
    };
  }
}
