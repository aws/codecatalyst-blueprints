import { File, MergeStrategyFunction } from './models';

export class MergeStrategies {
  public static readonly alwaysUpdate: MergeStrategyFunction = (
    _commonAncestorFile: File | undefined,
    _existingFile: File | undefined,
    _proposedFile: File | undefined,
    _options?: {},
  ) => {
    return _existingFile;
  };

  public static readonly neverUpdate: MergeStrategyFunction = (
    _commonAncestorFile: File | undefined,
    _existingFile: File | undefined,
    _proposedFile: File | undefined,
    _options?: {},
  ) => {
    return _existingFile;
  };
}
