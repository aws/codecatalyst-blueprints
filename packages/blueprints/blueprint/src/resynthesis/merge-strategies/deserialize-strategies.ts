import * as fs from 'fs';
import * as path from 'path';
import { Ownership } from '../ownership';
import { walkFiles } from '../walk-files';
import { Strategy } from './models';

export type StrategyLocations = { [bundlePath: string]: Strategy[] };

const getStrategyIds = (strategies: StrategyLocations): Set<string> => {
  const ids = new Set<string>();
  for (const strategyList of Object.values(strategies)) {
    for (const strategy of strategyList) {
      ids.add(strategy.identifier);
    }
  }
  return ids;
};

export const deserializeStrategies = (existingBundle: string, strategyMatch: StrategyLocations): StrategyLocations => {
  const validBlueprintStrategies = getStrategyIds(strategyMatch);
  const validStrategies: StrategyLocations = {};

  const ownershipFiles = walkFiles(existingBundle, [`src/**/*${Ownership.DEFAULT_FILE_NAME}`]);
  ownershipFiles.forEach(ownerfile => {
    const ownershipObject = Ownership.asObject(fs.readFileSync(path.join(existingBundle, ownerfile)).toString());
    const relevantStrategies: Strategy[] = [];
    ownershipObject.resynthesis?.strategies.forEach(strategy => {
      if (validBlueprintStrategies.has(strategy.identifier)) {
        relevantStrategies.push(strategy);
      }
    });
    validStrategies[ownerfile] = relevantStrategies;
  });

  return validStrategies;
};
