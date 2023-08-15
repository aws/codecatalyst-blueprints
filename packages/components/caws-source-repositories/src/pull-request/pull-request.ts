import * as path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { BUNDLE_PATH_PULL_REQUEST, writePullRequest } from '@caws-blueprint/blueprints.blueprint/lib/pull-requests/pull-requests';
import { Difference } from '../difference/difference';


export interface PullRequestDefinition {
  /**
  * This is the title of the pull request
  */
  title: string;

  /**
  * Markdown representing the main body of the pull request
  */
  description: string;

  /**
  * Differences in this pull request
  */
  changes?: Difference[];
}

export class PullRequest {

  public static BUNDLE_PATH = BUNDLE_PATH_PULL_REQUEST;

  constructor(protected readonly blueprint_: Blueprint, identifier: string, options: PullRequestDefinition) {
    writePullRequest(path.join(this.blueprint_.outdir, PullRequest.BUNDLE_PATH), identifier, {
      title: options.title,
      description: options.description,
      changes: (options.changes || []).map(diff => {
        return {
          diffs: path.join(Difference.BUNDLE_PATH, diff.identifier),
          repository: diff.repository.title,
          originBranch: diff.originBranch,
          targetBranch: diff.targetBranch,
        };
      }),
    });
  }
}