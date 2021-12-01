import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import defaults from './defaults.json';
import {readmeContents} from './readmeContents'
import { java11, python37, nodejs14 } from './templateContents';
//todo: add dependencies to .projenrc for the caws components you've added
import { Environment } from '@caws-blueprint-component/caws-environments';
import {SourceRepository} from '@caws-blueprint-component/caws-source-repositories';
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


/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
 export interface Options extends ParentOptions {

    /**
    * What runtime language do want your lambdas to use
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
       * The name of the CloudFormation stack to deploy your serverless application
       */
      //!this might be phased out with the changes to stages/stage definition
      //todo: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-using-console-create-stack-parameters.html verify stack formation name
      cloudFormationStackName: string;

      /**
       * The name of the S3 bucket to store build artifacts
       */
      //todo: https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html  verify bucket name
      s3BucketName: string;

      /**
       * The role ARN to use when building
       */
      //todo: verify connection arn https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html
      buildRoleArn: string;

      /**
       * Workflow stages to generate
       */
      stages: StageDefinition[];
    }

   /**
    * The default branch to trigger releases
    * @advanced
    */
    defaultReleaseBranch?: string;
}



/**
 * This is so that you can specify which lambdas you want in each api gateway
 */
/*
interface ApiGateway{
   name: string;
   runtime: 'Python 3' | '.NET Core 3' | 'Ruby 2.7' | 'Node.js 14' | 'Java 11 Maven';
   lambdas: Lambda[];
}
*/

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
 * Available Runtimes:
 * That aren't considered being cut
 * Java Coretto 11 -> Gradle/Maven might be getting cut so we will see on this one
 * Node v14
 * .Net Core 6 -> unsure if this is backwards compatible
 * Python 3.7 not 3.9
 *
 * ----------------------------------------------------------------
 * Things that might be cut in the workflows docker image:
 * RubyGems 3.1
 * Gradle 7.1
 * Maven 3.8.1
 */

//Maps the human readable runtime language to its sam runtime, code uri, handler, additional sam template properties, dependency manager, and cache directory name
//todo remove dependency manager no longer needed with svn change
//?keep cacheDir as things will get messy if we support another runtime of python or nodejs!

const samOptionsMap = new Map([
   ['Java 11 Maven', {runtime: 'java11', codeUri: 'HelloWorldFunction', handler: 'helloworld.App::handleRequest', templateProps: java11, cacheDir: 'java11maven', gitSrcPath: 'cookiecutter-aws-sam-hello-java-maven'}],
   ['Java 11 Gradle', {runtime: 'java11', codeUri: 'HelloWorldFunction', handler: 'helloworld.App::handleRequest', templateProps: java11,cacheDir: 'java11gradle', gitSrcPath: 'cookiecutter-aws-sam-hello-java-gradle'}],
  // ['.NET Core 3', {runtime:'dotnetcore3.1', codeUri: './src/HelloWorld/', handler: 'HelloWorld::HelloWorld.Function::FunctionHandler', templateProps: dotnetcore3, cacheDir: 'dotnetcore3'}],
   //['Node.js 12', {runtime: 'nodejs12.x', codeUri: 'hello-world/', handler: 'app.lambdaHandler', templateProps: nodejs12, cacheDir: 'nodejs12'}],
   ['Node.js 14', {runtime: 'nodejs14.x', codeUri: 'hello-world/', handler: 'app.lambdaHandler', templateProps: nodejs14, cacheDir: 'nodejs14', gitSrcPath: 'cookiecutter-aws-sam-hello-nodejs'}],
   //['Python 2', {runtime:'python2.7', codeUri: 'hello_world/', handler: 'app.lambda_handler', templateProps: python27, cacheDir: 'python27'}],
   ['Python 3', {runtime:'python3.7', codeUri: 'hello_world/', handler: 'app.lambda_handler', templateProps: python37, cacheDir: 'python37', gitSrcPath: 'cookiecutter-aws-sam-hello-python'}],
   //['Ruby 2.7', {runtime:'ruby2.7', codeUri: 'hello_world/', handler: 'app.lambda_handler', templateProps: ruby27, cacheDir: 'ruby27'}],
]);

