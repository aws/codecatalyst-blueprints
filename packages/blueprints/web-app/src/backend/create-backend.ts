import { SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { awscdk } from 'projen';
import { PROJEN_VERSION } from '..';
import { createProjenProject } from '../projen-class/create-projen-project';
import { createLambdaInfra, defaultLambdaReturn } from './create-lambda';
import { createReadme } from './create-readme';
import { getStackDefinition, getStackTestDefintion } from './create-stack';

export const createBackend = (
  options: {
    repository: SourceRepository;
    folder: string;
    frontendfolder: string;
    stackNameBase: string;
    backendStackName: string;
    frontendStackName: string;
    s3BucketName: string;
    lambdas: string[];
  },
  projectOptions: awscdk.AwsCdkTypeScriptAppOptions,
): awscdk.AwsCdkTypeScriptApp => {
  const rcvariable = 'backend';
  const { repository, folder, frontendfolder, stackNameBase, backendStackName, frontendStackName, s3BucketName, lambdas } = options;
  const { project, projenrc } = createProjenProject(repository, awscdk.AwsCdkTypeScriptApp, {
    subfolder: folder,
    rcvariable: rcvariable,
    projenVersion: PROJEN_VERSION,
    import: 'awscdk',
    instantiatedClass: 'awscdk.AwsCdkTypeScriptApp',
    projectOptions,
  });

  // add autodeploy task
  const autoDeployTaskName = 'autodeploy';
  const autoDeployTask = {
    exec: 'cdk watch',
    description: 'Builds, and autodeploys the project for easy development',
  };
  projenrc.addPostInstantiation({
    line: '// after a deploy to the backend stack, copy the output to the frontend so it knowsthe backend url.',
  });
  projenrc.addPostInstantiation({
    line: `${rcvariable}.addTask("${autoDeployTaskName}", ${JSON.stringify(autoDeployTask, null, 2)});`,
  });
  project.addTask(autoDeployTaskName, autoDeployTask);

  // add copy-config task
  const copyConfigTaskName = 'deploy:copy-config';
  const copyConfigTask = `cdk deploy ${backendStackName} --outputs-file ../${frontendfolder}/src/config.json --require-approval never`;

  project.setScript(copyConfigTaskName, copyConfigTask);
  projenrc.addPostInstantiation({
    line: `${rcvariable}.setScript("${copyConfigTaskName}", "${copyConfigTask}");`,
  });

  const lambdaOptions = (lambdas || []).map(lambdaName => {
    new SourceFile(
      repository,
      `${folder}/src/${lambdaName}.lambda.ts`,
      [
        'exports.handler = async (event: any, context: any) => {',
        `  return (${defaultLambdaReturn.toString().replace('<<lambda backend>>', lambdaName)})();`,
        '};',
      ].join('\n'),
    );
    return createLambdaInfra(project, lambdaName);
  });

  // stack definition
  new SourceFile(
    repository,
    `${folder}/src/main.ts`,
    getStackDefinition({
      stackNameBase: stackNameBase,
      backendStackName: backendStackName,
      frontendStackName: frontendStackName,
      bucketName: s3BucketName,
      frontEndFolder: frontendfolder,
      lambdaOptions,
    }),
  );
  // stack test definition
  new SourceFile(repository, `${folder}/src/main.test.ts`, getStackTestDefintion(project.appEntrypoint, backendStackName, frontendStackName));

  new SourceFile(repository, `${folder}/README.md`, createReadme());
  return project;
};
