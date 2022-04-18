import { Blueprint } from '@caws-blueprint/blueprints.blueprint';
import { Component, YamlFile } from 'projen';
import { AccountConnection, EnvironmentDefinition } from './environment-definition';

const stripSpaces = (str: string) => (str || '').replace(/\s/g, '');

/**
 * Generates an extropy string of a max 5 length
 * @param length number: max 10
 * @returns string
 */
const getEntropy = (length?: number) => (Math.random() + 1).toString(36).slice(2, 2 + (length || 5));

export class Environment extends Component {
  constructor(blueprint: Blueprint, environment: EnvironmentDefinition<any>) {
    super(blueprint);

    const writtenEnvironment = {
      name: environment.name,
      description: environment.description || environment.name,
      environmentType: environment.environmentType,
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
        const account: AccountConnection<any> = environment[accountkey];
        if (account.name && environment.name) {
          connectedAccounts.push({
            environmentName: environment.name,
            name: account.name,
          });
        }
      });

    // create the environment file
    new YamlFile(blueprint, `environments/${stripSpaces(writtenEnvironment.name || 'env')}-${getEntropy(5)}.yaml`, {
      readonly: false,
      marker: false,
      obj: writtenEnvironment,
    });

    // create all the linked accounts from the environment
    connectedAccounts.forEach(account => {
      new YamlFile(blueprint, `aws-account-to-environment/${stripSpaces(account.name || 'account')}-${getEntropy(5)}.yaml`, {
        readonly: false,
        marker: false,
        obj: account,
      });
    });
  }
}
