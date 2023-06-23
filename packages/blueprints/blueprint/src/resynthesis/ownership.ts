import { Blueprint } from '../blueprint';
import { Strategy } from './merge-strategies/models';

interface StrategyIdMap {
  [identifier: string]: Strategy;
}
export class Ownership {
  public static DEFAULT_FILE_NAME = '.ownership-file';
  public static asString = (blueprint: Blueprint, fileDefinition: Ownership): string => asOwnershipString(blueprint, fileDefinition);
  public static asObject = (stringContent: string, inMemoryMapping: StrategyIdMap): Ownership => asOwnershipDefintion(stringContent, inMemoryMapping);

  resynthesis?: {
    strategies: Strategy[];
  };
}

const asOwnershipString = (blueprint: Blueprint, fileDefinition: Ownership): string => {
  let fileContents = '';
  fileDefinition.resynthesis?.strategies.forEach(strategy => {
    const owner = strategy.owner ?? blueprint.context.package.name;
    if (!owner) {
      throw new Error(
        `Failed to resolve owner for strategy ${strategy.identifier}: no owner was provided, and the blueprint context is missing a package name`,
      );
    }
    fileContents += `[${strategy.identifier}] ${owner}\n`;
    if (strategy.description) {
      // TODO: format description into multiple lines with a max length
      fileContents += `# ${strategy.description}\n`;
    }
    fileContents += `# Internal merge strategy: ${strategy.strategy.name || 'custom'}\n`;
    strategy.globs.forEach(glob => {
      fileContents += `${glob}\n`;
    });
    fileContents += '\n';
  });
  return fileContents.trimEnd() + '\n';
};

const asOwnershipDefintion = (fileContent: string, inMemoryMapping: StrategyIdMap): Ownership => {
  const lines = fileContent.split(/\r?\n/);

  const strategies: Strategy[] = [];
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trimStart().trimEnd();

    if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
      return;
    }

    const strategy = parseSectionLine(trimmedLine);
    if (strategy && strategy.identifier in inMemoryMapping) {
      strategies.push({
        identifier: strategy.identifier,
        owner: strategy.owner,
        strategy: (inMemoryMapping[strategy.identifier] || {}).strategy,
        globs: [],
      });
      return;
    }

    if (strategies.length === 0) {
      throw new Error(`Encountered unexpected glob outside of a strategy section ${lineNumber}`);
    }
    const currentStrategy = strategies[strategies.length - 1];
    currentStrategy.globs.push(trimmedLine);
  });
  return {
    resynthesis: {
      strategies,
    },
  };
};

const STRATEGY_LINE_REGEX = /^\[(?<identifier>.+)\]\s+(?<owner>.+)$/; // e.g. [my_identifier] @caws-blueprint/my-blueprint
function parseSectionLine(line: string): { identifier: string; owner: string } | undefined {
  const match = line.match(STRATEGY_LINE_REGEX);
  if (!match || !match?.groups) {
    return;
  }

  const { identifier, owner } = match.groups;
  return { identifier, owner };
}
