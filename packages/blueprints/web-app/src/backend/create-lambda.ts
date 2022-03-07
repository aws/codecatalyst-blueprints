import { typescript, awscdk, DependencyType } from 'projen';

/**
 * @param project
 * @param functionName - name of the lambda function
 * @param callback - the body of the lambda function
 *
 * @returns
 */
export const createLambdaInfra = (
  project: typescript.TypeScriptAppProject,
  functionName: string
): awscdk.LambdaFunctionOptions => {

    const options: awscdk.LambdaFunctionOptions = {
    entrypoint: `${project.srcdir}/${functionName}.lambda.ts`,
    constructFile: `${project.srcdir}/${getConstructFileName(functionName)}.ts`,
    constructName: `${functionName}Function`,
    cdkDeps: new awscdk.AwsCdkDepsJs(project, {
      dependencyType: DependencyType.BUILD,
      cdkVersion: '1.95.0',
    }),
  };

  new awscdk.LambdaFunction(project, options);
  return options;
};

export function getConstructFileName(functionName: string) {
  return `${functionName}-function`;
}

export function defaultLambdaReturn(): any {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: 'hello world from <<lambda backend>>',
  };
};
