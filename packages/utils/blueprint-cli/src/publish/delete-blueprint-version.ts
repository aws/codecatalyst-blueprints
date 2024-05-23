import axios from 'axios';
import pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { IdentityResponse } from './verify-identity';

export async function deleteBlueprintVersion(
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
): Promise<void> {
  const deleteHeaders = {
    'authority': endpoint,
    'origin': `https://${endpoint}`,
    'accept': 'application/json',
    'content-type': 'application/json',
    ...generateHeaders(options.auth.authentication, options.auth.identity),
  };

  await axios.post(
    `https://${endpoint}/graphql?`,
    {
      operationName: 'DeleteBlueprintVersion',
      variables: {
        input: {
          blueprintName: options.blueprint.package,
          spaceName: options.blueprint.space,
          version: options.blueprint.version,
        },
      },
      query:
        'mutation DeleteBlueprintVersion($input: DeleteBlueprintVersionInput!) {\n  deleteBlueprintVersion(input: $input) {\n    spaceName\n    blueprintName\n    version\n  }\n}',
    },
    {
      headers: deleteHeaders,
    },
  );
}
