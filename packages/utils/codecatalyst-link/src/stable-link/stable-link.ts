import * as querystring from 'querystring';

export function stableLink(params?: {
  /**
   * @example integ.stage.quokka.codes
   * @default codecatalyst.aws
   */
  endpoint?: string;
  query?: {
    /**
     * blueprint package name
     */
    blueprintPackage?: string;
    /**
     * UUID of the blueprint publishing organization. If not provided it will attempt to search for a public blueprint with that package name instead.
     */
    publisher?: string;
    /**
     * blueprint version
     */
    version?: string;
    /**
     * blueprint options
     */
    options?: any;
  };
}) {
  const endpoint = params?.endpoint || 'codecatalyst.aws';
  const url = ['https://', [endpoint, 'launch'].join('/')].join('');
  console.log(url);
  const queryParameters = [
    makeQueryParam('blueprintName', params?.query?.blueprintPackage),
    makeQueryParam('publisher', params?.query?.publisher),
    makeQueryParam('version', params?.query?.version || 'latest'),
    makeQueryParam('options', params?.query?.options && JSON.stringify(params?.query?.options)),
  ]
    .filter(ele => !!ele)
    .join('&');
  return [url, queryParameters].join('?');
}

function makeQueryParam(key: string, value?: string): string | undefined {
  if (value) {
    return `${querystring.escape(key)}=${querystring.escape(value)}`;
  }
  return undefined;
}

// https://integ.stage.quokka.codes/launch?blueprintName=serverlessimageoss&publisher=1b965559-c56d-4542-88d1-7933e467b0b0&version=0.1.92&options=%7B%22code%22%3A%7B%22sourceCodeRepo%22%3A%22test%22%7D%7D
// https://codecatalyst.aws/launch?blueprintName=serverlessimageoss&publisher=1b965559-c56d-4542-88d1-7933e467b0b0&version=0.1.92&options=%7B%22code%22%3A%7B%22sourceCodeRepo%22%3A%22test%22%7D%7D

(() => {
  const link = stableLink({
    endpoint: 'integ.stage.quokka.codes',
    query: {
      blueprintPackage: 'serverlessimageoss',
    },
  });
  console.log(link);
})();
