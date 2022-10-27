##  About this blueprint

This blueprint generates a Cloud Development Kit (CDK) Web application project.

Your project uses an Amazon CodeCatalyst environment to deploy a CDK application with Lambda and API Gateway to a CloudFront URL. Your Amazon CodeCatalyst environment requires an AWS account connection to be set up for your Quokka organization, along with an IAM role configured for your project workflow. After you create your project, you can view the repository, source code, and CI/CD workflow for your project. After your workflow runs successfully, your deployed CDK application URL is available under the output for your workflow.

### Architecture overview



This project uses:

- Node.js - Back-end code
- ReactJS - Front-end code


This project will deploy to the following AWS Resources after being created. The deployment status can be viewed in the project's workflow:

- AWS Lambda
- AWS CloudFront
- AWS API Gateway
- Amazon S3



More elaboration needed...

Also include an architecture diagram...


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

## Project resources

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


## Additional Resources

See the **Amazon CodeCatalyst User Guide** for additional information on using the features and resources of Quokka.Codes
