import * as fs from 'fs';
import * as pathing from 'path';
import * as glob from 'glob';
import * as Mustache from 'mustache';
import { File } from './files/file';
import { SourceRepository } from './repository';

const STATIC_ASSET_DIRECTORY = 'static-assets';

/**
 * Helper that makes working with static assets easier.
 */
export class StaticAsset {
  static findAll<T extends StaticAsset>(this: new (path: string) => T, globPath?: string, globOptions?: any): T[] {
    return glob
      .sync(pathing.join(globPath ?? '**/*'), {
        cwd: STATIC_ASSET_DIRECTORY,
        nodir: true,
        dot: true,
        ...globOptions,
      })
      .map(path => new this(path));
  }

  /**
   * Copies all files from a subdirectory. This should be a path to a directory inside the static assets folder. This creates a new file in the repository for each file under the directory. This is an easier but slightly more inflexible method of copying files from static assets.
   * @example frontend
   * @param directoryPath - directory under static-assets
   * @param to - repository into which we're putting the files
   * @param options
   */
  static copyFrom(
    directoryPath: string,
    to: SourceRepository,
    options?: {
      globOptions?: any;
      /**
       * apply a transformation across each file;
       */
      transformation?: (file: StaticAsset) => { location?: string; content?: Buffer };
    },
  ) {
    const directory = pathing.join(directoryPath);
    StaticAsset.findAll(pathing.join(directory, '**/*'), options?.globOptions).forEach(file => {
      let location = file.path().replace(directory, '');
      let content = file.content();
      if (options?.transformation) {
        const result = options.transformation(file);
        location = result.location || location;
        content = result.content || content;
      }
      new File(to, location, content);
    });
  }

  private content_: Buffer;
  private location: string;

  constructor(public path_: string) {
    this.content_ = fs.readFileSync(pathing.join(STATIC_ASSET_DIRECTORY, path_));
    this.location = path_;
  }

  /**
   * path relative to the static-assets folder
   * @returns path/inside/static-assets.txt
   */
  path(): string {
    return this.location;
  }
  content(): Buffer {
    return this.content_;
  }
  toString(): string {
    return this.content().toString();
  }
}

/**
 * Asset that can perform a mustache subsitution on the content.
 */
export class SubstitionAsset extends StaticAsset {
  /**
   * Copies all files from a subdirectory. This should be a path to a directory inside the static assets folder. This creates a new file in the repository for each file under the directory.
   * @example findAll(frontend, myrepo)
   * @param directoryPath - directory under static-assets
   * @param to - repository into which we're putting the files
   * @param options
   */
  static copyFrom(
    directoryPath: string,
    to: SourceRepository,
    options?: {
      globOptions?: any;
      /**
       * Allows for Mustache subsitution across assets.
       */
      subsitution?: any;
    },
  ) {
    StaticAsset.copyFrom(directoryPath, to, {
      transformation: file => {
        return {
          content: Buffer.from(Mustache.render(file.content().toString(), options?.subsitution)),
        };
      },
    });
  }

  constructor(path: string) {
    super(path);
  }

  /**
   * @deprecated
   * @param subsitution
   * @returns
   */
  subsitite(subsitution: any): string {
    return this.substitute(subsitution);
  }

  /**
   * Use Mustache subsitution across this asset.
   * @param subsitution
   * @returns
   */
  substitute(subsitution: any): string {
    return Mustache.render(this.content().toString(), subsitution);
  }
}
