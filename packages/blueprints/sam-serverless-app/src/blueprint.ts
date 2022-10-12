import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';
import { generateReadmeContents } from './readmeContents';
import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { StaticAsset, SourceFile, SourceRepository } from '@caws-blueprint-component/caws-source-repositories';
import { SampleWorkspaces, Workspace } from '@caws-blueprint-component/caws-workspaces';
import {
  WorkflowDefinition,
  Workflow,
  addGenericBranchTrigger,
  addGenericBuildAction,
  addGenericCloudFormationDeployAction,
  emptyWorkflow,
  AutoDiscoverReportDefinition,
} from '@caws-blueprint-component/caws-workflows';
import { SampleDir, SampleFile } from 'projen';
import * as cp from 'child_process';
import * as path from 'path';

import { runtimeMappings } from './runtimeMappings';
import { FileTemplate, FileTemplateContext, RuntimeMapping } from './models';
import { getFilePermissions, writeFile } from 'projen/lib/util';
import * as fs from 'fs';

/**
 * This is the 'Options' interface. The 'Options' interface is interpreted by the wizard to dynamically generate a selection UI.
 * 1. It MUST be called 'Options' in order to be interpreted by the wizard
 * 2. This is how you control the fields that show up on a wizard selection panel. Keeping this small leads to a better user experience.
 * 3. You can use JSDOCs and annotations such as: '?', @advanced, @hidden, @display - textarea, etc. to control how the wizard displays certain fields.
 */
export interface Options extends ParentOptions {
  /**
   * @displayName Runtime Language
   */
  runtime: 'Python 3.9' | 'Node.js 14' | 'Java 11 Maven' | 'Java 11 Gradle';

  /**
   * The name of the AWS CloudFormation stack generated for the blueprint. It must be unique for the AWS account it's being deployed to.
   * @displayName CloudFormation stack name
   * @validationRegex /^[a-zA-Z][a-zA-Z0-9-]{1,100}$/
   * @validationMessage Stack names must start with a letter, then contain alphanumeric characters and dashes(-) up to a total length of 128 characters
   * @defaultEntropy 5
   */
  cloudFormationStackName: string;

  /**
   * Name for your deployment environment. You can add more environments once the project is created
   * @displayName Environment
   * @collapsed false
   */
  environment: EnvironmentDefinition<{
    /**
     * An AWS account connection is required by the project workflow to deploy to aws.
     * @displayName AWS account connection
     * @collapsed false
     */
    awsAccountConnection: AccountConnection<{
      /**
       * This is the role that will be used to deploy the application. It should have access to deploy all of your resources. See the Readme for more information.
       * @displayName Deploy role
       */
      deployRole: Role<['SAM Deploy']>;

      /**
       * This is the role that allows build actions to access and write to Amazon S3, where your serverless application package is stored.
       * @displayName Build role
       */
      buildRole: Role<['SAM Build']>;
    }>;
  }>;

  /**
   * @displayName Code Repository name
   * @collapsed true
   */
  code: {
    /**
     * @displayName Code Repository name
     * @validationRegex /(?!.*\.git$)^[a-zA-Z0-9_.-]{1,100}$/
     * @validationMessage Must contain only alphanumeric characters, periods (.), underscores (_), dashes (-) and be up to 100 characters in length. Cannot end in .git or contain spaces
     */
    sourceRepositoryName: string;
  };

  /**
   * @displayName Lambda function name
   * @collapsed true
   */
  lambda: {
    /**
     * Lambda function name must be unqiue to the AWS account it's being deployed to.
     * @displayName Lambda function name
     * @defaultEntropy 5
     * @validationRegex /^[a-zA-Z0-9]{1,56}$/
     * @validationMessage Must contain only alphanumeric characters and be up to 56 characters in length
     */
    functionName: string;
  };
}

