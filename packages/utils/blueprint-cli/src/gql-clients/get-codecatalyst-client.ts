import { ApolloClient, NormalizedCacheObject, ApolloQueryResult } from '@apollo/client';
import pino from 'pino';
import { getCodeCatalystAuthentication } from './authentication/get-codecatalyst-authentication';
import { executeRequest } from './execute-request';
import { getGQLClient } from './get-gql-client';
import { GetProjectQuery } from './gql/project';
import { verifyIdentity } from '../publish/verify-identity';

export async function getCodeCatalystClient(
  logger: pino.BaseLogger,
  endpoint: string,
  options: {
    target?: {
      spaceName: string;
      projectName: string;
    };
  },
): Promise<ApolloClient<NormalizedCacheObject> | undefined> {
  const absEndpoint = `${'https://'}${endpoint}`;
  const authentication = await getCodeCatalystAuthentication(logger, {
    endpoint: absEndpoint,
  });
  if (!authentication) {
    logger.error('Could not find authentication method.');
    return undefined;
  }

  const identityVerification = await verifyIdentity(endpoint, {
    authentication,
  });

  logger.debug(`Authenticated as ${identityVerification.name} at ${identityVerification.email}`);

  // console.log(authentication);
  const GQLClient = getGQLClient(logger, {
    endpoint: `${absEndpoint}/graphql`,
    authentication: authentication,
  });

  if (!options.target) {
    return GQLClient;
  }

  try {
    const project = await executeRequest<ApolloQueryResult<any>>(
      logger,
      GQLClient.query({
        query: GetProjectQuery,
        variables: {
          input: {
            spaceName: options.target.spaceName,
            name: options.target.projectName,
          },
        },
      }),
      {
        description: 'GQL getProject',
        purpose: 'Verify access to the project',
      },
    );
    logger.info(`Successfully accessed space [${options.target.spaceName}], project [${project.data.getProject.displayName}].`);
    return GQLClient;
  } catch (e) {
    logger.warn(e as any, 'Could not access project');
    logger.error(
      `Could not verify access to project [${options.target.projectName}] in space [${options.target.spaceName}]. Project does not exist or you do not have access`,
    );
    return undefined;
  }
}
