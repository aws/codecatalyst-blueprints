import { MergeStrategies } from './merge-strategies';
import { Strategy } from './models';
import { Ownership } from '../ownership';
import { matchesGlob } from '../walk-files';

export const FALLBACK_STRATEGY = MergeStrategies.threeWayMerge;
export const FALLBACK_STRATEGY_ID = `FALLBACK_${FALLBACK_STRATEGY.name}`;

export function match(bundlePath: string, strategies: { [bundlepath: string]: Strategy[] }): Strategy {
  const directories = bundlePath.split('/');

  while (directories.length > 0) {
    directories.pop();
    const ownershipPath = [...directories, Ownership.DEFAULT_FILE_NAME].join('/');
    const commonPath = directories.join('/') + '/';

    const relativeStrategies = strategies[ownershipPath];
    if (!relativeStrategies) {
      continue;
    }

    const relativeBundlePath = bundlePath.startsWith(commonPath) ? bundlePath.slice(commonPath.length) : bundlePath;
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
