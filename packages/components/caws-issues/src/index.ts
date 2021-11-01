import * as path from 'path';

import {Component, YamlFile} from 'projen';

import {Blueprint} from '@caws-blueprint/caws.blueprint';

export interface IssueDefinition {
  type: 'Issue';

  title: string;
  
  description: string;

  issueStore: string;

}

export class Issue extends Component {
  constructor(blueprint: Blueprint, issue: IssueDefinition) {
    super(blueprint);

    new YamlFile(
      blueprint,
      path.join(blueprint.context.rootDir, `issues/${issue.issueStore}/${issue.title}.yaml`),
      {
        obj: issue,
      },
    );
  }
}
