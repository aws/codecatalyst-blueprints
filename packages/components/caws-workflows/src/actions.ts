export enum ActionIdentifierAlias {
  build = 'build',
  deploy = 'deploy',
  test = 'test',
}

const ACTION_IDENTIFIERS: { [key: string]: { default: string; prod: string } } = {
  build: {
    default: 'aws/build-beta@v1',
    prod: 'aws/build@v1',
  },
  test: {
    default: 'aws/managed-test-gamma@v1',
    prod: 'aws/managed-test@v1',
  },
  deploy: {
    default: 'aws/cfn-deploy-gamma@v1',
    prod: 'aws/cfn-deploy@v1',
  },
};

export function getDefaultActionIdentifier(alias: ActionIdentifierAlias, environmentIdentifier: string = 'default'): string | undefined {
  return ACTION_IDENTIFIERS[alias]?.[environmentIdentifier] ?? ACTION_IDENTIFIERS[alias]?.default;
}
