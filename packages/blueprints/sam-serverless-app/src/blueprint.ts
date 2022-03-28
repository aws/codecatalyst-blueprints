import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';
import { generateReadmeContents } from './readmeContents';
import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  //generateWorkflow,
  WorkflowDefinition,
  Workflow,
  addGenericBranchTrigger,
  addGenericBuildAction,
  addGenericCloudFormationDeployAction,
} from '@caws-blueprint-component/caws-workflows';
import { SampleDir, SampleFile } from 'projen';
import * as cp from 'child_process';
import * as path from 'path';

import { RuntimeMapping } from './models';
import { runtimeMappings } from './runtimeMappings';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
export interface Options extends ParentOptions {
  /**
   * @displayName Runtime Language
   */
  runtime: 'Python 3' | 'Node.js 14' | 'Java 11 Maven' | 'Java 11 Gradle';

  /**
   * The name of the AWS CloudFormation stack generated for the blueprint. It must be unique for the AWS account it's being deployed to.
   * @displayName CloudFormation stack name
   * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,100}$/
   * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
   * @defaultEntropy
   */
  cloudFormationStackName: string;

  /**
   * This blueprint includes a default environment for production. Rename the default envionment and connect it to an AWS account here.
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
      awsDeployRole: Role<['SAM Deploy']>;
      /**
       * This is the role that allows AWS cloudformation to access resources specified in the AWS CloudFormation template.
       * @displayName Stack role
       */
      stackRole: Role<['CloudFormation']>;
      /**
       * This is the role that allows build actions to access and write to Amazon S3, wher eyour serverless application package is stored.
       * @displayName S3 build role
       */
      s3BuildRole: Role<['S3']>;
    }>;
  }>;

  /**
   * The configurations for your workflow
   */
  workflow: {
    /**
     * Enter the name of the S3 bucket to store build artifacts.
     * Must be an existing S3 bucket
     * @validationRegex /^(?!xn--)^(?!([0-9]{1,3}.){3}[0-9]{1,3}$)([a-z0-9][a-z0-9.-]{1,61}[a-z0-9])(?<!-s3alias)$/
     * @validationMessage SBucket names must only contain lowercase letters, numbers, and dashes.
     * See rules for bucket naming: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
     */
    s3BucketName: string;
  };

  /**
   * @displayName Code Repository name
   * @collapsed
   */
  code: {
    /**
     * @displayName Code Repository name
     * @validationRegex /^[a-zA-Z0-9_.-]{1,100}$(?<!.git$)/
     * @validationMessage Must contain only alphanumeric characters, periods (.), underscores (_), dashes (-) and be up to 100 characters in length. Cannot end in .git or contain spaces
     */
    sourceRepositoryName: string;
  };

  /**
   * @displayName Lambda function name
   * @collapsed
   */
  lambda: {
    /**
     * Lambda function name must be unqiue to the AWS account it's being deployed to.
     * @displayName Lambda function name
     * @validationRegex /^[a-zA-Z0-9]{1,56}$/
     * @validationMessage Must contain only alphanumeric characters and be up to 56 characters in length
     */
    functionName: string;
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
    console.log(defaults);
    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
      runtime: defaults.runtime as Options['runtime'],
    };
    const options = Object.assign(typeCheck, options_);
    this.options = options;

    this.repository = new SourceRepository(this, {
      title: this.options.code.sourceRepositoryName || 'sam-lambda',
    });
    this.options.lambda = options.lambda;
  }

  createWorkflow(params: {
    defaultBranch: string;
    workflowName: string;
    region: string;
    artifactName: string;
    roles: {
      deployRoleArn: string;
      stackRoleArn: string;
      s3BuildRoleArn: string;
    };
  }): void {
    this.addSamInstallScript();

    const { defaultBranch, workflowName, region, artifactName, roles } = params;
    console.log(defaultBranch, workflowName, region, artifactName, roles);
    //Workflow
    const workflowDefinition: WorkflowDefinition = {
      Name: workflowName,
      Triggers: [],
      Actions: {},
    };

    addGenericBranchTrigger(workflowDefinition, [defaultBranch]);
    const buildAction = addGenericBuildAction(
      this,
      workflowDefinition,
      roles.s3BuildRoleArn,
      [
        { Run: '. ./.aws/scripts/setup-sam.sh' },
        { Run: 'sam build' },
        {
          Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${this.options.workflow.s3BucketName} --output-template-file output.yaml --region ${region}`,
        },
      ],
      artifactName,
    );

    // Append the environment title to the cloudformation stack name
    const cfnStackname = `${this.options.cloudFormationStackName}-${this.options.environment.name}`;
    addGenericCloudFormationDeployAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionRoleArn: roles.deployRoleArn,
      stackRoleArn: roles.stackRoleArn,
      stackName: cfnStackname,
      stackRegion: region,
      dependsOn: buildAction,
      artifactName: artifactName,
      actionName: `Deploy_${this.options.environment.name}`,
      environmentName: this.options.environment.name,
    });

    new Workflow(this, this.repository, workflowDefinition);
  }

  override synth(): void {
    // create an MDE workspace
    new Workspace(this, this.repository, SampleWorkspaces.default);

    // create the build and release workflow
    const workflowName = 'build-and-release';
    this.createWorkflow({
      defaultBranch: 'main',
      workflowName: 'build-and-release',
      region: 'us-west-2',
      artifactName: 'ServerlessAppArtifact',
      roles: {
        deployRoleArn: this.options.environment.awsAccountConnection?.awsDeployRole?.arn || '<<PUT_IAM_ROLE_ARN_HERE>>',
        stackRoleArn: this.options.environment.awsAccountConnection?.s3BuildRole?.arn || '<<PUT_BUILD_ROLE_ARN_HERE>>',
        s3BuildRoleArn: this.options.environment.awsAccountConnection?.stackRole?.arn || '<<PUT_STACK_ROLE_ARN_HERE>>',
      },
    });

    //environments
    new Environment(this, this.options.environment);

    const runtimeOptions = runtimeMappings.get(this.options.runtime)!;
    const defaultReleaseBranch = 'main';
    const workflowName = 'build-and-release';
    const SCHEMA_VERSION = '1.0';
    //Workflow
    const workflowDefinition: WorkflowDefinition = {
      Name: workflowName,
      SchemaVersion: SCHEMA_VERSION,
      Triggers: [],
      Actions: {},
    };
    //todo: add region selection, when available
    const region = 'us-west-2';
    const artifactName = 'MyServerlessAppArtifact';
    this.addSamInstallScript();
    addGenericBranchTrigger(workflowDefinition, [defaultReleaseBranch]);
    addGenericBuildAction(
      this,
      workflowDefinition,
      this.options.workflow.buildRoleArn,
      [
        { Run: '. ./.aws/scripts/setup-sam.sh' },
        { Run: 'sam build' },
        {
          Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${this.options.workflow.s3BucketName} --output-template-file output.yaml --region ${region}`,
        },
      ],
      artifactName,
    );
    //each stage should depend on the previous stage
    let previousStage = 'Build';
    for (const stage of this.options.workflow.stages) {
      // Append the environment title to the cloudformation stack name
      const cfnStackname = `${this.options.workflow.cloudFormationStackName}-${stage.environment.title}`;
      //if (cfnStackname.length > 128) {
      //! Error message requires doc writer review
      //throw new Error ('Cloudformation stack name cannot be more than 128 characters')
      //}
      const cfnStage = { ...stage, stackRoleArn: this.options.workflow.stackRoleArn };
      addGenericCloudFormationDeployAction(this, workflowDefinition, cfnStage, cfnStackname, region, previousStage, artifactName);
      previousStage = `Deploy_${stage.environment.title}`;
    }
    new Workflow(this, this.repository, workflowDefinition);
    this.createSamTemplate(runtimeOptions);

    // create the sam template code
    this.createSamTemplate(runtimeOptions);

    // generate the readme
    new SourceFile(
      this.repository,
      'README.md',
      generateReadmeContents({
        runtimeMapping: runtimeOptions,
        defaultReleaseBranch: 'main',
        lambdas: [this.options.lambda],
        environment: this.options.environment,
        cloudFormationStackName: this.options.cloudFormationStackName,
        s3bucketName: this.options.workflow.s3BucketName,
        workflowName: workflowName,
      }),
    );

    const toDeletePath = this.populateLambdaSourceCode(runtimeOptions);
    super.synth();
    cp.execSync(`rm -rf ${toDeletePath}`);
  }

  /**
   * Populates source code for lambda functions.
   * Source code is checked out from sam templates
   */
  protected populateLambdaSourceCode(runtimeOptions: RuntimeMapping): string {
    const sourceDir = path.join('/tmp/sam-lambdas', runtimeOptions?.cacheDir);
    const runtime = runtimeOptions?.runtime;
    const gitSrcPath = runtimeOptions?.gitSrcPath;

    cp.execSync(`svn checkout https://github.com/aws/aws-sam-cli-app-templates/trunk/${runtime}/${gitSrcPath}/\{\{cookiecutter.project_name\}\} ${sourceDir}; \
      rm -rf ${sourceDir}/.svn ${sourceDir}/.gitignore ${sourceDir}/README.md ${sourceDir}/template.yaml`);

    for (const lambda of [this.options.lambda?.functionName]) {
      const newLambdaPath = path.join(this.repository.relativePath, lambda || '');
      new SampleDir(this, newLambdaPath, { sourceDir });
    }
    return sourceDir;
  }

  protected addSamInstallScript() {
    new SampleFile(this, path.join(this.repository.relativePath, '.aws', 'scripts', 'setup-sam.sh'), {
      contents: `#!/usr/bin/env bash
echo "Setting up sam"

yum install unzip -y

curl -LO https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip -qq aws-sam-cli-linux-x86_64.zip -d sam-installation-directory

./sam-installation-directory/install; export AWS_DEFAULT_REGION=us-west-2
`,
    });
  }

  /**
   * Generate Sam Template
   */
  protected createSamTemplate(runtimeOptions: RuntimeMapping): void {
    const header = `Transform: AWS::Serverless-2016-10-31
Description: lambdas
Globals:
  Function:
    Timeout: 20\n`;
    let resources = 'Resources:';
    let outputs = 'Outputs:';
    for (const lambda of [this.options.lambda?.functionName]) {
      resources += `
  ${lambda}Function:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ${lambda}/${runtimeOptions?.codeUri}
      Runtime: ${runtimeOptions?.runtime}
      Handler: ${runtimeOptions?.handler}
      Description: ${lambda}
      Events:
          ${lambda}:
             Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
             Properties:
                Path: /${lambda}
                Method: get`;
      //Append additional template properties
      resources += runtimeOptions?.templateProps;

      outputs += `
# ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
# Find out more about other implicit resources you can reference within SAM
# https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  ${lambda}Api:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/${lambda}/\"
  ${lambda}Function:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt ${lambda}Function.Arn
  ${lambda}FunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt ${lambda}FunctionRole.Arn`;
    }

    const destinationPath = path.join(this.repository.relativePath, 'template.yaml');
    const template = header + resources + '\n' + outputs;
    new SampleFile(this, destinationPath, { contents: template });
  }
}
