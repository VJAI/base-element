export const ELEMENT_META_KEY = '__ELEMENT_INFO__';

/**
 * Different data types of an attribute.
 */
export enum AttributeValueDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean'
}

/**
 * Metadata information of a web component.
 */
export class ElementMetadata {

  /**
   * Selector name.
   */
  name: string = null;

  /**
   * Html template string.
   */
  tpl: string = null;

  /**
   * Query accessors.
   */
  accessors = new Map<string, { selector: string; }>();

  /**
   * Inputs.
   */
  inputs = new Set<{property: string; attribute: boolean; dataType: AttributeValueDataType; }>();
}
