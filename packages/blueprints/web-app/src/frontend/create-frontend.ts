import { SourceRepository, SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import { web } from 'projen';
import { PROJEN_VERSION } from '../blueprint';
import { createProjenProject } from '../projen-class/create-projen-project';
import { createReadme } from './create-readme';
import { createReplacementFrontend } from './create-replacement-frontend';

export const createFrontend = (
  repository: SourceRepository,
  folder: string,
  options: web.ReactTypeScriptProjectOptions,
): web.ReactTypeScriptProject => {
  const rcvariable = 'frontend';
  const { project, projenrc } = createProjenProject(repository, web.ReactTypeScriptProject, {
    subfolder: folder,
    import: 'web',
    instantiatedClass: 'web.ReactTypeScriptProject',
    rcvariable,
    projenVersion: PROJEN_VERSION,
    projectOptions: options,
  });
  new SourceFile(repository, `${folder}/src/loader.d.ts`,
    `declare module '*.svg' {
  const content: any;
  export default content;
}`);


  // Override the react-scripts test command to generate coverage and test reports
  const reactScriptsTestTask = project.testTask.name;
  const reactScriptsTest = {
    exec: 'react-scripts test --watchAll=false --coverage --reporters default --reporters jest-junit',
    description: "Overrides the react-scripts test command to generate coverage and test reports",
  }
  project.testTask.reset();
  project.addTask(reactScriptsTestTask, reactScriptsTest);
  projenrc.addPostInstantiation({
    line: `${rcvariable}.testTask.reset()`,
  });
  projenrc.addPostInstantiation({
    line: `${rcvariable}.addTask("${reactScriptsTestTask}", ${JSON.stringify(reactScriptsTest, null, 2)});`,
  });

  // Issue: NPM build crawls up the dependency tree and sees a conflicting version of eslint
  //  that is incompatible with create-react-app (i.e react-scripts). We skip the preflight check
  //  to prevent blocking warnings.
  new SourceFile(repository, `${folder}/.env`, 'SKIP_PREFLIGHT_CHECK=true');

  // Need to create a /build directory with an empty .keep file
  new SourceFile(repository, `${folder}/build/.keep`, '');

  // update the index.tsx file to include the replacement app
  new SourceFile(repository, `${folder}/src/App.tsx`, createReplacementFrontend(repository.title));
  new SourceFile(repository, `${folder}/src/config.json`, '{}');

  new SourceFile(repository, `${folder}/README.md`, createReadme());

  return project;
};
