/**
 * We expose the touple type because typescript will treat defaulted touples as string[];
 */
export type SupportedTupleType = string | number;

/**
 * This returns a string[]. Lengths of 2 are currently supported
 */
export type Tuple<T extends [SupportedTupleType, SupportedTupleType]> = T | SupportedTupleType[];
