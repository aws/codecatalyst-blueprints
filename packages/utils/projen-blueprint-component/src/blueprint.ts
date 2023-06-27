import * as fs from 'fs';
import * as path from 'path';
import { typescript } from 'projen';

export interface ProjenComponentBlueprintOptions extends typescript.TypeScriptProjectOptions {
  /**
   * Override package version. I hope you know what you're doing.
   */
  readonly overridePackageVersion?: string;
}

/**
 * Blueprint Component app in TypeScript
 *
 *
 * @pjid blueprint
 */
export class ProjenBlueprintComponent extends typescript.TypeScriptProject {
  constructor(options: ProjenComponentBlueprintOptions) {
    super({
      license: 'Apache-2.0',
      projenrcTs: true,
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

    // force node types
    this.addDevDeps('@types/node@^18');

    // modify bumping tasks
    this.removeTask('release');
    this.removeTask('bump');
    this.addTask('bump', {
      exec: 'npm version patch -no-git-tag-version',
    });

    this.package.addField('preferGlobal', true);

    // set custom scripts
    this.setScript('projen', 'npx projen --no-post');
    this.setScript('npm:publish', 'yarn bump && yarn build && yarn package && yarn npm:push');
    this.setScript('npm:push', 'yarn npm publish');
  }

  synth(): void {
    super.synth();

    // // yarn install appends '\n' while projen removes it. This results in annoying commit diffs. Fixing once and for all.
    // const pkgJson = this.tryFindFile('package.json');
    // pkgJson &&
    //   fs.writeFileSync(pkgJson.absolutePath, '\n', {
    //     flag: 'a+',
    //   });
  }
}
