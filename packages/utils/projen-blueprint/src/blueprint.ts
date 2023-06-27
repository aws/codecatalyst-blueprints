import * as fs from 'fs';
import * as path from 'path';
import { typescript } from 'projen';

import { generateTestSnapshotInfraFiles } from './test-snapshot';

export interface BlueprintSnapshotConfiguration {
  /**
   * Which file paths do you want to snapshot across
   */
  snapshotGlobs?: string[];
}

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

  /**
   * Blueprint snapshot configuration
   */
  readonly blueprintSnapshotConfiguration?: BlueprintSnapshotConfiguration;
}

const DEFAULT_OPTS = {
  license: 'Apache-2.0',
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

    /**
     * We explicitly set the version of projen to cut down on author errors.
     * This is not strictly nessassary. Authors may override this by putting
     * this.addDevDeps('projen@something-else') in their package
     */
    this.addDevDeps('projen@^0.71.112');

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
    const testTask = this.tasks.tryFind('test');
    if (testTask) {
      testTask.reset();
      // The following logic is a simplification of what Projen does, so there may be projects where
      // the updated jest invocation doesn't work, but it works well enough for our blueprints.
      if (finalOpts.eslint) {
        const eslintTask = this.tasks.tryFind('eslint');
        if (eslintTask) {
          testTask.spawn(eslintTask);
        }
      }
      if (finalOpts.jest) {
        testTask.exec('jest --ci --passWithNoTests --verbose');
      }
    }

    // set custom scripts
    this.setScript('projen', 'npx projen --no-post');

    //make a script for creating asts
    this.setScript('blueprint:build-ast', 'blueprint build-ast ./lib/blueprint.d.ts --outdir ./lib/');
    this.setScript('blueprint:validate-options', 'blueprint validate-options ./lib/ast.json ./lib/defaults.json');

    //set local synthing
    this.setScript('build:cache', 'yarn build && yarn blueprint:build-ast && yarn blueprint:validate-options');

    //ignore synths
    this.gitignore.addPatterns('synth');
    this.npmignore?.addPatterns('synth');

    // set upload to aws script
    const organization = options.publishingOrganization || '<<replace-organization>>';
    this.setScript('package', 'rm -rf ./dist/js/ && npx projen package');

    this.setScript(
      'blueprint:preview',
      `yarn bump:preview && yarn blueprint:synth --cache && yarn package && blueprint publish ./ --publisher ${organization} $*`,
    );

    //add additional metadata fields to package.json
    this.package.addField('mediaUrls', options.mediaUrls);
    //display name will be the package name by default
    this.package.addField('displayName', options.displayName || this.package.packageName);

    // force the static assets to always be fully included, regardless of .npmignores
    this.package.addField('files', ['static-assets', 'lib']);

    let synthCommand = [
      'blueprint drive-synth',
      '--blueprint ./',
      '--outdir ./synth',
      '--default-options ./src/defaults.json',
      '--additional-options ./src/wizard-configurations',
    ].join(' ');

    let resynthCommand = [
      'blueprint drive-resynth',
      '--blueprint ./',
      '--outdir ./synth',
      '--default-options ./src/defaults.json',
      '--additional-options ./src/wizard-configurations',
    ].join(' ');

    if (finalOpts.blueprintSnapshotConfiguration) {
      if (finalOpts.jest) {
        this.addDeps('globule');

        this.addDeps('pino@^6.13.4');
        this.addDevDeps('@types/pino@^6.3.12');
        this.addDevDeps('pino-pretty@^4.8.0');

        this.addPeerDeps('@caws-blueprint-util/blueprint-cli');

        generateTestSnapshotInfraFiles(this, finalOpts.blueprintSnapshotConfiguration);
      } else {
        console.error('Snapshot configuration is enabled but requires option "jest" to also be enabled.');
      }
    }

    this.setScript('blueprint:synth', `${synthCommand} $*`);
    this.setScript('blueprint:resynth', `${resynthCommand} $*`);

    if (options.eslint) {
      this.eslint?.addIgnorePattern('src/blueprint-snapshot-*');
    }
  }

  synth(): void {
    super.synth();
  }
}
