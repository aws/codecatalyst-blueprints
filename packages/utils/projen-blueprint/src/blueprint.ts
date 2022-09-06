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

/**
 * Blueprint app in TypeScript
 *
 *
 * @pjid blueprint
 */
export class ProjenBlueprint extends typescript.TypeScriptProject {
  constructor(options: ProjenBlueprintOptions) {
    super({
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
      ...options,
    });

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

    //add additional metadata fields to package.json
    this.package.addField('mediaUrls', options.mediaUrls);
    //display name will be the package name by default
    this.package.addField('displayName', options.displayName || this.package.packageName);
  }
}
