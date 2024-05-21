import { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client';
import * as pino from 'pino';
import { ExportTarget } from './prepare-bundle';
import { executeRequest } from '../gql-clients/execute-request';
import { GetSourceRepositoryCloneUrlQuery, ListSourceRepositoriesQuery } from '../gql-clients/gql/source-repository';

export interface RepositoryRepresentation {
  [repositoryName: string]: {
    clone: string;
  };
}

export async function getBundleSrc(
  logger: pino.BaseLogger,
  GQLClient: ApolloClient<NormalizedCacheObject>,
  options: {
    target: ExportTarget;
  },
): Promise<RepositoryRepresentation> {
  let sourceRepositories = await listSourceRepositories(logger, GQLClient, {
    ...options.target,
  });

  const result: RepositoryRepresentation = {};
  for (const repository of sourceRepositories) {
    const cloneUrl = await getSourceRepositoryUrl(logger, GQLClient, {
      ...options.target,
      repositoryName: repository.name,
    });
    result[repository.name] = cloneUrl;
    logger.debug(`Profiling Repository: [${repository.name}]`);
  }
  return result;
}

const listSourceRepositories = async (
  log: pino.BaseLogger,
  client: ApolloClient<NormalizedCacheObject>,
  options: {
    spaceName: string;
    projectName: string;
    nextToken?: string;
  },
): Promise<
{
  name: string;
}[]
> => {
  const listSourceRepositoryRequest = client.query({
    query: ListSourceRepositoriesQuery,
    variables: {
      input: {
        spaceName: options.spaceName,
        projectName: options.projectName,
        nextToken: options.nextToken,
      },
    },
  });
  const response = await executeRequest<ApolloQueryResult<any>>(log, listSourceRepositoryRequest, {
    description: 'GQL listSourceRepository',
    purpose: 'Find all source repositories in the space',
  });
  return response.data?.listSourceRepositoriesMigration?.items || [];
};

const getSourceRepositoryUrl = async (
  log: pino.BaseLogger,
  client: ApolloClient<NormalizedCacheObject>,
  options: {
    spaceName: string;
    projectName: string;
    repositoryName: string;
  },
) => {
  const getSourceRepositoryCloneUrl = client.query({
    query: GetSourceRepositoryCloneUrlQuery,
    variables: {
      input: {
        spaceName: options.spaceName,
        projectName: options.projectName,
        sourceRepositoryName: options.repositoryName,
      },
    },
  });

  const response = await executeRequest<ApolloQueryResult<any>>(log, getSourceRepositoryCloneUrl, {
    description: 'GQL getSourceRepository URL',
    purpose: `Find repository ${options.repositoryName} clone URL`,
  });

  return {
    clone: response.data?.getSourceRepositoryCloneUrls?.https || '',
  };
};
