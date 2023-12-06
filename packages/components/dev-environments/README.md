```
import {...} from '@amazon-codecatalyst/blueprint-component.dev-environments'
```

# Managed Development Environment Workspace Component

MDE (managed development environments) are used to create and stand up MDE workspaces in codecatalyst. This component generates a 
[devfile.yaml](https://redhat-developer.github.io/devfile/). These can be used to define and bootstrap a cloud developer workspace.

```
new Workspace(this, repository, SampleWorkspaces.default);
```

Please see [Dev Environment public documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/devenvironment-devfile.html#devenvironment-devfile-moving).
