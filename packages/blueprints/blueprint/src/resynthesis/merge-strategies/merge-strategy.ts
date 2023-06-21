import { ContextFile } from './models';

export type StrategyFunction = (
  commonAncestorFile: ContextFile | undefined,
  existingFile: ContextFile | undefined,
  proposedFile: ContextFile | undefined,
  options?: {},
) => ContextFile | undefined;

export class MergeStrategies {
  public static alwaysUpdate(
    _commonAncestorFile: ContextFile | undefined,
    _existingFile: ContextFile | undefined,
    proposedFile: ContextFile | undefined,
    _options?: {},
  ) {
    return proposedFile;
  }

  public static neverUpdate(
    _commonAncestorFile: ContextFile | undefined,
    existingFile: ContextFile | undefined,
    _proposedFile: ContextFile | undefined,
    _options?: {},
  ) {
    return existingFile;
  }
}
