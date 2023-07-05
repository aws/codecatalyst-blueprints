import { File } from './file';
import { SourceRepository } from '../repository';

export interface Options {
  /**
   * Mark this file as readonly.
   * @deprecated - declare readonly status through the ownership file construct
   * @default false
   */
  readonly?: boolean;
}

export class SourceFile extends File {
  sourceRepository: SourceRepository;
  filepath: string;

  constructor(sourceRepository: SourceRepository, filePath: string, content: string, _options?: Options) {
    sourceRepository._trackFile(filePath, Buffer.from(content, 'utf8'));
    super(sourceRepository, filePath, Buffer.from(content));
    this.sourceRepository = sourceRepository;
    this.filepath = filePath;
  }
}
