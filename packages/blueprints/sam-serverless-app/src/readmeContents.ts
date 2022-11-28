import { EnvironmentDefinition } from '@caws-blueprint-component/caws-environments';
import { workflowLocation } from '@caws-blueprint-component/caws-workflows';

import { RuntimeMapping } from './models';
import { BlueprintRuntimes } from './runtimeMappings';

interface ReadmeParams {
  runtime: string;
  runtimeMapping: RuntimeMapping;
  lambdas: { functionName: string }[];
  defaultReleaseBranch?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  environment: EnvironmentDefinition<any>;
  cloudFormationStackName: string;
  workflowName: string;
  sourceRepositoryName: string;
}

export function generateReadmeContents(params: ReadmeParams) {
  const { runtime, runtimeMapping, lambdas, environment, cloudFormationStackName, workflowName, sourceRepositoryName } = params;
  const defaultReleaseBranch = params.defaultReleaseBranch ?? 'main';

  if (lambdas.length < 1) {
    throw new Error('Readme expects at least one Lambda function');
  }

  //Generate input variables
  let functionNames = '';
  for (let i = 0; i < lambdas.length - 1; i++) {
    functionNames += `${lambdas[i].functionName}, `;
  }
  functionNames += `${lambdas[lambdas.length - 1].functionName}`;

  const readmeContents = `
## This Project

This project is an AWS Serverless Application Model (SAM) project. A serverless application is a combination of AWS Lambda functions, event sources, and other resources that work together to perform tasks. A
serverless application can also include additional resources such as APIs, databases, and event source mappings. For more information on serverless
applications, see the [AWS Serverless Application Model (SAM) Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

The project uses an Amazon CodeCatalyst environment to deploy a SAM application with AWS Lambda and Amazon API Gateway to an Amazon CloudFront URL.
After you create your project, you can view the repository, source code, and continuous integration and continuous delivery (CI/CD) workflow for your
project. After your workflow runs successfully, your deployed [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) application URL is available under the output for your workflow.

### Architecture overview

![Architecture diagram](https://images2.imgbox.com/a0/69/MGTKGTt6_o.png)

## Connections and permissions

Configure your AWS account connection from the **AWS accounts** tab in your Amazon CodeCatalyst space. Add AWS IAM roles to
the account extension to authorize project workflows to access AWS account resources.

The SAM application requires the following IAM roles to build and deploy the application:

### IAM role trust policy

\`\`\`
{
"Version": "2012-10-17",
"Statement": [
    {
        "Sid": "CodeCatalyst",
        "Effect": "Allow",
        "Principal": {
            "Service": [
                "codecatalyst-runner.amazonaws.com",
                "codecatalyst.amazonaws.com"
            ]
        },
        "Action": "sts:AssumeRole"
    }
]
}
\`\`\`

### Deploy role policy

Create a role based on the trust policy above, and add the following inline policy:

\`\`\`
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "iam:PassRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:TagRole",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "cloudformation:*",
                "lambda:*",
                "apigateway:*"
            ],
            "Resource": "*"
        }
    ]
}
\`\`\`

_Note: You must update the policy if you add more resources.

### Build role policy

Create a role based on the trust policy above, and add the following inline policy:

\`\`\`
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:*",
                "cloudformation:*"
            ],
            "Resource": "*"
        }
    ]
}
\`\`\`

## Project resources

After being successfully created, this project deploys the following AWS resources:

- AWS Lambda function(s) - A resource that invokes your code on a high-availability compute infrastructure without provisioning or managing servers. For
  more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- Amazon API Gateway - A resource that creates, publishes, maintains, monitors, and secures REST, HTTP, and WebSocket APIs at any scale. For
  more information on API Gateway, see the
  [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- IAM role(s) -  A resource that secures controlled access to AWS resources such as the AWS Lambda function(s). For more information on IAM, see the
  [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

The deployment status can be viewed in the project's workflow.

This blueprint creates the following Amazon CodeCatalyst resources:

- Source repository named \`${sourceRepositoryName}\` - A Git repository to store, version, and manage the following project assets:
  - \`${functionNames}\` - Source code and supporting files for the Lambda function of the application, \`${functionNames}\` contains the following:
    - \`${runtimeMapping.srcCodePath}\` - Code for the AWS Lambda function of the application
    - \`events\` - Invocation events that you can use to invoke the AWS Lambda function
    - \`${runtimeMapping.testPath}\` - Tests for the AWS Lambda function's code
  - \`template.yaml\` - The template that defines the application's AWS resources, including AWS Lambda functions, Amazon API Gateways, and IAM roles.
  - \`devfile.yaml\` - A devfile that defines Dev Environments or development environments that have been built for the cloud.

  For more information on source repositories, see the _Working with source repositories_ section in the **Amazon CodeCatalyst User Guide**.

- Workflows defined in \`.codecatalyst/workflows/build-and-release.yaml\`

  A workflow is an automated procedure that defines how to build, test, and deploy the serverless application. For more information, see the _Build,
  test, and deploy with workflows_ section of the **Amazon CodeCatalyst User Guide**.

- Environment(s) - An abstraction of infrastructure resources that deploy applications. You can use environments can be used to organize deployment actions into a production or non-production environment.

  For more information on environments, see the _Organizing deployments using environments_ section in the **Amazon CodeCatalyst User Guide**.

- Dev Environment - A cloud-based development environment. A Dev Environment must be manually created with the generated devfile using the Create Dev
  Environment operation in Amazon CodeCatalyst.

  For more information on creating Dev Environments, see the _Working with Dev Environments_ section in the **Amazon CodeCatalyst User Guide**.


## Using the SAM CLI to build and test locally

You can use the SAM Command Line Interface (CLI) to build and test your application locally. The SAM CLI is an extension of the AWS CLI that can emulate your AWS Lambda functions, application build environment, and API. It uses Docker to run your functions in an Amazon Linux environment that matches AWS Lambda. It can also emulate your application's build environment and API.
To work on the sample code generated, clone your project's repository to your local computer. For more information, see the _Cloning a source repository_ section in the Amazon CodeCatalyst User Guide.

To use the SAM CLI, install following tools into your workspace.

  * Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  * Install [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
  * Install [Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
  * ${runtimeMapping.installInstructions}

To build your application locally, run the following command in your shell:

\`\`\`
    sam build
\`\`\`

  The SAM CLI installs dependencies defined in the ${runtimeMapping.codeUri}/${runtimeMapping.dependenciesFilePath} file of the AWS Lambda function, creates a deployment package, and saves it in the \`.aws-sam/build\` folder.
  For more information on sam build, see the [Sam Build Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-build.html).
  Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the \`events\` folder in each function's folder in this project.

\`\`\`
  sam local invoke <functionName> --event <functionName>/events/event.json
\`\`\`

For more information on sam local invoke, see the [Sam Invoke Command Reference Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-local-invoke.html).
The SAM CLI can also emulate your application's API. Run the \`sam local start-api\` command to run the API locally. The default port is 3000.

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

${runtimeReadmeSection[runtime].readmeTestSection}

## Adding a resource to your serverless application
The application template uses SAM to define application resources. AWS SAM is an extension of AWS CloudFormation that uses a different syntax to configure common serverless application resources such as functions, triggers, and APIs. For resources not included in the [SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), use the standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Deploying your serverless application
The application is deployed through Amazon CodeCatalyst using the workflow defined in \`${workflowLocation}/${workflowName}.yaml\`. The workflow is triggered by pushes to the \`${defaultReleaseBranch}\` branch of the source repository.
Triggers can be code pushes to a source repository branch or a pull request being created, merged, closed, or revised. For more information on adding or configuring workflow triggers, see the _Working with triggers_ section in the  Amazon CodeCatalyst User Guide.
The workflow builds your application, stores the build artifacts in a generated Amazon S3 bucket, and deploys your application to your project environment \`${environment.name}\` using the \`${cloudFormationStackName}\` AWS Cloudformation stack.
For more information on deploying using workflows and organizing deployments by environment, see the _Deploying using CodeCatalyst workflows_ section in the Amazon CodeCatalyst User Guide.

If you still want to deploy without using CI/CD workflows, you can follow these instructions after building the application:
\`\`\`
  cd .aws-sam/build/
  sam package --output-template-file packaged.yaml --resolve-s3 --template-file template.yaml --region <aws-region>
  sam deploy --template-file /projects/ServerlessAppRepo/.aws-sam/build/packaged.yaml --stack-name sam-api-blueprints-test --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
\`\`\`

## Additional Resources
See the Amazon CodeCatalyst User Guide for additional information on using the features and resources of Amazon CodeCatalyst.
`;
  return readmeContents;
}

