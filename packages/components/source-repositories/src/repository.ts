import * as fs from 'fs';
import * as path from 'path';
import { Blueprint, Strategy, isBinary } from '@amazon-codecatalyst/blueprints.blueprint';

import { Component } from 'projen';
import { File } from './files/file';
import { SourceFile } from './files/source-file';
import { SubstitionAsset } from './static-assets';
import { makeValidFolder } from './utilities';

export const sourceRepositoryRootDirectory = 'src';

export interface SourceRepositoryDefinition {
  title: string;
}

export class SourceRepository extends Component {
  public static BUNDLE_PATH = sourceRepositoryRootDirectory;

  public readonly relativePath: string;
  public readonly path: string;
  public readonly title: string;
  public readonly blueprint: Blueprint;
  private readonly files: { [filePath: string]: Buffer } = {};

  // functions that get executed at the end of a synthesis of a repository.
  public readonly synthesisSteps: (() => void)[];

  constructor(protected readonly blueprint_: Blueprint, protected readonly sourceRepository: SourceRepositoryDefinition) {
    super(blueprint_);
    this.blueprint = blueprint_;
    this.sourceRepository.title = makeValidFolder(sourceRepository.title);
    this.title = this.sourceRepository.title;
    this.relativePath = path.join(sourceRepositoryRootDirectory, sourceRepository.title);
    this.path = path.join(this.blueprint.context.rootDir, this.relativePath);
    this.synthesisSteps = [];
  }

  copyStaticFiles(options?: {
    /**
     * From a location inside static assets. This is a directory path prefixed by the location of the static-assets folder.
     * @example 'java/src' - copies all files inside the 'java/src' directory inside static assets
     * @default undefined - defaults to copying everything from inside static-assets/
     */
    from?: string;
    /**
     * To a location inside the repository. This is a directory path.
     * @example 'src' - copies all files to the 'src' directory inside the repository
     * @default undefined - defaults to copying everything to the root of the repository
     */
    to?: string;

    /**
     * Use Mustache subsitution across non-binary assets.
     * @example {
          'my_variable': 'subbed value1',
          'another_variable': 'subbed value2'
        }
     * @param subsitution
     * @returns
     */
    substitute?: { [key: string]: string };
  }) {
    let from = options?.from ? path.join('', options?.from) : '';
    if (from === '.') {
      from = '';
    }

    const to = options?.to || '';

    let fromGlob: string | undefined = undefined;
    if (options?.from) {
      fromGlob = `${path.join(options.from, '**')}`;
    }
    for (const asset of SubstitionAsset.findAll(fromGlob)) {
      const relativeLocation = asset.path().replace(from, '');
      if (isBinary(asset.content())) {
        new File(this, path.join(to, relativeLocation), asset.content());
      } else {
        new SourceFile(this, path.join(to, relativeLocation), options?.substitute ? asset.substitute(options.substitute) : asset.toString());
      }
    }
  }

  getResynthStrategies(_options?: {}): Strategy[] {
    return this.blueprint.getResynthStrategies(path.join(this.relativePath));
  }

  setResynthStrategies(strategies: Strategy[], _options?: {}) {
    this.blueprint.setResynthStrategies(path.join(this.relativePath), strategies);
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

  synthesize(): void {
    const srcDir = path.join(this.blueprint.context.rootDir, sourceRepositoryRootDirectory);
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
    super.synthesize();
    this.synthesisSteps.forEach(step => step());
  }
}
