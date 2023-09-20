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

  log.info(`Starting publishing blueprint package to space '${blueprint.targetSpace}'`);
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

  const baseWaitSec = 5;
  const attempts = 5;
  const { spaceName, blueprintName, version, statusId } = publishBlueprintPackageResponse.data;
  const fetchStatusInput = {
    spaceName,
    id: statusId,
    version,
    blueprintName,
  };
  log.debug(`Fetching publish status for publishing job '${statusId}' for blueprint '${blueprintName}' version '${version}'`);

  for (let attempt = 0; attempt < attempts; attempt++) {
    log.info(`Getting status. Attempt: ${attempt}`);
    const fetchStatusResponse = await fetchstatus(log, {
      input: fetchStatusInput,
      http: {
        endpoint,
        headers: generateHeaders(blueprint.authentication, blueprint.identity),
      },
    });
    if (fetchStatusResponse.success) {
      log.info('Blueprint published successfully');
      return;
    } else if (fetchStatusResponse.status === 'IN_PROGRESS') {
      const curWait = baseWaitSec * 1000 + 1000 * attempt;
      log.debug(`[${attempt}/${attempts}] Waiting ${curWait / 1000} seconds...`);
      await sleep(curWait);
    } else {
      //break on failed or cancelled publishing jobs
      log.info(`Blueprint publish job status is '${fetchStatusResponse.status}' due to '${fetchStatusResponse.reason}'`);
      break;
    }
  }
  log.info('Blueprint has not published successfully');
}

interface FetchStatusResult {
  success: boolean;
  status: string;
  reason?: string;
}

async function fetchstatus(
  log: pino.BaseLogger,
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
): Promise<FetchStatusResult> {
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
  log.info(`Blueprint publish status ${response.data?.data?.getBlueprintVersionStatus?.status}`);
  if (response.data?.data?.getBlueprintVersionStatus?.status === 'SUCCEEDED') {
    return {
      success: true,
      status: response.data?.data?.getBlueprintVersionStatus?.status,
    };
  } else if (response.data?.data?.getBlueprintVersionStatus?.status === 'FAILED') {
    return {
      success: false,
      status: response.data?.data?.getBlueprintVersionStatus?.status,
      reason: response.data?.data?.getBlueprintVersionStatus?.reason ?? 'an internal error has occurred',
    };
  } else if (response.data?.data?.getBlueprintVersionStatus?.status === 'CANCELLED') {
    return {
      success: false,
      status: response.data?.data?.getBlueprintVersionStatus?.status,
      reason: response.data?.data?.getBlueprintVersionStatus?.reason ?? 'The publishing job has been cancelled',
    };
  }
  return {
    success: false,
    status: response.data?.data?.getBlueprintVersionStatus?.status ?? 'UNKNOWN',
  };
}

function sleep(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
