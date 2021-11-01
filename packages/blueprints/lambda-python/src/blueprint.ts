import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import defaults from './defaults.json';

import {SourceRepository} from '@caws-blueprint-component/caws-source-repositories';

import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { YamlFile } from 'projen';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
export interface Options extends ParentOptions {
   /**
    * The name of the application code module.
    */
   moduleName: string;
   

   /**
    * The name of the S3 bucket to store build artifacts
    */
   s3BucketName: string;

   /**
    * The AWS Account connection details
    */
   connectionArn: string;

   /**
    * The default branch to trigger releases
    * @advanced
    */
   defaultReleaseBranch?: string;
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
     console.log(options);
     this.options = options;
 
     this.repository = new SourceRepository(this, {
       title: this.options.moduleName,
     });

     const workflowFolder = path.join(this.repository.relativePath, '.aws', 'workflows');
     this.createWorkflow(workflowFolder, this.options);

   }
 
   override synth(): void {
     // create my project directory
     super.synth();
 
     this.copySourceFiles(this.repository.path);
     const templateYamlLocation = path.join(this.repository.path, 'template.yaml');
     this.createSamTemplate(templateYamlLocation, this.options);
   }
 
   protected copySourceFiles(desination: string): void {
     // the source files I want to copy are local to the template
     const sourceFiles = path.resolve(__dirname, '../assets');
     cp.execSync(`cp -R ${sourceFiles}/* ${desination}`, {
       stdio: 'inherit',
     });
   }
 
   protected createWorkflow(desination: string, options: Options): void {
     new YamlFile(this, `${desination}/build.yaml`, {
      marker: false,
      obj: {
        Name: 'build',
        Triggers: [
          {
            Type: 'Push',
            Branches: ['main']
          }
        ],
        Actions: {
          Build: {
            Identifier: 'aws-actions/cawsbuildprivate-build@v1',
            OutputArtifacts: ['MyCustomBuildArtifactName'],
            Configuration: {
              Variables: [
                {
                  Name: 'BUILD_ROLE_ARN',
                  Value: options.connectionArn
                }
              ],
              Environment: {
                Container: {
                  Image: 'public.ecr.aws/t5a3h6s3/rhboyd/build:latest',
                }
              },
              Steps: [
                {Run: 'python --version'},
                {Run: 'sam build'},
                {Run: `sam package --template-file ./.aws-sam/build/template.yaml --s3-bucket ${options.s3BucketName} --output-template-file output1.yaml --region us-west-2`},
              ],
              Artifacts: [
                {
                  Name: 'MyCustomBuildArtifactName',
                  Files: ['output1.yaml']
                }
              ]
            }
          },
          DeployCloudFormationStack: {
            Identifier: 'aws/cloudformation-deploy-gamma@v1',
            // eslint-disable-next-line quotes
            InputArtifacts: ['MyCustomBuildArtifactName'],
            Configuration: {
              CodeAwsRoleARN: options.connectionArn,
              StackRoleARN: options.connectionArn,
              StackName: `${options.moduleName}-stack`,
              StackRegion: 'us-west-2',
              TemplatePath: 'MyCustomBuildArtifactName::output1.yaml',
            }
          }
        },
      }
    });
   }
 
   protected createSamTemplate(desination: string, options: Options): void {

    new YamlFile(this, desination, {});

     const template = `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  sam-app

  Sample SAM Template for sam-app

# More info about Globals: https://github.com/awslabs/serverless-application-model/blob/master/docs/globals.rst
Globals:
  Function:
    Timeout: 3

Resources:
  ${options.moduleName}Function:
    Type: AWS::Serverless::Function # More info about Function Resource: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction
    Properties:
      CodeUri: src/
      Handler: app.lambda_handler
      Runtime: python3.8
      Events:
        ${options.moduleName}:
          Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
          Properties:
            Path: /hello
            Method: get

Outputs:
  # ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
  # Find out more about other implicit resources you can reference within SAM
  # https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  ${options.moduleName}Api:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/hello/"
  ${options.moduleName}Function:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt ${options.moduleName}Function.Arn
  ${options.moduleName}FunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt ${options.moduleName}FunctionRole.Arn`;
 
     fs.writeFileSync(desination, template);
   }
} 
