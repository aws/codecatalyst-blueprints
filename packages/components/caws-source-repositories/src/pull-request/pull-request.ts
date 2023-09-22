import * as path from 'path';
import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { BUNDLE_PATH_PULL_REQUEST, writePullRequest } from '@amazon-codecatalyst/blueprints.blueprint/lib/pull-requests/pull-requests';
import { Component } from 'projen';
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

export class PullRequest extends Component {

  public static BUNDLE_PATH = BUNDLE_PATH_PULL_REQUEST;

  constructor(readonly blueprint: Blueprint, readonly identifier: string, readonly options: PullRequestDefinition) {
    super(blueprint);
  }

  synthesize(): void {
    writePullRequest(this.blueprint.outdir, this.identifier, {
      title: this.options.title,
      description: this.options.description,
      changes: (this.options.changes || []).map(diff => {
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
