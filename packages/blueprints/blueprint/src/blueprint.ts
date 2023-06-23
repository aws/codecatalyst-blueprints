/* eslint-disable @typescript-eslint/no-empty-function */
import * as fs from 'fs';
import * as path from 'path';

import { JsonFile, Project } from 'projen';
import { Context } from './context/context';
import { TraversalOptions, traverse } from './context/traverse';
import { createContextFile, destructurePath } from './resynthesis/context-file';
import { filepathSet } from './resynthesis/file-set';
import { StrategyLocations, deserializeStrategies } from './resynthesis/merge-strategies/deserialize-strategies';
import { match } from './resynthesis/merge-strategies/match';
import { Strategy } from './resynthesis/merge-strategies/models';

export interface ParentOptions {
  outdir: string;
  parent?: Project;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Options extends ParentOptions {}

export class Blueprint extends Project {
  public readonly context: Context;
  protected strategies: StrategyLocations | undefined;

  constructor(options: Options) {
    super({
      name: 'CodeAwsBlueprint',
      ...options,
    });
    this.context = {
      rootDir: path.resolve(this.outdir),
      spaceName: process.env.CONTEXT_SPACENAME,
      environmentId: process.env.CONTEXT_ENVIRONMENTID,
      npmConfiguration: {
        token: process.env.NPM_CONFIG_TOKEN,
        registry: process.env.NPM_CONFIG_REGISTRY ?? '',
      },
      package: {
        name: process.env.PACKAGE_NAME,
        version: process.env.PACKAGE_VERSION,
      },
      project: {
        name: process.env.CONTEXT_PROJECTNAME,
        bundlepath: process.env.EXISTING_BUNDLE_ABS,
        src: {
          findAll: (_options?: TraversalOptions) => traverse(this.context.project.bundlepath, _options),
        },
      },
    };

    for (const component of this.components) {
      component.synthesize = () => {};
    }

    // write the options to the bundle
    new JsonFile(this, 'options.json', {
      obj: options,
      readonly: false,
      marker: false,
    });
  }

  addStrategy(bundlepath: string, strategy: Strategy) {
    if (!this.strategies) {
      this.strategies = {};
    }
    if (!this.strategies[bundlepath]) {
      this.strategies[bundlepath] = [];
    }
    this.strategies[bundlepath].push(strategy);
  }

  resynth(ancestorBundle: string, existingBundle: string, proposedBundle: string) {
    //1. find the merge strategies from the exisiting codebase, deserialize and match against strategies in memory
    const validStrategies: StrategyLocations = deserializeStrategies(existingBundle, this.strategies || {});
    // used for pretty formatting
    let maxIdlength = 0;
    for (const [ownershipFile, strategies] of Object.entries(validStrategies)) {
      for (const strategy of strategies) {
        console.log(`<<STRATEGY>> [${ownershipFile}] [${strategy.identifier}] matches [${strategy.globs}]`);
        maxIdlength = Math.max(strategy.identifier.length, maxIdlength);
      }
    }
    console.log('<<STRATEGY>> [SYS-FALLBACK] [FALLBACK_never_update] matches [*]');
    maxIdlength = Math.max(maxIdlength, 'STRATEGY-SYS-FALLBACK'.length);

    //2. construct the superset of files between [ancestorBundle, existingBundle, proposedBundle]/src
    // only consider files under the source code 'src'
    const supersetSourcePaths: string[] = filepathSet([ancestorBundle, existingBundle, proposedBundle], ['src/**']);
    supersetSourcePaths.forEach(sourcePath => {
      //3. for each file, match it with a merge strategy
      const strategy = match(sourcePath, validStrategies);
      const { resourcePrefix, subdirectory, filepath } = destructurePath(sourcePath, '');

      const resolvedFile = strategy.strategy(
        createContextFile(ancestorBundle, resourcePrefix!, subdirectory!, filepath!),
        createContextFile(existingBundle, resourcePrefix!, subdirectory!, filepath!),
        createContextFile(proposedBundle, resourcePrefix!, subdirectory!, filepath!),
      );

      console.debug(structureMatchReport(maxIdlength, strategy, subdirectory!, filepath!));
      if (resolvedFile) {
        //4. write the result of the merge strategy to the outdir/src/path
        const outputPath = path.join(this.outdir, resolvedFile.path);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, resolvedFile.buffer);
      } else {
        console.debug('\t -> removed');
      }
    });
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

function structureMatchReport(maxStrategyLength: number, strategy: Strategy, repository: string, filepath: string) {
  return `[${strategy.identifier}] ${' '.repeat(maxStrategyLength - strategy.identifier.length)} [${repository}] [${filepath}] -> [${
    strategy.globs
  }]`;
}
