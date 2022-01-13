## Blueprints

Blueprints are a project generation tool. Blueprints will generate source code and configuaration files such as package.json, Makefile, eslint, etc. for your project.
Blueprints can generate files supporting AWS resources such as cdk constructs, cloudformation and sam templates, etc.
Blueprints can also generate components and files supporting Quokka.Codes resources such as source repositories, workflows, environments, etc.

## This Blueprint:
This blueprint generates a Serverless Application Model (SAM) project. This blueprint will generate the source code, supporting files, and create resources for a serverless application that is deployed using Quokka workflows.

This blueprint will generate the following files and folders:

- *FunctionName* - Folder(s) named after a lambda function that contain its source code

- .aws/workflows/build.yaml - The template that defines the project's workflow

- template.yaml - The template that defines the AWS resources of the application, including Lambda Functions, API Gateways, and IAM roles

- .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments.

- README - Information on the files and folders in the project, how to build, test, and deploy your appliction.

This blueprint will generate the following resources in a Quokka.AWS project:

- Source repository - A git repository to store, version, and manage project assets.

  For more information on source repositories, see the [Quokka.Codes Source Repository User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/source.html)

- Workflow - An automated procedure that defines how to build, test, and deploy the serverless application.

  For more information on workflows, see the [Quokka.Codes Workflows User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/flows.html)

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into a development, staging, or production environment.

  For more information on environments, see the [Quokka.Codes Environments User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/environments)

- Workspace - A cloud native development environment. Workspace must be manually created with the generated DevFile using the create workspace operation on Quokka.AWS.

  For more information on the create workspace operation and workspaces, see the [Quokka.Codes Workspaces User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/workspace.html)

This blueprint will deploy the following AWS Resources upon successful project creation, their deployment status can be viewed in the project's workflow:

- Lambda Function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers.

  For more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale.

  For more information on API Gateway, see the [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- IAM Role(s) - A resource for securely controled access to the lambda function(s).

  For more information on IAM, see the [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

## Serverless Application

A serverless application is a combination of Lambda functions, event sources, and other resources that work together to perform tasks. Note that a serverless application is more than just a Lambda function—it can include additional resources such as APIs, databases, and event source mappings.
For more information on serverless applications, see the [AWS Serverless Application Model (SAM) Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
