import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import * as ini from 'ini';

import { Component } from 'projen';
import { File } from './files/file';
import { SourceFile } from './files/source-file';
import { ALL_FILES, cleanExistingCodeAndNewSynth, removeFolders, walkFiles } from './lifecycle/file-resolution';
import { MergeStrategies, merge } from './lifecycle/merge-strategy';
import { LifecycleControl } from './lifecycle/models';
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
export const BLUEPRINT_RESYNTHESIS_PREFERENCES = 'blueprint.lifecycle';

export class SourceRepository extends Component {
  public readonly relativePath: string;
  public readonly path: string;
  public readonly title: string;
  public readonly blueprint: Blueprint;
  private readonly files: { [filePath: string]: Buffer } = {};

  // functions that get executed at the end of a synthesis of a repository.
  public readonly synthesisSteps: (() => void)[];

  public writeResynthesisPreferences: boolean;
  public resynthesis: LifecycleControl;

  constructor(protected readonly blueprint_: Blueprint, protected readonly sourceRepository: SourceRepositoryDefinition) {
    super(blueprint_);
    this.blueprint = blueprint_;
    this.sourceRepository.title = makeValidFolder(sourceRepository.title);
    this.title = this.sourceRepository.title;
    this.relativePath = path.join(sourceRepositoryRootDirectory, sourceRepository.title);
    this.path = path.join(this.blueprint.context.rootDir, this.relativePath);
    this.synthesisSteps = [];

    this.writeResynthesisPreferences = (sourceRepository.resynthesis || false) && true;
    this.resynthesis = {
      blueprintOwned: [],
      userOwned: [],
      shared: [],
      defaultMergeStrategy: MergeStrategies.useExistingContent,
      ...sourceRepository.resynthesis,
    };
  }

  /**
   * Internally used to reason about which files exist in this repository.
   * If you're adding files without using the constructs, such as using fs.writeFile
   * directly, you'll need to make sure you track those files too. Used for resynthesis
   * @param location
   * @param content
   */
  _trackFile(location: string, content: Buffer) {
    this.files[location] = content;
  }

  getFiles() {
    return this.files;
  }

  /**
   * Wrapper around new File(...)
   * @param location
   * @param content
   */
  addFile(location: string, content: Buffer) {
    new File(this, location, content);
  }

  removeFile(location: string) {
    if (this.files[location]) {
      delete this.files[location];
    }
    this.blueprint.tryRemoveFile(path.join(this.relativePath, location));
  }

  setLifecycleControl(lifecyclePreferences: LifecycleControl) {
    this.writeResynthesisPreferences = true;
    this.resynthesis = lifecyclePreferences;
  }
  getLifecycleControl(): LifecycleControl {
    return this.resynthesis;
  }

  synthesize(): void {
    const srcDir = path.join(this.blueprint.context.rootDir, sourceRepositoryRootDirectory);

    const repoDir = path.join(srcDir, this.sourceRepository.title);
    if (fs.existsSync(repoDir)) {
      console.log('doing a lifecycle resolution');
      this.resolveLifecycleConflicts(repoDir);
    }

    console.log('doing a synth');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }
    this.writeSynthesis();
  }

  addSynthesisStep(postSynthFunction: () => void) {
    this.synthesisSteps.push(postSynthFunction);
  }

  private writeSynthesis() {
    console.log('running synthesis into ' + this.path);
    if (this.writeResynthesisPreferences) {
      const key: any = { ...this.resynthesis, defaultMergeStrategy: null };
      delete key.defaultMergeStrategy;
      new SourceFile(this, BLUEPRINT_RESYNTHESIS_PREFERENCES, ini.encode(key));
    }
    super.synthesize();
    this.synthesisSteps.forEach(step => step());
  }

  private resolveLifecycleConflicts(location: string) {
    const existingContentFolder = `${location}-existing`;

    removeFolders([existingContentFolder]);
    try {
      if (fs.existsSync(location)) {
        // save the old synthesis
        console.log(`Moving old synth to ${existingContentFolder} for references`);
        cp.execSync(`mv ${location} ${existingContentFolder}`);
      }

      /**
       * TODO: * 1. check if there is a LIFECYCLE_MANAGEMENT_RECORD in the existing repo, update the lifecycle content.
       */

      // clean files that we dont want to include in our ouput.
      cleanExistingCodeAndNewSynth(this, {
        blueprintOwned: this.resynthesis.blueprintOwned,
        userOwned: this.resynthesis.userOwned,
        existingCodeLocation: existingContentFolder,
      });

      // walk all the files that could possibly show up as merges
      const existingFiles = new Set<string>();
      console.log('existingContentFolder' + existingContentFolder);

      [existingContentFolder].forEach(folder => {
        for (const filepath of walkFiles(folder, ALL_FILES)) {
          (existingFiles as any).add(filepath);
        }
      });
      /**
       * if the file exists in both places, we need to run a merge across it,
       * otherwise write it as content from the place it does exist
       */
      existingFiles.forEach(localPath => {
        // this localPath shows up in my current synth and in the existing codebase.
        const existingContent = fs.readFileSync(path.join(existingContentFolder, localPath));
        if (this.files[localPath]) {
          const content = merge(
            [
              {
                strategyName: 'Default Merge Strategy',
                globs: ['**/*'],
                strategy: this.resynthesis.defaultMergeStrategy,
              },
              ...(this.sourceRepository.resynthesis?.shared || []),
            ],
            {
              path: localPath,
              existingContent,
              newContent: this.files[localPath],
            },
          );
          new File(this, localPath, content);
        } else {
          // this file doesnt in the new synth exist, but should
          new File(this, localPath, existingContent);
        }
      });
    } finally {
      removeFolders([existingContentFolder]);
    }
  }
}
