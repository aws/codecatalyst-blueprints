/**
 * This allows you to implement a multiselect component in the blueprint wizard
 * @example multi: MultiSelect<['A', 'B', 'C']>
 * @returns ['A', 'B'];
 */
export type MultiSelect<T extends any[]> = T;
