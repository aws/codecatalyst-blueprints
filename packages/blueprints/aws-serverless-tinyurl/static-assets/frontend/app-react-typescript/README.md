# Frontend

This web app uses [ReactJS](https://reactjs.org/) in conjunction with the [Cloudscape](https://cloudscape.design/) component library. Please consult
the respective documentation as you extend the app.

`canary` directory contains the script to test the cloudfront website, please refer
[Amazon CloudWatch Synthetics](https://docs.aws.amazon.com/AmazonSynthetics/latest/APIReference/Welcome.html) for making any changes to the script.

## Local Development

Local development requires below pre-requisites.

- [NodeJS v14.x](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/)
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites)

In the project directory, you can run:

- `npm install` To pull the dependencies defined in the `package.json` of this project

- `npm start` To run the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will
  reload if you make edits. You will also see any lint errors in the console.

- `npm test` To run the test runner as defined in `jest.config.js`. See Jest documentation for options to configure the testing

- `npm run build` To build the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the
  best performance.

## Project resources

The project contains below modules / files

- `canary`: Canary test scripts

- `public`: HTML resources

- `src`: To define the React components and UI logic

- `jest.config.js`: For unit test discoverability and execution

- `package.json`: To maintain the dependencies

- `babel.config.js`: To convert .ts to .js files

- `tsconfig.json`: Typescript compilation

## Additional resources

See the Amazon CodeCatalyst user guide for additional information on using the features and resources of Amazon CodeCatalyst
