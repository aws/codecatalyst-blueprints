import { File } from './models';

export class MergeStrategies {
  public static alwaysUpdate(_commonAncestorFile: File | undefined, _existingFile: File | undefined, _proposedFile: File | undefined, _options?: {}) {
    return _existingFile;
  }

  public static neverUpdate(_commonAncestorFile: File | undefined, _existingFile: File | undefined, _proposedFile: File | undefined, _options?: {}) {
    return _existingFile;
  }
}
