/* eslint-disable @typescript-eslint/no-empty-function */
import * as path from 'path';

import { Project } from 'projen';
import { Context } from './context';

export interface ParentOptions {
  outdir: string;
  parent?: Project;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Options extends ParentOptions {}

export type AWS_REGIONS =
  | 'af-south-1'
  | 'ap-east-1'
  | 'ap-northeast-1'
  | 'ap-northeast-2'
  | 'ap-northeast-3'
  | 'ap-south-1'
  | 'ap-south-2'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ap-southeast-3'
  | 'ap-southeast-4'
  | 'ca-central-1'
  | 'cn-north-1'
  | 'cn-northwest-1'
  | 'eu-central-1'
  | 'eu-central-2'
  | 'eu-north-1'
  | 'eu-south-1'
  | 'eu-south-2'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-west-3'
  | 'me-central-1'
  | 'me-south-1'
  | 'sa-east-1'
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-1'
  | 'us-west-2';

//@ts-ignore
export type Region<T extends AWS_REGIONS[]> = string;

export class Blueprint extends Project {
  public readonly context: Context;

  constructor(options: Options) {
    super({
      name: 'CodeAwsBlueprint',
      ...options,
    });

    this.context = {
      rootDir: path.resolve(this.outdir),
      spaceName: process.env.CONTEXT_SPACENAME,
      projectName: process.env.CONTEXT_PROJECTNAME,
      environmentId: process.env.CONTEXT_ENVIRONMENTID,
      npmConfiguration: {
        token: process.env.NPM_CONFIG_TOKEN,
        registry: process.env.NPM_CONFIG_REGISTRY ?? 'https://template-721779663932.d.codeartifact.us-west-2.amazonaws.com/npm/global-templates/',
      },
    };

    for (const component of this.components) {
      component.synthesize = () => {};
    }
  }

  throwSynthesisError(error: BlueprintSynthesisError) {
    throw error;
  }
}

export enum BlueprintSynthesisErrorTypes {
  /**
   * Throw for generic synthesis error not defined in BlueprintSynthesisErrorTypes
   */
  BlueprintSynthesisError = 'BlueprintSynthesisError',
  /**
   * Throw when there is a conflict with a resource in synth
   * Ex: Folder with name X already exists, a workspace already exists for repository X
   */
  ConflictError = 'BlueprintSynthesisConflictError',
  /**
   * Throw when unable to find resource in synth
   * Ex: Git repository not found when cloning, unable to find image imported from the web
   */
  NotFoundError = 'BlueprintSynthesisNotFoundError',
  /**
   * Throw when resource fails validation in synth
   * Ex: Filename fails regex validation, X required if Y is not given
   */
  ValidationError = 'BlueprintSynthesisValidationError',
}

export class BlueprintSynthesisError extends Error {
  constructor(options: { message: string; type: BlueprintSynthesisErrorTypes }) {
    const { message, type } = options;
    super(message);
    this.name = type;
  }
}
