import * as fs from 'fs';
import * as path from 'path';

export function generateGettingStarted() {
  return fs.readFileSync(path.join(__dirname, '../../', 'static-assets/GETTING_STARTED.md')).toString();
}
