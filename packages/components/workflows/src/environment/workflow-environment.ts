import { AccountConnection, Environment } from '@amazon-codecatalyst/blueprint-component.environments';

/**
 * can use convertToWorkflowEnvironment to convert from an Environment to a WorkflowEnvironment
 */
export interface WorkflowEnvironment {
  Name: string;
  Connections: ConnectionDefinition[];
}

export interface ConnectionDefinition {
  Name: string;
  Role: string;
}

export function convertToWorkflowEnvironment(environment: Environment | undefined): WorkflowEnvironment | undefined {
  if (!environment) {
    return undefined;
  }

  const connections: ConnectionDefinition[] = [];
  (environment.accountKeys || []).forEach(key => {
    const account = environment.definition[key] as AccountConnection<any>;
    (environment.getRoles(key) || []).forEach(role => {
      connections.push({
        Name: account.name || '',
        Role: role.name || '',
      });
    });
  });

  return {
    Name: environment.name || '',
    Connections: connections,
  };
}
