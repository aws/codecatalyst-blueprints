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
   * This is a way to denote ownership boundries.
   */
  lifecycle?: Partial<LifecycleControl>;
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

  public readonly lifecycle: LifecycleControl;

  constructor(protected readonly blueprint_: Blueprint, protected readonly sourceRepository: SourceRepositoryDefinition) {
    super(blueprint_);
    this.blueprint = blueprint_;
    this.sourceRepository.title = makeValidFolder(sourceRepository.title);
    this.title = this.sourceRepository.title;
    this.relativePath = path.join(sourceRepositoryRootDirectory, sourceRepository.title);
    this.path = path.join(this.blueprint.context.rootDir, this.relativePath);
    this.synthesisSteps = [];
    this.lifecycle = {
      alwaysReplace: [],
      neverReplace: [],
      mergeUsingExistingContent: [],
      mergeUsingNewContent: [],
      mergeStrategy: MergeStrategies.default,
      ...sourceRepository.lifecycle,
    };

    // If lifecycle management is not enabled, this means the author probably has not reasoned about how to do updates safely.
    // We clean all existing files in an attempt to ship a working product as close to what the author would expect
    if (!sourceRepository.lifecycle) {
      this.lifecycle.alwaysReplace = ['**/*'];
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
        {
          globs: this.lifecycle.mergeUsingExistingContent,
          strategy: MergeStrategies.useExistingContent,
        },
        {
          globs: this.lifecycle.mergeUsingNewContent,
          strategy: MergeStrategies.useNewContent,
        },
        {
          globs: ['**/*'],
          strategy: this.lifecycle.mergeStrategy,
        },
      ];

      // clean files that we dont want to include in our ouput.
      [
        {
          scope: existingContentFolder,
          globs: this.lifecycle.alwaysReplace,
          label: 'Clean and Replace',
        },
        {
          scope: newContentFolder,
          globs: this.lifecycle.neverReplace,
          label: 'Not Updating',
        },
      ].forEach(lifeCycleStage =>
        removeFiles(lifeCycleStage.scope, lifeCycleStage.globs, {
          operation: lifeCycleStage.label,
        }),
      );

      // walk all the files that could possibly show up in the resynth'd content
      const lifecycledFiles = new Set<MirroredFilePath>();
      [existingContentFolder, newContentFolder].forEach(location => {
        for (const file of walkFiles(location, '**/*')) {
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
