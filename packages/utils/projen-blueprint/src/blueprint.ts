import * as fs from 'fs';
import * as path from 'path';
import { typescript } from 'projen';

export interface ProjenBlueprintOptions extends typescript.TypeScriptProjectOptions {
  /**
   * List of media url links
   */
  readonly mediaUrls?: string[];
  /**
   * Human readable blueprint name
   */
  readonly displayName?: string;

  /**
   * Publishing organization
   */
  readonly publishingOrganization?: string;

  /**
   * Override package version. I hope you know what you're doing.
   */
  readonly overridePackageVersion?: string;
}

const DEFAULT_OPTS = {
  license: 'MIT',
  sampleCode: false,
  github: false,
  eslint: true,
  jest: false,
  npmignoreEnabled: true,
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
      noImplicitAny: false,
    },
  },
};
/**
 * Blueprint app in TypeScript
 *
 *
 * @pjid blueprint
 */
export class ProjenBlueprint extends typescript.TypeScriptProject {
  constructor(options: ProjenBlueprintOptions) {
    const finalOpts = {
      ...DEFAULT_OPTS,
      ...options,
    };
    super(finalOpts);

    const version = options.overridePackageVersion || JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8')).version;
    this.package.addVersion(version || '0.0.0');
    this.addDevDeps('ts-node@^10');

    // modify bumping tasks
    this.removeTask('release');
    this.removeTask('bump');
    this.addTask('bump', {
      exec: 'npm version patch -no-git-tag-version',
    });

    this.addTask('bump:preview', {
      exec: 'npm version prerelease --preid preview -no-git-tag-version',
    });

    // Our version of Projen adds `--updateSnapshot` to the *test* task. We do not want this because we
    // rely on snapshot testing to prevent regressions. Newer versions of Projen (0.63+) support removing
    // this param in an idiomatic way:
    // https://github.com/projen/projen/commit/c84c8f9a64d95c5b6c0d0f20d156f94c5a7f90f2
    // Until then, we remove this argument manually.
    //
    // We cannot update the *test* task without removing it (https://github.com/projen/projen/issues/2243), and we
    // cannot remove it without removing the *build* task too, since there is a dependency.
    this.removeTask('build');
    this.removeTask('test');
    const testOpts = {
      description: 'Run tests',
      steps: [
        (finalOpts.eslint ? { spawn: 'eslint' } : {}),
        (finalOpts.jest ? { exec: 'jest --passWithNoTests' } : {}),
      ],
    };
    this.addTask('test', testOpts);
    // Re-add the *build* task just as it was originally:
    // https://github.com/projen/projen/blob/98b1abc07335bbad3384484591344e6f7dffc70c/src/project-build.ts#L70
    this.addTask('build', {
      description: 'Full release build',
      steps: [
        { spawn: 'default' },
        { spawn: 'pre-compile' },
        { spawn: 'compile' },
        { spawn: 'post-compile' },
        { spawn: 'test' },
        { spawn: 'package' },
      ],
    });

    // set custom scripts
    this.setScript('projen', 'npx projen --no-post');

    //make a script for creating asts
    this.setScript('blueprint:build-ast', 'blueprint build-ast ./lib/blueprint.d.ts --outdir ./lib/');
    this.setScript('blueprint:validate-options', 'blueprint validate-options ./lib/ast.json ./lib/defaults.json');

    //set local synthing
    this.setScript('build:cache', 'yarn build && yarn blueprint:build-ast && yarn blueprint:validate-options');

    this.setScript('blueprint:synth', 'blueprint synth ./ --outdir ./ --options ./src/defaults.json');
    this.setScript('blueprint:synth:cache', 'yarn build:cache && blueprint synth ./ --outdir ./ --options ./src/defaults.json --cache');

    //ignore synths
    this.gitignore.addPatterns('synth');
    this.npmignore?.addPatterns('synth');

    // set upload to aws script
    const organization = options.publishingOrganization || '<<replace-organization>>';
    this.setScript('package', 'rm -rf ./dist/js/ && npx projen package');
    this.setScript(
      'blueprint:preview',
      `yarn bump:preview && yarn blueprint:synth:cache && yarn package && blueprint publish ./ --publisher ${organization}`,
    );

    this.setScript(
      'blueprint:preview:prod',
      `yarn bump:preview && yarn blueprint:synth:cache && yarn package && blueprint publish ./ --publisher ${organization} --endpoint public.api.quokka.codes`,
    );

    //add additional metadata fields to package.json
    this.package.addField('mediaUrls', options.mediaUrls);
    //display name will be the package name by default
    this.package.addField('displayName', options.displayName || this.package.packageName);

    // force the static assets to always be fully included, regardless of .npmignores
    this.package.addField('files', ['static-assets', 'lib']);
  }
}
