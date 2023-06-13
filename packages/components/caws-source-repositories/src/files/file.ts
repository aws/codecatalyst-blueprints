import * as fs from 'fs';
import path from 'path';
import { SourceRepository } from '../repository';

/**
 * Generic undetermined file, takes a buffer, is written out at synthesis time.
 */
export class File {
  path: string;

  constructor(protected readonly sourceRepository: SourceRepository, filePath: string, content: Buffer) {
    sourceRepository._trackFile(filePath, content);

    this.path = path.join(sourceRepository.relativePath, filePath);
    sourceRepository.project.tryRemoveFile(this.path);

    sourceRepository.addSynthesisStep(() => {
      if (sourceRepository.getFiles[filePath]) {
        const location = path.join(sourceRepository.path, filePath);
        fs.mkdirSync(path.parse(location).dir, { recursive: true });
        fs.writeFileSync(location, content);
      }
    });
  }
}
