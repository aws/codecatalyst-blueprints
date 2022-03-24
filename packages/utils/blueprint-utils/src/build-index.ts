export const buildIndex = (): string => {
  return `
export * from './blueprint';
import defaults_ from './defaults.json';
export const defaults = defaults_;
`;
};