/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  protected options: Options;
  protected readonly repository: SourceRepository;
  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    /**
     * This is a typecheck to ensure that the defaults passed in are of the correct type.
     * There are some cases where the typecheck will fail, but the defaults will still be valid, such when using enums.
     * you can override this ex. myEnum: defaults.myEnum as Options['myEnum'],
     */
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
      runtime: defaults.runtime as Options['runtime'],
    };
    const options = Object.assign(typeCheck, options_);
    options.code.sourceRepositoryName = sanitizePath(options.code.sourceRepositoryName);
    this.options = options;

    this.repository = new SourceRepository(this, {
      title: this.options.code.sourceRepositoryName || 'sam-lambda',
    });
    this.options.lambda = options.lambda;
  }

  override synth(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const runtime = this.options.runtime!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const runtimeOptions = runtimeMappings.get(runtime)!;
    // create an MDE workspace
    new Workspace(this, this.repository, SampleWorkspaces.default);

    // create an environment
    new Environment(this, this.options.environment);

    // create SAM template and installation scripts
    this.createSamTemplate({
      runtime: runtimeOptions.runtime,
      codeUri: runtimeOptions.codeUri,
      handler: runtimeOptions.handler,
      templateProps: runtimeOptions.templateProps,
    });
    this.createSamInstallScript();

    // create additional files required for this runtime
    const context: FileTemplateContext = {
      repositoryRelativePath: this.repository.relativePath,
      lambdaFunctionName: this.options.lambda?.functionName ?? '.',
    };
    for (const fileTemplate of runtimeOptions.filesToCreate) {
      new SampleFile(this, fileTemplate.resolvePath(context), { contents: fileTemplate.resolveContent(context) });
    }

    // create the build and release workflow
    const workflowName = 'build-and-release';
    this.createWorkflow({
      name: 'build-and-release',
      outputArtifactName: 'build_result',
      stepsToRunUnitTests: runtimeOptions.stepsToRunUnitTests,
      autoDiscoveryOverride: runtimeOptions.autoDiscoveryOverride,
      runtimeOptions,
    });

    // generate the readme
    new SourceFile(
      this.repository,
      'README.md',
      generateReadmeContents({
        runtime,
        runtimeMapping: runtimeOptions,
        defaultReleaseBranch: 'main',
        lambdas: [this.options.lambda],
        environment: this.options.environment,
        cloudFormationStackName: this.options.cloudFormationStackName,
        workflowName: workflowName,
      }),
    );

    const toDeletePath = this.populateLambdaSourceCode({
      runtime: runtimeOptions.runtime,
      cacheDir: runtimeOptions.cacheDir,
      gitSrcPath: runtimeOptions.gitSrcPath,
      filesToOverride: runtimeOptions.filesToOverride,
    });

    super.synth();

    cp.execSync(`rm -rf ${toDeletePath}`);

    // update permissions
    const permissionChangeContext: FileTemplateContext = {
      repositoryRelativePath: path.join(this.outdir, this.repository.relativePath),
      lambdaFunctionName: this.options.lambda?.functionName ?? '.',
    };
    for (const filePermissionChange of runtimeOptions.filesToChangePermissionsFor) {
      fs.chmodSync(filePermissionChange.resolvePath(permissionChangeContext), getFilePermissions(filePermissionChange.newPermissions));
    }
  }

  createWorkflow(params: {
    name: string;
    outputArtifactName: string;
    stepsToRunUnitTests: Array<string>;
    autoDiscoveryOverride?: AutoDiscoverReportDefinition;
    runtimeOptions: RuntimeMapping;
  }): void {
    const { name } = params;

    const stripSpaces = (str: string) => (str || '').replace(/\s/g, '');

    const defaultBranch = 'main';
    const region = 'us-west-2';
    const schemaVersion = '1.0';

    const workflowDefinition: WorkflowDefinition = {
      ...emptyWorkflow,
      SchemaVersion: schemaVersion,
      Name: name,
    };
    addGenericBranchTrigger(workflowDefinition, [defaultBranch]);

    const buildActionName = `build_for_${stripSpaces(this.options.environment.name)}`;
    const samBuildImageOptions = params.runtimeOptions.samBuildImage
      ? `sam build --template-file template.yaml --use-container --build-image ${params.runtimeOptions.samBuildImage}`
      : 'sam build --template-file template.yaml';
    addGenericBuildAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: buildActionName,
      environment: {
        Name: this.options.environment.name || '<<PUT_YOUR_ENVIRONMENT_NAME_HERE>>',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.buildRole?.name || ' ',
          },
        ],
      },
      input: {
        Sources: ['WorkflowSource'],
      },
      output: {
        AutoDiscoverReports: params.autoDiscoveryOverride ?? {
          ReportNamePrefix: 'AutoDiscovered',
          IncludePaths: ['**/*'],
          Enabled: true,
          SuccessCriteria: {
            PassRate: 100,
            LineCoverage: 70,
            BranchCoverage: 50,
          },
        },
        Artifacts: [
          {
            Name: params.outputArtifactName,
            Files: ['**/*'],
          },
        ],
      },
      steps: [
        ...params.stepsToRunUnitTests,
        '. ./.aws/scripts/setup-sam.sh',
        samBuildImageOptions,
        'cd .aws-sam/build/',
        `sam package --output-template-file packaged.yaml --resolve-s3 --template-file template.yaml --region ${region}`,
      ],
    });

    const deployActionName = `deploy_to_${stripSpaces(this.options.environment.name)}`;
    addGenericCloudFormationDeployAction({
      blueprint: this,
      workflow: workflowDefinition,
      actionName: deployActionName,
      inputs: {
        Artifacts: [params.outputArtifactName],
      },
      configuration: {
        parameters: {
          region,
          'name': this.options.cloudFormationStackName,
          'template': '.aws-sam/build/packaged.yaml',
          'no-fail-on-empty-changeset': '1',
        },
      },
      environment: {
        Name: this.options.environment.name || ' ',
        Connections: [
          {
            Name: this.options.environment.awsAccountConnection?.name || ' ',
            Role: this.options.environment.awsAccountConnection?.deployRole?.name || ' ',
          },
        ],
      },
    });
    new Workflow(this, this.repository, workflowDefinition);
  }

  /**
   * Populates source code for lambda functions.
   * Source code is checked out from sam templates
   */
  protected populateLambdaSourceCode(params: {
    runtime: string;
    cacheDir: string;
    gitSrcPath: string;
    filesToOverride: Array<FileTemplate>;
  }): string {
    const sourceDir = path.join('/tmp/sam-lambdas', params.cacheDir);

    cp.execSync(`svn checkout https://github.com/aws/aws-sam-cli-app-templates/trunk/${params.runtime}/${params.gitSrcPath}/{{cookiecutter.project_name}} ${sourceDir}; \
      rm -rf ${sourceDir}/.svn ${sourceDir}/.gitignore ${sourceDir}/README.md ${sourceDir}/template.yaml`);

    // override any files that need to be overridden
    const overrideContext: FileTemplateContext = {
      repositoryRelativePath: sourceDir,
      lambdaFunctionName: this.options.lambda?.functionName ?? '.',
    };
    for (const fileTemplate of params.filesToOverride) {
      writeFile(fileTemplate.resolvePath(overrideContext), fileTemplate.resolveContent(overrideContext));
    }

    // copy the lambda to the new path
    const newLambdaPath = path.join(this.repository.relativePath, this.options.lambda?.functionName ?? '');
    new SampleDir(this, newLambdaPath, { sourceDir });
    return sourceDir;
  }

  protected createSamInstallScript() {
    new SampleFile(this, path.join(this.repository.relativePath, '.aws', 'scripts', 'setup-sam.sh'), {
      contents: new StaticAsset('setup-sam.sh').toString(),
    });
  }

  protected createSamTemplate(params: { runtime: string; codeUri: string; handler: string; templateProps: string }): void {
    const header = `Transform: AWS::Serverless-2016-10-31
Description: lambdas
Globals:
  Function:
    Timeout: 20\n`;
    let resources = 'Resources:';
    let outputs = 'Outputs:';
    for (const lambda of [this.options.lambda?.functionName]) {
      resources += `
  ${lambda}Function:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ${lambda}/${params.codeUri}
      Runtime: ${params.runtime}
      Handler: ${params.handler}
      Description: ${lambda}
      Events:
          ${lambda}:
             Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
             Properties:
                Path: /${lambda}
                Method: get`;
      //Append additional template properties
      resources += params.templateProps;

      outputs += `
# ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
# Find out more about other implicit resources you can reference within SAM
# https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  ${lambda}Api:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/${lambda}/"
  ${lambda}Function:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt ${lambda}Function.Arn
  ${lambda}FunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt ${lambda}FunctionRole.Arn`;
    }

    const destinationPath = path.join(this.repository.relativePath, 'template.yaml');
    const template = header + resources + '\n' + outputs;
    new SampleFile(this, destinationPath, { contents: template });
  }
}

/**
 * removes all '.' '/' and ' ' characters
 */
function sanitizePath(path: string) {
  return path.replace(/\.|\/| /g, '');
}
