import { Tuple, SupportedTupleType } from './tuple';

type SupportedDynamic = Tuple<[SupportedTupleType, SupportedTupleType]> | string | number;

/**
 * A special UI element that allows you to specify display properties via the defaults
 */
export type SimpleDynamicElement<Element extends SupportedDynamic> = {
  element: Element;
  /**
   * If this is specified this particular value cannot be removed.
   */
  required?: boolean;
  description?: string;
  keyRegex?: string;
  valueRegex?: string;
};
