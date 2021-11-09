import * as fs from 'fs';
import * as path from 'path';

import {Blueprint} from '@caws-blueprint/caws.blueprint';
import {Component} from 'projen';

export const sourceRepositoryRootDirectory = 'src';

export interface SourceRepositoryDefinition {
  title: string;
}

export class SourceRepository extends Component {
  public readonly relativePath: string;
  public readonly path: string;

  constructor(
    protected readonly blueprint: Blueprint,
    protected readonly sourceRepository: SourceRepositoryDefinition,
  ) {
    super(blueprint);
    this.relativePath = path.join(sourceRepositoryRootDirectory, sourceRepository.title);
    this.path = path.join(blueprint.context.rootDir, this.relativePath);
  }

  synthesize(): void {
    const srcDir = path.join(this.blueprint.context.rootDir, sourceRepositoryRootDirectory);
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }

    const repoDir = path.join(srcDir, this.sourceRepository.title);
    if (!fs.existsSync(repoDir)) {
      fs.mkdirSync(repoDir);
    }

    super.synthesize();
  }
}
