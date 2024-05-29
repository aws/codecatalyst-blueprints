import { DynamicKVInput } from '@amazon-codecatalyst/blueprints.blueprint';

export const myOptions: DynamicKVInput[] = [
  {
    displayType: 'environment',
    key: 'testEnvName',
    description: 'this is my dynamically generated environment description',
    accountConnections: [{
      name: 'testAcc',
      description: 'dynamic account connection description',
      roles: [{
        name: 'roleKey',
        displayName: 'Deploy role',
        inlinePolicy: `{
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
          }`,
        trustPolicy: `{
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
      }`,
        capabilities: ['codecatalyst*'],
      }],
    }],
    value: {
      name: 'DEFAULT_ENVIRONMENT_NAME',
      environmentType: 'PRODUCTION',
    },
  },
];