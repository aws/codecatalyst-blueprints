import { Workspace, SampleWorkspaces } from '@amazon-codecatalyst/blueprint-component.dev-environments';
import devEnvPackage from '@amazon-codecatalyst/blueprint-component.dev-environments/package.json';
import envPackage from '@amazon-codecatalyst/blueprint-component.environments/package.json';
import issuesPackage from '@amazon-codecatalyst/blueprint-component.issues/package.json';

import { SourceFile, SourceRepository } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import sourceReposPackage from '@amazon-codecatalyst/blueprint-component.source-repositories/package.json';
import workflowsPackage from '@amazon-codecatalyst/blueprint-component.workflows/package.json';
import cliPackage from '@amazon-codecatalyst/blueprint-util.cli/package.json';
import { ProjenBlueprint, ProjenBlueprintOptions } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';
import projenBlueprintPackage from '@amazon-codecatalyst/blueprint-util.projen-blueprint/package.json';
import { Blueprint, BlueprintSynthesisErrorTypes } from '@amazon-codecatalyst/blueprints.blueprint';
import baseBlueprintPackage from '@amazon-codecatalyst/blueprints.blueprint/package.json';
import { Options } from './blueprint';

/**
 * This function is responsible for building out all the code that is standard to a blueprint npm package
 * @param blueprint
 * @param repository
 * @param options
 */
export function buildBlueprintPackage(
  blueprint: Blueprint,
  repository: SourceRepository,
  options: {
    space: string;
    packageName: string;
    dashname: string;
    bpOptions: Options;
  },
) {
  repository.copyStaticFiles({
    from: 'standard-blueprint',
  });

  const newBlueprintOptions: ProjenBlueprintOptions = {
    authorName: options.bpOptions.authorName,
    publishingOrganization: options.space,
    packageName: options.packageName,
    name: options.dashname,
    displayName: options.bpOptions.blueprintName,
    defaultReleaseBranch: 'main',
    license: options.bpOptions.advancedSettings?.license || 'MIT',
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
    copyrightOwner: options.space,
    deps: [
      'projen',
      `@amazon-codecatalyst/blueprints.blueprint@${baseBlueprintPackage.version}`,
      `@amazon-codecatalyst/blueprint-component.workflows@${workflowsPackage.version}`,
      `@amazon-codecatalyst/blueprint-component.source-repositories@${sourceReposPackage.version}`,
      `@amazon-codecatalyst/blueprint-component.dev-environments@${devEnvPackage.version}`,
      `@amazon-codecatalyst/blueprint-component.environments@${envPackage.version}`,
      `@amazon-codecatalyst/blueprint-component.issues@${issuesPackage.version}`,
    ],
    description: `${options.bpOptions.description}`,
    devDeps: [
      'ts-node@^10',
      'typescript',
      `@amazon-codecatalyst/blueprint-util.projen-blueprint@${projenBlueprintPackage.version}`,
      `@amazon-codecatalyst/blueprint-util.cli@${cliPackage.version}`,
      'fast-xml-parser',
    ],
    keywords: [...(options.bpOptions.advancedSettings?.tags || ['<<tag>>'])],
    homepage: '',
  };
  console.log('New blueprint options:', JSON.stringify(newBlueprintOptions, null, 2));

  /**
   * Write the projenrc.ts
   */
  new SourceFile(
    repository,
    '.projenrc.ts',
    [
      "import { ProjenBlueprint } from '@amazon-codecatalyst/blueprint-util.projen-blueprint';",
      '',
      `const project = new ProjenBlueprint(${JSON.stringify(
        {
          ...newBlueprintOptions,
          deps: [
            'projen',
            '@amazon-codecatalyst/blueprints.blueprint',
            '@amazon-codecatalyst/blueprint-component.workflows',
            '@amazon-codecatalyst/blueprint-component.source-repositories',
            '@amazon-codecatalyst/blueprint-component.dev-environments',
            '@amazon-codecatalyst/blueprint-component.environments',
            '@amazon-codecatalyst/blueprint-component.issues',
          ],
          devDeps: [
            'ts-node@^10',
            'typescript',
            '@amazon-codecatalyst/blueprint-util.projen-blueprint',
            '@amazon-codecatalyst/blueprint-util.cli',
            'fast-xml-parser',
          ],
        },
        null,
        2,
      )});`,
      '',
      'project.synth();',
    ].join('\n'),
  );

  /**
   * write a dev file that allows publishing within codecatalyst
   */
  new Workspace(blueprint, repository, {
    ...SampleWorkspaces.latest,
    ...{
      components: [
        {
          name: 'aws-runtime',
          container: {
            image: 'public.ecr.aws/aws-mde/universal-image:3.0',
            env: [
              {
                name: 'AWS_PROFILE',
                value: 'codecatalyst',
              },
            ],
            mountSources: true,
            volumeMounts: [
              {
                name: 'docker-store',
                path: '/var/lib/docker',
              },
            ],
          } as any,
        },
        {
          name: 'docker-store',
          volume: {
            size: '16Gi',
          },
        },
      ],
    },
  });

  repository.addSynthesisStep(() => {
    try {
      new ProjenBlueprint({
        outdir: repository.path,
        ...newBlueprintOptions,
        overridePackageVersion: '0.0.0',
      }).synth();
    } catch (error) {
      blueprint.throwSynthesisError({
        name: BlueprintSynthesisErrorTypes.BlueprintSynthesisError,
        message: 'Invalid, could not synthesize code',
      });
    }
  });
}
