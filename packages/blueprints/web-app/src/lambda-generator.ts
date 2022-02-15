import { SourceCode, typescript, awscdk, DependencyType } from 'projen';

/**
 * @param project
 * @param functionName - name of the lambda function
 * @param callback - the body of the lambda function
 *
 * @returns
 */
export function createLambda(project: typescript.TypeScriptAppProject, functionName: string, callback: Function): awscdk.LambdaFunctionOptions {
  const cdkDeps: awscdk.AwsCdkDeps = new awscdk.AwsCdkDepsJs(project, {
    dependencyType: DependencyType.BUILD,
    cdkVersion: '1.95.0',
  });

  const options: awscdk.LambdaFunctionOptions = {
    entrypoint: `${project.srcdir}/${functionName}.lambda.ts`,
    constructFile: `${project.srcdir}/${getConstructFileName(functionName)}.ts`,
    constructName: `${functionName}Function`,
    cdkDeps,
  };

  const sourceCode = new SourceCode(project, options.entrypoint);
  sourceCode.open('exports.handler = async (event: any, context: any) => {');
  sourceCode.line(`return (${callback.toString()})()`);
  sourceCode.close('};');

  new awscdk.LambdaFunction(project, options);
  return options;
};

export function getConstructFileName(functionName: string) {
  return `${functionName}-function`;
}
