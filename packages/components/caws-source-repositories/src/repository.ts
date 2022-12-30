import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component } from 'projen';
import { makeMirroredPaths, removeFiles, walkFiles } from './lifecycle/file-resolution';
import { MergeStrategies, merge } from './lifecycle/merge-strategy';
import { LifecycleControl, MirroredFilePath } from './lifecycle/models';
import { makeValidFolder } from './utilities';

export const sourceRepositoryRootDirectory = 'src';

export interface SourceRepositoryDefinition {
  title: string;

  /**
   * This controls how files are merged when a user runs re-synthesis.
   *
   * Resynthesis is typically run when an update to a blueprint results in bug fixes or other changes in generated code.
   * This will result in a depend-a-bot style PR into customer generated codebases.
   *
   * You should assume that the same or similar options are passed during resynthesis, if the options diverge too much,
   * (e.g. changing the language) it might not be possible to effectively reason about needed changes. This might still
   * result in a valid synthesis, but will likely require the customer to do some work to manually fix merge conflicts.
   *
   * This can also happen if the blueprint interface adds backwards breaking changes to it's shape, prior used options
   * will no longer work.
   */
  resynthesis?: Partial<LifecycleControl>;
}

/**
 * File in which we record lifecycle preferences and overrides
 */
export const LIFECYCLE_MANAGEMENT_RECORD = 'blueprint.lifecycle.overrides';

export class SourceRepository extends Component {
  public readonly relativePath: string;
  public readonly path: string;
  public readonly title: string;
  public readonly blueprint: Blueprint;

  // functions that get executed at the end of a synthesis of a repository.
  public readonly synthesisSteps: (() => void)[];

  public readonly resynthesis: LifecycleControl;

  constructor(protected readonly blueprint_: Blueprint, protected readonly sourceRepository: SourceRepositoryDefinition) {
    super(blueprint_);
    this.blueprint = blueprint_;
    this.sourceRepository.title = makeValidFolder(sourceRepository.title);
    this.title = this.sourceRepository.title;
    this.relativePath = path.join(sourceRepositoryRootDirectory, sourceRepository.title);
    this.path = path.join(this.blueprint.context.rootDir, this.relativePath);
    this.synthesisSteps = [];
    this.resynthesis = {
      blueprintOwned: [],
      userOwned: [],
      shared: [],
      defaultMergeStrategy: MergeStrategies.default,
      ...sourceRepository.resynthesis,
    };

    // If lifecycle management is not enabled, this means the author probably has not reasoned about how to do updates safely.
    // We assume the blueprint owns all the files in the filesystem.
    if (!sourceRepository.resynthesis) {
      this.resynthesis.blueprintOwned = ['**/*'];
    }
  }

  synthesize(): void {
    const srcDir = path.join(this.blueprint.context.rootDir, sourceRepositoryRootDirectory);
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }

    const repoDir = path.join(srcDir, this.sourceRepository.title);
    if (fs.existsSync(repoDir)) {
      this.writeLifecycleSynthesis(repoDir);
    } else {
      this.writeInitalSynthesis(repoDir);
    }
  }

  addSynthesisStep(postSynthFunction: () => void) {
    this.synthesisSteps.push(postSynthFunction);
  }

  private writeInitalSynthesis(location: string) {
    fs.mkdirSync(location);
    super.synthesize();
    this.synthesisSteps.forEach(step => step());
  }

  private writeLifecycleSynthesis(location: string) {
    const existingContentFolder = `${location}-existing`;
    const newContentFolder = `${location}-new`;

    try {
      cp.execFileSync(`mv ${location} ${existingContentFolder}`);
      this.writeInitalSynthesis(newContentFolder);

      // create the synthesis destination
      fs.mkdirSync(location);

      /**
       * TODO: * 1. check if there is a LIFECYCLE_MANAGEMENT_RECORD in the existing repo, update the lifecycle content.
       */

      const lifecycleMergePriority = [
        ...(this.sourceRepository.resynthesis?.shared || []),
        {
          globs: ['**/*'],
          strategy: this.resynthesis.defaultMergeStrategy,
        },
      ];

      // clean files that we dont want to include in our ouput.
      [
        {
          scope: existingContentFolder,
          globs: this.resynthesis.blueprintOwned,
          label: 'Removing blueprint owned:',
        },
        {
          scope: newContentFolder,
          globs: this.resynthesis.userOwned,
          label: 'Removing user owned:',
        },
      ].forEach(lifeCycleStage =>
        removeFiles(lifeCycleStage.scope, lifeCycleStage.globs, {
          operation: lifeCycleStage.label,
        }),
      );

      // walk all the files that could possibly show up in the resynth'd content
      const lifecycledFiles = new Set<MirroredFilePath>();
      [existingContentFolder, newContentFolder].forEach(folder => {
        for (const file of walkFiles(folder, '**/*')) {
          lifecycledFiles.add(makeMirroredPaths(existingContentFolder, newContentFolder, file));
        }
      });

      lifecycledFiles.forEach(file => {
        let content;
        if (file.existingAbsPath && file.newAbsPath) {
          // files present in both must be merged
          content = merge(lifecycleMergePriority, {
            path: file.path,
            existingContent: fs.readFileSync(file.existingAbsPath),
            newContent: fs.readFileSync(file.newAbsPath),
          });
        } else {
          content = fs.readFileSync(file.existingAbsPath || file.newAbsPath || '');
        }

        //write the file to the synthesis location
        fs.writeFileSync(path.join(location, file.path), content);
      });
    } finally {
      fs.rmdirSync(existingContentFolder);
      fs.rmdirSync(newContentFolder);
    }
  }
}
