import globule from 'globule';
import { MergeStrategies } from './merge-strategy';
import { MergeStrategyFunction, Strategy } from './models';

export function match(bundlePath: string, strategies: { [bundlepath: string]: Strategy[] }): MergeStrategyFunction {
  const directories = bundlePath.split('/');

  while (directories.length > 0) {
    directories.pop();
    const ownershipPath = [...directories, '.blueprint-ownership'].join('/');
    const commonPath = directories.join('/') + '/';

    const relativeStrategies = strategies[ownershipPath];
    if (!relativeStrategies) {
      continue;
    }

    const relativeBundlePath = bundlePath.startsWith(commonPath) ? bundlePath.slice(commonPath.length) : bundlePath;
    console.log({ relativeBundlePath, commonPath, bundlePath, ownershipPath });
    const matchedStrategy = matchStrategies(relativeBundlePath, relativeStrategies);
    if (matchedStrategy) {
      return matchedStrategy;
    }
  }

  // TODO: Default to three way merge once it exists.
  return MergeStrategies.neverUpdate;
}

function matchStrategies(bundlePath: string, strategies: Strategy[]): MergeStrategyFunction | undefined {
  for (let i = strategies.length - 1; i >= 0; i--) {
    const strategy = strategies[i];

    if (
      globule.isMatch(strategy.globs, bundlePath, {
        matchBase: true,
        dot: true,
      })
    ) {
      return strategy.strategy;
    }
  }

  return;
}