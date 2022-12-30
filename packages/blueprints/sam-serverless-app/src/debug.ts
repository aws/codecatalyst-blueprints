import * as globule from 'globule';
import * as path from 'path';
import * as fs from 'fs';

// these are the files under snapshot
const SNAPSHOT_GLOBS: string[] = ['**', '!environments/**', '!aws-account-to-environment/**'];
const outdir = '/Users/alexfors/code-aws/blueprints/caws-blueprints/packages/blueprints/sam-serverless-app/synth/01.snapshot.python39.json';

(() => {
  const elements = globule
    .find(['**/*', '**/*.??*', '*'], {
      cwd: outdir,
      dot: true,
    })
    .filter(element =>
      globule.isMatch(SNAPSHOT_GLOBS, element, {
        dot: true,
      }),
    )
    .filter(directory => !fs.lstatSync(path.join(outdir, directory)).isDirectory());
  console.log(elements);
})();
