import { SourceCode, TypeScriptAppProject, awscdk } from 'projen';

/**
 * @param project
 * @param functionName - name of the lambda function
 * @param callback - the body of the lambda function
 *
 * @returns
 */
export function createLambda(project: TypeScriptAppProject, functionName: string, callback: Function): awscdk.LambdaFunctionOptions {
  const options: awscdk.LambdaFunctionOptions = {
    entrypoint: `${project.srcdir}/${functionName}.lambda.ts`,
    constructFile: `${project.srcdir}/${getConstructFileName(functionName)}.ts`,
    constructName: `${functionName}Function`,
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
