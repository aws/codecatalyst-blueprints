# README.md

### This blueprint:

Generates a serverless application project that can be built and deployed using the SAM CLI. This blueprint will generate the source code for a set of lambda functions and configuration files for the project . It will generate the following files and folders: 

- src/lambdas - Contains subdirectories of code for the application's Lambda functions.
- src/lambdas/<functionName> - Files and folders for the application's Lambda functions. Each will be named after the lambda function it contains. ** may want to remove 

- src/lambdas/.aws/workflows/build.yaml - The workflow template of the project
- src/lambdas/template.yaml - A template that defines the application's AWS resources 
////////////////////////////////- Readme.md - Documentation on working within a serverless application project? *REmove readme not needed*

** include what is synthed by projen (i.e. .gitignore, .gitattributes, license?, requirements.txt/)

### Requires:

The runtime environment and dependency manager associated with it in order to build and deploy your blueprint using SAM locally

