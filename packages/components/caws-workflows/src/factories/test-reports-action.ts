import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { WorkflowDefinition, Step, getDefaultActionIdentifier, ActionIdentifierAlias } from '..';

export const addGenericTestReports = (params: {
  blueprint: Blueprint;
  workflow: WorkflowDefinition;
  steps: Step[];
  coverageArtifactName: string;
  testArtifactName: string;
  dependsOn: string[];
  actionName?: string;
}) => {
  const { blueprint, workflow, steps, coverageArtifactName, testArtifactName, dependsOn } = params;
  const actionName = params.actionName || 'Test';
  workflow.Actions[actionName] = {
    DependsOn: dependsOn,
    Identifier: getDefaultActionIdentifier(ActionIdentifierAlias.test, blueprint.context.environmentId),
    Outputs: {
      Artifacts: [
        {
          Name: coverageArtifactName,
          Files: ['reports/cov.xml'],
        },
        {
          Name: testArtifactName,
          Files: ['reports/report.xml'],
        },
      ],
      Reports: [coverageArtifactName, testArtifactName],
    },
    Configuration: {
      Steps: steps,
    },
  };
  return actionName;
};
