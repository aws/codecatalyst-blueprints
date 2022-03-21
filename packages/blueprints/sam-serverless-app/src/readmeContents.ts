import {Lambda} from './blueprint';
import {RuntimeMapping} from './models';
import {StageDefinition} from '@caws-blueprint-component/caws-workflows';

export function generateReadmeContents(
  runtimeMapping: RuntimeMapping,
  defaultReleaseBranch: 'main',
  lambdas: Lambda[],
  stages: StageDefinition[],
  cloudFormationStackName: string,
  workflowName: string,
) {
  //Generate input variables
  let functionNames = '';
  for (let i = 0; i < lambdas.length - 1; i++) {
    functionNames += `${lambdas[i].functionName}, `;
  }
  functionNames += `${lambdas[lambdas.length - 1].functionName}`;

  let environments = '';
  for (const stage of stages) {
    environments += `- \`${stage.environment.title}\` using the cloudformation stack \`${cloudFormationStackName}-${stage.environment.title}\`\n`;
  }

  const readmeContents = `
## This Project:

This project is an AWS Serverless Application Model (SAM) Project generated using the AWS Blueprints System. For more information on blueprints, see the _Working with blueprints in Quokka_ section in the **Quokka User Guide**. This project contains the source code, supporting files, and Quokka.Codes resources for a SAM application that is deployed using Quokka.Codes workflows.

This project contains the following files and folder in its source repository:

  - ${functionNames} - Source code and supporting files for the Lambda function of the application, containing:

    - ${runtimeMapping.srcCodePath} - Code for the Lambda function of the application

    - events - Invocation events that you can use to invoke the function

    - ${runtimeMapping.testPath} - Unit tests for the Lambda function's code


  - .aws/workflows/${workflowName}.yaml - The template that defines the project's workflow

  - template.yaml - The template that defines the application's AWS resources, including Lambda Functions, API Gateways, and IAM roles

  - .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments.

This project has created the following Quokka.Codes Resources:

- Source repository - A git repository to store, version, and manage project assets.

  For more information on source repositories, see the _Source Repositories in Quokka_ section in the **Quokka User Guide**

- Workflow - An automated procedure that defines how to build, test, and deploy the serverless application.

  For more information on workflows, see the _Build, test, and deploy with workflows in Quokka_ section of the **Quokka User Guide**

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into a development, staging, or production environment.

  For more information on environments, see the _Organizing deployments using environments_ section in the **Quokka User Guide**

- Workspace - A cloud native development environment. Workspace must be manually created with the generated DevFile using the create workspace operation on Quokka.Codes.

  For more information on the create workspace operation and workspaces, see the _Working with workspaces in Quokka_ section in the **Quokka User Guide**

This project will deploy the following AWS Resources after being successfuly created, the deployment status can be viewed in the project's workflow:

  - Lambda Function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers. For more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

  - API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale. For more information on API Gateway, see the [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

  - IAM Role(s) - A resource for securely controlled access to AWS resource, such as the lambda function(s). For more information on IAM, see the [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

## Serverless Application

A serverless application is a combination of Lambda functions, event sources, and other resources that work together to perform tasks. Note that a serverless application is more than just a Lambda function—it can include additional resources such as APIs, databases, and event source mappings.
For more information on serverless applications, see the [AWS Serverless Application Model (SAM) Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

## Using the SAM CLI to build and test locally

You can use the Serverless Application Model Command Line Interface (SAM CLI) to build and test your application locally. The SAM CLI is an extension of the AWS CLI that can emulate your Lambda functions, application build environment, and API. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.
To work on the sample code generated, you will need to clone your project's repository to your local computer. If you haven't, do that first. You can find instructions in the _Clone a source repository_ section in the **Quokka User Guide**.

To use the SAM CLI, you need the following tools into your workspace.

  * Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  * Install [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
  * Install [Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
  * ${runtimeMapping.installInstructions}

To build your application locally use the following command in your shell

\`\`\`
   sam build
\`\`\`

  The SAM CLI installs dependencies defined in the ${runtimeMapping.codeUri}/${runtimeMapping.dependenciesFilePath} file of each lambda functions, creates a deployment package, and saves it in the .aws-sam/build folder.
  For more information on sam build, see the [Sam Build Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html).
  Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the \`events\` folder in each function's folder in this project.

\`\`\`
  sam local invoke <functionName> --event <functionName>/events/event.json
\`\`\`

For more information on sam local invoke, see the [Sam Invoke Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html).
The SAM CLI can also emulate your applications API. Use the sam local start-api to run the API locally (The default port is 3000).

\`\`\`
  sam local start-api
  curl http://localhost:3000/
\`\`\`

For more information on sam local start-api, see the [Sam Local Invoke Start-Api Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html).
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
The application template uses SAM to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in the [SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Deploying your serverless application
The application is deployed through Quokka.Codes using the workflow defined in \`.aws/workflows/${workflowName}.yaml\`. The workflow is triggered by pushes to the \`${defaultReleaseBranch}\` of the source repository. Triggers can be code pushes to a source repository branch or a pull request being created, merged, closed, or revised. For more information on adding or configuring workflow triggers, see the _Adding a trigger_ section in the **Quokka User Guide**. The workflow builds your application, stores the build artifacts in a generated s3 bucket, and deploys your application to your project environments in the following order:

  ${environments}

For more information on deploying using workflows and organizing deployments by environment, see the _Deploying using workflows_ section in the **Quokka User Guide**.

## Additional Resources
See the Quokka User Guide for additional information on using the features and resources of Quokka.Codes
`;
  return readmeContents;
}
