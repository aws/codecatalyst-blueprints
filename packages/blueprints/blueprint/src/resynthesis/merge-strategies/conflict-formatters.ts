import { CONFLICT_MARKER_LENGTH, splitLines } from './diff3';

export type MergeConflictFormatter = (a: string, o: string, b: string, options?: MergeConflictFormatterOptions) => string;

export interface MergeConflictFormatterOptions {
  aLabel?: string;
  oLabel?: string;
  bLabel?: string;
}

export class ConflictFormatters {
  public static diff3(a: string, o: string, b: string, options?: MergeConflictFormatterOptions): string {
    return createConflictString(a, b, {
      oText: o,
      aLabel: options?.aLabel,
      oLabel: options?.oLabel,
      bLabel: options?.bLabel,
    });
  }

  public static diff3NoAncestor(a: string, _o: string, b: string, options?: MergeConflictFormatterOptions) {
    return createConflictString(a, b, {
      aLabel: options?.aLabel,
      bLabel: options?.bLabel,
    });
  }

  public static preferExisting(a: string, _o: string, _b: string): string {
    return a;
  }

  public static preferProposed(_a: string, _o: string, b: string): string {
    return b;
  }

  public static trimEnds(a: string, _o: string, b: string, options?: MergeConflictFormatterOptions): string {
    const aLines = splitLines(a);
    const bLines = splitLines(b);

    const resultLines: string[] = [];
    const minLength = Math.min(aLines.length, bLines.length);
    for (let i = 0; i < minLength; i++) {
      if (aLines[i] !== bLines[i]) {
        break;
      }

      resultLines.push(aLines[i]);
    }

    const commonPrefixLength = resultLines.length;
    let commonSuffix: string[] = [];
    for (let i = 0; i < minLength - commonPrefixLength; i++) {
      if (aLines[aLines.length - 1 - i] !== bLines[bLines.length - 1 - i]) {
        break;
      }

      commonSuffix.push(aLines[aLines.length - 1 - i]);
    }

    const aConflictLines = aLines.slice(commonPrefixLength, aLines.length - commonSuffix.length);
    const bConflictLines = bLines.slice(commonPrefixLength, bLines.length - commonSuffix.length);
    if (aConflictLines.length || bConflictLines.length) {
      resultLines.push(createConflictString(aConflictLines.join(''), bConflictLines.join(''), { ...options }));
    }

    if (commonSuffix.length) {
      resultLines.push(...commonSuffix.reverse());
    }

    return resultLines.join('');
  }
}

function createConflictString(
  aText: string,
  bText: string,
  options?: {
    aLabel?: string;
    bLabel?: string;
    oText?: string;
    oLabel?: string;
  },
) {
  let chunkContents = '';

  chunkContents += createConflictMarker('<', options?.aLabel);
  chunkContents += aText;
  if (!aText.endsWith('\n')) {
    chunkContents += '\n';
  }

  if (options?.oText !== undefined) {
    chunkContents += createConflictMarker('|', options?.oLabel);
    chunkContents += options.oText;
    if (!options.oText.endsWith('\n')) {
      chunkContents += '\n';
    }
  }

  chunkContents += createConflictMarker('=');
  chunkContents += bText;
  if (!bText.endsWith('\n')) {
    chunkContents += '\n';
  }
  chunkContents += createConflictMarker('>', options?.bLabel);

  return chunkContents;
}

function createConflictMarker(type: '<' | '|' | '=' | '>', label?: string): string {
  return type.repeat(CONFLICT_MARKER_LENGTH) + `${label ? ' ' + label : ''}\n`;
}
