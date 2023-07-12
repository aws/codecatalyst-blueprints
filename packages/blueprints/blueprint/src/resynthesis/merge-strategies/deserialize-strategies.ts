import * as fs from 'fs';
import * as path from 'path';
import { constructLocalStrategy } from './local';
import { Strategy } from './models';
import { BlueprintSynthesisError, BlueprintSynthesisErrorTypes } from '../../blueprint';
import { PackageConfiguration } from '../../context/context';
import { Ownership } from '../ownership';
import { walkFiles } from '../walk-files';

export type StrategyLocations = { [bundlePath: string]: Strategy[] };
export const LOCAL_STRATEGY_ID = 'local';

const getStrategyIds = (strategies: StrategyLocations): { [identifier: string]: Strategy } => {
  const ids: { [id: string]: Strategy } = {};
  for (const strategyList of Object.values(strategies)) {
    for (const strategy of strategyList) {
      ids[strategy.identifier] = strategy;
    }
  }
  return ids;
};

export const merge = (orginal: StrategyLocations, overrides: StrategyLocations): StrategyLocations => {
  const result: StrategyLocations = {};
  const allLocations = new Set([...Object.keys(orginal), ...Object.keys(overrides)]);
  allLocations.forEach(location => {
    result[location] = [...(orginal[location] || []), ...(overrides[location] || [])];
  });
  return result;
};

export const deserializeStrategies = (existingBundle: string, strategyMatch: StrategyLocations): StrategyLocations => {
  const inMemStrategies = getStrategyIds(strategyMatch);
  const validStrategies: StrategyLocations = {};
  const ownershipFiles = walkFiles(existingBundle, [`src/**/*${Ownership.DEFAULT_FILE_NAME}`]);

  ownershipFiles.forEach(ownerfile => {
    const ownershipPath = path.join(existingBundle, ownerfile);
    const ownershipObject = Ownership.asObject(fs.readFileSync(ownershipPath).toString(), inMemStrategies);
    const relevantStrategies: Strategy[] = [];
    ownershipObject.resynthesis?.strategies.forEach(deserializedStrategy => {
      if (deserializedStrategy.identifier === LOCAL_STRATEGY_ID) {
        if (!deserializedStrategy.owner) {
          throw new BlueprintSynthesisError({
            message: `Failed to resolve command for local strategy: ${deserializedStrategy.identifier}`,
            type: BlueprintSynthesisErrorTypes.ValidationError,
          });
        }

        deserializedStrategy.strategy = constructLocalStrategy(deserializedStrategy.owner, ownershipPath);
        relevantStrategies.push(deserializedStrategy);
      } else if (deserializedStrategy.identifier in inMemStrategies) {
        relevantStrategies.push(deserializedStrategy);
      }
    });
    validStrategies[ownerfile] = relevantStrategies;
  });

  return validStrategies;
};

/**
 * Filters strategies based on the given package configuration.
 * @returns strategies that have an owner matching the given package configuration.
 */
export function filterStrategies(strategies: StrategyLocations, packageConfig: PackageConfiguration): StrategyLocations {
  const result: StrategyLocations = {};
  const locations = Object.keys(strategies);

  for (const location of locations) {
    const strategyList = strategies[location];
    const filtered = strategyList.filter(strategy => strategy.owner && matchesOwner(strategy.identifier, strategy.owner, packageConfig));
    if (filtered.length > 0) {
      result[location] = filtered;
    }
  }

  return result;
}

function matchesOwner(identifier: string, strategyOwner: string, packageConfig: PackageConfiguration): boolean {
  if (identifier === LOCAL_STRATEGY_ID) {
    return true;
  }

  const owners: string[] = [];
  if (packageConfig.name) {
    owners.push(packageConfig.name);
  }
  if (packageConfig.name && packageConfig.version) {
    owners.push(`${packageConfig.name}@${packageConfig.version}`);
  }

  for (const owner of owners) {
    if (wildcardMatch(strategyOwner, owner)) {
      return true;
    }
  }

  return false;
}

function wildcardMatch(pattern: string, s: string): boolean {
  // escape regex special characters:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // replace occurrences of '\*' with '.*':
  const re = new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`);
  return re.test(s);
}
