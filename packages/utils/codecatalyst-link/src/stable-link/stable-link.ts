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
