import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export const BUNDLE_PATH_PULL_REQUEST = 'pull-request';
interface PullRequestYaml {
  title: string;
  description: string;
  changes: {
    diffs: string;
    repository: string;
    originBranch: string;
    targetBranch?: string;
  }[];
}

export const writePullRequest = (bundle: string, identifier: string, pullRequest: PullRequestYaml) => {
  const pullRequestYamlLocation = path.join(bundle, BUNDLE_PATH_PULL_REQUEST, `${identifier}.yaml`);
  fs.mkdirSync(path.dirname(pullRequestYamlLocation), { recursive: true });

  const doc = new YAML.Document(pullRequest);
  fs.writeFileSync(pullRequestYamlLocation, doc.toString({ blockQuote: 'literal' }));
};
