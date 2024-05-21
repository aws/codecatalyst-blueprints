import * as fs from 'fs';
import * as path from 'path';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import * as pino from 'pino';
import { getBundleAWSAccountToEnvironment } from './get-bundle-aws-account-to-environment';
import { getBundleEnvironments } from './get-bundle-environments';
import { getBundleSecrets } from './get-bundle-secrets';
import { getBundleSrc } from './get-bundle-src';
import { writeElements } from './write-elements';

export interface ExportTarget {
  spaceName: string;
  projectName: string;
}

export type ExportableResourceType = 'src' | 'aws-account-to-environment' | 'environments' | 'secrets' | 'instantiations' | 'issues';
/**
 * We do this due to a transcompilation issue with enums when executed by the MCE handler
 * note: tsconfig updates don't work. Investigation pending
 */
export const ExportableResource: { [key: string]: ExportableResourceType } = {
  SRC: 'src',
  AWS_ACCOUNT_TO_ENVIRONMENT: 'aws-account-to-environment',
  ENVIRONMENTS: 'environments',
  SECRETS: 'secrets',
  INSTANTIATIONS: 'instantiations',
  ISSUES: 'issues',
};

/**
 * EXPERIMENTAL. Exports an existing project as a bundle
 * @param logger
 * @param client
 * @param options
 * @returns
 */
export async function prepareBundle(
  logger: pino.BaseLogger,
  client: ApolloClient<NormalizedCacheObject>,
  options: {
    target: ExportTarget;
    outputPath: string;
  },
): Promise<{ folderPathAbs: string }> {
  const code = await getBundleSrc(logger, client, {
    target: options.target,
  });
  const environments = await getBundleEnvironments(logger, client, {
    target: options.target,
  });
  const awsAccountAssociations = await getBundleAWSAccountToEnvironment(logger, client, {
    target: options.target,
    environmentNames: Object.keys(environments),
  });
  const secrets = await getBundleSecrets(logger, client, {
    target: options.target,
  });

  const bundle = {
    code,
    environments,
    awsAccountAssociations,
    secrets,
  };
  console.log(bundle);

  const outputLocation = structureOutputLocation(logger, options.outputPath);
  const folderLocation = await writeElements(logger, outputLocation.folderPathAbs, {
    bundle,
  });

  return {
    folderPathAbs: folderLocation,
  };
}

function structureOutputLocation(
  _logger: pino.BaseLogger,
  outputPath: string,
): {
    folderPathAbs: string;
    tarPathAbs: string;
  } {
  const absOutputPath = path.resolve(outputPath);
  if (fs.existsSync(absOutputPath)) {
    fs.rmSync(absOutputPath, {
      recursive: true,
      force: true,
    });
  }
  const absTarPath = `${absOutputPath}.tgz`;
  if (fs.existsSync(absTarPath)) {
    fs.rmSync(absTarPath, {
      recursive: true,
      force: true,
    });
  }

  fs.mkdirSync(absOutputPath, { recursive: true });
  return {
    folderPathAbs: absOutputPath,
    tarPathAbs: absTarPath,
  };
}
