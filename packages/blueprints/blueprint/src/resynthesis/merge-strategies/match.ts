import * as path from 'path';
import { MergeStrategies } from './merge-strategies';
import { Strategy } from './models';
import { Ownership } from '../ownership';
import { matchesGlob } from '../walk-files';

export const FALLBACK_STRATEGY = MergeStrategies.preferProposed;
export const FALLBACK_STRATEGY_ID = `FALLBACK_${FALLBACK_STRATEGY.name}`;

export function match(sourceCodePath: string, strategies: { [bundlepath: string]: Strategy[] }): Strategy {
  const directories = sourceCodePath.split('/');

  while (directories.length > 0) {
    directories.pop();

    // path we would expect for if the ownership is declared in memory at this location
    const syntheticPath = path.join(...directories);
    // path we would expect for a ownership override file at this location
    const ownershipPath = path.join(syntheticPath, Ownership.DEFAULT_FILE_NAME);

    const commonPath = directories.join('/') + '/';
    const relativeStrategies = [...(strategies[syntheticPath] || []), ...(strategies[ownershipPath] || [])];
    if (!relativeStrategies.length) {
      continue;
    }

    const relativeBundlePath = sourceCodePath.startsWith(commonPath) ? sourceCodePath.slice(commonPath.length) : sourceCodePath;
    const matchedStrategy = matchStrategies(relativeBundlePath, relativeStrategies);
    if (matchedStrategy) {
      return matchedStrategy;
    }
  }

  return {
    identifier: FALLBACK_STRATEGY_ID,
    strategy: FALLBACK_STRATEGY,
    globs: ['*'],
  };
}

function matchStrategies(bundlePath: string, strategies: Strategy[]): Strategy | undefined {
  for (let i = strategies.length - 1; i >= 0; i--) {
    const strategy = strategies[i];
    if (matchesGlob(bundlePath, strategy.globs)) {
      return strategy;
    }
  }
  return;
}
