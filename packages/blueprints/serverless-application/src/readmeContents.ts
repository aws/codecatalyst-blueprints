export const readmeContents = `# This Project

This project is a Serverless Application Project generated using the AWS Blueprints System. For more information on blueprints, see the [Blueprints User Guide](https://docs.aws.amazon.com/quokka/latest/userguide/projects-blueprints.html). This project contains the source code, supporting files, and Code.AWS resources for a serverless application that is deployed using Code.AWS workflows.

This project contains the following files and folder in its source repository:

- {functionNames} - Source code and supporting files for a Lambda function of the application, containing:
  - {runtimeMapping.srcCodePath} - Code for a Lambda function of the application
  - events - Invocation events that you can use to invoke the function
  - {runtimeMapping.testPath} - Unit tests for the Lambda function's code
- .aws/workflows/build.yaml - The template that defines the project's workflow
- template.yaml - The template that defines the applications AWS resources, including Lambda Functions, API Gateways, and IAM roles
- .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments.

This project has created the following Code.AWS Resources:

- Source repository - A git repository to store, version, and manage project assets

  For more information on source repositories, see the [Source Repositories User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/source.html)

- Workflow - A code pipeline to build and deploy your serverless application

  For more information on workflows, see the [Workflows User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/flows.html)

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into development, staging, or production environment.

  For more information on Environments, see the [Environments User Guide](https://quip-amazon.com/8U1QAd5nkD8N/Environment-in-CODEAWS) (https://alpha-docs-aws.amazon.com/quokka/latest/userguide/deploy-environments.html)

- Workspace - A cloud native development environment. Workspace must be manually created with the generated DevFile using the create workspace operation on Code.AWS.

For more information on the create workspace operation and workspaces, see the [Workspaces User Guide](https://quip-amazon.com/WCSJAmBVbD1u/MDE-Devfile-Design)


This project will deploy the following AWS Resources after being successfuly created, the deployment status can be viewed in the project\'s workflow:

- Lambda Function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers. For more information on AWS Lambda, see its [developer guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale. For more information on API Gateway, see its [developer guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- Lambda Function IAM Role(s) - A resource for securely controled access to the lambda function(s). For more information on IAM, see its [user guide]()

## Serverless Application

A serverless application is a combination of Lambda functions, event sources, and other resources that work together to perform tasks. Note that a serverless application is more than just a Lambda function—it can include additional resources such as APIs, databases, and event source mappings.
For more information on serverless applications, see [AWS Serverless Application Model (SAM) Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)


## Using the SAM CLI to build and test locally

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.
* SAM CLI - [Install the SAM CLI](_https__:__//docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html_)
* [Python 3 installed](_https__:__//www.python.org/downloads/_)
* Docker - [Install Docker community edition](_https__:__//hub.docker.com/search/?type=edition&offering=community_)

To build your application locally use the following command in your shell
\`\`\`
 sam build
\`\`\`

The SAM CLI installs dependencies defined in the {runtimeMapping.codeUri}/{runtimeMapping.dependenciesFilePath} file of each lambda functions, creates a deployment package, and saves it in the .aws-sam/build folder.

For more information on sam build, see the [Sam Build Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html)

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the \`events\` folder in each function's folder in this project.
\`\`\`
 sam local invoke <functionName> --event <functionName>/events/event.json
\`\`\`
For more information on sam local invoke, see the [Sam Invoke Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html)

The SAM CLI can also emulate your applications API. Use the sam local start-api to run the API locally (The default port is 3000).
\`\`\`
 sam local start-api
 curl http://localhost:3000/
\`\`\`
For more information on sam local start-api, see [the sam local invoke start-api reference guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-start-api.html)

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
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in the [SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Deploying your serverless application
The application is deployed through Code.AWS using the workflow defined in \`.aws/workflows/build.yaml\`. The workflow is triggered by pushes to the {defaultReleaseBranch} of the source repository. Triggers can be code pushes to a source repository or a pull request being created, merged, closed, or revised. For more information on adding or configuring workflow triggers, see the [Workflow Trigger User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/workflows-add-trigger.html). The workflow builds your application, stores the build artifacts in {s3bucketName}, and deploys your application to your project environments in the following order:

{environmentsMD}

The application will deploy the following AWS Resources:
- Lambda Function
- API Gateway
- Lambda Function IAM Role

For more information on working with deploying using workflows and organizing deployment by environment, see the [workflow deployment guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/deploy.html)

## Additional Resources:
See the [Code.AWS User Guide]() for additional information on using the features and resources of Code.AWS
`


