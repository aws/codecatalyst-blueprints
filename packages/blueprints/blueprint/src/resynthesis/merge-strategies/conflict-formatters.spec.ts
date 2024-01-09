import { ConflictFormatters } from './conflict-formatters';

[
  ConflictFormatters.diff3,
  ConflictFormatters.diff3NoAncestor,
  ConflictFormatters.preferExisting,
  ConflictFormatters.preferProposed,
  ConflictFormatters.trimEnds,
].forEach(formatter => {
  describe(`conflict formatter: ${formatter.name}`, () => {
    it('formats simple conflicts', () => {
      const aText = 'line 1 a\nline 2';
      const oText = 'line 1 o\nline 2';
      const bText = 'line 1 b\nline 2';

      expect(formatter(aText, oText, bText, { aLabel: 'existing', oLabel: 'ancestor', bLabel: 'proposed' })).toMatchSnapshot();
    });

    it('formats simple conflicts with trailing newlines', () => {
      const aText = 'line 1 a\nline 2\n';
      const oText = 'line 1 o\nline 2\n';
      const bText = 'line 1 b\nline 2\n';

      expect(formatter(aText, oText, bText, { aLabel: 'existing', oLabel: 'ancestor', bLabel: 'proposed' })).toMatchSnapshot();
    });

    it('formats a conflict with a common prefix and suffix', () => {
      const commonPrefix = 'common prefix line\n'.repeat(3);
      const commonSuffix = 'common suffix line\n'.repeat(3);
      const aText = `${commonPrefix}some contents from a\n${commonSuffix}`;
      const oText = `${commonPrefix}some contents from o\n${commonSuffix}`;
      const bText = `${commonPrefix}some contents from b\n${commonSuffix}`;

      expect(formatter(aText, oText, bText, { aLabel: 'existing', oLabel: 'ancestor', bLabel: 'proposed' })).toMatchSnapshot();
    });
  });
});
