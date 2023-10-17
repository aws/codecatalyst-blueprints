import axios from 'axios';
import pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { IdentityResponse } from './verify-identity';

/**
 * returns true if the existing version of the blueprint exists
 */
export async function blueprintVersionExists(
  _log: pino.BaseLogger,
  endpoint: string,
  options: {
    blueprint: {
      space: string;
      version: string;
      package: string;
    };
    auth: {
      authentication: CodeCatalystAuthentication;
      identity: IdentityResponse;
    };
  },
): Promise<boolean> {
  const versionCheckHeaders = {
    'authority': endpoint,
    'origin': `https://${endpoint}`,
    'accept': 'application/json',
    'content-type': 'application/json',
    ...generateHeaders(options.auth.authentication, options.auth.identity),
  };

  try {
    await axios.post(
      `https://${endpoint}/graphql?`,
      {
        operationName: 'GetBlueprintVersion',
        variables: {
          input: {
            blueprintName: options.blueprint.package,
            spaceName: options.blueprint.space,
            version: options.blueprint.version,
          },
        },
        query:
          'query GetBlueprintVersion($input: GetBlueprintVersionInput!) {\n  getBlueprintVersion(input: $input) {\n    blueprintName\n    blueprintVersion\n  packageUri\n  }\n}',
      },
      {
        headers: versionCheckHeaders,
      },
    );
    return true;
  } catch (error: any) {
    console.log(error);
    // log.debug({ message: error.message }, 'Could not find blueprint');
    return false;
  }
}
