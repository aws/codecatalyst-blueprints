import path from 'path';
import { TextFile as ProjenSourceCodeComponent } from 'projen';
import { SourceRepository } from './repository';

export interface Options {
  /**
   * Mark this file as readonly.
   * @default false
   */
  readonly?: boolean;
}

export class SourceFile extends ProjenSourceCodeComponent {
  constructor(
    protected readonly sourceRepository: SourceRepository,
    filePath: string,
    content: string,
    options?: Options,
  ) {
    super(sourceRepository.blueprint, path.join(sourceRepository.relativePath, filePath), {
      readonly: false,
      ...options,
    });
    content.split('\n').forEach(line => this.addLine(line));
  }
}
