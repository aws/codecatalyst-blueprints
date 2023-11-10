import { TriggerType, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';

export function buildReleaseWorkflow(workflow: WorkflowBuilder): WorkflowBuilder {
  workflow.setName('blueprint-release');
  const RELEASE_COMMIT_PREFIX = 'chore(release):';
  const BUILD_ARTIFACT_NAME = 'codebase';

  workflow.addBranchTrigger(['main']);
  workflow.addTrigger({
    Type: TriggerType.MANUAL,
  });
  workflow.addBuildAction({
    actionName: 'check_commit',
    input: {
      Sources: ['WorkflowSource'],
    },
    output: {
      Variables: ['IS_RELEASE_COMMIT'],
    },
    steps: [
      'TRIGGER_COMMIT_ID=$CATALYST_EVENT_SHA',
      'COMMIT_MESSAGE="$(git log -n 1 $TRIGGER_COMMIT_ID --oneline)"',
      `RELEASE_PREFIX='${RELEASE_COMMIT_PREFIX}'`,
      'IS_RELEASE_COMMIT=false',
      'if grep -q "$RELEASE_PREFIX" <<< "$COMMIT_MESSAGE"; then echo \'this is a release commit\' && IS_RELEASE_COMMIT=true; fi',
    ],
  });
  workflow.addBuildAction({
    actionName: 'build_blueprint',
    dependsOn: ['check_commit'],
    input: {
      Sources: ['WorkflowSource'],
      Variables: {
        IS_RELEASE_COMMIT: '${check_commit.IS_RELEASE_COMMIT}',
      },
    },
    output: {
      Artifacts: [
        {
          Name: BUILD_ARTIFACT_NAME,
          Files: ['**/*'],
        },
      ],
    },
    steps: [
      "if $IS_RELEASE_COMMIT; then  echo 'This is a release commit, skipping' && exit 1; fi",
      'yum install -y rsync',
      'npm install -g yarn',
      'yarn',
      'yarn build',
      'yarn bump',
      'yarn blueprint:package',
    ],
  });
  // TODO: Build actions can't push back to source yet:
  // workflow.addBuildAction({
  //   actionName: 'commit_changes',
  //   dependsOn: ['build_blueprint'],
  //   input: {
  //     Sources: ['WorkflowSource'],
  //     Variables: {
  //       IS_RELEASE_COMMIT: '${check_commit.IS_RELEASE_COMMIT}',
  //     },
  //   },
  //   output: {},
  //   steps: [
  //     "if $IS_RELEASE_COMMIT; then  echo 'This is a release commit, skipping' && exit 1; fi",
  //     `RELEASE_COMMIT_MESSAGE="${RELEASE_COMMIT_PREFIX} release on $(date +"%Y %m %d %H:%M:%S")"`,
  //     'git add .',
  //     'git commit -m $RELEASE_COMMIT_MESSAGE',
  //     'git push --force',
  //   ],
  // });
  workflow.addPublishBlueprintAction({
    actionName: 'publish_blueprint',
    dependsOn: ['build_blueprint'],
    inputs: {
      Sources: ['WorkflowSource'],
      Artifacts: [BUILD_ARTIFACT_NAME],
      // TODO: The action doesn't handle this env var correctly:
      // Variables: [
      //   {
      //     Name: 'IS_RELEASE_COMMIT',
      //     Value: '${check_commit.IS_RELEASE_COMMIT}',
      //   },
      // ],
    },
    configuration: {
      ArtifactPackagePath: 'dist/js/*.tgz',
      PackageJSONPath: 'package.json',
      InputArtifactName: BUILD_ARTIFACT_NAME,
      TimeoutInSeconds: '120',
    },
  });

  return workflow;
}
