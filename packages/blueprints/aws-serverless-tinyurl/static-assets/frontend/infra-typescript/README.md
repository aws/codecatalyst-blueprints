# Frontend Infrastructure

This project uses CDK development with TypeScript for developing the frontend infrastructure as code. The `cdk.json` file tells the CDK Toolkit how to
execute your app.

Canary setup uses [Amazon CloudWatch Synthetics](https://docs.aws.amazon.com/AmazonSynthetics/latest/APIReference/Welcome.html) to test and
continuously monitor the application's health.

## Local Development

Local development requires below pre-requisites.

- [NodeJS v14.x](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites)

## Useful commands

- `npm run build` To compile typescript to js
- `npm run watch` To watch for changes and compile
- `npm run test` To perform the jest unit tests
- `cdk synth` To emit the synthesized CloudFormation template
- `cdk diff` To compare deployed stack with current state
- `cdk bootstrap` To bootstrap the AWS Account
- `cdk deploy` To deploy this stack to your default AWS account/region

## Project resources

The project contains below modules / files

- `bin`: CDK App to synthesize the infrastructure

- `lib`: To define the Stack definitions for the frontend infrastructure

- `test`: To test the infrastructure code

- `jest.config.js`: For unit test discoverability and execution

- `package.json`: To maintain the dependencies

- `cdk.json`: To execute the CDK code

- `tsconfig.json`: Typescript compilation

## Additional resources

See the Amazon CodeCatalyst user guide for additional information on using the features and resources of Amazon CodeCatalyst
