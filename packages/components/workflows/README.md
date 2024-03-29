```
import {...} from '@amazon-codecatalyst/blueprint-component.workflows'
```

The workflow component can be found [here](https://github.com/aws/codecatalyst-blueprints/tree/main/packages/components/workflows).

## What is a workflow component?

A workflow is used by CodeCatalyst projects to execute some actions based off triggers. The blueprints team exposes some helpful workflows components
that are meant to help in building and putting together workflow yaml files. See
[public workflows documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/workflow-reference.html) for general use.

```
import { WorkflowBuilder, Workflow } from '@amazon-codecatalyst/blueprint-component.workflows'
```

### Example 1: WorkflowBuilder component

This is a class that helps build a workflow definition. This can then be given over to a workflow component for rendering in a repository.

```
import { WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows'

const workflowBuilder = new WorkflowBuilder({} as Blueprint, {
  Name: 'my_workflow',
});

// trigger the workflow on pushes to branch 'main'
workflowBuilder.addBranchTrigger(['main']);

// add a build action
workflowBuilder.addBuildAction({
  // give the action a name
  actionName: 'build_and_do_some_other_stuff',

  // the action pulls from source code
  input: {
    Sources: ['WorkflowSource'],
  },

  // the output attempts to autodiscover test reports, but not in the node modules
  output: {
    AutoDiscoverReports: {
      Enabled: true,
      ReportNamePrefix: AutoDiscovered,
      IncludePaths: ['**/*'],
      ExcludePaths: ['*/node_modules/**/*'],
    },
  },
  // execute some arbitrary steps
  steps: [
    'npm install',
    'npm run myscript',
    'echo hello-world',
  ],
  // add an account connection to the workflow
  environment: convertToWorkflowEnvironment(myEnv),
});
```

### Example 2: Workflow projen component

This is a projen component that writes a workflow yaml to a repository.

```
import { Workflow } from '@amazon-codecatalyst/blueprint-component.workflows'

...

const repo = new SourceRepository
const blueprint = this;
const workflowDef = workflowBuilder.getDefinition()

// creates a workflow.yaml at .aws/workflows/${workflowDef.name}.yaml
new Workflow(blueprint, repo, workflowDef);

// can also pass in any object and have it rendered as a yaml. This is unsafe and may not produce a valid workflow
new Workflow(blueprint, repo, {... some object ...});

```

## Connecting to an environment

Many workflows need to run in an AWS account connection. Workflows deal with this by allowing actions to connect to environments, with account and
role name specifications.

```
import { convertToWorkflowEnvironment } from '@amazon-codecatalyst/blueprint-component.workflows'


const myEnv = new Environment(...);

// can be passed into a workflow constructor
const workflowEnvironment = convertToWorkflowEnvironment(myEnv);


// add a build action
workflowBuilder.addBuildAction({
  ...
  // add an account connection to the workflow
  environment: convertToWorkflowEnvironment(myEnv),
});
```
