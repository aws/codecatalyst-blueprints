# My First Lambda
​
This project contains source code and supporting files for a serverless CODE.AWS lambda application based on [SAM](https://aws.amazon.com/serverless/sam/). It includes the following files and folders.
​
- src - Code for the application's Lambda function.
- events - Invocation events that you can use to invoke the function.
- tests - Unit tests for the application code.
- template.yaml - A SAM Cloudformation template that defines the application's AWS resources.
- .aws - A directory containing CI/CD workflows to automatically build and deploy your application.
​
The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.
​
## Deploying your lambda
CODE.AWS workflows simplify deployment. In fact, we deployed a lambda as soon as the project was created. To see it, go to CI/CD/Workflows and choose the latest run of the Deploy action. Click on `config` in the pane that opens on the right and scroll down until you see a clickable URL. Click on it, to call your lambda from the browser via API Gateway.
​
​
## Manual deployment (optional)
CODE.AWS workflows will automatically redeploy your lambda every time you commit to your repo, so you generally shouldn't need to worry about manual commits. However, you can always trigger a manual redeployment of the latest commit by going to CI/CD/Workflows, selecting the build workflow and click the run button. The following sections describe how to deploy uncommitted code.
### Testing locally before committing
If you prefer to deploy code that hasn't been committed yet from you integrated development environment (IDE) to build and test your application, you can use the AWS Toolkit.
The AWS Toolkit is an open source plug-in for popular IDEs that uses the SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds a simplified step-through debugging experience for Lambda function code. See the following links to get started.
​
* [CLion](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [GoLand](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [WebStorm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [Rider](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [PhpStorm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [PyCharm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [RubyMine](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [DataGrip](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [Visual Studio](https://docs.aws.amazon.com/toolkit-for-visual-studio/latest/user-guide/welcome.html)
​
​
### Use the SAM CLI to build and test locally (optional)
​
Build your application with the `sam build --use-container` command.
​
```bash
sam-app$ sam build --use-container
```
​
The SAM CLI installs dependencies defined in `hello_world/requirements.txt`, creates a deployment package, and saves it in the `.aws-sam/build` folder.
​
Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.
​
Run functions locally and invoke them with the `sam local invoke` command.
​
```bash
sam-app$ sam local invoke HelloWorldFunction --event events/event.json
```
​
The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000.
​
```bash
sam-app$ sam local start-api
sam-app$ curl http://localhost:3000/
```
​
## Resources
​
See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.
​
Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)