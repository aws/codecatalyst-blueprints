import { isInGlob } from './file-resolution';
import { MergeStrategy, MergeStrategyFunction } from './models';

export class MergeStrategies {
  public static readonly default: MergeStrategyFunction = (
    _filePath: string,
    _existingContent: Buffer,
    _newContent: Buffer,
    _options?: {},
  ): string | NodeJS.ArrayBufferView => {
    return _newContent.toString();
  };

  public static readonly useNewContent: MergeStrategyFunction = (
    _filePath: string,
    _existingContent: Buffer,
    _newContent: Buffer,
    _options?: {},
  ): string | NodeJS.ArrayBufferView => {
    return _newContent.toString();
  };

  public static readonly useExistingContent: MergeStrategyFunction = (
    _filePath: string,
    _existingContent: Buffer,
    _newContent: Buffer,
    _options?: {},
  ): string | NodeJS.ArrayBufferView => {
    return _existingContent.toString();
  };
}

export function merge(
  strategies: MergeStrategy[],
  file: {
    path: string;
    existingContent: Buffer;
    newContent: Buffer;
  },
): string | NodeJS.ArrayBufferView | undefined {
  for (const strategy of strategies) {
    for (const glob of strategy.globs) {
      if (isInGlob(file.path, glob)) {
        return strategy.strategy(file.path, file.existingContent, file.newContent);
      }
    }
  }
  return undefined;
}
