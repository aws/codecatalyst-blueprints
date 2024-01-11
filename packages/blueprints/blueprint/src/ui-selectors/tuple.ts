/**
 * We expose the touple type because typescript will treat defaulted touples as string[];
 */
type SupportedTupleType = string | number;

/**
 * This returns a string[] of length 2
 */
export type Tuple<K extends SupportedTupleType = string, V extends SupportedTupleType = string> = (K | V)[]
