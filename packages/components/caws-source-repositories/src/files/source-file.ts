import path from 'path';
import { IResolver, TextFile } from 'projen';
import { SourceRepository } from '../repository';

export interface Options {
  /**
   * Mark this file as readonly.
   * @default false
   */
  readonly?: boolean;
}

export class SourceFile extends TextFile {
  sourceRepository: SourceRepository;
  filepath: string;

  constructor(sourceRepository: SourceRepository, filePath: string, content: string, options?: Options) {
    sourceRepository._trackFile(filePath, Buffer.from(content, 'utf8'));
    super(sourceRepository.blueprint, path.join(sourceRepository.relativePath, filePath), {
      readonly: false,
      ...options,
    });
    this.sourceRepository = sourceRepository;
    this.filepath = filePath;
  }

  protected synthesizeContent(_: IResolver): string | undefined {
    return this.sourceRepository.getFiles()[this.filepath]?.toString();
  }
}
