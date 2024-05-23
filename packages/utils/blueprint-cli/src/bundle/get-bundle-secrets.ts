import { ApolloClient, NormalizedCacheObject, ApolloQueryResult } from '@apollo/client';
import * as pino from 'pino';
import { ExportTarget } from './prepare-bundle';
import { executeRequest } from '../gql-clients/execute-request';
import { listSecretsQuery } from '../gql-clients/gql/secrets';

export interface SecretReference {
  [SecretName: string]: {
    /**
     * This is the value of the secret. We do not propagate the secret value
     */
    name: string;

    description?: string;
  };
}

export const getBundleSecrets = async (
  logger: pino.BaseLogger,
  client: ApolloClient<NormalizedCacheObject>,
  options: {
    target: ExportTarget;
  },
): Promise<SecretReference> => {
  const listSecretsRequest = client.query({
    query: listSecretsQuery,
    variables: {
      input: {
        spaceName: options.target.spaceName,
        projectName: options.target.projectName,
      },
    },
  });

  const response = await executeRequest<ApolloQueryResult<any>>(logger, listSecretsRequest, {
    description: 'GQL listSecrets',
    purpose: 'Find secrets',
  });

  const secrets = (response.data?.listSecrets?.items || []).map(ele => {
    return {
      name: ele.name,
      description: ele.description,
    };
  });

  const result = {};
  for (const secret of secrets) {
    logger.debug(`Profiling Secret: [${secret.name}]`);
    result[secret.name] = secret;
  }
  return result;
};
