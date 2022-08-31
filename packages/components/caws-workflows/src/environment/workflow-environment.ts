import { Environment } from '@caws-blueprint-component/caws-environments';

export interface WorkflowEnvironment {
  Name: string;
  Connections: ConnectionDefinition[];
}

export interface ConnectionDefinition {
  Name: string;
  Role: string;
}

export function convertToWorkflowEnvironment(environment: Environment): WorkflowEnvironment {
  const connections: ConnectionDefinition[] = [];
  environment.accountNames.forEach(accountName => {
    environment.getRoles(accountName).forEach(role => {
      connections.push({
        Name: accountName || '',
        Role: role.name || '',
      });
    });
  });

  return {
    Name: environment.name || '',
    Connections: connections,
  };
}
