import * as crypto from 'crypto';
import { Blueprint } from '@amazon-codecatalyst/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
import { Role } from '.';
import { AccountConnection, EnvironmentDefinition } from './environment-definition';

const stripSpaces = (str: string) => (str || '').replace(/\s/g, '');

function hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

/**
 * Generates a seeded entropy string of a max 5 length
 * @param length number: max 10
 * @returns string
 */
const getHashedEntropy = (length: number, str: string) => hash(str).slice(2, 2 + (length || 5));

export class Environment extends Component {
  definition: EnvironmentDefinition<any>;
  name: string;
  accountKeys: string[];

  constructor(blueprint: Blueprint, environment_: EnvironmentDefinition<any>) {
    super(blueprint);
    const environment = environment_ || {};
    this.name = environment?.name || 'default-env-name';
    this.definition = environment;
    this.accountKeys = [];

    const writtenEnvironment = {
      name: this.name,
      description: environment.description || environment.name,
      environmentType: environment.environmentType || 'PRODUCTION',
    };

    const connectedAccounts: {
      environmentName: string;
      name: string;
    }[] = [];

    /**
     * keys of the environment definition that dont represent an account connection
     */
    const nonAccountKeys = new Set(Object.keys(writtenEnvironment));

    // find all the account connections on the environment
    Object.keys(environment)
      .filter(key => !nonAccountKeys.has(key))
      .forEach(accountkey => {
        this.accountKeys.push(accountkey);
        const account: AccountConnection<any> = environment[accountkey];
        if (account.name && environment.name) {
          connectedAccounts.push({
            environmentName: environment.name,
            name: account.name,
          });
        }
      });

    // create the environment file
    new YamlFile(
      blueprint,
      `environments/${stripSpaces(writtenEnvironment.name || 'env')}-${getHashedEntropy(5, JSON.stringify(writtenEnvironment))}.yaml`,
      {
        readonly: false,
        marker: false,
        obj: writtenEnvironment,
      },
    );

    // create all the linked accounts from the environment
    connectedAccounts.forEach(account => {
      new YamlFile(
        blueprint,
        `aws-account-to-environment/${stripSpaces(account.name || 'account')}-${getHashedEntropy(5, JSON.stringify(account))}.yaml`,
        {
          readonly: false,
          marker: false,
          obj: account,
        },
      );
    });
  }

  getRoles(accountKey: string): Role<any>[] {
    const account: AccountConnection<any> = this.definition[accountKey];
    const roles: Role<any>[] = [];
    /**
     * keys of the accountConnection that dont represent a role
     */
    const nonRoleKeys = new Set(['id', 'name']);

    // find all the account connections on the environment
    Object.keys(account)
      .filter(key => !nonRoleKeys.has(key))
      .forEach(roleKey => {
        roles.push(account[roleKey]);
      });
    return roles;
  }
}
