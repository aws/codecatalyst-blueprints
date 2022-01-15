import * as fs from 'fs';
import * as path from 'path';
import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import {
  ActionIdentifierAlias,
  BuildActionConfiguration,
  Step,
  StageDefinition,
  Workflow,
  WorkflowDefinition,
  getDefaultActionIdentifier,
} from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  Blueprint as ParentBlueprint,
  Options as ParentOptions,
} from '@caws-blueprint/blueprints.blueprint';
import { AwsCdkTypeScriptApp, SampleFile, SourceCode, awscdk, web } from 'projen';

import defaults from './defaults.json';
import { helloWorldLambdaCallback } from './hello-world-lambda';
import { createLambda } from './lambda-generator';
import { generateReadmeContents } from './readme-contents';
import { generatePackageJson } from './package-json-contents';
import { getStackDefinition, getStackTestDefintion } from './stack';
import { createClass } from './stack-generator';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 * 4. All required members of 'Options' must be defined in 'defaults.json' to synth your blueprint locally
 * 5. The 'Options' member values defined in 'defaults.json' will be used to populate the wizard selection panel with default values
 */
export interface Options extends ParentOptions {
  repositoryName: string;
  /**
   * Name of the folder for the frontend stack, such as react or ui.
   */
  reactFolderName: string;
  /**
   * Name of the folder for the backend stack, such as node or api.
   */
  nodeFolderName: string;
  /**
   * An array of stage definitions
   */
  stages: StageDefinition[];
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;
  protected readonly repository: SourceRepository;
  protected readonly frontend: web.ReactTypeScriptProject;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);
    this.options = options;

    this.repository = new SourceRepository(this, {
      title: this.options.repositoryName,
    });
    new Workspace(this, this.repository, SampleWorkspaces.default);

    this.options.stages.forEach(stage => new Environment(this, stage.environment));

    this.frontend = this.createFrontend();
    this.createStacks();
    this.createWorkflow();
  }

  private createFrontend(): web.ReactTypeScriptProject {
    const project = new web.ReactTypeScriptProject({
      parent: this,
      name: `${this.options.reactFolderName}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${this.repository.relativePath}/${this.options.reactFolderName}`,
      defaultReleaseBranch: 'main',
      deps: [
        'axios',
      ],
    });

    // Issue: NPM build crawls up the dependency tree and sees a conflicting version of eslint
    //  that is incompatible with create-react-app (i.e react-scripts). We skip the preflight check
    //  to prevent blocking warnings.
    const dotenvFile = new SourceCode(project, '.env');
    dotenvFile.line('SKIP_PREFLIGHT_CHECK=true');

    // Need to create a /build directory with an empty .keep file
    project.gitignore.removePatterns('/build/');
    createClass(project.outdir, 'build', '.keep', '');

    return project;
  }

  override synth(): void {
    const readmeContents: string = generateReadmeContents(this.options.reactFolderName, this.options.nodeFolderName);
    new SampleFile(this, path.join(this.repository.relativePath, 'README.md'), { contents: readmeContents });

    const rootPackageJson: string = generatePackageJson(this.options.reactFolderName, this.options.nodeFolderName);
    new SampleFile(this, path.join(this.repository.relativePath, 'README.md'), { contents: rootPackageJson });

    super.synth();

    // overwite the App.tsx file with some additional logic
    const sourceCode = [
      "import logo from './logo.svg';",
      "import './App.css';",
      "import axios from 'axios';",
      "import config from './config.json';",
      "import { useState, useEffect } from 'react';",
      '',
      'function App() {',
      '  const [result, setResult] = useState({ data: null });',
      '  useEffect(() => {',
      '    const getData = async (): Promise<void> => {',
      '      const result = await axios.get(config.HelloWorldAppApiStack.apiurl);',
      '      setResult({ data: result.data });',
      '    };',
      '    getData();',
      '  }, []);',
      '  return (',
      '   <div className="App">',
      '      <header className="App-header">',
      '        <img src={logo} className="App-logo" alt="logo" />',
      '        <p>',
      '          Edit <code>src/App.tsx</code> and save to reload.',
      '        </p>',
      '        <p>',
      '          {result.data}',
      '        </p>',
      '        <a className="App-link"',
      '          href="https://reactjs.org"',
      '          target="_blank"',
      '          rel="noopener noreferrer"',
      '        >',
      '          Learn React',
      '        </a>',
      '      </header>',
      '    </div>',
      '  );',
      '}',
      '',
      'export default App;',
      '',
    ];
    fs.writeFileSync(path.join(this.frontend.outdir, this.frontend.srcdir, 'App.tsx'), sourceCode.join('\n'));
  }

  private createStacks(): AwsCdkTypeScriptApp {
    const project = new AwsCdkTypeScriptApp({
      parent: this,
      cdkVersion: '1.95.2',
      name: `${this.options.nodeFolderName}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${this.repository.relativePath}/${this.options.nodeFolderName}`,
      appEntrypoint: 'main.ts',
      cdkDependencies: [
        '@aws-cdk/core',
        '@aws-cdk/aws-lambda',
        '@aws-cdk/aws-apigateway',
        '@aws-cdk/aws-s3',
        '@aws-cdk/aws-s3-deployment',
        '@aws-cdk/aws-cloudfront',
      ],
      devDeps: ['cdk-assets'],
      context: {
        '@aws-cdk/core:newStyleStackSynthesis': 'true',
      },
      sampleCode: false,
      lambdaAutoDiscover: true,
      defaultReleaseBranch: 'main',
    });

    const lambdaName = `${this.options.repositoryName}Lambda`;
    const lambdaOptions: awscdk.LambdaFunctionOptions = createLambda(
      project,
      lambdaName,
      helloWorldLambdaCallback,
    );

    const stackName = `${this.options.repositoryName}`;
    const sourceCode = getStackDefinition(stackName, this.options, lambdaOptions);
    createClass(project.outdir, project.srcdir, 'main.ts', sourceCode);

    const testCode = getStackTestDefintion(project.appEntrypoint, stackName);
    createClass(project.outdir, project.testdir, 'main.test.ts', testCode);

    return project;
  }

  // TODO: A temporary hack for deploying cdk apps through workflows.
  private createWorkflow() {
    const workflowDefinition: WorkflowDefinition = {
      Name: 'buildAssets',
      Triggers: [
        {
          Type: 'push',
          Branches: ['main'],
        },
      ],
      Actions: {},
    };

    this.options.stages.forEach((stage: StageDefinition) => {
      this.createDeployAction(stage, workflowDefinition);
    });

    new Workflow(
      this,
      this.repository,
      workflowDefinition,
    );
  }

  private createDeployAction(stage: any, workflow: WorkflowDefinition) {
    workflow.Actions[`Build_${stage.environment.title}`] = {
      Identifier: getDefaultActionIdentifier(
        ActionIdentifierAlias.build,
        this.context.environmentId,
      ),
      Configuration: {
        ActionRoleArn: stage.role,
        Steps: [
          { Run: `export awsAccountId=${this.getIdFromArn(stage.role)}` },
          { Run: `export awsRegion=${stage.region}` },
          { Run: `cd ./${this.options.nodeFolderName} && npm install && npm run build` },
          { Run: `npm run env -- cdk bootstrap aws://${this.getIdFromArn(stage.role)}/${stage.region}` },
          { Run: `npm run env -- cdk deploy ${this.options.repositoryName}ApiStack --outputs-file ../${this.options.reactFolderName}/src/config.json --require-approval never` },
          { Run: `cd ../${this.options.reactFolderName} && npm install && npm run build` },
          { Run: `cd ../${this.options.nodeFolderName}` },
          { Run: `npm run env -- cdk deploy ${this.options.repositoryName}Stack --require-approval never --outputs-file config.json` },
          // TODO - a hack to get the cloudformation url to show up under build outputs
          { Run: `eval $(jq -r \'.${this.options.repositoryName}Stack | to_entries | .[] | .key + "=" + (.value | @sh) \' \'config.json\')` },
        ] as Step[],
        OutputVariables: [{ Name: 'CloudFrontURL' }],
      } as BuildActionConfiguration,
    };
  };

  private getIdFromArn(arnRole: string) {
    return arnRole.split(':')[4];
  }
}
