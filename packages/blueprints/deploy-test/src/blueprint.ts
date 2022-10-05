import { Environment, EnvironmentDefinition, AccountConnection, Role } from '@caws-blueprint-component/caws-environments';
import { SourceRepository, SourceFile } from '@caws-blueprint-component/caws-source-repositories';
import { Blueprint as ParentBlueprint, Options as ParentOptions } from '@caws-blueprint/blueprints.blueprint';
import defaults from './defaults.json';

export interface Options extends ParentOptions {
  /**
   * This is some information about what type of environment and what in the world an environment is.
   * @displayName This is the Environment Title Area
   * @collapsed
   */
  testEnvironment: EnvironmentDefinition<{
    /**
     * blah blah blah some comments about the account that i'm deploying into
     * @displayName This account connection has an overriden name
     * @collapsed
     */
    testAccountConnection: AccountConnection<{
      /**
       * Blah blah some information about the role that I expect
       * e.g. here's a copy-pastable policy: [to a link]
       * @displayName This role has an overriden name
       */
      testRole: Role<['admin', 'lambda', 's3', 'cloudfront']>;
    }>;
  }>;
}
/**
 * This is the actual blueprint class.
 * 1. This MUST be the only 'class' exported, as 'Blueprint'
 * 2. This Blueprint should extend another ParentBlueprint
 */
export class Blueprint extends ParentBlueprint {
  constructor(options_: Options) {
    super(options_);
    console.log(defaults);
    // helpful typecheck for defaults
    const typeCheck: Options = {
      outdir: this.outdir,
      ...defaults,
    };
    const options = Object.assign(typeCheck, options_);

    options.testEnvironment.testAccountConnection;

    // add a repository
    const repo = new SourceRepository(this, { title: 'deployApiTestRepo' });

    // example showing add files to the repository
    new SourceFile(repo, 'testfile.txt', 'this is a line of text');
    new Environment(this, options.testEnvironment);
  }
}
