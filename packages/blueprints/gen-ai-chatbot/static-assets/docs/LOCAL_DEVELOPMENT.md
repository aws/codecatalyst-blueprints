# Local development

## Backend Development

See [backend/README](../backend/README.md).

## Frontend Development

In this sample, you can locally modify and launch the frontend using AWS resources (`API Gateway`, `Cognito`, etc.) that have been deployed with `cdk deploy`.

1. Copy the `frontend/.env.template` and save it as `frontend/.env.local`.
2. Fill in the contents of `.env.local` based on the output results of `cdk deploy` (such as `BedrockChatStack.AuthUserPoolClientIdXXXXX`).
   - Or check CodeCatalyst Workflow CDKDeployAction step and search the Logs tab.
3. Execute the following command:

```zsh
cd frontend && npm ci && npm run dev
```

### Using Streaming

Currently, the environment variable `VITE_APP_USE_STREAMING` is specified on the frontend side. It's recommended to set it to `false` when running the backend locally and `true` when operating on AWS.
When streaming is enabled, text is generated in real-time due to the streaming of content generation results.
