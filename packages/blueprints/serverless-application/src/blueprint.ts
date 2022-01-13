import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';
import { generateReadmeContents } from './readmeContents'
import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  //generateWorkflow,
  WorkflowDefinition,
  Workflow,
  addGenericCloudFormationDeployAction,
  addGenericBranchTrigger,
  addGenericBuildAction,
  StageDefinition
} from '@caws-blueprint-component/caws-workflows';
import { SampleDir, SampleFile } from 'projen';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { RuntimeMapping } from './models';
import { runtimeMappings } from './runtimeMappings';

export interface Lambda {
  /**
   * Enter the name of your Lambda function
   * Must be alphanumeric
   */
  functionName: string;

  /**
   * Enter a description of your Lambda function
   */
  description?: string;
}


/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
 export interface Options extends ParentOptions {
  /**
  * Enter the name your application's source repository
  */
  sourceRepositoryName: string;
  /**
  * What runtime language do want your serverless application to use
  */
  runtime: 'Python 3' | 'Node.js 14' | 'Java 11 Maven' | 'Java 11 Gradle';
  /**
   * Enter the configuration details for your application's Lambda function(s)
   */
  lambdas: Lambda[];
  /**
   * The configurations for your workflow
   */
  workflow: {

    /**
     * Enter the name of the S3 bucket to store build artifacts.
     * Must be an existing S3 bucket
     */
    s3BucketName: string;

    /**
     * Enter the name of the CloudFormation stack to deploy your application
     */
    cloudFormationStackName: string;

    /**
     * Enter the role ARN to use when building your application
     */
    buildRoleArn: string;

    /**
     * Enter the role ARN to use when deploying your application through CloudFormation
     */
    stackRoleArn: string;
    /**
     * Configure the workflow stages of your project
     */
    stages: StageDefinition[];
  }
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
      const options = Object.assign(defaults, options_);
      this.options = options;

      this.repository = new SourceRepository(this, {
        title: this.options.sourceRepositoryName
      });
      this.options.lambdas = options.lambdas;
  }

    override synth(): void {
      //MDE config workspace
      new Workspace(this, this.repository, SampleWorkspaces.default);
      //environments
      for (const stage of this.options.workflow.stages) {
        const entropy = Math.random().toString(36).substr(2, 5);
        stage.environment.title = `${stage.environment.title}-${entropy}`;
      }
      this.options.workflow.stages.forEach(stage => new Environment(this, stage.environment));

      const runtimeOptions = runtimeMappings.get(this.options.runtime)!;
      const defaultReleaseBranch = 'main';
      const workflowName = 'build-and-release'
      //Workflow
      const workflowDefinition: WorkflowDefinition = {
        Name: workflowName,
        Triggers: [],
        Actions: {},
      }
      //todo: add region selection, when available
      const region = 'us-west-2'
      const artifactName = 'MyServerlessAppArtifact';
      this.addSamInstallScript();
      addGenericBranchTrigger(workflowDefinition, [defaultReleaseBranch]);
      addGenericBuildAction(workflowDefinition, this.options.workflow.buildRoleArn, [
        {Run: '. ./.aws/scripts/setup-sam.sh'},
        {Run: 'sam build'},
        {Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${this.options.workflow.s3BucketName} --output-template-file output.yaml --region ${region}`},
      ], artifactName);
      //each stage should depend on the previous stage
      let previousStage = 'Build'
      for (const stage of this.options.workflow.stages) {
        // Append the environment title to the cloudformation stack name
        const cfnStackname = `${this.options.workflow.cloudFormationStackName}-${stage.environment.title}`
        //if (cfnStackname.length > 128) {
          //! Error message requires doc writer review
          //throw new Error ('Cloudformation stack name cannot be more than 128 characters')
        //}
        const cfnStage = {...stage, stackRoleArn: this.options.workflow.stackRoleArn}
        addGenericCloudFormationDeployAction(workflowDefinition, cfnStage, cfnStackname, region, previousStage, artifactName);
        previousStage = `Deploy_${stage.environment.title}`;
      }
      new Workflow(
        this,
        this.repository,
        workflowDefinition
      );
      this.createSamTemplate(runtimeOptions);

      const readmeContents = generateReadmeContents(runtimeOptions, defaultReleaseBranch, this.options.lambdas,
        this.options.workflow.stages, this.options.workflow.cloudFormationStackName, this.options.workflow.s3BucketName, workflowName);
      new SampleFile(this, path.join(this.repository.relativePath, 'README.md'),
      { contents: readmeContents });

      const toDeletePath = this.populateLambdaSourceCode(runtimeOptions);
      super.synth();
      // verify synth generating source code for each lambda
      for (const lambda of this.options.lambdas) {
        if (!fs.existsSync(path.join(this.repository.path, lambda.functionName))) {
          //! Error message requires doc writer review
          throw new Error('Unable to synthesize source code for lambda function');
        }
      }
      cp.execSync(`rm -rf ${toDeletePath}`);
   }

   /**
    * Populates source code for lambda functions.
    * Source code is checked out from sam templates
    */
   protected populateLambdaSourceCode(runtimeOptions: RuntimeMapping): string{
      const sourceDir = path.join('/tmp/sam-lambdas', runtimeOptions?.cacheDir!);
      const runtime = runtimeOptions?.runtime;
      const gitSrcPath = runtimeOptions?.gitSrcPath;

      cp.execSync(`svn checkout https://github.com/aws/aws-sam-cli-app-templates/trunk/${runtime}/${gitSrcPath}/\{\{cookiecutter.project_name\}\} ${sourceDir}; \
      rm -rf ${sourceDir}/.svn ${sourceDir}/.gitignore ${sourceDir}/README.md ${sourceDir}/template.yaml`);

      for (const lambda of this.options.lambdas) {
        const newLambdaPath = path.join(this.repository.relativePath, lambda.functionName);
        new SampleDir(this, newLambdaPath, {sourceDir});
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
    const header =
`Transform: AWS::Serverless-2016-10-31
Description: lambdas
Globals:
  Function:
    Timeout: 20\n`;
    let resources = 'Resources:';
    let outputs = 'Outputs:';
    for (const lambda of this.options.lambdas) {
       resources += `
  ${lambda.functionName}Function:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ${lambda.functionName}/${runtimeOptions!.codeUri}
      Runtime: ${runtimeOptions!.runtime}
      Handler: ${runtimeOptions!.handler}
      Description: ${lambda.description}
      Events:
          ${lambda.functionName}:
             Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
             Properties:
                Path: /${lambda.functionName}
                Method: get`
      //Append additional template properties
      resources += runtimeOptions?.templateProps;

       outputs += `
# ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
# Find out more about other implicit resources you can reference within SAM
# https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  ${lambda.functionName}Api:
    Description: \"API Gateway endpoint URL for Prod stage for Hello World function\"
    Value: !Sub \"https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/${lambda.functionName}/\"
  ${lambda.functionName}Function:
    Description: \"Hello World Lambda Function ARN\"
    Value: !GetAtt ${lambda.functionName}Function.Arn
  ${lambda.functionName}FunctionIamRole:
    Description: \"Implicit IAM Role created for Hello World function\"
    Value: !GetAtt ${lambda.functionName}FunctionRole.Arn`
    }

    const destinationPath = path.join(this.repository.relativePath, 'template.yaml');
    const template = header + resources + '\n' + outputs;
    new SampleFile(this, destinationPath, { contents: template });
 }

}



