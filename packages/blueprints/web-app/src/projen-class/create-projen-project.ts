import * as path from 'path';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Project } from 'projen';
import { ProjenRCFile } from './projenrc-file';

export interface Options {
  subfolder?: string;
  instantiatedClass: string;
  rcvariable: string;
  import: string;
  projectOptions: any;
  projenVersion?: string;

  /*
  * The following are optional and operate over the constructed 'project' to modify projen options that arent exposed in the constructor
  * These should operate over the 'project' variable.
  * e.g. project.gitignore.removePatterns('/build/');
  */
  postConstructOptions?: string[];
}

export const createProjenrc = (options: Options) => {
  const imports = [
    `import { ${options.import} } from 'projen';`,
  ];

  const projectOptions = [
    `const project = new ${options.instantiatedClass}(${JSON.stringify(options.projectOptions, null, 2)});`,
    ...options.postConstructOptions || [],
  ];
  const synth = [
    'project.synth();',
  ];

  return [
    ...imports,
    [],
    ...projectOptions,
    ...synth,
  ].join('\n');
};

/**
 * Creates a projen project with the given options using a projenrc.ts file
 * @param repository
 * @param Project
 * @param options
 * @returns
 */
export const createProjenProject = <T extends Project>(
  repository: SourceRepository,
  ProjenProject: (new (options: any) => T),
  options: Options,
): {
  project: T;
  projenrc: ProjenRCFile;
} => {
  options.projectOptions = {
    projenrcTs: true,
    ...options.projectOptions,
  }

  const project = new ProjenProject({
    outdir: path.join(repository.path, options.subfolder || ''),
    ...options.projectOptions
  });

  if (options.projenVersion && (project as any).addDevDeps) {
    (project as any).addDevDeps(`projen@${options.projenVersion}`);
  }

  // eslint-disable-next-line
  project['synthesize'] = () => {project.synth();};
  repository.blueprint._addComponent(project as any);

  // create a .projenrc file
  const projenrc = new ProjenRCFile(repository, {
    subfolder: options.subfolder,
  });
  projenrc.addImport({
    from: 'projen',
    import: options.import,
  });
  projenrc.addInstantiation({
    instantiatedClass: options.instantiatedClass,
    variable: options.rcvariable,
    options: options.projectOptions,
  });

  return {
    project,
    projenrc,
  };
};