//!github repo for svn would be https://github.com/aws/aws-sam-cli-app-templates/trunk/${runtime}/cookiecutter-aws-sam-hello-${language}


/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
 export class Blueprint extends ParentBlueprint {
   protected options: Options;
   protected readonly repository: SourceRepository;
   protected lambdas: Lambda[];
    constructor(options_: Options) {
      super(options_);
      const options = Object.assign(defaults, options_);
      this.options = options;
      //!Optional members of options can be empty when trying to synth
      if (!this.options.defaultReleaseBranch){
        this.options.defaultReleaseBranch = 'main';
      }
      this.repository = new SourceRepository(this, {
         title: "lambdas"
       });
       this.lambdas = options.lambdas;
      //!Quokka tries to synth after anything has changed currently, throw error early
      if (this.lambdas.length === 0) {
        throw new Error("At least 1 Lambda function is required to create this project")
      }
      //TODO: find git branch naming rules
      const lambdaPattern = '^[a-zA-Z0-9][-_a-zA-Z0-9]*';
      //must start with a letter and must only constin alphanumeric or hypehns
      const cloudFormationPattern = '^[a-zA-Z][-a-zA-Z0-9]*';
      //https://regex101.com/library/pOfxYN
      //todo: figure out connection arn regex
      //const arnPattern = "^arn:(?P<Partition>[^:\n]*):(?P<Service>[^:\n]*):(?P<Region>[^:\n]*):(?P<AccountID>[^:\n]*):(?P<Ignore>(?P<ResourceType>[^:\/\n]*)[:\/])?(?P<Resource>.*)$";
      //https://stackoverflow.com/questions/50480924/regex-for-s3-bucket-name
      /*
        (?!^xn--) -> s3 bucket name cannot start with xn--
        (?!.*-s3alias$) -> s3 bucket name cannot end with suffix -s3alias
      */
      /*
      !Connection arn may not be needed to be checked with the changes to code.aws connections
      const connectionArn = this.options.workflow.connectionArn;
      if (!connectionArn.match(connectionArnPattern)){
        throw new Error("Invalid ARN format, please refer to https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html for \
        valid arn formats");
      }
      */
      const s3BucketPattern = '(?!^xn--)(?!.*-s3alias$)(^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$)';
      //git releasebranchNaming
      const releaseBranchPattern = "^[a-zA-Z][-_a-zA-Z0-9]*";
      //? should i care if functionName are case sensitive or not
      const cloudFormationStackName = this.options.workflow.cloudFormationStackName;
      if (cloudFormationStackName.length > 128 ||
        !cloudFormationStackName.match(cloudFormationPattern)) {
        throw new Error("CloudFormation Stack Name must be alphanumeric with hypens, start with an alphabetic character, and cannot be longer than 128 characters in length");
      }
      const s3BucketName = this.options.workflow.s3BucketName;
      if (s3BucketName.length < 3 || s3BucketName.length > 63 ||
        !s3BucketName.match(s3BucketPattern)) {

        throw new Error("Invalid S3 Bucket Name, please refer to https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html \
        for S3 bucket naming rules");
      }

      const defaultReleaseBranch = this.options.defaultReleaseBranch;
      if (!defaultReleaseBranch.match(releaseBranchPattern)){
        throw new Error("Invalid default release branch name");
      }
      const uniqname = new Set;
      for (const lambda of this.lambdas){
        if (!lambda.functionName.match(lambdaPattern)) {
          throw new Error("Lambda function names must be alphanumeric");
        }
        //https://docs.aws.amazon.com/lambda/latest/dg/API_CreateFunction.html#API_CreateFunction_RequestSyntax
        if (lambda.functionName.length < 1 || lambda.functionName.length > 140){
          throw new Error("Lambda function names must have a length of at least 1 and cannot exceed 140 characters");
        }
        uniqname.add(lambda.functionName)
      }
      if (uniqname.size !== this.lambdas.length) {
        throw new Error("Lambda function names must be unique");
      }

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
      //Readme
      new SampleFile(this, path.join(this.repository.relativePath, 'README.md'), {contents: readmeContents})
      //Workflow
      const workflowDefinition: WorkflowDefinition = {
        Name: 'build',
        Triggers: [],
        Actions: {},
      }
      //todo: add region selection
      const region = 'us-west-2'
      addGenericBranchTrigger(workflowDefinition, this.options.defaultReleaseBranch);
      addGenericBuildAction(workflowDefinition, this.options.workflow.buildRoleArn, [
        {Run: 'sam build'},
        {Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${this.options.workflow.s3BucketName} --output-template-file output.yaml --region ${region}`},
      ]);
      for (const stage of this.options.workflow.stages) {
        //todo: change to use a new cfnStackname for each deployment action
        addGenericCloudFormationDeployAction(workflowDefinition, stage, this.options.workflow.cloudFormationStackName, region, 'Build');
      }
      new Workflow(
        this,
        this.repository,
        workflowDefinition
      );
      this.createSamTemplate();
      const toDeletePath = this.populateLambdaSourceCode();
      super.synth();
      //! verify synth generating source code for lambda
      for (const lambda of this.lambdas) {
        if (!fs.existsSync(path.join(this.repository.path, lambda.functionName))) {
          throw new Error('Unable to synthesize source code for lambda function');
        }
      }
      cp.execSync(`rm -rf ${toDeletePath}`);
   }

   /**
    * Populates source code for lambda functions.
    * Source code is checked out from sam templates
    */
   protected populateLambdaSourceCode(): string{
      const samOptions = samOptionsMap.get(this.options.runtime);
      const sourceDir = path.join('/tmp/sam-lambdas', samOptions?.cacheDir!);
      const runtime = samOptions?.runtime;
      const gitSrcPath = samOptions?.gitSrcPath;

      cp.execSync(`svn checkout https://github.com/aws/aws-sam-cli-app-templates/trunk/${runtime}/${gitSrcPath}/\{\{cookiecutter.project_name\}\} ${sourceDir}; \
      rm -rf ${sourceDir}/.svn ${sourceDir}/.gitignore ${sourceDir}/README.md ${sourceDir}/template.yaml`);

      for (const lambda of this.lambdas) {
        const newLambdaPath = path.join(this.repository.relativePath, lambda.functionName);
        new SampleDir(this, newLambdaPath, {sourceDir});
      }
      return sourceDir;
  }

   /**
    * Generate Sam Template
    */
   protected createSamTemplate(): void {
    const header =
`Transform: AWS::Serverless-2016-10-31
Description: lambdas
Globals:
  Function:
    Timeout: 20\n`;
    let resources = 'Resources:';
    let outputs = 'Outputs:';
    for (const lambda of this.lambdas) {
       const samOptions = samOptionsMap.get(this.options.runtime);
       resources += `
  ${lambda.functionName}Function:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ${lambda.functionName}/${samOptions!.codeUri}
      Runtime: ${samOptions!.runtime}
      Handler: ${samOptions!.handler}
      Description: ${lambda.description}
      Events:
          ${lambda.functionName}:
             Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
             Properties:
                Path: /${lambda.functionName}
                Method: get`
      //Append additional template properties
      resources += samOptions?.templateProps;

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
     protected createTemplatePrototype(): void {
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
      for (const lambda of this.lambdas) {
        const samOptions = samOptionsMap.get(this.options.runtime);
        const properties = {
          CodeUri: `${lambda.functionName}/${samOptions!.codeUri}`,
          Description: lambda.description,
          //...samOptions!.templateProps,
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



