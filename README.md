# CodeAwsProjectTemplate
This repository contains application, infrastructure, and test code for the Code.AWS Project Templating system:
* Frontend Performance Tests

This is NOT a Brazil package, and instead relies on vanilla tooling and native AWS pipelines.

## Code Organization
This repository contains both test code and infrastructure code deployed together.  Application code is largely written in Typescript utilizing Node.  Infrastructure code is written in Typescript utilizing CDK.

### A Note About NPM
DO NOT use `npm` to build or run this solution.  This solution requires `yarn` to build correctly as we are using [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) to share code between different projects.

To install yarn:
```
npm install -g yarn
```

### Code Layout

* */app*: Contains any applications that make up part of this stack.

* */stacks*: Contains infrastructure code as a CDK stack.  This is a self-mutating pipeline which means that the CDK stack not only contains infrastructure to run the applications, but infrastructure to build and deploy the applications.

## Getting Started
Ensure that you followed the setup outlined in the [Developer Onboarding Guide](https://w.amazon.com/bin/view/CAWS/ProjectsVertical/DeveloperOnboarding/).

## Building
### Building the Entire Stack
To build and test the entire stack (both application and infrastructure code) you can run the following command from the `~/` root directory:
```
yarn install
yarn build
```

This command will attempt to build all workspace packages include the CDK package.