interface RuntimeReadmeSectionData {
  readmeTestSection: string;
}

type RuntimeReadmeSectionType = {
  [key in BlueprintRuntimes]: RuntimeReadmeSectionData;
};

export const runtimeReadmeSection: RuntimeReadmeSectionType = {
  'Java 11 Maven': {
    readmeTestSection: `
## Running tests
Tests are defined in the \`HelloWorldFunction/src/test\` folder in this project.
\`\`\`
$ cd HelloWorldFunction
$ mvn test
\`\`\`
`,
  },
  'Java 11 Gradle': {
    readmeTestSection: `
## Running tests
Tests are defined in the \`HelloWorldFunction/src/test\` folder in this project.
\`\`\`
$ cd HelloWorldFunction
$ gradle test
\`\`\`
    `,
  },
  'Node.js 14': {
    readmeTestSection: `
## Running tests
Tests are defined in the \`hello-world/tests\` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests.
\`\`\`
$ cd hello-world
$ npm install
$ npm run test
\`\`\`
`,
  },
  'Python 3.9': {
    readmeTestSection: `
## Running tests
Tests are defined in the \`tests\` folder in this project. Use PIP to install the test dependencies and run tests.
\`\`\`
$ pip install -r tests/requirements.txt

# unit test
$ python -m pytest tests/unit -v

# integration test, requires deploying the stack first.
# Create the environment variable AWS_SAM_STACK_NAME with the name of the stack to test
$ AWS_SAM_STACK_NAME=<stack-name> python -m pytest tests/integration -v
\`\`\`
`,
  },
};
