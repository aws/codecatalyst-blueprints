import * as fs from 'fs';
import * as path from 'path';

export function createClass(outdir: string, srcdir: string, filename: string, sourceCode: string) {
  const sourceDirectory = path.join(outdir, srcdir);
  fs.mkdirSync(sourceDirectory, { recursive: true });
  fs.writeFileSync(path.join(sourceDirectory, filename), sourceCode);
}
