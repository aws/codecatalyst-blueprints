import * as fs from 'fs';
import * as querystring from 'querystring';
import * as axios from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';
import * as pino from 'pino';
import { blueprintVersionExists } from './blueprint-version-exists';
import { CodeCatalystAuthentication, generateHeaders } from './codecatalyst-authentication';
import { deleteBlueprintVersion } from './delete-blueprint-version';
import { IdentityResponse } from './verify-identity';

export async function uploadBlueprint(
  log: pino.BaseLogger,
  packagePath: string,
  endpoint: string,
  options: {
    force?: boolean;
    blueprint: {
      publishingSpace: string;
      targetSpace: string;
      targetProject?: string;
      targetInstance?: string;
      packageName: string;
      version: string;
      authentication: CodeCatalystAuthentication;
      identity: IdentityResponse | undefined;
    };
  },
) {
  const { blueprint } = options;
  const auth = {
    authentication: blueprint.authentication,
    identity: blueprint.identity,
  };
  const target = {
    package: blueprint.packageName,
    space: blueprint.targetSpace,
    version: blueprint.version,
  };
  log.info(`Starting publishing blueprint package to ['${blueprint.packageName}'] ['${blueprint.version}'] to ['${blueprint.targetSpace}'].`);
  if (
    await blueprintVersionExists(log, endpoint, {
      blueprint: target,
      auth,
    })
  ) {
    log.warn(
      `Blueprint version ['${blueprint.packageName}'] ['${blueprint.version}'] EXISTS in ['${blueprint.targetSpace}']. Run with --force to override`,
    );
    if (options.force) {
      log.warn(`[FORCE] running in force mode. Deleting ['${blueprint.packageName}'] ['${blueprint.version}'] in ['${blueprint.targetSpace}'].`);
      await deleteBlueprintVersion(log, endpoint, {
        blueprint: target,
        auth,
      });
      log.warn(`[FORCE] Deletion ['${blueprint.packageName}'] ['${blueprint.version}'] in ['${blueprint.targetSpace}'] successful.`);
    } else {
      throw `Blueprint ['${blueprint.packageName}'] ['${blueprint.version}'] already exists in ['${blueprint.targetSpace}']. Change the package version or run with --force to override.`;
    }
  }

  log.info(`Generating a readstream to ${packagePath}`);
  const blueprintTarballStream = fs.createReadStream(packagePath);
  const publishHeaders = {
    'authority': endpoint,
    'origin': `https://${endpoint}`,
    'Content-Type': 'application/octet-stream',
    'Content-Length': fs.statSync(packagePath).size,
    ...generateHeaders(blueprint.authentication, blueprint.identity),
  };

  const url = `https://${endpoint}/v1/spaces/${querystring.escape(blueprint.targetSpace)}/blueprints/${querystring.escape(
    blueprint.packageName,
  )}/versions/${querystring.escape(blueprint.version)}/packages`;

  const maxRetries = 2;
  const publishAxios = axios.default.create();
  axiosRetry(publishAxios, {
    retries: maxRetries,
    shouldResetTimeout: true,
    retryDelay: exponentialDelay,
    retryCondition: error => {
      switch (error.response?.status) {
        case 500:
          return true;
        default:
          return false;
      }
    },
    onRetry: (retryCount, error) => {
      console.log(`publishing attempt ${retryCount}/${maxRetries + 1} failed: ${error.message}...`);
      console.log('retrying...');
    },
    onMaxRetryTimesExceeded: error => {
      console.log(`publishing attempt ${maxRetries}/${maxRetries + 1} failed: ${error.message}...`);
      console.log('all publishing attempts have failed');
    },
  });

  const publishBlueprintPackageResponse = await publishAxios({
    method: 'PUT',
    url,
    data: blueprintTarballStream,
    headers: publishHeaders,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  console.log({
    requestId: publishBlueprintPackageResponse.headers['x-amzn-requestid'],
    ...publishBlueprintPackageResponse.data,
    url,
    servedFrom: publishBlueprintPackageResponse.headers['x-amzn-served-from'],
  });

  log.info('Attempting to publish', {
    data: publishBlueprintPackageResponse.data,
  });

  const baseWaitSec = 5;
  const attempts = 100;
  const { spaceName, blueprintName, version, statusId } = publishBlueprintPackageResponse.data;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const fetchStatusResponse = await fetchstatus(log, {
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
    log.info(`[${attempt}/${attempts}] Status: ${fetchStatusResponse.status}`);
    if (fetchStatusResponse.status === 'SUCCEEDED') {
      log.info('Blueprint published successfully');
      const previewOptions = {
        blueprintPackage: blueprint.packageName,
        version: blueprint.version,
        publishingSpace: blueprint.publishingSpace,
        targetSpace: blueprint.targetSpace,
        targetProject: blueprint.targetProject,
        targetInstance: blueprint.targetInstance,
        http: {
          endpoint: endpoint,
          headers: generateHeaders(blueprint.authentication, blueprint.identity),
        },
      };
      log.info(`Enable version ${version} at: ${resolveStageUrl(endpoint)}/spaces/${blueprint.targetSpace}/blueprints`);
      const previewlink = await generatePreviewLink(log, previewOptions);
      if (previewOptions.targetProject) {
        log.info(`Blueprint applied to [${previewOptions.targetProject}]: ${previewlink}`);
      } else {
        log.info(`Blueprint applied to [NEW]: ${previewlink}`);
      }
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
  log.info(`Blueprint has not published successfully. Id: ${statusId}`);
}

interface FetchStatusResult {
  success: boolean;
  status: string;
  reason?: string;
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

  const responseStatus = response.data?.data?.getBlueprintVersionStatus;
  if (responseStatus.status === 'SUCCEEDED') {
    return {
      success: true,
      status: responseStatus.status,
    };
  } else if (responseStatus.status === 'FAILED') {
    return {
      success: false,
      status: responseStatus.status,
      reason: responseStatus.reason ?? 'an internal error has occurred',
    };
  } else if (responseStatus.status === 'CANCELLED') {
    return {
      success: false,
      status: responseStatus.status,
      reason: responseStatus.reason ?? 'The publishing job has been cancelled',
    };
  }
  return {
    success: false,
    status: responseStatus.status ?? 'UNKNOWN',
  };
}

function sleep(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function generatePreviewLink(
  _logger: pino.BaseLogger,
  options: {
    blueprintPackage: string;
    version: string;
    publishingSpace: string;
    targetSpace: string;
    targetProject?: string;
    targetInstance?: string;
    http: {
      endpoint;
      headers: { [key: string]: string };
    };
  },
): Promise<string> {
  const publishingSpaceIdResponse = await axios.default.post(
    `https://${options.http.endpoint}/graphql?`,
    {
      operationName: 'GetSpace',
      variables: {
        input: {
          name: options.publishingSpace,
        },
      },
      query: 'query GetSpace($input: GetSpaceInput!) {\n  getSpace(input: $input) {\n    id\n    name\n }\n}\n',
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

  if (options.targetProject && options.targetInstance) {
    /**
     * generate a url to preview against an existing instance
     */
    return [
      resolveStageUrl(options.http.endpoint),
      'spaces',
      querystring.escape(options.targetSpace),
      'projects',
      querystring.escape(options.targetProject),
      'blueprints',
      querystring.escape(options.blueprintPackage),
      'publishers',
      querystring.escape(publishingSpaceIdResponse.data?.data?.getSpace?.id),
      'versions',
      querystring.escape(options.version),
      `edit?instantiationId=${options.targetInstance}`,
    ].join('/');
  } else if (options.targetProject) {
    /**
     * generate a url to add project
     */
    return [
      resolveStageUrl(options.http.endpoint),
      'spaces',
      querystring.escape(options.targetSpace),
      'projects',
      querystring.escape(options.targetProject),
      'blueprints',
      querystring.escape(options.blueprintPackage),
      'publishers',
      querystring.escape(publishingSpaceIdResponse.data?.data?.getSpace?.id),
      'versions',
      querystring.escape(options.version),
      'add',
    ].join('/');
  }

  return [
    resolveStageUrl(options.http.endpoint),
    'spaces',
    querystring.escape(options.targetSpace),
    'blueprints',
    querystring.escape(options.blueprintPackage),
    'publishers',
    querystring.escape(publishingSpaceIdResponse.data?.data?.getSpace?.id),
    'versions',
    querystring.escape(options.version),
    'projects/create',
  ].join('/');
}

function resolveStageUrl(endpoint: string): string {
  if (endpoint.endsWith('api-gamma.quokka.codes')) {
    return 'https://integ.stage.quokka.codes';
  } else {
    return 'https://codecatalyst.aws';
  }
}
