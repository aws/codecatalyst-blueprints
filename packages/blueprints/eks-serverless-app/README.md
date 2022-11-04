## This project:

This project is an EKS project generated using the AWS Blueprints System. For more information on blueprints, see the _Working with blueprints in
Quokka_ section in the **Quokka User Guide**. This project contains the source code, supporting files, and Quokka.Codes resources for a SAM
application that is deployed using Quokka.Codes workflows.

This application is based on this EKS tutorial: https://aws.amazon.com/getting-started/guides/deploy-webapp-eks/ See this tutorial for more
information.

The project uses a Quokka environment to deploy an EKS application. Your Quokka environment requires an AWS account connection to be set up for your
Quokka organization, along with an IAM role configured for your project workflow. After you create your project, you can view the repository, source
code, and CI/CD workflow for your Quokka project. After your workflow runs successfully, your deployed CDK application URL is available under the
output for your workflow.

## Configuring the account connection

You can create a new account connection from the AWS Accounts extension in the Quokka marketplace. AWS IAM roles added to the account extension can be
used to authorize project workflows to access AWS account resources.

The SAM application uses multiple IAM roles to build and deploy the application, each with the Quokka trust policy:

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
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:PassRole",
                "ecr:*",
                "eks:*",
                "ec2:*",
                "cloudformation:*",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:CreateServiceLinkedRole",
                "ssm:*",
                "s3:*",
                "lambda:*",
                "states:*"
            ],
            "Resource": "*"
        }
    ]
}
```

_Note: If you add more resources, you will need to update the policy_

### Deploy role policy

Create a role based on the trust policy above, and then add the following inline policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:PassRole",
                "ecr:*",
                "eks:*",
                "ec2:*",
                "cloudformation:*",
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PutRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:CreateServiceLinkedRole",
                "ssm:*",
                "s3:*",
                "lambda:*",
                "states:*"
            ],
            "Resource": "*"
        }
    ]
}
```
