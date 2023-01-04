import { matchesGlob } from './file-resolution';
import { MergeStrategy, MergeStrategyFunction } from './models';

export class MergeStrategies {
  public static readonly useNewContent: MergeStrategyFunction = (
    _filePath: string,
    _existingContent: Buffer,
    _newContent: Buffer,
    _options?: {},
  ): Buffer => {
    return _newContent;
  };

  public static readonly useExistingContent: MergeStrategyFunction = (
    _filePath: string,
    _existingContent: Buffer,
    _newContent: Buffer,
    _options?: {},
  ): Buffer => {
    return _existingContent;
  };
}

export function merge(
  strategies: MergeStrategy[],
  file: {
    path: string;
    existingContent: Buffer;
    newContent: Buffer;
  },
): Buffer {
  let match: boolean = false;
  for (const strategy of strategies.reverse()) {
    if (matchesGlob(file.path, strategy.globs)) {
      console.log(`Strategy '${strategy.strategyName}' across ${strategy.globs} matches: ${file.path}`);
      return strategy.strategy(file.path, file.existingContent, file.newContent);
    }
  }

  if (!match) {
    const err = `COULD NOT MATCH ${file.path}`;
    console.error(err);
    throw new Error(err);
  }
  return file.existingContent;
}
