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
  const publishHeaders = {
    'authority': endpoint,
    'origin': `https://${endpoint}`,
    'Content-Type': 'application/octet-stream',
    'Content-Length': fs.statSync(packagePath).size,
    ...generateHeaders(blueprint.authentication, blueprint.identity),
  };
  const publishBlueprintPackageResponse = await axios.default({
    method: 'PUT',
    url: `https://${endpoint}/v1/spaces/${querystring.escape(blueprint.targetSpace)}/blueprints/${querystring.escape(
      blueprint.packageName,
    )}/versions/${querystring.escape(blueprint.version)}/packages`,
    data: blueprintTarballStream,
    headers: publishHeaders,
  });
  console.log(publishBlueprintPackageResponse.data);

  log.info('Attempting to publish', {
    data: publishBlueprintPackageResponse.data,
  });

  const baseWaitSec = 3;
  const attempts = 10;
  const { spaceName, blueprintName, version, statusId } = publishBlueprintPackageResponse.data;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const status = await fetchstatus(log, {
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
    log.info(`[${attempt}/${attempts}] Status: ${status}`);
    if (status === 'SUCCEEDED') {
      log.info('Blueprint published successfully');
      return;
    } else {
      const curWait = baseWaitSec * 1000 + 1000 * attempt;
      log.info(`[${attempt}/${attempts}] Waiting ${curWait / 1000} seconds...`);
      await sleep(curWait);
    }
  }
  log.info(`Blueprint has not published successfully. Id: ${statusId}`);
}

async function fetchstatus(
  _log: pino.BaseLogger,
  options: {
    input: {
      spaceName: string;
      id: string;
      blueprintName: string;
      version: string;
    };
    http: {
      endpoint;
      headers: { [key: string]: string };
    };
  },
): Promise<string> {
  const input = {
    spaceName: options.input.spaceName,
    id: options.input.id,
    blueprintName: options.input.blueprintName,
    version: options.input.version,
  };
  const response = await axios.default.post(
    `https://${options.http.endpoint}/graphql?`,
    {
      query:
        'query GetBlueprintVersionStatus($input: GetBlueprintVersionStatusInput!) {\n  getBlueprintVersionStatus(input: $input) {\n    spaceName\n    id\n    blueprintName\n    version\n    status\n  }\n}',
      variables: {
        input,
      },
      operationName: 'GetBlueprintVersionStatus',
    },
    {
      headers: {
        'authority': options.http.endpoint,
        'origin': `https://${options.http.endpoint}`,
        'accept': 'application/json',
        'content-type': 'application/json',
        ...options.http.headers,
      },
    },
  );

  return response.data?.data?.getBlueprintVersionStatus?.status;
}

function sleep(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
