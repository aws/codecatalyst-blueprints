# LLM Chatbot Playground

This blueprint generates a sample chatbot using the Anthropic company's LLM [Claude 2](https://www.anthropic.com/index/claude-2), one of the foundational models provided by [Amazon Bedrock](https://aws.amazon.com/bedrock/) for generative AI.

### Basic Conversation

![](https://d107sfil7rheid.cloudfront.net/demo.gif)

### Bot Personalization

Add your own instruction and give external knowledge as URL or files (a.k.a [RAG](./docs/RAG.md)). The bot can be shared among application users.

![](https://d107sfil7rheid.cloudfront.net/bot_creation.png)
![](https://d107sfil7rheid.cloudfront.net/bot_chat.png)

## 📚 Supported Languages

- English 💬
- 日本語 💬 (ドキュメントは[こちら](./docs/README_ja.md))
- 한국어 💬
- 中文 💬

## 🚀 Super-easy Deployment

- On us-east-1, open [Bedrock Model access](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess) > `Manage model access` > Check `Anthropic / Claude`, `Anthropic / Claude Instant` and `Cohere / Embed Multilingual` then `Save changes`.

<details>
<summary>Screenshot</summary>

![](https://d107sfil7rheid.cloudfront.net/model_screenshot.png)

</details>

## Architecture

It's an architecture built on AWS managed services, eliminating the need for infrastructure management. Utilizing Amazon Bedrock, there's no need to communicate with APIs outside of AWS. This enables deploying scalable, reliable, and secure applications.

- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/): NoSQL database for conversation history storage
- [Amazon API Gateway](https://aws.amazon.com/api-gateway/) + [AWS Lambda](https://aws.amazon.com/lambda/): Backend API endpoint ([AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter), [FastAPI](https://fastapi.tiangolo.com/))
- [Amazon SNS](https://aws.amazon.com/sns/): Used to decouple streaming calls between API Gateway and Bedrock because streaming responses can take over 30 seconds in total, exceeding the limitations of HTTP integration (See [quota](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)).
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/) + [S3](https://aws.amazon.com/s3/): Frontend application delivery ([React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/))
- [AWS WAF](https://aws.amazon.com/waf/): IP address restriction
- [Amazon Cognito](https://aws.amazon.com/cognito/): User authentication
- [Amazon Bedrock](https://aws.amazon.com/bedrock/): Managed service to utilize foundational models via APIs. Claude is used for chat response and Cohere for vector embedding
- [Amazon EventBridge Pipes](https://aws.amazon.com/eventbridge/pipes/): Receiving event from DynamoDB stream and launching ECS task to embed external knowledge
- [Amazon Elastic Container Service](https://aws.amazon.com/ecs/): Run crawling, parsing and embedding tasks. [Cohere Multilingual](https://txt.cohere.com/multilingual/) is the model used for embedding.
- [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/): Scalable vector store with [pgvector](https://github.com/pgvector/pgvector) plugin

![](https://d107sfil7rheid.cloudfront.net/arch.png)

## Connections and permissions

This blueprint requires a custom development role.  To create one, click "Add an existing IAM role" from the add IAM role options. The IAM role needs to contain the CodeCatalyst trust policy, as well as the following permissions:

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

### Required IAM role trust policy:

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

## Features and Roadmap

### Basic chat features

- [x] Authentication (Sign-up, Sign-in)
- [x] Creation, storage, and deletion of conversations
- [x] Copying of chatbot replies
- [x] Automatic subject suggestion for conversations
- [x] Syntax highlighting for code
- [x] Rendering of Markdown
- [x] Streaming Response
- [x] IP address restriction
- [x] Edit message & re-send
- [x] I18n
- [x] Model switch (Claude Instant / Claude)

### Customized bot features

- [x] Customized bot creation
- [x] Customized bot sharing

### RAG features

- [x] Web (html)
- [x] Text data (txt, csv, markdown and etc)
- [x] PDF
- [x] Microsoft office files (pptx, docx, xlsx)
- [x] Youtube transcript

### Admin features

- [ ] Admin console to analyze user usage

### RAG (Retrieval Augmented Generation)

See [here](./docs/RAG.md).

## Authors

- [Takehiro Suzuki](https://github.com/statefb)
- [Yusuke Wada](https://github.com/wadabee)

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

***

When you create or update a project using a blueprint, CodeCatalyst may generate resources such as source repository, sample source code, CI/CD workflows, build and test reports, secrets, integrated issue tracking tools, etc. You should review the generated artifacts/project before deploying to a production or publicly accessible environment. You are responsible for all activities in your production and publicly accessible environments.
