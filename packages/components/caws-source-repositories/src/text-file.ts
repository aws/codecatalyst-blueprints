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

export class SourceFile {
  path: string;
  projenSourceCodeComponent: ProjenSourceCodeComponent;

  constructor(protected readonly sourceRepository: SourceRepository, filePath: string, content: string, options?: Options) {
    this.path = path.join(sourceRepository.relativePath, filePath);
    sourceRepository.project.tryRemoveFile(this.path);

    this.projenSourceCodeComponent = new ProjenSourceCodeComponent(sourceRepository.blueprint, path.join(sourceRepository.relativePath, filePath), {
      readonly: false,
      ...options,
    });
    content.split('\n').forEach(line => this.projenSourceCodeComponent.addLine(line));
  }

  addLine(line: string) {
    this.projenSourceCodeComponent.addLine(line);
  }
}
