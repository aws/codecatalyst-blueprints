## About this blueprint:

This blueprint provides sample code to build and deploy a serverless tiny URL web application. It uses CDK to define and provision the necessary AWS
resources, as well as sample Tiny URL App for realtime use.

## Architecture overview:

The application architecture uses AWS Lambda, Amazon API Gateway, Amazon DynamoDB, and Amazon S3. Amazon S3 is used for hosting the static web
resources. JavaScript executed in the browser sends and receives data from the backend API built using Lambda and API Gateway. Finally, DynamoDB
provides a persistence layer where data can be stored by the API's Lambda function.

## Configuring the account connection

An AWS account connection is required before deploying this project. An IAM role with below policy statement is required for the blueprint to deploy
successfully

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:TagRole",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "s3:*",
                "cloudformation:*",
                "lambda:*",
                "apigateway:*",
                "ssm:*"
            ],
            "Resource": "*"
        }
    ]
}
```

_Note: If you add more resources, you will need to update the policy_

IAM role also requires below trust policy.

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

## Project resources

This blueprint will create the Amazon CodeCatalyst Resources and along with a source code Repository for the project. The project contains below
modules / files

- cdk - Java maven module for creating the Application and Canary Stacks.

- lambda - Java maven module for the Lambda function used by the Application to create Tiny URL and retrieve long url.

- site-contents - Static HTML for content serving

- testscripts - NodeJS Source code for the canary tests

- pom.xml - Maven configuration for dependency management, plugin management, build and packaging

- cdk.json - To execute the CDK code

- .codecatalyst/workflows/build-and-release.yaml - The template that defines the project's workflow
