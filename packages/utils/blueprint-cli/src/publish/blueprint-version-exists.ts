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
      identity: IdentityResponse | undefined;
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
    const result = await axios.post(
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
    if (result.data.data.getBlueprintVersion) {
      // the version exists
      return true;
    } else {
      console.log(result.data.data);
      return false;
    }
  } catch (error: any) {
    throw new Error(`Could not look up ['${options.blueprint.package}'] ['${options.blueprint.version}'] in ['${options.blueprint.version}']`);
  }
}
