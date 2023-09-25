import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { getDefaultActionIdentifier, ActionIdentifierAlias, ActionDefiniton } from './action';
import { WorkflowDefinition } from '../workflow/workflow';

export interface TestReportActionParameters {
  steps: Step[];
  coverageArtifactName: string;
  testArtifactName: string;
  dependsOn: string[];
  actionName?: string;
}

export interface TestActionConfiguration {
  Steps: Step[];
}
interface Step {
  Run: string;
}

export const addGenericTestReports = (
  params: TestReportActionParameters & {
    blueprint: Blueprint;
    workflow: WorkflowDefinition;
  },
) => {
  const { blueprint, workflow, steps, coverageArtifactName, testArtifactName, dependsOn } = params;
  const actionName = (params.actionName || 'Test').replace(new RegExp('-', 'g'), '_');
  const testAction: ActionDefiniton = {
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
  workflow.Actions = workflow.Actions || {};
  workflow.Actions[actionName] = testAction;
  return actionName;
};
