import * as crypto from 'crypto';
import * as fs from 'fs';
import * as querystring from 'querystring';
import * as stream from 'stream';
import * as util from 'util';
import * as axios from 'axios';
import * as pino from 'pino';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { IdentityResponse } from './verify-identity';

export async function uploadBlueprint(
  log: pino.BaseLogger,
  packagePath: string,
  endpoint: string,
  blueprint: {
    publishingSpace: string;
    targetSpace: string;
    packageName: string;
    version: string;
    authentication: CodeCatalystAuthentication;
    identity: IdentityResponse;
  },
) {
  // get the signature of the package
  const pipeline = util.promisify(stream.pipeline);
  const hash = crypto.createHash('sha384').setEncoding('hex');
  await pipeline(fs.createReadStream(packagePath), hash);
  const packageSignature = hash.read();

  log.info(`Signature: [${packageSignature}]`);
  if (!packageSignature) {
    log.error('Unable to compute package signature');
    process.exit(254);
  }

  log.info(`Starting publishing blueprint package to ${blueprint.targetSpace}.`);
  log.info(`Generating a readstream to ${packagePath}`);

  const blueprintTarballStream = fs.createReadStream(packagePath);
  const publishBlueprintPackageResponse = await axios.default({
    method: 'PUT',
    url: `https://${endpoint}/v1/spaces/${querystring.escape(blueprint.targetSpace)}/blueprints/${querystring.escape(blueprint.packageName)}/versions/${querystring.escape(blueprint.version)}/packages`,
    data: blueprintTarballStream,
    headers: {
      'authority': endpoint,
      'origin': `https://${endpoint}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fs.statSync(packagePath).size,
      ...generateHeaders(blueprint.authentication, blueprint.identity),
    },
  });
  console.log(publishBlueprintPackageResponse.data);

  log.info('Attempting to publish', {
    data: publishBlueprintPackageResponse.data,
  });

  const baseWaitSec = 2;
  const attempts = 5;
  const { spaceName, blueprintName, version, statusId } = publishBlueprintPackageResponse.data;

  for (let attempt = 0; attempt < attempts; attempt++) {
    log.info(`Getting status. Attempt: ${attempt}`);
    const success = await fetchstatus(log, {
      input: {
        spaceName,
        id: statusId,
        version,
        blueprintName,
      },
      http: {
        endpoint,
        headers: generateHeaders(blueprint.authentication, blueprint.identity),
      },
    });
    if (success) {
      log.info('Blueprint published successfully');
      return;
    } else {
      const curWait = baseWaitSec * 1000 + 1000 * attempt;
      log.debug(`[${attempt}/${attempts}] Waiting ${curWait/1000} seconds...`);
      await sleep(curWait);
    }
  }
  log.info('Blueprint has not published successfully');
}

async function fetchstatus(log: pino.BaseLogger, options: {
  input: {
    spaceName: string;
    id: string;
    blueprintName: string;
    version: string;
  };
  http: {
    endpoint;
    headers: {[key: string]: string};
  };
}): Promise<boolean> {
  const publishngStatus = await axios.default.post(`https://${options.http.endpoint}/graphql?`, {
    operationName: 'GetBlueprintVersionStatus',
    query: 'query GetBlueprintVersionStatus($input: GetBlueprintVersionStatusInput!) {\n  getBlueprintVersionStatus(input: $input) {\n    spaceName\n    blueprintName\n    version\n    status\n    reason\n    lastUpdatedTime\n  }\n}\n',
    variables: {
      input: {
        spaceName: options.input.spaceName,
        id: options.input.id,
        blueprintName: options.input.blueprintName,
        version: options.input.version,
      },
    },
    headers: {
      'authority': options.http.endpoint,
      'origin': `https://${options.http.endpoint}`,
      'accept': 'application/json',
      'content-type': 'application/json',
      ...options.http.headers,
    },
  });
  log.info(publishngStatus.data);
  return false;
}


function sleep(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}