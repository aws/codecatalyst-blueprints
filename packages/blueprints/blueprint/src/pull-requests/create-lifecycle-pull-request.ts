import path from 'path';
import { writePullRequest } from './pull-requests';
import { BUNDLE_PATH_SRC_DIFF, generateDifferencePatch, writeDifferencePatch } from '../differences/differences';
import { destructurePath } from '../resynthesis/context-file';
import { filepathSet } from '../resynthesis/file-set';

interface lifecyclePullRequestOptions {
  originBranch: string;
  targetBranch?: string;
  pullRequest: {
    id: string;
    title: string;
    description: string;
  };
}
export const createLifecyclePullRequest = (
  resolvedBundle: string,
  exisitingBundle: string,
  options: lifecyclePullRequestOptions,
) => {
  const allfiles = filepathSet([resolvedBundle, exisitingBundle], ['src/**']);
  const differences = {};

  allfiles.forEach(sourcepath => {
    const destructuredPath = destructurePath(sourcepath, '');
    const { subdirectory, filepath } = destructuredPath;
    const repository = subdirectory;
    const diff = generateDifferencePatch(path.join(exisitingBundle, sourcepath), path.join(resolvedBundle, sourcepath), filepath!);

    if (diff) {
      const differenceIdentifier = `${repository}-${options.originBranch}`;
      writeDifferencePatch(resolvedBundle, differenceIdentifier, filepath!, diff);
      differences[differenceIdentifier] = repository;
    }
  });

  if (Object.keys(differences).length) {
    // only create pull requests if there are differences
    writePullRequest(resolvedBundle, options.pullRequest.id, {
      title: options.pullRequest.title,
      description: options.pullRequest.description,
      changes: (Object.keys(differences) || []).map(differenceId => {
        return {
          repository: differences[differenceId],
          diffs: path.join(BUNDLE_PATH_SRC_DIFF, differenceId),
          originBranch: options.originBranch,
          targetBranch: options.targetBranch,
        };
      }),
    });
  }
};
