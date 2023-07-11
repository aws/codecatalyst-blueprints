import * as fs from 'fs';
import * as path from 'path';
import { Strategy } from './models';
import { Ownership } from '../ownership';
import { walkFiles } from '../walk-files';

export type StrategyLocations = { [bundlePath: string]: Strategy[] };

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
    const ownershipObject = Ownership.asObject(fs.readFileSync(path.join(existingBundle, ownerfile)).toString(), inMemStrategies);
    const relevantStrategies: Strategy[] = [];
    ownershipObject.resynthesis?.strategies.forEach(deserializedStrategy => {
      if (deserializedStrategy.identifier in inMemStrategies) {
        relevantStrategies.push(deserializedStrategy);
      }
    });
    validStrategies[ownerfile] = relevantStrategies;
  });

  return validStrategies;
};
