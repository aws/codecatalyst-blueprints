export interface Role<Capabilities extends any[]> {
  /**
   * A list of capabilities that this role has.
   * e.g. ['IAM', 'Lambda', 'S3']
   */
  capability: Capabilities | any[]; // hack due to typescript bug in

  /**
   * Role ARN.
   * e.g. arn:aws:iam::123456789012:role/my-role
   */
  arn: string;

  /**
   * A human readable name for the role
   */
  name: string;
}

export type AccountConnection<T extends { [key: string]: Role<any> }> = Partial<T> & {
  /**
   * The number of the Account
   */
  id: string;
  /**
   * A human readable name for the Account
   */
  name: string;
};

export type EnvironmentDefinition<T extends { [key: string]: AccountConnection<any> }> = Partial<T> & {
  /**
   * Name of the environment.
   */
  name: string;

  /**
   * Environment type.
   * only 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' are supported.
   */
  environmentType: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | string;

  /**
   * Environment description.
   */
  description?: string;
};
