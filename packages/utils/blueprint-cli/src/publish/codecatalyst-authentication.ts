import * as path from 'path';
import { CodeCatalystClient, VerifySessionCommand } from '@aws-sdk/client-codecatalyst';
import * as axios from 'axios';
import * as pino from 'pino';
import { IdentityResponse } from './verify-identity';

export type AuthTokenType = 'cookie' | 'bearertoken' | 'workflowtoken';
export interface CodeCatalystAuthentication {
  type: AuthTokenType;
  token: string;
}

export function generateHeaders(authentication: CodeCatalystAuthentication, identity?: IdentityResponse): any {
  if (authentication.type == 'cookie') {
    const headers = {
      cookie: authentication.token,
    };
    if (identity?.csrfToken) {
      headers['anti-csrftoken-a2z'] = identity?.csrfToken;
    }
    return headers;
  } else {
    return {
      authorization: authentication.token,
    };
  }
}

export const codecatalystAuthentication = async (
  log: pino.BaseLogger,
  options: {
    cookie?: string;
    endpoint: string;
    region?: string;
  },
): Promise<CodeCatalystAuthentication | undefined> => {
  if (options.cookie) {
    return {
      type: 'cookie',
      token: options.cookie,
    };
  } else if (process.env.AWS_CONTAINER_TOKEN_ENDPOINT) {
    log.warn('Attempting to fetch credentials from the CodeCatalyst workflow action environment.');
    try {
      const response = await axios.default.get(process.env.AWS_CONTAINER_TOKEN_ENDPOINT);
      const credentials = response.data as { AccessKeyId: string; SecretAccessKey: string };
      return {
        type: 'workflowtoken',
        token: `Bearer ${credentials.AccessKeyId}:${credentials.SecretAccessKey}`,
      };
    } catch (e: any) {
      log.error(e);
      log.error('Unable to fetch credentials from the CodeCatalyst workflow action environment.');
    }
  } else {
    log.warn('Attempting to fetch credentials from AWS CLI profile.');
    try {
      const codecatalyst = new CodeCatalystClient({
        region: options.region,
        endpoint: path.join('https://', options.endpoint),
      });

      let bearertoken = '';
      codecatalyst.middlewareStack.add(
        (next, _context) => async args => {
          const result = await next(args);
          bearertoken = (args as any).request.headers.authorization;
          return result;
        },
        {
          step: 'finalizeRequest',
          name: 'log-request-tokens',
        },
      );
      await codecatalyst.send(new VerifySessionCommand({}));

      log.info('Successfully authenticated with codecatalyst CLI credentials');
      return {
        type: 'bearertoken',
        token: bearertoken,
      };
    } catch (e: any) {
      log.error(e);
      log.error('Unable to retrive credentials for Codecatalyst.');
      log.warn('Have you set up the AWS codecatalyst cli and logged into codecatalyst?');
      log.info('> ');
      log.info('> # https://docs.aws.amazon.com/codecatalyst/latest/userguide/set-up-cli.html');
      log.info('> ');
      log.info('> aws sso login --profile codecatalyst && export AWS_PROFILE=codecatalyst');
      log.info('> ');
    }
  }
  return undefined;
};
