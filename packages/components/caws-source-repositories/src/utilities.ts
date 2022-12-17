import { BAD_SOURCE_CHARACTERS } from './constants';

export const makeValidFolder = (
  name: string,
  options?: {
    separator?: string;
    maxlength?: number;
    invalidChars?: string[];
  },
): string => {
  const { maxlength = 100, invalidChars = BAD_SOURCE_CHARACTERS } = options || {};
  const result = name.replace(new RegExp(`[${invalidChars.join('\\')}]`, 'g'), '').substring(0, maxlength);
  return result;
};
