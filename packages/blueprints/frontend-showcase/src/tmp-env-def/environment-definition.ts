export interface Role<Capabilities extends any[]> {
  /**
   * A list of capabilities that this role has.
   * e.g. ['IAM', 'Lambda', 'S3']
   */
  capability: Capabilities;

  /**
   * Role ARN.
   * e.g. arn:aws:iam::123456789012:role/my-role
   */
  arn: string;
}

export interface AccountConnection<Roles extends {[key: string]: Role<any>}> {
  /**
   * The number of the Account
   */
  accountId: string;
  /**
   * A human readable name for the Account
   */
  accountName: string;

  /**
   * Role definitions for the Account
   */
  roles?: Roles;
}

export interface EnvironmentDefinition<AccountConnections extends {[key: string]: AccountConnection<any>}> {
  /**
  * Name of the environment.
  */
  environmentName: string;

  /**
  * Environment description.
  */
  description?: string;

  /**
   * Accounts associated with this environment.
   */
  accountConnections?: AccountConnections;
}
