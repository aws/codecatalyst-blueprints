import { diff_match_patch, Diff, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch';

const DMP = new diff_match_patch();
const CONFLICT_MARKER_LENGTH = 7;

function diffLines(a: string, b: string, dmp: diff_match_patch = DMP): Diff[] {
  const lines = dmp.diff_linesToChars_(a, b);
  const diff = dmp.diff_main(lines.chars1, lines.chars2, false);
  dmp.diff_charsToLines_(diff, lines.lineArray);

  dmp.diff_cleanupSemantic(diff);
  return diff;
}

type MergeChunk = MergeConflictChunk | MergeOkChunk;

interface MergeConflictChunk {
  conflict: true;
  a: string;
  b: string;
}

interface MergeOkChunk {
  conflict: false;
  ok: string;
}

export interface Diff3Options {
  diffFunction?: (a: string, b: string) => Diff[];
  aLabel?: string;
  bLabel?: string;
}

export class Diff3 {
  private readonly lines: {
    a: string[];
    o: string[];
    b: string[];
  };

  private currentLine: {
    a: number;
    o: number;
    b: number;
  } = {
      a: 0,
      o: 0,
      b: 0,
    };

  private readonly matches: {
    a: Map<number, number>;
    b: Map<number, number>;
  };

  private readonly mergedChunks: MergeChunk[] = [];
  private readonly options?: Diff3Options;

  constructor(a: string, o: string, b: string, options?: Diff3Options) {
    this.options = options;
    const diff = options?.diffFunction ?? diffLines;

    this.matches = {
      a: getMatches(diff(o, a)),
      b: getMatches(diff(o, b)),
    };

    this.lines = {
      a: splitLines(a),
      o: splitLines(o),
      b: splitLines(b),
    };

    this.merge();
  }

  getMerged(): string {
    return this.mergedChunks
      .map(chunk =>
        mergeChunkToString(chunk, {
          aLabel: this.options?.aLabel,
          bLabel: this.options?.bLabel,
        }),
      )
      .join('');
  }

  // Based on the algorithm described in https://www.cis.upenn.edu/~bcpierce/papers/diff3-short.pdf
  private merge() {
    while (true) {
      const i = this.findMismatch();

      if (i === 1) {
        const { o, a, b } = this.findMatch();

        if (a !== undefined && b !== undefined) {
          this.pushChunk(a, o, b);
        } else {
          this.pushRemainingChunk();
          return;
        }
      } else if (i) {
        this.pushChunk(this.currentLine.a + i, this.currentLine.o + i, this.currentLine.b + i);
      } else {
        this.pushRemainingChunk();
        return;
      }
    }
  }

  /**
   * Find the offset from the current line to the next mismatch
   * @returns the number of lines to the next mismatch, or undefined if there is no mismatch
   */
  private findMismatch(): number | undefined {
    let i = 1;

    while (
      this.currentLine.a + i <= this.lines.a.length ||
      this.currentLine.b + i <= this.lines.b.length ||
      this.currentLine.o + i <= this.lines.o.length
    ) {
      if (
        this.matches.a.get(this.currentLine.o + i) !== this.currentLine.a + i ||
        this.matches.b.get(this.currentLine.o + i) !== this.currentLine.b + i
      ) {
        return i;
      }

      i++;
    }

    return;
  }

  private findMatch(): {
    a: number | undefined;
    o: number;
    b: number | undefined;
  } {
    let o = this.currentLine.o + 1;

    while (o <= this.lines.o.length && this.matches.a.get(o) === undefined && this.matches.b.get(o) === undefined) {
      o++;
    }

    return { o, a: this.matches.a.get(o), b: this.matches.b.get(o) };
  }

  private pushRemainingChunk() {
    this.pushChunk(this.lines.a.length + 1, this.lines.o.length + 1, this.lines.b.length + 1);
  }

  private pushChunk(a: number, o: number, b: number) {
    const oText = this.lines.o.slice(this.currentLine.o, o - 1).join('');
    const aText = this.lines.a.slice(this.currentLine.a, a - 1).join('');
    const bText = this.lines.b.slice(this.currentLine.b, b - 1).join('');

    if (oText === aText && oText === bText) {
      this.mergedChunks.push({
        conflict: false,
        ok: oText,
      });
    } else if (oText === aText) {
      this.mergedChunks.push({
        conflict: false,
        ok: bText,
      });
    } else if (oText === bText) {
      this.mergedChunks.push({
        conflict: false,
        ok: aText,
      });
    } else if (aText === bText) {
      // false conflict, both copies modified the original in the same way.
      this.mergedChunks.push({
        conflict: false,
        ok: aText,
      });
    } else {
      this.mergedChunks.push({
        conflict: true,
        a: aText,
        b: bText,
      });
    }

    this.currentLine = {
      o: o - 1,
      a: a - 1,
      b: b - 1,
    };
  }
}

/**
 * Converts a diff to a map of matching lines between the original and modified text.
 * @param diff A diff-match-patch style diff
 * @returns a map from line number in the original text to line number in the modified text.
 */
function getMatches(diff: Diff[]): Map<number, number> {
  const matches = new Map<number, number>();

  let oLineNumber = 1;
  let aLineNumber = 1;
  for (const [type, text] of diff) {
    const numLines = countLines(text);

    switch (type) {
      case DIFF_EQUAL:
        for (let i = 0; i < numLines; i++) {
          matches.set(oLineNumber + i, aLineNumber + i);
        }

        oLineNumber += numLines;
        aLineNumber += numLines;
        break;
      case DIFF_DELETE:
        oLineNumber += numLines;
        break;
      case DIFF_INSERT:
        aLineNumber += numLines;
        break;
    }
  }

  return matches;
}

function countLines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s.charAt(i) === '\n') {
      count++;
    }
  }

  return count;
}

function mergeChunkToString(
  chunk: MergeChunk,
  options?: {
    aLabel?: string;
    bLabel?: string;
  },
) {
  if (chunk.conflict) {
    let chunkContents = '';

    chunkContents += createConflictMarker('<', options?.aLabel);
    chunkContents += chunk.a;
    if (!chunk.a.endsWith('\n')) {
      chunkContents += '\n';
    }

    chunkContents += createConflictMarker('=');
    chunkContents += chunk.b;
    if (!chunk.b.endsWith('\n')) {
      chunkContents += '\n';
    }
    chunkContents += createConflictMarker('>', options?.bLabel);

    return chunkContents;
  } else {
    return chunk.ok;
  }
}

function createConflictMarker(type: '<' | '=' | '>', label?: string): string {
  return type.repeat(CONFLICT_MARKER_LENGTH) + `${label ? ' ' + label : ''}\n`;
}

/**
 * Splits a string into lines, preserving the newline character at the end of each line.
 * @param s the string to split
 * @returns an array of lines
 */
function splitLines(s: string): string[] {
  const split = s.split('\n');

  return split.map((line, i) => (i === split.length - 1 ? line : line + '\n'));
}
