import path from 'path';

import { ContextFile, createContextFile } from '../resynthesis/context-file';
import { ALL_FILES, walkFiles } from '../resynthesis/walk-files';

export interface TraversalOptions {
  repositoryName?: string;
  fileGlobs?: string[];
}

export function traverse(bundlepath: string | undefined, options?: TraversalOptions): ContextFile[] {
  if (!bundlepath) {
    return [];
  }

  const repoPrefix = options?.repositoryName || '**';
  const fileGlobs = (options?.fileGlobs || ALL_FILES).map(glob => path.join(repoPrefix, glob));

  const sourcePath = path.join(bundlepath, 'src');
  return walkFiles(sourcePath, fileGlobs)
    .map(filepath => createContextFile(sourcePath, filepath))
    .filter(item => !!item) as ContextFile[];
}
