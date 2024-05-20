import { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client';
import * as pino from 'pino';
import { ExportTarget } from './prepare-bundle';
import { executeRequest } from '../gql-clients/execute-request';
import { ListEnvironmentQuery } from '../gql-clients/gql/environment';

export interface EnvironmentRepresentation {
  [environmentName: string]: {
    name: string;
    description: string;
    environmentType: string;
  };
}

export async function getBundleEnvironments(
  logger: pino.BaseLogger,
  GQLClient: ApolloClient<NormalizedCacheObject>,
  options: {
    target: ExportTarget;
  },
): Promise<EnvironmentRepresentation> {
  const listRequest = GQLClient.query({
    query: ListEnvironmentQuery,
    variables: {
      input: {
        spaceName: options.target.spaceName,
        projectName: options.target.projectName,
      },
    },
  });

  const response = await executeRequest<ApolloQueryResult<any>>(logger, listRequest, {
    description: 'GQL ListEnvironmentQuery',
    purpose: 'Find environments',
  });

  const environments = (response.data?.listEnvironments?.items || []).map(ele => {
    return {
      name: ele.name,
      description: ele.description,
      environmentType: ele.environmentType,
    };
  });

  const result = {};
  for (const environment of environments) {
    logger.debug(`Profiling Environment: [${environment.name}]`);
    result[environment.name] = environment;
  }
  return result;
}
