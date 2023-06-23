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

  return walkFiles(path.join(bundlepath, 'src'), fileGlobs)
    .map(filepath => {
      const chunks = filepath.split('/');
      return createContextFile(bundlepath, 'src', chunks.shift()!, path.join(...chunks));
    })
    .filter(item => !!item) as ContextFile[];
}
