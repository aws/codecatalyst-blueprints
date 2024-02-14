## Components: Issues

In CodeCatalyst, you can monitor features, tasks, bugs, and any other work involved in your project. Each piece of work is kept in a distinct record
called an issue. Each issue can have a description, assignee, status, and other properties, which you can search for, group and filter on. You can
view your issues using the default views, or you can create your own views with custom filtering, sorting, or grouping. For more information about
concepts related to issues, see [Issues concepts](https://docs.aws.amazon.com/codecatalyst/latest/userguide/issues-concepts.html). The issue component
generates a json representation of an issue. The component takes in an id field and issue definition as input.

Issues have quotas. For more information, see [Quotas for issues](https://docs.aws.amazon.com/codecatalyst/latest/userguide/issues-quotas.html).

In your `blueprint.ts`, file, add the following:
```
import {...} from '@amazon-codecatalyst/blueprint-component.issues'
```

### Example 1: Creating an issue

```
import { Issue } from '@amazon-codecatalyst/blueprint-component.issues';
...
new Issue(this, 'myFirstIssue', {
  title: 'myFirstIssue',
  content: 'this is an example issue',
});
```

### Example 2: Creating a high priority issue

```
import { Issue } from '@amazon-codecatalyst/blueprint-component.issues';
...
new Issue(this, 'mySecondIssue', {
  title: 'mySecondIssue',
  content: 'this is an example high priority issue',
  priority: 'HIGH',
});
```

### Example 3: Creating a low priority issue with labels

```
import { Issue } from '@amazon-codecatalyst/blueprint-component.issues';
...
new Issue(this, 'myThirdIssue', {
  title: 'myThirdIssue',
  content: 'this is an example of a low priority issue with a label',
  priority: 'LOW',
  labels: ['exampleLabel'],
});
```
