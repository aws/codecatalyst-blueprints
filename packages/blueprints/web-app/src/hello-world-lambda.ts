export function helloWorldLambdaCallback(): any {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: 'hello world from a lambda backend',
  };
};
