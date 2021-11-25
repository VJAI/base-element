import { AttributeValueDataType, ELEMENT_META_KEY, ElementMetadata } from './element.metadata';

/**
 * Registers a class into web component.
 * @param name selector name.
 * @param [tpl] html template string.
 */
export function element(
  name: string,
  tpl?: string
): ClassDecorator {
  return (target: any) => {
    if (window.customElements.get(name)) {
      throw new Error(`Already an element is registered with the name ${name}`);
    }

    window.customElements.define(name, target);
    setMeta(target, Object.assign(getMeta(target), { name, tpl }));
  };
}

/**
 * Marks the applied property as an input.
 * @param [attribute] True to bind the property with the attribute.
 * @param [dataType] The data type of the attribute.
 */
export function input(attribute = false, dataType = AttributeValueDataType.STRING): PropertyDecorator {
  return (target: object, property: string | symbol) => {
    const metadata = getMeta(target.constructor),
      { inputs } = metadata;

    if (inputs.has(property)) {
      throw new Error(
        `Input decorator is already applied for the property ${
          property as string
        }`
      );
    }

    inputs.add({ property, attribute, dataType });
    setMeta(target.constructor, metadata);
  };
}

/**
 * Marks the applied property as a CSS selector.
 * @param selector CSS selector.
 */
export function query(selector: string): PropertyDecorator {
  return (target: object, property: string | symbol) => {
    const metadata = getMeta(target.constructor),
      { accessors } = metadata;

    if (accessors.has(property)) {
      throw new Error(
        `Already a CSS selector is assigned for the property ${
          property as string
        }`
      );
    }

    accessors.set(property, { selector });
    setMeta(target.constructor, metadata);
  };
}

/**
 * Returns meta from class static property.
 * @param target
 */
function getMeta(target: Function) {
  return target[ELEMENT_META_KEY] || new ElementMetadata();
}

/**
 * Stores meta as a class property.
 * @param target
 * @param meta
 */
function setMeta(target: Function, meta: ElementMetadata) {
  target[ELEMENT_META_KEY] = meta;
}
