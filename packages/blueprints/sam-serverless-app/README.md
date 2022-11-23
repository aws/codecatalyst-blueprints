## This Blueprint

This Blueprint generates an AWS Serverless Application Model (SAM) project.

A serverless application is a combination of AWS Lambda functions, event sources, and other resources that work together to perform tasks. A
serverless application can also include additional resources such as APIs, databases, and event source mappings. For more information on serverless
applications, see the
[AWS Serverless Application Model (SAM) Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)

The project uses an Amazon CodeCatalyst environment to deploy a SAM application with AWS Lambda and Amazon API Gateway to an Amazon CloudFront URL.
After you create your project, you can view the repository, source code, and continuous integration and continuous delivery (CI/CD) workflow for your
project. After your workflow runs successfully, your deployed [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
application URL is available under the output for your workflow.

### Architecture overview

This project uses:

- Node.js 14
- Java 11
- Python 3.9

You can choose any of the above as the programming language.

![Architecture diagram](https://images2.imgbox.com/a0/69/MGTKGTt6_o.png)

### Connections and permissions

You configure your AWS account connection from the **AWS accounts** settings in your Amazon CodeCatalyst Space settings. AWS IAM roles added to the
account extension can be used to authorize project workflows to access AWS account resources.

The SAM application requires multiple IAM roles to build and deploy the application:

## IAM role trust policy

```
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
```

## Deploy role policy

Create a role based on the trust policy above, and then add the following inline policy:

```
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
```

_Note: If you add more resources, you will need to update the policy_

## Build role policy

Create a role based on the trust policy above, and then add the following inline policy:

```
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
```

### Project resources

This project deploys the following AWS resources after being successfuly created:

- AWS Lambda function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers. For
  more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- Amazon API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale. For
  more information on API Gateway, see the
  [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- IAM role(s) - A resource for securely controlled access to AWS resource, such as the AWS Lambda function(s). For more information on IAM, see the
  [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

The deployment status can be viewed in the project's workflow.

This blueprint creates the following Amazon CodeCatalyst resources:

- Source repository named `HelloWorld` - A Git repository to store, version, and manage project assets.

  - `template.yaml` - The template that defines the application's AWS resources, including AWS Lambda functions, Amazon API Gateways, and IAM roles
  - `.mde.devfile.yaml` - A devfile that defines Dev Environments or cloud-native development environments

  <!--- [Tech Comm comment:]Can you please check the wording for the sentence above. Are we talking about Amazon CodeCatalyst Dev Environments or other kinds of workspaces? --->

  For more information on source repositories, see the _Working with source repositories_ section in the **Amazon CodeCatalyst User Guide**

- Workflows defined in `.codecatalyst/workflows/build-and-release.yaml`

  A workflow is an automated procedure that defines how to build, test, and deploy the serverless application. For more information, see the _Build,
  test, and deploy with workflows_ section of the **Amazon CodeCatalyst User Guide**

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into
  a production or non-production environment.

  For more information on environments, see the _Organizing deployments using environments_ section in the **Amazon CodeCatalyst User Guide**

- Dev Environment - A cloud-based development environment. A Dev Environment must be manually created with the generated devfile using the Create Dev
  Environment operation in Amazon CodeCatalyst.

  For more information on creating Dev Environemnts, see the _Working with Dev Environemnts_ section in the **Amazon CodeCatalyst User Guide**

### Additional resources

See the Amazon CodeCatalyst User Guide for additional information on using the features and resources of Amazon CodeCatalyst.
