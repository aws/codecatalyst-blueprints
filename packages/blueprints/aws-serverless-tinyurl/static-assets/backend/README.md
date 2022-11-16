# Backend

The backend is deployed as a RESTful API using AWS Serverless technologies:

- [AWS API Gateway](https://aws.amazon.com/api-gateway) to provide the REST interface to the user
- [Amazon DynamoDB](https://aws.amazon.com/dynamodb) for URL persistence
- [AWS Lambda](https://aws.amazon.com/lambda) process the API gateway requests for create and retrieve the data from DynamoDB table

### Infrastructure

`cdk` maven module will set up the Application Stack.

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

To package the resources for deployment.

```
$ mvn package
```

To test the project by deploying into your AWS Account

```
$ cdk deploy
```

### Resources

The following resources have been generated as a initial revisions and it can be modified for your requirements

- `cdk`: Java maven module for creating the backend stack.

- `lambda`: Java maven module for the Lambda function used by the Application to create tiny URL and retrieve long URL.

- `pom.xml`: Maven configuration for dependency management, plugin management, build and packaging

- `cdk.json`: To execute the CDK code

## Additional resources

See the Amazon CodeCatalyst user guide for additional information on using the features and resources of Amazon CodeCatalyst
