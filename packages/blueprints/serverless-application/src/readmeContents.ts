import { RuntimeMapping } from './models';
import { Lambda } from './blueprint';
import { StageDefinition } from '@caws-blueprint-component/caws-workflows';

export function generateReadmeContents(
  runtimeMapping: RuntimeMapping,
  defaultReleaseBranch: 'main',
  lambdas: Lambda[],
  stages: StageDefinition[],
  cloudFormationStackName: string,
  s3bucketName: string,
  workflowName: string,
){
  //Generate input variables
  let functionNames = '';
  for (let i = 0; i < lambdas.length - 1; i++) {
    functionNames += `${lambdas[i].functionName}, `
  }
  functionNames += `${lambdas[lambdas.length - 1].functionName}`;

  let environments = '';
  for (const stage of stages){
    environments += `- \`${stage.environment.title}\` using the cloudformation stack \`${cloudFormationStackName}-${stage.environment.title}\`\n`
  }

  const readmeContents = `
## This Project:

This project is a Serverless Application Project generated using the AWS Blueprints System. For more information on blueprints, see the [Blueprints User Guide](_https://docs.aws.amazon.com/quokka/latest/userguide/projects-blueprints.html_). This project contains the source code, supporting files, and Quokka.Codes resources for a serverless application that is deployed using Quokka.Codes workflows.

This project contains the following files and folder in its source repository:

  - ${functionNames} - Source code and supporting files for a Lambda function of the application, containing:

    - ${runtimeMapping.srcCodePath} - Code for a Lambda function of the application

    - events - Invocation events that you can use to invoke the function

    - ${runtimeMapping.testPath} - Unit tests for the Lambda function's code


  - .aws/workflows/${workflowName}.yaml - The template that defines the project's workflow

  - template.yaml - The template that defines the application's AWS resources, including Lambda Functions, API Gateways, and IAM roles

  - .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments.

This project has created the following Quokka.Codes Resources:

  - Source repository - A git repository to store, version, and manage project assets.

    For more information on source repositories, see the [Quokka.Codes Source Repositiory User Guide](_https://alpha-docs-aws.amazon.com/quokka/latest/userguide/source.html_)

  - Workflow - An automated procedure that defines how to build, test, and deploy the serverless application.

    For more information on workflows, see the [Quokka.Codes Workflows User Guide](_https://alpha-docs-aws.amazon.com/quokka/latest/userguide/flows.html_)

  - Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into development, staging, or production environment.

    For more information on Environments, see the [Quokka.Codes Environments User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/deploy-environments.html)

  - Workspace - A cloud native development environment. Workspace must be manually created with the generated DevFile using the create workspace operation on Quokka.Codes.

    For more information on the create workspace operation and workspaces, see the [Quokka.Codes Workspaces User Guide](_https://quip-amazon.com/WCSJAmBVbD1u/MDE-Devfile-Design_)

This project will deploy the following AWS Resources after being successfuly created, the deployment status can be viewed in the project's workflow:

  - Lambda Function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers. For more information on AWS Lambda, see the [AWS Lambda developer guide](_https://docs.aws.amazon.com/lambda/latest/dg/welcome.html_)

  - API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale. For more information on API Gateway, see the [AWS API Gateway developer guide](_https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html_)

  - Lambda Function IAM Role(s) - A resource for securely controled access to the lambda function(s). For more information on IAM, see the [AWS IAM user guide](_https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html_)

## Serverless Application

A serverless application is a combination of Lambda functions, event sources, and other resources that work together to perform tasks. Note that a serverless application is more than just a Lambda function—it can include additional resources such as APIs, databases, and event source mappings.
For more information on serverless applications, see the [AWS Serverless Application Model (SAM) Developer Guide](_https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html_)

## Using the SAM CLI to build and test locally

You can use the Serverless Application Model Command Line Interface (SAM CLI) to build and test your application locally. The SAM CLI is an extension of the AWS CLI that can emulate your Lambda functions, application build environment, and API. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.
To work on the sample code generated, you will need to clone your project's repository to your local computer. If you haven't, do that first. You can find instructions in the [Quokka User Guide](_https://alpha.www.docs.aws.a2z.com/quokka/latest/userguide/source-repositories-clone.html_) .

To use the SAM CLI, you need the following tools into your workspace.

  * Install [AWS CLI](_https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html_)
  * Install [SAM CLI](__https__:__//docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html__)
  * Install [Docker community edition](__https__:__//hub.docker.com/search/?type=edition&offering=community__)
  * ${runtimeMapping.installInstructions}

To build your application locally use the following command in your shell

\`\`\`
   sam build
\`\`\`

  The SAM CLI installs dependencies defined in the ${runtimeMapping.codeUri}/${runtimeMapping.dependenciesFilePath} file of each lambda functions, creates a deployment package, and saves it in the .aws-sam/build folder.
  For more information on sam build, see the [Sam Build Command Reference Guide](_https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html_)
  Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the \`events\` folder in each function's folder in this project.

\`\`\`
  sam local invoke <functionName> --event <functionName>/events/event.json
\`\`\`

For more information on sam local invoke, see the [Sam Invoke Command Reference Guide](_https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html_)
The SAM CLI can also emulate your applications API. Use the sam local start-api to run the API locally (The default port is 3000).

\`\`\`
  sam local start-api
  curl http://localhost:3000/
\`\`\`

For more information on sam local start-api, see the [Sam Local Invoke Start-Api Command Reference Guide](_https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html_)
The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The \`Events\` property on each function's definition includes the route and method for each path.

\`\`\`yaml
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
\`\`\`

## Add a resource to your serverless application
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in the [SAM specification](_https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md_), you can use standard [AWS CloudFormation](_https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html_) resource types.

## Deploying your serverless application
The application is deployed through Quokka.Codes using the workflow defined in \`.aws/workflows/${workflowName}.yaml\`. The workflow is triggered by pushes to the ${defaultReleaseBranch} of the source repository. Triggers can be code pushes to a source repository branch or a pull request being created, merged, closed, or revised. For more information on adding or configuring workflow triggers, see the [Quokka.Codes Workflow Trigger User Guide](_https://alpha-docs-aws.amazon.com/quokka/latest/userguide/workflows-add-trigger.html_). The workflow builds your application, stores the build artifacts in ${s3bucketName}, and deploys your application to your project environments in the following order:

  ${environments}

For more information on deploying using workflows and organizing deployments by environment, see the [Quokka.Codes Workflow Deployment User Guide](_https://alpha-docs-aws.amazon.com/quokka/latest/userguide/deploy.html_)

## Additional Resources
See the [Quokka.Codes User Guide](_https://alpha.www.docs.aws.a2z.com/quokka/latest/userguide/welcome.html_) for additional information on using the features and resources of Quokka.Codes
`;
  return readmeContents;
}



