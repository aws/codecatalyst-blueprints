import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import {
  generateWorkflow,
  StageDefinition,
  Workflow,
} from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@caws-blueprint/caws.blueprint';
import { YamlFile, SampleFile } from 'projen';
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
   * The name of the application code module.
   */
  moduleName: string;

  /**
   * The name of the S3 bucket to store build artifacts
   */
  s3BucketName: string;

  /**
   * The role ARN to use when building your application
   */
  buildRoleArn: string;

  /**
   * The role ARN to use to deploy your application through CloudFormation
   */
  stackRoleArn: string;

  /**
   * Workflow stages to generate
   */
  stages: StageDefinition[];

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

    for (const stage of this.options.stages) {
      const entropy = Math.random().toString(36).substr(2, 5);
      stage.environment.title = `${stage.environment.title}-${entropy}`;
    }

    this.repository = new SourceRepository(this, {
      title: this.options.moduleName,
    });

    options.stages.forEach(stage => new Environment(this, stage.environment));

    new Workflow(
      this,
      this.repository,
      generateWorkflow(
        'sam-python',
        'main',
        options.stages,
        options.moduleName,
        options.s3BucketName,
        options.buildRoleArn,
        false,
        options.stackRoleArn,
      ),
    );

    new Workspace(this, this.repository, SampleWorkspaces.default);
  }

  override synth(): void {
    this.addSamInstallScript();
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
      Runtime: python3.6
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
