# Bedrock Claude Chat

This blueprint generates a sample chatbot using the Anthropic company's LLM [Claude](https://www.anthropic.com/), one of the foundational models provided by [Amazon Bedrock](https://aws.amazon.com/bedrock/) for generative AI.

### Basic Conversation

![](./docs/imgs/demo.gif)

### Bot Personalization

Add your own instruction and give external knowledge as URL or files (a.k.a [RAG](./docs/RAG.md)). The bot can be shared among application users. The customized bot also can be published as stand-alone API (See the [detail](./docs/PUBLISH_API.md)).

![](./docs/imgs/bot_creation.png)
![](./docs/imgs/bot_chat.png)
![](./docs/imgs/bot_api_publish_screenshot3.png)

### Administrator dashboard

Analyze usage for each user / bot on administrator dashboard. [detail](./docs/ADMINISTRATOR.md)

![](./docs/imgs/admin_bot_analytics.png)

## 📚 Supported Languages

- English 💬
- 日本語 💬 (ドキュメントは[こちら](./docs/README_ja.md))
- 한국어 💬
- 中文 💬

## 🚀 Super-easy Deployment

- In the {{bedrockRegion}} region, open [Bedrock Model access](https://{{bedrockRegion}}.console.aws.amazon.com/bedrock/home?region={{bedrockRegion}}#/modelaccess) > `Manage model access` > Check `Anthropic / Claude 3 Haiku`, `Anthropic / Claude 3 Sonnet` and `Cohere / Embed Multilingual` then `Save changes`.

<details>
<summary>Screenshot</summary>

![](./docs/imgs/model_screenshot.png)

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

![](./docs/imgs/signin.png)

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

![](./docs/imgs/arch.png)

## Features and Roadmap

<details>
<summary>Basic chat features</summary>

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
- [x] Model switch
</details>

<details>
<summary>Customized bot features</summary>

- [x] Customized bot creation
- [x] Customized bot sharing
- [x] Publish as stand-alone API
</details>

<details>
<summary>RAG features</summary>

- [x] Web (html)
- [x] Text data (txt, csv, markdown and etc)
- [x] PDF
- [x] Microsoft office files (pptx, docx, xlsx)
- [x] Youtube transcript
- [ ] Import from S3 bucket
- [ ] Import external existing Kendra / OpenSearch / KnowledgeBase
</details>

<details>
<summary>Admin features</summary>

- [x] Tracking usage fees per bot
- [x] List all published bot
</details>

## Others

### Configure text generation / embedding parameters

Edit [config.py](./backend/app/config.py) and run `cdk deploy`.

```py
# See: https://docs.anthropic.com/claude/reference/complete_post
GENERATION_CONFIG = {
    "max_tokens": 2000,
    "top_k": 250,
    "top_p": 0.999,
    "temperature": 0.6,
    "stop_sequences": ["Human: ", "Assistant: "],
}

EMBEDDING_CONFIG = {
    "model_id": "cohere.embed-multilingual-v3",
    "chunk_size": 1000,
    "chunk_overlap": 200,
}
```

### Remove resources

Uncomment the `chatbot-DANGER-hard-delete-deployed-resources` workflow in [.codecatalyst/workflows`](./codecatalyst/workflows/chatbot-DANGER-hard-delete-deployed-resources.yaml) and then manually trigger the workflow. This will remove the stacks and all associated resources.

### Language Settings

This asset automatically detects the language using [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector). You can switch languages from the application menu. Alternatively, you can use Query String to set the language as shown below.

> `https://example.com?lng=ja`

### Local Development

See [LOCAL DEVELOPMENT](./docs/LOCAL_DEVELOPMENT.md).

### Contribution

Thank you for considering contribution to this repository! We welcome bug fixes, language translation, feature enhancements, and other improvements. Please see following:

- [Local Development](./docs/LOCAL_DEVELOPMENT.md)
- [CONTRIBUTING](./CONTRIBUTING.md)

### RAG (Retrieval Augmented Generation)

See [here](./docs/RAG.md).

## Authors

- [Takehiro Suzuki](https://github.com/statefb)
- [Yusuke Wada](https://github.com/wadabee)

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

***

When you create or update a project using a blueprint, CodeCatalyst may generate resources such as source repository, sample source code, CI/CD workflows, build and test reports, secrets, integrated issue tracking tools, etc. You should review the generated artifacts/project before deploying to a production or publicly accessible environment. You are responsible for all activities in your production and publicly accessible environments.
