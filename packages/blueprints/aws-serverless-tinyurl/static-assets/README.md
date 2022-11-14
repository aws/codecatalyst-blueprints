# Application

This project is a single-page Tiny URL application. It is meant to be extensible after creation to meet your requirements.

## Architecture overview

The project uses [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk) for building the infrastructure-as-code and deploy them to a live AWS
environment.

### Backend

The backend is deployed as a RESTful API using AWS Serverless technologies:

- [AWS API Gateway](https://aws.amazon.com/api-gateway) to provide the REST interface to the user
- [Amazon DynamoDB](https://aws.amazon.com/dynamodb) for URL persistence
- [AWS Lambda](https://aws.amazon.com/lambda) provides the glue between the two.

### Frontend

The frontend uses [Amazon S3](https://aws.amazon.com/s3/) to store the web content and render it as an user interface through
[AWS API Gateway - AWS service integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-aws-proxy.html).

### Infrastructure

`cdk` maven module will set up the Application Stack and Canary Stack using [AWS CloudFromation](https://aws.amazon.com/cloudformation/).

Canary uses [Amazon CloudWatch Synthetics](https://docs.aws.amazon.com/AmazonSynthetics/latest/APIReference/Welcome.html) to test and continuosly
monitor the application's health.

### Code Pipeline

Project uses [maven](https://maven.apache.org/) for build and packaging the resources for production deployment. As part of the build, the workflow
will run the unit tests in the `lambda` maven module, and produces testing reports. Failed tests will stop the artifacts from publishing.

Workflow uses `CDKBootstrap` and `CDKDeploy` Actions to deploy the resources on AWS services.

## Local Development

Local development requires below pre-requisites.

- [JDK 11](https://docs.oracle.com/en/java/javase/18/install/overview-jdk-installation.html)
- [Apache Maven v3.8.6](https://maven.apache.org/install.html)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites)

To run the unit tests in the project

```
$ mvn test
```

To package the resources for deployment. Please note that unit tests will be executed as part of packaging

```
$ mvn package
```

To test the project by deploying into your AWS Account

```
$ cdk deploy
```

### Resources

The following resources have been generated and initial revisions can be modified

- `.codecatalyst/workflows/build-and-release.yaml`: The template that defines the project's workflow

- `cdk`: Java maven module for creating the Application and Canary Stacks.

- `lambda`: Java maven module for the Lambda function used by the Application to create tiny URL and retrieve long URL.

- `site-contents`: Static HTML for content serving

- `testscripts`: NodeJS source code for the canary test

- `pom.xml`: Maven configuration for dependency management, plugin management, build and packaging

- `cdk.json`: To execute the CDK code

## Additional resources

See the Amazon CodeCatalyst user guide for additional information on using the features and resources of Amazon CodeCatalyst
