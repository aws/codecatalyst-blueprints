import * as fs from 'fs';
import * as path from 'path';
import { Blueprint, BlueprintSynthesisErrorTypes } from '@amazon-codecatalyst/blueprints.blueprint';
import { Component, JsonFile } from 'projen';
import { ISSUES_ROOT_DIR } from './constants';
import { IssueDefinition, IssueObject } from './issue-definition';

export class Issue extends Component {
  id: string;
  relativePath: string;
  blueprint: Blueprint;
  constructor(blueprint: Blueprint, id: string, issueDefinition: IssueDefinition) {
    super(blueprint);
    this.id = id;
    this.relativePath = path.join(ISSUES_ROOT_DIR, id + '.json');
    this.blueprint = blueprint;
    const nameRegex = /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;
    if (!nameRegex.test(this.id)) {
      blueprint.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.ValidationError,
        message: 'Issue id must contain only alphanumeric characters and the characters _- and cannot start or end with special characters.',
      });
    }
    if (issueDefinition.title.length < 1) {
      blueprint.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.ValidationError,
        message: 'Issue title name must have a minimum of 1 character.',
      });
    }

    if (issueDefinition.title.length > 255) {
      blueprint.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.ValidationError,
        message: 'Issue title must have a maximum of 255 characters.',
      });
    }
    if (issueDefinition.content) {
      if (issueDefinition.content.length > 32767) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Issue content cannot exceed 32767 characters.',
        });
      }
    }
    if (issueDefinition.labels) {
      if (issueDefinition.labels.length < 1) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Issue labels must contain at least one element.',
        });
      }
      //limit the number of labels being created
      if (issueDefinition.labels.length > 1) {
        blueprint.throwSynthesisError({
          name: BlueprintSynthesisErrorTypes.ValidationError,
          message: 'Issue labels must contain at most ten elements.',
        });
      }
      for (const label of issueDefinition.labels) {
        if (label.length < 1) {
          blueprint.throwSynthesisError({
            name: BlueprintSynthesisErrorTypes.ValidationError,
            message: 'Issue label must have a minimum of 1 character.',
          });
        }
        if (label.length > 63) {
          blueprint.throwSynthesisError({
            name: BlueprintSynthesisErrorTypes.ValidationError,
            message: 'Issue label must have a minimum of 1 character.',
          });
        }
      }
    }
    const issueObject: IssueObject = {
      id,
      ...issueDefinition,
    };

    new JsonFile(blueprint, this.relativePath, {
      readonly: false,
      marker: false,
      obj: issueObject,
    });
  }

  synthesize(): void {
    const synthPath = path.join(this.blueprint.context.rootDir, this.relativePath);
    if (fs.existsSync(synthPath)) {
      this.blueprint.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.ValidationError,
        message: `Issue identifier ${this.id} is already in use`,
      });
    }
    super.synthesize();
  }
}
