import { ContextFile } from './models';

type StrategyFunction = (
  _commonAncestorFile: ContextFile | undefined,
  _existingFile: ContextFile | undefined,
  _proposedFile: ContextFile | undefined,
  _options?: {}) => ContextFile | undefined;

export class MergeStrategies {
  public static alwaysUpdate: StrategyFunction = function alwaysUpdate(
    _commonAncestorFile: ContextFile | undefined,
    _existingFile: ContextFile | undefined,
    _proposedFile: ContextFile | undefined,
    _options?: {}) {
    return _existingFile;
  };

  public static neverUpdate: StrategyFunction = function neverUpdate(
    _commonAncestorFile: ContextFile | undefined,
    _existingFile: ContextFile | undefined,
    _proposedFile: ContextFile | undefined,
    _options?: {}) {
    return _existingFile;
  };
}
