## Blueprints

Blueprints are a project generation tool. Blueprints will generate source code and configuaration files such as package.json, Makefile, eslint, etc. for your project.
Blueprints can generate files supporting AWS resources such as cdk constructs, cloudformation and sam templates, etc.
Blueprints can also generate components and files supporting Quokka.Codes resources such as source repositories, workflows, environments, etc.

## This Blueprint:
This blueprint generates a Web Application project. This blueprint will generate the source code, supporting files, and create resources for a web application that is deployed using Quokka workflows.

This blueprint will generate the following files and folders:

- *ReactFolderName* - Folder that contains your React front-end code
- *NodeFolderName* - Folder that contains backend code and Cloud Development Kit (cdk) constructs. For more information on cdk, see the [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- .aws/workflows/build.yaml - The template that defines the project's workflow
- .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments
- Source repository - A git repository to store, version, and manage project assets. For more information on source repositories, see the [Quokka.Codes Source Repository User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/source.html)
- Workflow - An automated procedure that defines how to build, test, and deploy the web application. For more information on workflows, see the [Quokka.Codes Workflows User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/flows.html)
- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into a development, staging, or production environment. For more information on environments, see the [Quokka.Codes Environments User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/environments)
- Workspace - A cloud native development environment. A workspace must be manually created with the generated DevFile using the create workspace operation on Quokka.Codes. For more information on the create workspace operation and workspaces, see the [Quokka.Codes Workspaces User Guide](https://alpha-docs-aws.amazon.com/quokka/latest/userguide/workspace.html)

This blueprint will deploy the following AWS Resources upon successful project creation, their deployment status can be viewed in the project's workflow:

- S3 - A resource to host your front-end assets on a object storage service offering industry-leading scalability, data high-availability, security, and performance

  For more information on S3, see the [AWS S3 User Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

- Cloudfront - A resource for speeding up distribution of your front-end content, such as .html, .css, .js, and image files, to your users

  For more information on Cloudfront, see the [AWS Cloudfront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

- API Gateway -  A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale

  For more information on API Gateway, see the [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- Lambda Function - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers

For more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- IAM Role(s) - A resource for securely controlled access to AWS

  For more information on IAM, see the [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
