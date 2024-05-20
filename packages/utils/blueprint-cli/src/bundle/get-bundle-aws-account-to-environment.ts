import * as crypto from 'crypto';
import { ApolloClient, ApolloQueryResult, NormalizedCacheObject } from '@apollo/client';
import * as pino from 'pino';
import { ExportTarget } from './prepare-bundle';
import { executeRequest } from '../gql-clients/execute-request';
import { ListAwsAccountAssociationsQuery } from '../gql-clients/gql/aws-account-to-environment';

function hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

export interface AWSAccountToEnvironmentRepresentation {
  [mapping: string]: {
    environmentName: string;
    /**
     * This is a hash of an aws account in the origin space
     */
    awsAccount: string;
  };
}

export async function getBundleAWSAccountToEnvironment(
  logger: pino.BaseLogger,
  GQLClient: ApolloClient<NormalizedCacheObject>,
  options: {
    target: ExportTarget;
    environmentNames: string[];
  },
): Promise<AWSAccountToEnvironmentRepresentation> {
  const associations = {};
  for (const environmentName of options.environmentNames) {
    let accountConnections = await listAccountAssociations(logger, GQLClient, {
      ...options.target,
      environmentName,
    });
    for (const connection of accountConnections) {
      associations[`${connection.environmentName}-${connection.awsAccount}`] = connection;
    }
  }
  return associations;
}

const listAccountAssociations = async (
  logger: pino.BaseLogger,
  client: ApolloClient<NormalizedCacheObject>,
  options: {
    spaceName: string;
    projectName: string;
    environmentName: string;
    nextToken?: string;
  },
) => {
  const listAwsAccountAssociation = client.query({
    query: ListAwsAccountAssociationsQuery,
    variables: {
      input: {
        spaceName: options.spaceName,
        projectName: options.projectName,
        environmentName: options.environmentName,
        nextToken: options.nextToken,
      },
    },
  });

  const response = await executeRequest<ApolloQueryResult<any>>(logger, listAwsAccountAssociation, {
    description: 'GQL ListAwsAccountAssociationsQuery',
    purpose: 'Find all AwsAccountAssociations',
  });

  return (response.data?.listAwsAccountToEnvironmentAssociations?.items || []).map(ele => {
    logger.debug(`Profiling Aws Account Association: [${ele.awsAccount?.name}]`);
    return {
      environmentName: ele.environmentName,
      awsAccount: hash(ele.awsAccount?.name || ''),
    };
  });
};
