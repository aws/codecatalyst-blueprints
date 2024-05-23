import { ApolloClient, NormalizedCacheObject, ApolloLink, from, HttpLink, InMemoryCache } from '@apollo/client/core';
import * as pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from '../publish/codecatalyst-authentication';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const fetch = require('cross-fetch');

export interface SpaceScopeTarget {
  name: string;
  id: string;
}

export interface ProjectScopeTarget {
  space: SpaceScopeTarget;
  project: {
    name: string;
    id: string;
  };
}

export const getGQLClient = (
  _logger: pino.BaseLogger,
  options: {
    endpoint: string;
    authentication: CodeCatalystAuthentication;
    headers?: { [key: string]: string };
  },
): ApolloClient<NormalizedCacheObject> => {
  const afterwareLink = new ApolloLink((operation, forward) => {
    return forward(operation).map(response => {
      // const context = operation.getContext();
      // const xRequestId = context.response.headers.get('x-amzn-requestid');
      // logger.debug({ xRequestId }, `Making GQL request: ${operation.operationName}`);
      return response;
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authMiddleware = new ApolloLink((operation: any, forward: any) => {
    operation.setContext(({}) => ({
      headers: {
        'Access-Token-Type': 'acsm',
        ...generateHeaders(options.authentication),
        ...options.headers,
      },
    }));
    return forward(operation);
  });

  const httpLink = new HttpLink({
    /**
     * Note: http link errors unless fetch is explicitly provided.
     * Since fetch doesn't exist in the default node runtime, we bring it in ourselves.
     * Depend on fetch@2 becuase we need to stay compatible with commonJS modules
     */
    fetch: fetch,
    uri: options.endpoint,
  });

  const client = new ApolloClient({
    link: from([authMiddleware, afterwareLink, httpLink]),
    cache: new InMemoryCache(),
  });
  return client;
};
