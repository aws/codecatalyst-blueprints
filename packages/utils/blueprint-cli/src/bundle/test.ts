// import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import * as pino from 'pino';
import { exportBundle } from './export-bundle';
import { getCodeCatalystClient } from '../gql-clients/get-codecatalyst-client';
// import { ApolloClient, NormalizedCacheObject } from '@apollo/client';

const log = pino.default({
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
});

interface BundleSource {
  spaceName: string;
  projectName: string;
}

void (async () => {
  const endpoint = 'public.console.codecatalyst.aws';
  const target: BundleSource = {
    spaceName: 'blueprints',
    projectName: 'delete-me-1',
  };
  const outputBundle = 'local-bundle';

  const client = await getCodeCatalystClient(log, endpoint, {
    target,
  });
  if (!client) {
    return;
  }
  const exportResult = await exportBundle(log, client, {
    target,
    outputPath: outputBundle,
  });
  console.log(exportResult);

  // const absEndpoint = `${'https://'}${endpoint}`;
  // const authentication = await getCodeCatalystAuthentication(log, {
  //   endpoint: absEndpoint,
  // });
  // if (!authentication) {
  //   log.error('Could not find authentication method.');
  //   return;
  // }

  // const identityVerification = await verifyIdentity(endpoint, {
  //   authentication,
  // });

  // log.debug(`Authenticated as ${identityVerification.name} at ${identityVerification.email}`);

  // // console.log(authentication);
  // const GQLClient = createGQLClient(log, {
  //   endpoint: `${absEndpoint}/graphql`,
  //   authentication: authentication,
  // });

  // try {
  //   const project = await executeRequest<ApolloQueryResult<any>>(log, GQLClient.query({
  //     query: GetProjectQuery,
  //     variables: {
  //       input: {
  //         spaceName: target.spaceName,
  //         name: target.projectName,
  //       },
  //     },
  //   }), {
  //     description: 'GQL getProject',
  //     purpose: 'Verify access to the project',
  //   });
  //   log.info(`Successfully accessed space [${target.spaceName}], project [${project.data.getProject.displayName}].`);
  // } catch (e) {
  //   log.warn(e as any, 'Could not access project');
  //   log.error(`Could not verify access to project [${target.projectName}] in space [${target.spaceName}]. Project does not exist or you do not have access`);
  //   return;
  // }

  // const code = await getBundleSrc(log, GQLClient, { target });
  // const environments = await getBundleEnvironments(log, GQLClient, {
  //   target,
  // });
  // const awsAccountAssociations = await getBundleAWSAccountToEnvironment(log, GQLClient, {
  //   target,
  //   environmentNames: Object.keys(environments),
  // });
  // const secrets = await getBundleSecrets(log, GQLClient, {
  //   target,
  // });

  // const bundle = {};
  // bundle[ExportableResource.SRC] = code;
  // bundle[ExportableResource.ENVIRONMENTS] = environments;
  // bundle[ExportableResource.AWS_ACCOUNT_TO_ENVIRONMENT] = awsAccountAssociations;
  // bundle[ExportableResource.SECRETS] = secrets;

  // console.log(bundle);

  // const result = await getBundleEnvironments(log, GQLClient, {
  //   target,
  // });

  // ...await getBundleEnvironments(log, GQLClient, { target }),
  // ...await getBundleAWSAccountToEnvironment(log, GQLClient, { target }),
  // ...await getBundlePullRequests(log, GQLClient, { target }),
  // ...await getBundleIssues(log, GQLClient, { target }),
  // ...await getBundleInstantiations(log, GQLClient, { target }),

  // console.log(bundle);
})();

// function getBundleAWSAccountToEnvironment(logger: pino.Logger, GQLClient: ApolloClient<NormalizedCacheObject>, arg2: { target: BundleSource }) {
//   return {};
//   throw new Error('Function not implemented.');
// }

// function getBundlePullRequests(logger: pino.Logger, GQLClient: ApolloClient<NormalizedCacheObject>, arg2: { target: BundleSource }) {
//   return {};
//   throw new Error('Function not implemented.');
// }

// function getBundleIssues(logger: pino.Logger, GQLClient: ApolloClient<NormalizedCacheObject>, arg2: { target: BundleSource }) {
//   return {};
//   throw new Error('Function not implemented.');
// }

// function getBundleInstantiations(logger: pino.Logger, GQLClient: ApolloClient<NormalizedCacheObject>, arg2: { target: BundleSource }) {
//   return {};
//   throw new Error('Function not implemented.');
// }
