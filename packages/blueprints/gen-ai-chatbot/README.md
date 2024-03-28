# Bedrock GenAI chatbot
This blueprint allows you to build, customize, and manage a chatbot using Anthropic’s LLM [Claude](https://www.anthropic.com/index/claude-2), a model provided by [Amazon Bedrock](https://aws.amazon.com/bedrock/) for generative AI. The chatbot supports multiple languages, content formats, conversation capabilities, and ability to monitor usage. You can set necessary permissions with IAM roles for a secure and login-protected LLM playground that can be customized to your data.

**Important**: Changing to a blueprint version with a different Claude model deletes the conversation history. A new blueprint version is not backwards compatible with an older version.

## Bot conversation and bot personalization
You can personalize your chatbot through custom instructions and external knowledge that can be provided through URLs or files (for example, [retrieval-augmented generation (RAG)](https://github.com/aws-samples/bedrock-claude-chat/blob/main/docs/RAG.md)). When a chatbot is created or updated, it pulls and breaks down data into text, and uses Cohere Multilingual to find and match the text to provide responses to user questions. The customized bot can be shared among application users.

## Features
With this blueprint, you can modify your chatbot capabilities using chat features, customization capabilities, personal data, and usage tracking. The features besides IP address restriction are made available by default.

### Basic chat features
* Authentication (Sign-up, Sign-in)
* Creation, storage, and deletion of conversations
* Copying of chatbot replies
* Automatic subject suggestion for conversations
* Syntax highlighting for code
* Rendering of Markdown
* Streaming Response
* IP address restriction (not available by default)
* Edit message and resend
* I18n
* Model switch (Claude Instant / Claude)

### Customized bot featuers
* Customized bot creation
* Customized bot sharing

### Retrieval-augmented generation (RAG) features
* Web (html)
* Text data (txt, csv, markdown and etc)
* PDF
* Microsoft office files (pptx, docx, xlsx)
* Youtube transcript

### Admin features
* Admin console to analyze user usage

## Supported languages
The following languages are supported for a custom chatbot:
* English 
* Japanese (日本語)
* Korean (한국어)
* Chinese (中文)

## Deployment
After building your chatbot, you can also deploy it with this blueprint. Before a chatbot can be deployed with a CodeCatalyst workflow, you must enable model access.

**To enable model access a chatbot**
1. Navigate to the [AWS Management Console](https://console.aws.amazon.com/).
2. From the region dropdown menu, choose the region where Amazon Bedrock will be called. This should be the same deployment region you choose under Additional configurations when creating a project in Amazon CodeCatalyst with the Bedrock GenAI chatbot blueprint. 
3. Navigate to [Amazon Bedrock access](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess).
4. Choose Manage model access.
5. Choose the checkboxes for Anthropic/Claude, Anthropic/Claude Instant, and Cohere/Embed Multilingual.
6. Choose Request model access.

## Architecture
The architecture of this blueprint leverages AWS-managed services to minimize the need for infrastructure management. Integration of Amazon Bedrock eliminates the need to communicate with external APIs, which allows for scalable, reliable, and secure applications.

The following AWS services are integrated in the architecture:
* [Amazon DynamoDB](https://aws.amazon.com/dynamodb/): NoSQL database for conversation history storage
* [Amazon API Gateway](https://aws.amazon.com/api-gateway/) + [AWS Lambda](https://aws.amazon.com/lambda/): Backend API endpoint ([AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter), [FastAPI](https://fastapi.tiangolo.com/))
* [Amazon SNS](https://aws.amazon.com/sns/): Used to decouple streaming calls between API Gateway and Bedrock because streaming responses can take over 30 seconds in total, exceeding the limitations of HTTP integration. For more information, see [Amazon API Gateway quotas and important notes](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html).
* [Amazon CloudFront](https://aws.amazon.com/cloudfront/) + [S3](https://aws.amazon.com/s3/): Frontend application delivery ([React](https://tailwindcss.com/), [Tailwind CSS](https://tailwindcss.com/))
* [AWS WAF](https://aws.amazon.com/waf/): IP address restriction
* [Amazon Cognito](https://aws.amazon.com/cognito/): User authentication
* [Amazon Bedrock](https://aws.amazon.com/bedrock/): Managed service to utilize foundational models via APIs. Claude used for chat response and Cohere for vector embedding
* [Amazon EventBridge Pipes](https://aws.amazon.com/eventbridge/pipes/): Receiving event from DynamoDB stream and launching ECS task to embed external knowledge
* [Amazon Elastic Container Service](https://aws.amazon.com/ecs/): Run crawling, parsing and embedding tasks. [Cohere Multilingual](https://txt.cohere.com/multilingual/) model used for embedding
* [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/): Scalable vector store with [pgvector](https://github.com/pgvector/pgvector) plugin

![](https://d107sfil7rheid.cloudfront.net/arch.png)

## Connections and permissions
This blueprint supports the Amazon CodeCatalyst development administrator role in IAM, which can be created from the [AWS Management Console](https://console.aws.amazon.com/). The role can be used across multiple blueprints. An alternative option is creating a blueprint-specific IAM role by adding an existing IAM role to your CodeCatalyst space. For more information, see [Adding an AWS account to a space](https://docs.aws.amazon.com//codecatalyst/latest/userguide/ipa-connect-account-create.html) and [Adding IAM roles to account connections](https://docs.aws.amazon.com//codecatalyst/latest/userguide/ipa-connect-account-addroles.html).

When using an existing IAM role, make sure it contains the CodeCatalyst trust policy, as well as the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
            "iam:DeleteRole",
            "iam:GetRole",
            "iam:TagRole",
            "iam:CreateRole",
            "iam:AttachRolePolicy",
            "iam:DetachRolePolicy",
            "iam:DeleteRolePolicy",
            "cloudformation:*",
            "lambda:*",
            "apigateway:*",
            "ecr:*",
            "ssm:PutParameter",
            "ssm:DeleteParameter",
            "iam:PutRolePolicy",
            "s3:*",
            "ssm:GetParameter",
            "ssm:GetParameters"
          ],
          "Resource": "*"
      },
      {
          "Effect": "Allow",
          "Action": [
              "sts:AssumeRole"
          ],
          "Resource": [
              "arn:aws:iam::*:role/cdk-*"
          ]
      }
  ]
}
```
The IAM roles also require the Amazon CodeCatalyst service principals `codecatalyst.amazonaws.com` and `codecatalyst-runner.amazonaws.com`.
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "codecatalyst.amazonaws.com",
                    "codecatalyst-runner.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

## Additional resources
See the Amazon CodeCatalyst user guide for additional information on using the features and resources of Amazon CodeCatalyst. To learn more about blueprints, see the [Project blueprint reference](https://docs.aws.amazon.com//codecatalyst/latest/userguide/project-blueprints.html) and [Working with custom blueprints in CodeCatalyst](https://docs.aws.amazon.com//codecatalyst/latest/userguide/custom-blueprints.html).
