export function generateReadmeContents(
  reactFolderName: string,
  nodeFolderName: string,
) {
  return `## This Project:

This project is a Cloud Development Kit (CDK) Web application Project generated using the AWS Blueprints system. For more information on blueprints, see [Blueprints User Guide](https://docs.aws.amazon.com/quokka/latest/userguide/projects-blueprints.html). This project contains the source code, supporting files, and Quokka.Codes resources for a CDK application that is deploying using Quokka.Codes workflows.

This project contains the following files and folders in its source repository:

- .aws/workflows/buildAssets.yaml - The template that defines the project's workflow

- ${nodeFolderName} - Folder containing source code for the back-end Lambda code and cdk constructs

  - src - Folder containing code for the Lambda function and generating cdk constructs

  - test - Folder containinng test code

- ${reactFolderName} - Folder containing source code for the front-end React application

  - build - Folder containing any build assets

  - public - Folder containing public assets

  - src - Folder containing React code

- .mde.devfile.yaml - A DevFile that defines developer workspaces or cloud-native development environments.

This project has created the following Quokka.Codes Resources:

  - Source repository - A git repository to store, version, and manage project assets.

  For more information on source repositories, see _Working with source repositories_ in the **Quokka User Guide**

  - Workflow - An automated procedure that defines how to build, test, and deploy the web application.

  For more information on workflows, see _Build, test, and deploy with workflows_ in the **Quokka User Guide**

  - Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into a development, staging, or production environment.

  For more information on environments, see _Organizing deployments using environments_ in the **Quokka User Guide**.

  - Workspace - A cloud native development environment. A workspace must be manually created with the generated DevFile using the create workspace operation on Quokka.Codes.

  For more information on the create workspace operation and workspaces, see _Working with workspaces_ in the **Quokka User Guide**.

This project will deploy the following AWS Resources after being successfuly created, the deployment status can be viewed in the project's workflow:

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

## Using the CDK CLI and NPM to build and test

You can use the Cloud Development Kit Command Line Interface (CDK CLI) and Node Package Manager (NPM) to build, test, and deploy your application. To use the CDK CLI and NPM, you will need the following tools in your workspace.

  * Install [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
  * Install [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

To work on the sample generated code, you will need to clone your project's repository to your local computer. You can find instructions in the _Clone a source repository_ section in the **Quokka User Guide**

To build your application locally, use the following command in your shell from your workspace root

\`\`\`
  npm run build-server

  npm run build-client
\`\`\`

To view the generated cloudformation stacks, use the following command in your shell from your workspace root

\`\`\`
cd ${nodeFolderName}
cdk synth
\`\`\`

  The CDK CLI will output any Assets that it will generate the cdk.out folder. For more information about Assets, see the [Assets page](https://docs.aws.amazon.com/cdk/v2/guide/assets.html)

## Deploying your serverless application

The application is deployed through Quokka.Codes using the workflow defined in .aws/workflows/buildAssets.yaml. The workflow is triggered by pushes to the main branch of the source repository. Triggers can be code pushes to a source repository branch or a pull request being created, merged, closed, or revised.

For more information on deploying using workflows and organizing deployments by environment, see the _Deploying using workflows_ section in the **Quokka User Guide**

## Add a resource to your web application
The application uses CDK to define application resources. AWS CDK is an extension of AWS CloudFormation with a simpler syntax for configuring application resources such as functions, triggers, and APIs. To add an application resource, you can define a CDK construct in ${nodeFolderName}/src/main.ts. For a list of CDK constructs, see the [AWS CDK Reference Documentation](https://docs.aws.amazon.com/cdk/api/v2/).

## Additional Resources
See the **Quokka User Guide** for additional information on using the features and resources of Quokka.Codes
`;
}
