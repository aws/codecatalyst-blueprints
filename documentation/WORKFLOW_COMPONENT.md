## Workflow Component

The workflow component is used by code.aws projects to execute some actions based off triggers. While the blueprints team does expose some helpful
workflows components, these are meant to help in building and putting together `workflow.yaml` files. Full workflow documentation is provided by the
workflow team.

```
import { WorkflowBuilder, Workflow } from '@caws-blueprint-component/caws-workflows'
```

## WorkflowBuilder Component

This is a class that helps build a workflow defintion. This can then be given over to a workflow component for rendering in a repository.

```
import { WorkflowBuilder } from '@caws-blueprint-component/caws-workflows'

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
  environment: convertToWorkflowEnvironment(environment as Environment),
});

```

## Workflow projen Component

This is a projen component that writes a workflow yaml to a repository.

```
import { Workflow } from '@caws-blueprint-component/caws-workflows'

...

const repo = new SourceRepository
const blueprint = this;
const workflowDef = workflowBuilder.getDefinition()

// creates a workflow.yaml at .aws/workflows/${workflowDef.name}.yaml
new Workflow(blueprint, repo, workflowDef);

// can also pass in any object and have it rendered as a yaml. This is unsafe and may not produce a valid workflow
new Workflow(blueprint, repo, {... some object ...});

```

## Connecting to an Environment

Many workflows need to to run in an aws account connection. Workflows deals with this by allowing actions to connect to environments, with account and
role name specifications.

```
import { convertToWorkflowEnvironment } from '@caws-blueprint-component/caws-workflows'


const myEnv = new Environment(...);

// can be passed into a workflow constructor
const workflowEnvironment = convertToWorkflowEnvironment(myEnv);

```
