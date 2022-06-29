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

export class Blueprint extends Project {
  public readonly context: Context;

  constructor(options: Options) {
    super({
      name: 'CodeAwsBlueprint',
      ...options,
    });

    this.context = {
      rootDir: path.resolve(this.outdir),
      organizationName: process.env.CONTEXT_ORGANIZATIONNAME,
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
  ValidationError = 'ValidationError',
  ConflictError = 'ConflictError',
  NotFoundError = 'NotFoundError',
  UndefinedSynthesisError = 'UndefinedSynthesisError',
}

export class BlueprintSynthesisError extends Error {
  constructor(options: { message: string; type?: BlueprintSynthesisErrorTypes }) {
    const { message, type } = options;
    super(message);
    switch (type) {
      case BlueprintSynthesisErrorTypes.ValidationError:
        this.name = type;
        break;
      case BlueprintSynthesisErrorTypes.ConflictError:
        this.name = type;
        break;
      case BlueprintSynthesisErrorTypes.NotFoundError:
        this.name = type;
        break;
      default:
        this.name = BlueprintSynthesisErrorTypes.UndefinedSynthesisError;
    }
  }
}
