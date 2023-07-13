import path from 'path';

import { ContextFile, createContextFile, destructurePath } from '../resynthesis/context-file';
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
    .map(filelocation => {
      const { resourcePrefix, subdirectory, filepath } = destructurePath(path.join('src', filelocation), '');
      return createContextFile(bundlepath, resourcePrefix!, subdirectory!, filepath!);
    })
    .filter(item => !!item) as ContextFile[];
}
