import { SourceFile, SourceRepository, SubstitionAsset } from '@amazon-codecatalyst/blueprint-component.source-repositories';
import { TriggerType, WorkflowBuilder } from '@amazon-codecatalyst/blueprint-component.workflows';

export function buildReleaseWorkflow(
  workflow: WorkflowBuilder,
  repository: SourceRepository,
  options?: { includePublishStep?: boolean },
): WorkflowBuilder {
  const publishingEnabled = options?.includePublishStep ?? true;

  workflow.setName('blueprint-release');
  const RELEASE_COMMIT_PREFIX = 'chore(release):';
  const BUILD_ARTIFACT_NAME = 'codebase';

  const releaseScript = new SubstitionAsset('release.sh');
  new SourceFile(repository, 'release.sh', releaseScript.substitute({ commitPrefix: RELEASE_COMMIT_PREFIX }));

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
    actionName: 'build_and_commit',
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
    steps: ["if $IS_RELEASE_COMMIT; then  echo 'This is a release commit, skipping'; else chmod +x release.sh && ./release.sh; fi"],
  });

  if (publishingEnabled) {
    workflow.addPublishBlueprintAction({
      actionName: 'publish_blueprint',
      dependsOn: ['build_and_commit'],
      inputs: {
        Artifacts: [BUILD_ARTIFACT_NAME],
        Variables: [
          {
            Name: 'IS_RELEASE_COMMIT',
            Value: '${check_commit.IS_RELEASE_COMMIT}',
          },
        ],
      },
      configuration: {
        ArtifactPackagePath: 'dist/js/*.tgz',
        PackageJSONPath: 'package.json',
        InputArtifactName: BUILD_ARTIFACT_NAME,
        TimeoutInSeconds: '120',
      },
    });
  }

  return workflow;
}
