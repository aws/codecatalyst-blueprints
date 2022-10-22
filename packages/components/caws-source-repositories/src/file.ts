import * as fs from 'fs';
import path from 'path';
import { SourceRepository } from './repository';

/**
 * Generic undetermined file, takes a buffer, is written out at synthesis time.
 */
export class File {
  path: string;

  constructor(protected readonly sourceRepository: SourceRepository, filePath: string, content: Buffer) {
    this.path = path.join(sourceRepository.relativePath, filePath);
    sourceRepository.project.tryRemoveFile(this.path);
    sourceRepository.addSynthesisStep(() => {
      fs.writeFileSync(path.join(sourceRepository.path, filePath), content);
    });
  }
}
