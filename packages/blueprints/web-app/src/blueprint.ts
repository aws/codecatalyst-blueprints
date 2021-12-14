import { Environment } from '@caws-blueprint-component/caws-environments';
import { SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { Workflow, BuildActionConfiguration, Step, WorkflowDefinition } from '@caws-blueprint-component/caws-workflows';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/caws.blueprint';
import { awscdk, AwsCdkTypeScriptApp, Project, SourceCode, web } from 'projen';

import defaults from './defaults.json';
import { helloWorldLambdaCallback } from './hello-world-lambda';
import { createLambda } from './lambda-generator';
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
  /**
   * The name of the source repository.
   */
  sourceRepositoryName: string;
  /**
   * Frontend related parameters
   */
  frontend: {
    /**
     * Name of the frontend project and directory.
     */
    name: string;
    /**
     * Frontend license.
     */
    license?: 'MIT' | 'Apache-2.0';
  };
  backend: {
    /**
     * Name of the backend project and directory.
     */
    name: string;
    /**
     * Backend license.
     */
    license?: 'MIT' | 'Apache-2.0';
  };
  /**
   * An array of stage definitions
   */
  stages: any[];
  /**
   * Default release branch.
   * @advanced
   */
  defaultReleaseBranch?: string;
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;

  constructor(options_: Options) {
    super(options_);
    const options = Object.assign(defaults, options_);
    this.options = options;

    const repository = new SourceRepository(this, {
      title: this.options.sourceRepositoryName,
    });
    new Workspace(this, repository, SampleWorkspaces.default);

    this.options.stages.forEach(stage => new Environment(this, stage.environment));

    this.createFrontend(repository);
    this.createStacks(repository);
    this.createWorkflow(repository);
  }

  private createFrontend(repo: SourceRepository): web.ReactTypeScriptProject {
    const project = new web.ReactTypeScriptProject({
      parent: this,
      name: `${this.options.frontend.name}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${repo.relativePath}/${this.options.frontend.name}`,
      license: this.options.frontend.license,
      defaultReleaseBranch: this.options.defaultReleaseBranch as string,
    });

    // Issue: NPM build crawls up the dependency tree and sees a conflicting version of eslint
    //  that is incompatible with create-react-app (i.e react-scripts). We skip the preflight check
    //  to prevent blocking warnings.
    const dotenvFile = new SourceCode(project, '.env');
    dotenvFile.line('SKIP_PREFLIGHT_CHECK=true');

    return project;
  }

  private createStacks(repo: SourceRepository): Project {
    const project = new AwsCdkTypeScriptApp({
      parent: this,
      cdkVersion: '1.95.2',
      name: `${this.options.backend.name}`,
      authorEmail: 'caws@amazon.com',
      authorName: 'codeaws',
      outdir: `${repo.relativePath}/${this.options.backend.name}`,
      appEntrypoint: 'main.ts',
      cdkDependencies: [
        '@aws-cdk/core',
        '@aws-cdk/aws-lambda',
        '@aws-cdk/aws-apigateway',
        '@aws-cdk/aws-s3',
        '@aws-cdk/aws-s3-deployment',
        '@aws-cdk/aws-cloudfront',
      ],
      devDeps: [
        'cdk-assets',
      ],
      context: {
        // TODO: may be able to remove this
        //       and is related to using cdk-assets?
        '@aws-cdk/core:newStyleStackSynthesis': 'true',
      },
      sampleCode: false,
      lambdaAutoDiscover: true,
      license: this.options.backend.license,
      defaultReleaseBranch: this.options.defaultReleaseBranch as string,
    });

    const lambdaName = `${this.options.sourceRepositoryName}Lambda`;
    const lambdaOptions: awscdk.LambdaFunctionOptions = createLambda(project, lambdaName, helloWorldLambdaCallback);

    const stackName = `${this.options.sourceRepositoryName}Stack`;

    const sourceCode = getStackDefinition(stackName, this.options, lambdaOptions);
    createClass(project.outdir, project.srcdir, 'main.ts', sourceCode);

    const testCode = getStackTestDefintion(project.appEntrypoint, stackName);
    createClass(project.outdir, project.testdir, 'main.test.ts', testCode);

    return project;
  }

  // TODO: A temporary hack for deploying cdk apps through workflows.
  private createWorkflow(repository: SourceRepository) {
    const workflowDefinition: WorkflowDefinition = {
      Name: 'buildAssets',
      Triggers: [
        {
          Type: 'push',
          Branches: [this.options.defaultReleaseBranch as string],
        },
      ],
      Actions: {},
    };

    this.options.stages.forEach((stage: any) => {
      this.createDeployAction(stage, workflowDefinition);
    });

    new Workflow(
      this,
      repository,
      workflowDefinition,
    );

  }

  private createDeployAction(stage: any, workflow: WorkflowDefinition) {
    workflow.Actions[`Build_${stage.environment.title}`] = {
      Identifier: 'aws-actions/cawsbuildprivate-build@v1',
      Configuration: {
        ActionRoleArn: stage.role,
        Steps: [
          { Run: `export awsAccountId=${this.getIdFromArn(stage.role)}` },
          { Run: `export awsRegion=${stage.region}` },
          { Run: `cd ./${this.options.frontend.name} && npm install && npm run build` },
          { Run: `cd ../${this.options.backend.name} && npm install && npm run build` },
          // { Run: `export AWS_SDK_LOAD_CONFIG=1` },
          { Run: `npm run env -- cdk bootstrap aws://${this.getIdFromArn(stage.role)}/${stage.region}` },
          { Run: 'npm run env -- cdk deploy --require-approval never' },
          // TODO - Look into using this to push artifacts to s3.
          // { Run: `npm run env -- cdk synth` },
          // { Run: `npm run env -- cdk-assets publish --path ./cdk.out/${this.options.sourceRepositoryName}Stack.assets.json` }
        ] as Step[],
      } as BuildActionConfiguration,
    };
    //         workflow.Actions[`Bootstrap_${stage.environment.title}`] = {
    //           DependsOn: [`Build_${stage.environment.title}`],
    //           Identifier: 'aws-actions/cawsbuildprivate-build@v1',
    //           Configuration: {
    //             ActionRoleArn: stage.role,
    //             Steps: [
    //             ] as Step[],
    //           }
    //         }

    //         workflow.Actions[`Deploy_${stage.environment.title}`] = {
    //           DependsOn: [`Bootstrap_${stage.environment.title}`],
    //           Identifier: 'aws-actions/cawsbuildprivate-build@v1',
    //           Configuration: {
    //             ActionRoleArn: stage.role,
    //             Steps: [
    //             ] as Step[],
    //           } as BuildActionConfiguration,
    //         };
  };

  private getIdFromArn(arnRole: string) {
    return arnRole.split(':')[4];
  }
}
