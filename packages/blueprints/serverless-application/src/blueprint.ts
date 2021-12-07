import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import defaults from './defaults.json';
import { generateReadmeContents } from './readmeContents'
import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  //generateWorkflow,
  StageDefinition,
  WorkflowDefinition,
  Workflow,
  addGenericCloudFormationDeployAction,
  addGenericBranchTrigger,
  addGenericBuildAction
  //addGenericTestReports
} from '@caws-blueprint-component/caws-workflows';
import { SampleDir, SampleFile, YamlFile } from 'projen';
import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import { RuntimeMapping } from './models';
import { runtimeMappings } from './runtimeMappings';

export interface Lambda {
  /**
   * What do you want to name your lambda function
   * Must be alphanumeric
   */
  functionName: string;

  /**
   * Describe your lambda function
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
  * The name your application's source repository
  */
  sourceRepositoryName: string;
  /**
  * What runtime language do want your lambda functions to use
  */
  runtime: 'Python 3' | 'Node.js 14' | 'Java 11 Maven' | 'Java 11 Gradle'; //'Ruby 2.7' | '.NET Core 3' |
  /**
   * A set of lambdas for your serverless application
   */
  lambdas: Lambda[];
  /**
   * The configurations for your workflow
   */
   workflow: {


    /**
     * The name of the S3 bucket to store build artifacts
     */
    s3BucketName: string;

    /**
     * The role ARN to use when building your application
     */
    buildRoleArn: string;
    /**
     * The name of the CloudFormation stack to deploy your application
     */
    //!this might be phased out with the changes to stages/stage definition
    cloudFormationStackName: string;
    /**
     * The workflow stages of your project
     */
    stages: StageDefinition[];
  }
}

