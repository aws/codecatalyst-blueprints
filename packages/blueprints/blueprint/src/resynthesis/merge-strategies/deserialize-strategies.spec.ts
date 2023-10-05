import { filterStrategies } from './deserialize-strategies';
import { MergeStrategies } from './merge-strategies';
import { Strategy } from './models';

describe('filterStrategies', () => {
  it('filters strategies with non-matching owners', () => {
    const baseStrategy: Strategy = {
      identifier: 'my_strategy',
      strategy: MergeStrategies.alwaysUpdate,
      globs: ['*'],
    };

    const matchingStrategies = [
      '*',
      '@amazon-codecatalyst/*',
      '@amazon-codecatalyst/test-blueprint',
      '@amazon-codecatalyst/test-blueprint@1.2.3',
      '@amazon-codecatalyst/test-blueprint@1.*.*',
      '*/test-blueprint',
      '*/*@1.*',
    ].map(owner => {
      return {
        ...baseStrategy,
        owner,
      };
    });

    const nonmatchingStrategies = [
      '@another-namespace/test-blueprint',
      '@another-namespace/*',
      '@amazon-codecatalyst/test-blueprint@2.0.0',
      '*/wrong-name',
    ].map(owner => {
      return {
        ...baseStrategy,
        owner,
      };
    });

    const filtered = filterStrategies(
      {
        'src/repo/.blueprint-ownership': [...matchingStrategies, ...nonmatchingStrategies],
      },
      {
        name: '@amazon-codecatalyst/test-blueprint',
        version: '1.2.3',
      },
    );

    expect(filtered).toStrictEqual({
      'src/repo/.blueprint-ownership': matchingStrategies,
    });
  });
});
