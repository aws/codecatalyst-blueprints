## Project overview

This project is a Cloud Development Kit (CDK) Web application project generated using Amazon CodeCatalyst blueprints.

Your project uses an Amazon CodeCatalyst environment to deploy a CDK application with Lambda and API Gateway to a CloudFront URL. Your Amazon CodeCatalyst environment requires an AWS account connection to be set up for your Quokka organization, along with an IAM role configured for your project workflow. After you create your project, you can view the repository, source code, and CI/CD workflow for your project. After your workflow runs successfully, your deployed CDK application URL is available under the output for your workflow.

### Architecture overview



This project uses:

- Node.js - Back-end code
- ReactJS - Front-end code

- AWS Lambda
- AWS CloudFront
- AWS API Gateway
- Amazon S3



More elaboration needed...

### Architecture diagram


needs a diagram...


## Connections and permissions

You configure your AWS account connection from the **AWS accounts** settings in your Amazon CodeCatalyst Organization settings. AWS IAM roles added to the account extension can be used to authorize project workflows to access AWS account resources. The IAM roles for the Web application require the following permissions:

### Web application IAM permissions:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "ecr:*",
                "ssm:*",
                "s3:*",
                "iam:PassRole",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy"
            ],
            "Resource": "*"
        }
    ]
}
```

The IAM roles also require the Quokka service principals `quokka.amazonaws.com` and `quokka-runner.amazonaws.com`.

### Web application IAM role trust policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "quokka.amazonaws.com",
                    "quokka-runner.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

## Project details

### Project resources

This project will create the following Amazon CodeCatalyst Resources:

- Source repository - A Git repository to store, version, and manage project assets.

For more information on source repositories, see _Working with source repositories_ in the **Amazon CodeCatalyst User Guide**

- Workflow - defined in ``.aws/workflows/buildAssets.yaml`` - An automated procedure that defines how to build, test, and deploy the web application.

For more information on workflows, see _Build, test, and deploy with workflows_ in the **Amazon CodeCatalyst User Guide**

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into
  a production or non-production environment.  **NOTE: NOT SPECIFIC ENOUGH**

For more information on environments, see _Organizing deployments using environments_ in the **Amazon CodeCatalyst User Guide**.

- Workspace - A cloud-based development environment. A workspace must be manually created with the generated devfile using the create workspace
  operation on Quokka.Codes.

For more information on the create workspace operation and workspaces, see _Working with workspaces_ in the **Amazon CodeCatalyst User Guide**.

### Deployment environment

This project will deploy to the following AWS Resources after being created. The deployment status can be viewed in the project's workflow:

- Amazon S3 - A resource to host your front-end assets on a object storage service offering industry-leading scalability, data high-availability, security,
  and performance

  For more information on S3, see the [AWS S3 User Guide](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

- Amazon Cloudfront - A resource for speeding up distribution of your front-end content, such as .html, .css, .js, and image files, to your users

  For more information on Cloudfront, see the
  [AWS Cloudfront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

- AWS API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale

  For more information on API Gateway, see the
  [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- AWS Lambda Function - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers

  For more information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- IAM role(s) - A resource for securely controlled access to AWS

  For more information on IAM, see the [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
  **NOTE ARE WE ACTUALLY CREATING A NEW IAM ROLE???**


## Additional Resources

See the **Amazon CodeCatalyst User Guide** for additional information on using the features and resources of Quokka.Codes
