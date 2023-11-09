import { TriggerType, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';

export function buildReleaseWorkflow(workflow: WorkflowBuilder): WorkflowBuilder {

  workflow.setName('blueprint-release');
  const RELEASE_COMMIT_PREFIX = 'chore(release):';

  workflow.addBranchTrigger(['main']),
  workflow.addTrigger({
    Type: TriggerType.MANUAL,
  });
  workflow.addBuildAction({
    actionName: 'check_commit',
    input: {
      Sources: ['WorkflowSource'],
    },
    output: {
      Variables: [
        'IS_RELEASE_COMMIT',
      ],
    },
    steps: [
      'TRIGGER_COMMIT_ID=$CATALYST_EVENT_SHA',
      'COMMIT_MESSAGE="$(git log -n 1 $TRIGGER_COMMIT_ID --oneline)"',
      `RELEASE_PREFIX='${RELEASE_COMMIT_PREFIX}'`,
      'IS_RELEASE_COMMIT=false',
      'if grep -q "$RELEASE_PREFIX" <<< "$COMMIT_MESSAGE"; then echo \'this is a release commit\' && IS_RELEASE_COMMIT=true; fi',
    ],
  }),

  workflow.addBuildAction({
    actionName: 'build_blueprint',
    dependsOn: ['check_commit'],
    input: {
      Sources: ['WorkflowSource'],
      Variables: {
        IS_RELEASE_COMMIT: '${check_commit.IS_RELEASE_COMMIT}',
      },
    },
    output: {},
    steps: [
      'if $IS_RELEASE_COMMIT; then  echo \'This is a release commit, skipping\' && exit 1; fi',
      'yarn',
      'yarn build',
      'yarn bump',
      'yarn blueprint:package',
    ],
  }),

  workflow.addBuildAction({
    actionName: 'commit_changes',
    dependsOn: ['build_blueprint'],
    input: {
      Sources: ['WorkflowSource'],
      Variables: {
        IS_RELEASE_COMMIT: '${check_commit.IS_RELEASE_COMMIT}',
      },
    },
    output: {},
    steps: [
      'if $IS_RELEASE_COMMIT; then  echo \'This is a release commit, skipping\' && exit 1; fi',
      `RELEASE_COMMIT_MESSAGE="${RELEASE_COMMIT_PREFIX} release on $(date +"%Y %m %d %H:%M:%S")"`,
      'git add .',
      'git commit -m $RELEASE_COMMIT_MESSAGE',
      'git push --force',
    ],
  }),

  workflow.setDefinition({
    ...workflow.getDefinition(),
    Actions: {
      ...workflow.definition.Actions,
      publish_blueprint: {
        Identifier: 'aws/publish-blueprint-action',
        dependsOn: ['commit_changes'],
        Inputs: {
          Sources: ['WorkflowSource'],
          Variables: {
            IS_RELEASE_COMMIT: '${check_commit.IS_RELEASE_COMMIT}',
          },
        },
        Configuration: {
          ArtifactPackagePath: 'dist/*.tgz',
          PackageJSONPath: 'package.json',
          TimeoutInSeconds: '120',
        },
      },
    },
  });
  return workflow;
}