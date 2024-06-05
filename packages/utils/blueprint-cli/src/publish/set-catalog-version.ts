import axios from 'axios';
import pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { IdentityResponse } from './verify-identity';

/**
 * Sets this blueprint version as the catalog version
 */
export async function setCatalogVersion(
  log: pino.BaseLogger,
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
  const authHeaders = {
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
        operationName: 'UpdateBlueprintCatalogVersion',
        variables: {
          input: {
            spaceName: options.blueprint.space,
            name: options.blueprint.package,
            catalogVersion: options.blueprint.version,
          },
        },
        query:
          'mutation UpdateBlueprintCatalogVersion($input: UpdateBlueprintCatalogVersionInput!) {\n  updateBlueprintCatalogVersion(input: $input) {\n    spaceName\n    name\n    displayName\n    description\n    latestVersion {\n      blueprintVersionId\n      version\n    }\n    catalogVersion {\n      blueprintVersionId\n      version\n    }\n    lastUpdatedTime\n  }\n}',
      },
      {
        headers: authHeaders,
      },
    );
    if (result.data.data.updateBlueprintCatalogVersion) {
      // the version exists
      log.warn(`Success: [${options.blueprint.package}] [${options.blueprint.version}] is available in space [${options.blueprint.space}] catalog.`);
    }
  } catch (error: any) {
    log.error(error);
    throw new Error(
      `Could not set catalog version ['${options.blueprint.package}'] ['${options.blueprint.version}'] in ['${options.blueprint.version}']`,
    );
  }
}