//? Uncomment if a limit on the number of lambdas or workflow stages is needed
//const LAMBDA_LIMIT = 10;
//const WORKFLOW_STAGE_LIMIT = 10;

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

      //!Ensure that users aren't able to remove all list items from a list before attempting to synth
      if (this.options.lambdas.length === 0) {
        //! Error message requires doc writer review
        throw new Error("At least 1 Lambda function is required to create this project")
      }
      /*
      ? Uncomment if a limit on the number of lambdas or workflow stages is needed
      if (this.options.lambdas.length > LAMBDA_LIMIT) {
        throw new Error(`This blueprint is limited to generating ${LAMBDA_LIMIT} lambda functions`)
      }
      if(this.options.workflow.stages.length > WORKFLOW_STAGE_LIMIT){
        throw new Error(`This blueprint is limited to generating ${WORKFLOW_STAGE_LIMIT} workflow stages`);
      }
      */
      /*
      todo: uncomment input validation when available on the front end to send messages to users
      ! All validation error messages need to be reviewed by doc writers before we enable them to be sent to the front end to users
      ! Input validation that will be out of date:
      ? defaultReleaseBranch as we have no current way of enforcing that on source repository
      ? arn input validation has been removed already given the expected integration with aws connections so users wont have to input the arn themselves
      ? s3BucketName validation may not be needed if it is associated with the environment selection feature

      const cloudFormationPattern = '^[a-zA-Z][-a-zA-Z0-9]*';

      if (this.options.workflow.cloudFormationStackName.length > 128 ||
        !this.options.workflow.cloudFormationStackName.match(cloudFormationPattern)) {
        throw new Error("CloudFormation Stack Name must be alphanumeric with hypens, start with an alphabetic character, and cannot be longer than 128 characters in length");
      }

      const s3BucketPattern = '(?!^xn--)(?!.*-s3alias$)(^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$)';

      if (this.options.workflow.s3BucketName.length < 3 || s3BucketName.length > 63 ||
        !this.options.workflow.s3BucketName.match(s3BucketPattern)) {

        throw new Error("Invalid S3 Bucket Name, please refer to https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html \
        for S3 bucket naming rules");
      }

      //const releaseBranchPattern = "^[a-zA-Z][-_a-zA-Z0-9]*";
      //if (!this.options.defaultReleaseBranch.match(releaseBranchPattern)){
      //  throw new Error("Invalid default release branch name");
      //}

      ?lambdaFunctionNamePattern is the pattern used for lambda function names
      https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#API_CreateFunction_RequestSyntax

      //const lambdaFunctionNamePattern = '^[a-zA-Z0-9][-_a-zA-Z0-9]*';
      ? the function name in given in options is used as a logical id so it should follow cloudformation logical id pattern
      ? logical ids must be unique within a template
      https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resources-section-structure.html
      const logicalIdPattern = '^[a-zA-Z0-9]*'

      const uniqname = new Set;
      for (const lambda of this.options.lambdas){
        if (!lambda.functionName.match(logicalIdPattern)) {
          throw new Error("Lambda function names must be alphanumeric");
        }
        ? When deployed using workflows -> function name becomes <cfnStackName>-<functionName>-<Entropy> with the cfnStackName being cutoff to fit within 64 characters
        ? Unsure at what length we should cut off a lambda function name for users when it is input in options

        //if (lambda.functionName.length < 1 || lambda.functionName.length > 64){
        //  throw new Error("Lambda function names must have a length of at least 1 and cannot exceed 140 characters");
        //}
        uniqname.add(lambda.functionName)
      }
      if (uniqname.size !== this.options.lambdas.length) {
        throw new Error("Lambda function names must be unique");
      }
      */
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
      addGenericBranchTrigger(workflowDefinition, defaultReleaseBranch);
      addGenericBuildAction(workflowDefinition, this.options.workflow.buildRoleArn, [
        {Run: 'sam build'},
        {Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${this.options.workflow.s3BucketName} --output-template-file output.yaml --region ${region}`},
      ], artifactName);
      //each stage should depend on the previous stage
      let previousStage = 'Build'
      for (const stage of this.options.workflow.stages) {
        //! Append the environment title to the cloudformation stack name
        const cfnStackname = `${this.options.workflow.cloudFormationStackName}-${stage.environment.title}`
        if (cfnStackname.length > 128) {
          //! Error message requires doc writer review
          throw new Error ('Cloudformation stack name cannot be more than 128 characters')
        }
        addGenericCloudFormationDeployAction(workflowDefinition, stage, cfnStackname, region, previousStage, artifactName);
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
      //! verify synth generating source code for each lambda
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



    /**
    * Generate Sam Template
    *
    * todo: fix Error: Failed to create changeset for the stack: nov15, ex: Waiter ChangeSetCreateComplete failed: Waiter encountered a terminal failure state: For expression "Status" we matched expected path: "FAILED" Status: FAILED. Reason: Template error: instance of Fn::GetAtt references undefined resource helloWorldPython2FunctionRole
    *! Use createTemplate for now until this is fixed
    */
     protected createTemplatePrototype(runtimeOptions: RuntimeMapping): void {
      const template = {
        Transform: "AWS::Serverless-2016-10-31",
        Description: "An SAM template to deploy your serverless application",
        Globals: {
          Function: {
            Timeout: 20
          }
        },
      }
      const resources:any = {};
      const outputs:any = {};
      for (const lambda of this.options.lambdas) {
        const properties = {
          CodeUri: `${lambda.functionName}/${runtimeOptions!.codeUri}`,
          Description: lambda.description,
          //...runtimeOptions!.templateProps,
          Events: {
            [lambda.functionName]: {
              Type: "Api",
              Properties: {
                Path: `/${lambda.functionName}`,
                Method: "get"
              }
            }
          }
        }

        resources[`${lambda.functionName}`] = {
            Type: "AWS::Serverless::Function",
            Properties: {
              ...properties
            }
        };

        outputs[`${lambda.functionName}Api`] = {
            Description: "API Gateway endpoint URL for Prod stage for Hello World function",
            Value: {
             ["Fn::Sub"]: `https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/${lambda.functionName}`,
            }
        };

        outputs[`${lambda.functionName}Function`] = {
            Description: "Hello World Lambda Function ARN",
            Value: {
              ["Fn::GetAtt"]:  `${lambda.functionName}Function.Arn`
            }
        };

        outputs[`${lambda.functionName}FunctionIamRole`] = {
            Description: "Implicit IAM Role created for Hello World function",
            Value: {
              ["Fn::GetAtt"]: `${lambda.functionName}FunctionRole.Arn`
            }
        };
      }

      template["Resources"] = resources;
      template["Outputs"] = outputs;
      const destinationPath = path.join(this.repository.relativePath, 'template.yaml');
      new YamlFile(this, destinationPath, {obj: template});
    }

}



