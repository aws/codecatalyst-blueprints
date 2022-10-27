## About this blueprint

This blueprint creates an AWS Serverless Application Model (SAM) project. This project contains the source code, supporting files, and
Amazon CodeCatalyst resources for a SAM application that is deployed using Amazon CodeCatalyst workflows.

Your project uses a Amazon CodeCatalyst environment to deploy a SAM application with AWS Lambda and Amazon API Gateway to an Amazon CloudFront URL. Your Amazon CodeCatalyst environment requires
an AWS account connection to be set up for your Amazon CodeCatalyst organization, along with an IAM role configured for your project workflow. After you create
your project, you can view the repository, source code, and CI/CD workflow for your Amazon CodeCatalyst project. After your workflow runs successfully, your
deployed CDK application URL is available under the output for your workflow.

### Architecture overview

This project uses:
- asd

This project will deploy to the following AWS Resources after being created. The deployment status can be viewed in the project's workflow:

- AWS Lambda
- AWS CloudFront
- AWS API Gateway
- 
**more elaboration needed..

needs an architecture diagram...**


The application is deployed through Amazon CodeCatalyst using the workflow defined in `.aws/workflows/build-and-release.yaml`. The workflow is triggered by pushes to the `main` of the source repository.


## Connections and permissions

You configure your AWS account connection from the AWS accounts settings in your Amazon CodeCatalyst Organization settings. AWS IAM roles added to the account extension can be used to authorize project workflows to access AWS account resources. 

The SAM application uses multiple IAM roles to build and deploy the application, each with the Amazon CodeCatalyst trust policy:

### IAM role trust policy

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

### Deploy role policy

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


### Build role policy

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

## Project resources

This blueprint will create the following Amazon CodeCatalyst resources:

- Source repository - A Git repository to store, version, and manage project assets.

  For more information on source repositories, see the _Source Repositories in Amazon CodeCatalyst_ section in the **Amazon CodeCatalyst User Guide**

- Workflow - An automated procedure that defines how to build, test, and deploy the serverless application.

  For more information on workflows, see the _Build, test, and deploy with workflows in Amazon CodeCatalyst_ section of the **Amazon CodeCatalyst User Guide**

- Environment(s) - An abstraction of infrastructure resources for deploying applications. Environments can be used to organize deployment actions into
  a production or non-production environment.

  For more information on environments, see the _Organizing deployments using environments_ section in the **Amazon CodeCatalyst User Guide**

- Workspace - A cloud-based development environment. Workspace must be manually created with the generated devfile using the create workspace
  operation on Amazon CodeCatalyst.

  For more information on the create workspace operation and workspaces, see the _Working with workspaces in Amazon CodeCatalyst_ section in the **Amazon CodeCatalyst User
  Guide**

This project will deploy the following AWS resources after being successfuly created, the deployment status can be viewed in the project's workflow:

- Lambda Function(s) - A resource to invoke your code on a high-availability compute infrastructure without provisioning or managing servers. For more
  information on AWS Lambda, see the [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)

- API Gateway - A resource for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs at any scale. For more
  information on API Gateway, see the [AWS API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)

- IAM Role(s) - A resource for securely controlled access to AWS resource, such as the lambda function(s). For more information on IAM, see the
  [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

