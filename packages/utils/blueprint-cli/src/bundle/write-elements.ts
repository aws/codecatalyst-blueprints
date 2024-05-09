import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as pino from 'pino';
import * as yaml from 'yaml';
import { ExportableResource } from './export-bundle';
import { AWSAccountToEnvironmentRepresentation } from './get-bundle-aws-account-to-environment';
import { EnvironmentRepresentation } from './get-bundle-environments';
import { SecretReference } from './get-bundle-secrets';
import { RepositoryRepresentation } from './get-bundle-src';

export async function writeElements(
  logger: pino.BaseLogger,
  folderPathAbs: string,
  options: {
    bundle: {
      code: RepositoryRepresentation;
      environments: EnvironmentRepresentation;
      awsAccountAssociations: AWSAccountToEnvironmentRepresentation;
      secrets: SecretReference;
    };
  },
): Promise<string> {
  // source code
  const repositories = Object.keys(options.bundle.code);
  if (repositories) {
    const sourceLocation = path.join(folderPathAbs, ExportableResource.SRC);
    fs.mkdirSync(sourceLocation);
    for (const repositoryName of repositories) {
      const cloneCommand = ['git', 'clone', options.bundle.code[repositoryName].clone].join(' ');
      logger.debug(`Running: ${cloneCommand}`);
      cp.execSync(cloneCommand, {
        stdio: 'inherit',
        cwd: sourceLocation,
      });
    }
  }

  // environments
  for (const [resourceName, resourceRepresentation] of Object.entries(options.bundle.environments)) {
    const location = path.join(folderPathAbs, ExportableResource.ENVIRONMENTS, `${stripName(resourceName)}.yaml`);
    writeYaml(logger, location, resourceRepresentation);
  }

  // awsAccountAssociations
  for (const [resourceName, resourceRepresentation] of Object.entries(options.bundle.awsAccountAssociations)) {
    const location = path.join(folderPathAbs, ExportableResource.AWS_ACCOUNT_TO_ENVIRONMENT, `${stripName(resourceName)}.yaml`);
    writeYaml(logger, location, resourceRepresentation);
  }

  // secrets
  for (const [resourceName, resourceRepresentation] of Object.entries(options.bundle.secrets)) {
    const location = path.join(folderPathAbs, ExportableResource.SECRETS, `${stripName(resourceName)}.yaml`);
    writeYaml(logger, location, resourceRepresentation);
  }

  return folderPathAbs;
}

function writeYaml(logger: pino.BaseLogger, filePathAbs: string, content: any) {
  logger.debug(`Writing: ${filePathAbs}`);
  const yamlcontent = yaml.stringify(content);
  console.log(yamlcontent);
  fs.mkdirSync(path.dirname(filePathAbs), { recursive: true });
  fs.writeFileSync(filePathAbs, yaml.stringify(content));
}

function stripName(name: string): string {
  return name;
}
