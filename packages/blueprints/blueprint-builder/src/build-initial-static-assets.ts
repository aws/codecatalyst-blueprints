import * as path from 'path';
import { File, SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { ContextFile } from '@amazon-codecatalyst/blueprints.blueprint/lib/resynthesis/context-file';

/**
 * converts an existing project to a blueprint
 * @param blueprint
 * @param repository
 * @param options
 */
export function buildInitialStaticAssets(
  repository: SourceRepository,
  options: {
    existingFiles: ContextFile[];
  },
) {
  for (const file of options.existingFiles) {
    let newPath = file.path;
    console.log('path: ' + newPath);
    newPath = replaceEndWith(newPath, '.npmignore', '_npmignore');
    newPath = replaceEndWith(newPath, '.gitignore', '_gitignore');

    new File(repository, path.join('static-assets', 'starter-code', newPath), file.buffer);
  }

  console.log('getting here');
  repository.copyStaticFiles({
    from: 'converted-blueprint',
  });
}

function replaceEndWith(str: string, occurance: string, replacement: string): string {
  if (str.endsWith(occurance)) {
    return str.substring(0, str.lastIndexOf(occurance)) + replacement;
  }
  return str;
}
