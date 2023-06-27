import { Strategy } from './merge-strategies/models';
import { Blueprint } from '../blueprint';

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
    const trimmedLine = line.trimStart().trimEnd();

    if (trimmedLine.length === 0) {
      return;
    }
    const destructuredLine = parseLine(trimmedLine);

    if (destructuredLine.type == LineType.GLOB) {
      if (strategies.length === 0) {
        throw new Error(`Encountered unexpected glob outside of a strategy section at line: ${index + 1}`);
      }
      strategies[strategies.length - 1].globs.push(trimmedLine);
    }

    if (destructuredLine.type == LineType.STRATEGY) {
      strategies.push({
        identifier: destructuredLine.identifier,
        owner: destructuredLine.owner,
        strategy: (inMemoryMapping[destructuredLine.identifier] || {}).strategy,
        globs: [],
      });
    }
  });
  return {
    resynthesis: {
      strategies,
    },
  };
};

const STRATEGY_LINE_REGEX = /^\[(?<identifier>.+)\]\s+(?<owner>.+)$/; // e.g. [my_identifier] @caws-blueprint/my-blueprint
enum LineType {
  COMMENT = 'COMMENT',
  STRATEGY = 'STRATEGY',
  GLOB = 'GLOB',
}
interface GlobLine {
  type: LineType.GLOB;
  glob: string;
}
interface CommentLine {
  type: LineType.COMMENT;
  text: string;
}
interface StrategyLine {
  type: LineType.STRATEGY;
  identifier: string;
  owner: string;
}
function parseLine(line: string): GlobLine | CommentLine | StrategyLine {
  line = line.trim();
  const match = line.match(STRATEGY_LINE_REGEX);
  if (match && match?.groups) {
    const { identifier, owner } = match.groups;
    return {
      type: LineType.STRATEGY,
      identifier,
      owner,
    };
  }

  if (line.startsWith('#')) {
    return {
      type: LineType.COMMENT,
      text: line,
    };
  }

  return {
    type: LineType.GLOB,
    glob: line,
  };
}
