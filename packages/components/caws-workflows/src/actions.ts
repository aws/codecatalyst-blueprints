export enum ActionIdentifierAlias {
  build = 'build',
  deploy = 'deploy',
  test = 'test',
}

const ACTION_IDENTIFIERS: {[key: string]: {default: string; prod: string}} = {
  build: {
    default: 'aws-actions/cawsbuildprivate-build@v1',
    prod: 'aws/build@v1',
  },
  test: {
    default: 'aws-actions/cawstestbeta-test@v1',
    prod: 'aws/managed-test@v1',
  },
  deploy: {
    default: 'aws/cloudformation-deploy-gamma@v1',
    prod: 'aws/cloudformation-deploy@v1',
  },
};

export function getDefaultActionIdentifier(
  alias: ActionIdentifierAlias,
  environmentIdentifier: string = 'default',
): string | undefined {
  return ACTION_IDENTIFIERS[alias]?.[environmentIdentifier] ?? ACTION_IDENTIFIERS[alias]?.default;
}
