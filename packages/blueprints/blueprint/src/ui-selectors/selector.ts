/**
 * This allows you to implement a codecatalyst resource selector component in the blueprint wizard
 * @example selector: Selector<SourceRepository>
 * @returns string;
 */
export type Selector<T> = T | string;
