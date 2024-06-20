# Bedrock Claude Chat

This blueprint generates a sample chatbot using the Anthropic company's LLM [Claude](https://www.anthropic.com/), one of the foundational models provided by [Amazon Bedrock](https://aws.amazon.com/bedrock/) for generative AI.

### Basic Conversation

![](https://d107sfil7rheid.cloudfront.net/demo.gif)

### Bot Personalization

Add your own instruction and give external knowledge as URL or files (a.k.a [RAG](./docs/RAG.md)). The bot can be shared among application users. The customized bot also can be published as stand-alone API (See the [detail](./docs/PUBLISH_API.md)).

![](https://d107sfil7rheid.cloudfront.net/bot_creation.png)
![](https://d107sfil7rheid.cloudfront.net/bot_chat.png)
![](https://d107sfil7rheid.cloudfront.net/bot_api_publish_screenshot3.png)

> [!Important]
> For governance reasons, only allowed users are able to create customized bots. To allow the creation of customized bots, the user must be a member of group called `CreatingBotAllowed`, which can be set up via the management console > Amazon Cognito User pools or aws cli. Note that the user pool id can be referred by accessing CloudFormation > BedrockChatStack > Outputs > `AuthUserPoolIdxxxx`.

### Administrator dashboard

Analyze usage for each user / bot on administrator dashboard. [detail](./docs/ADMINISTRATOR.md)

![](https://d107sfil7rheid.cloudfront.net/admin_bot_analytics.png)

### LLM-powered Agent

By using the [Agent functionality](./docs/AGENT.md), your chatbot can automatically handle more complex tasks. For example, to answer a user's question, the Agent can retrieve necessary information from external tools or break down the task into multiple steps for processing.

![](https://d107sfil7rheid.cloudfront.net/chatbot/agent.gif)

## 📚 Supported Languages

- English 💬
- 日本語 💬 (ドキュメントは[こちら](./docs/README_ja.md))
- 한국어 💬
- 中文 💬
- Français 💬
- Deutsch 💬
- Español 💬
- Italian 💬

## 🚀 Super-easy Deployment

- In the {{bedrockRegion}} region, open [Bedrock Model access](https://{{bedrockRegion}}.console.aws.amazon.com/bedrock/home?region={{bedrockRegion}}#/modelaccess) > `Manage model access` > Check `Anthropic / Claude 3 Haiku`, `Anthropic / Claude 3 Sonnet` and `Cohere / Embed Multilingual` then `Save changes`.

<details>
<summary>Screenshot</summary>

![](https://d107sfil7rheid.cloudfront.net/model_screenshot.png)

</details>

- Open [CloudShell](https://console.aws.amazon.com/cloudshell/home) at the region where you want to deploy
- Run deployment via following commands

```sh
git clone https://github.com/aws-samples/bedrock-claude-chat.git
cd bedrock-claude-chat
chmod +x bin.sh
./bin.sh
```

- After about 30 minutes, you will get the following output, which you can access from your browser

```
Frontend URL: https://xxxxxxxxx.cloudfront.net
```

![](https://d107sfil7rheid.cloudfront.net/signin.png)

The sign-up screen will appear as shown above, where you can register your email and log in.

> [!Important]
> For production use we strongly recommend adding IP address restrictions in order to mitigate security risks. Self-signup is disabled by default but it may be enabled, although this is discouraged.

## Architecture

It's an architecture built on AWS managed services, eliminating the need for infrastructure management. Utilizing Amazon Bedrock, there's no need to communicate with APIs outside of AWS. This enables deploying scalable, reliable, and secure applications.

- [Amazon DynamoDB](https://aws.amazon.com/dynamodb/): NoSQL database for conversation history storage
- [Amazon API Gateway](https://aws.amazon.com/api-gateway/) + [AWS Lambda](https://aws.amazon.com/lambda/): Backend API endpoint ([AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter), [FastAPI](https://fastapi.tiangolo.com/))
- [Amazon CloudFront](https://aws.amazon.com/cloudfront/) + [S3](https://aws.amazon.com/s3/): Frontend application delivery ([React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/))
- [AWS WAF](https://aws.amazon.com/waf/): IP address restriction
- [Amazon Cognito](https://aws.amazon.com/cognito/): User authentication
- [Amazon Bedrock](https://aws.amazon.com/bedrock/): Managed service to utilize foundational models via APIs. Claude is used for chat response and Cohere for vector embedding
- [Amazon EventBridge Pipes](https://aws.amazon.com/eventbridge/pipes/): Receiving event from DynamoDB stream and launching ECS task to embed external knowledge
- [Amazon Elastic Container Service](https://aws.amazon.com/ecs/): Run crawling, parsing and embedding tasks. [Cohere Multilingual](https://txt.cohere.com/multilingual/) is the model used for embedding.
- [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/): Scalable vector store with [pgvector](https://github.com/pgvector/pgvector) plugin
- [Amazon Athena](https://aws.amazon.com/athena/): Query service to analyze S3 bucket

![](https://d107sfil7rheid.cloudfront.net/chatbot/arch_202404.png)

## Others

### Configure default text generation

Users can adjust the [text generation parameters](https://docs.anthropic.com/claude/reference/complete_post) from the custom bot creation screen. If the bot is not used, the default parameters set in [config.py](./backend/app/config.py) will be used.

```py
DEFAULT_GENERATION_CONFIG = {
    "max_tokens": 2000,
    "top_k": 250,
    "top_p": 0.999,
    "temperature": 0.6,
    "stop_sequences": ["Human: ", "Assistant: "],
}
```

### Remove resources

Uncomment the `chatbot-DANGER-hard-delete-deployed-resources` workflow in [.codecatalyst/workflows`](./codecatalyst/workflows/chatbot-DANGER-hard-delete-deployed-resources.yaml) and then manually trigger the workflow. This will remove the stacks and all associated resources.

### Stopping Vector DB for RAG

By setting [cdk.json](./cdk.json) in the following CRON format, you can stop and restart Aurora Serverless resources created by the [VectorStore construct](./lib/constructs/vectorstore.ts). Applying this setting can reduce operating costs. By default, Aurora Serverless is always running. Note that it will be executed in UTC time.

```json
...
"rdbSchedules": {
  "stop": {
    "minute": "50",
    "hour": "10",
    "day": "*",
    "month": "*",
    "year": "*"
  },
  "start": {
    "minute": "40",
    "hour": "2",
    "day": "*",
    "month": "*",
    "year": "*"
  }
}
```

### Language Settings

This asset automatically detects the language using [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector). You can switch languages from the application menu. Alternatively, you can use Query String to set the language as shown below.

> `https://example.com?lng=ja`

### External Identity Provider

This application supports an external identity provider. Currently we support [Google](./docs/idp/SET_UP_GOOGLE.md) and [custom OIDC provider](./docs/idp/SET_UP_CUSTOM_OIDC.md).

### Add new users to groups automatically

This sample has the following groups to give permissions to users:

- [`Admin`](./docs/ADMINISTRATOR.md)
- [`CreatingBotAllowed`](#bot-personalization)
- [`PublishAllowed`](./docs/PUBLISH_API.md)

If you want newly created users to automatically join groups, you can specify them in [cdk.json](./cdk/cdk.json).

```json
"autoJoinUserGroups": ["CreatingBotAllowed"],
```

By default, newly created users will be joined to the `CreatingBotAllowed` group.

### Local Development

See [LOCAL DEVELOPMENT](./docs/LOCAL_DEVELOPMENT.md).

### Contribution

Thank you for considering contribution to this repository! We welcome bug fixes, language translation, feature enhancements, and other improvements. Please see following:

- [Local Development](./docs/LOCAL_DEVELOPMENT.md)
- [CONTRIBUTING](./CONTRIBUTING.md)

### RAG (Retrieval Augmented Generation)

See [here](./docs/RAG.md).

## Contacts

- [Takehiro Suzuki](https://github.com/statefb)
- [Yusuke Wada](https://github.com/wadabee)
- [Yukinobu Mine](https://github.com/Yukinobu-Mine)

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

***

When you create or update a project using a blueprint, CodeCatalyst may generate resources such as source repository, sample source code, CI/CD workflows, build and test reports, secrets, integrated issue tracking tools, etc. You should review the generated artifacts/project before deploying to a production or publicly accessible environment. You are responsible for all activities in your production and publicly accessible environments.
