import { AttributeValueDataType, ELEMENT_META_KEY, ElementMetadata } from './element.metadata';
import { isVoid } from './util';

/**
 * Represents the input changes with old and current values.
 */
export type ElementChanges = Map<string, { oldValue: any; newValue: any }>;

/**
 * The input parameter of DOM operations.
 */
export type UIElement = string | BaseElement | HTMLElement;

/**
 * Represents an object.
 */
export interface KeyValue {
  [key: string]: any;
}

/**
 * Base class for all custom web components.
 */
export abstract class BaseElement extends HTMLElement {

  /**
   * The component metadata.
   */
  private readonly _metadata: ElementMetadata = null;

  /**
   * True when the component is initialized (applied the decorators and refreshed with the initial inputs state).
   */
  private _initialized: boolean = false;

  /**
   * True when the component is rendered.
   */
  private _rendered: boolean = false;

  /**
   * Changes of inputs.
   */
  private _changes = new Map<string, { oldValue: any; newValue: any }>();

  /**
   * The current state of properties.
   */
  private _props = new Map<string, any>();

  /**
   * Timer to refresh the UI from the changes map.
   */
  private _updateTimer: any = null;

  protected constructor() {
    super();
    this._metadata = this.constructor[ELEMENT_META_KEY];
  }

  /**
   * Overrides the getter of the properties decorated with `query` decorator to return the dom elements
   * on accessing the properties.
   */
  private _applyAccessors() {
    [...this._metadata.accessors].forEach(
      ([prop, { selector }]) => {
        Object.defineProperty(this, prop, {
          get() {
            return this.$(selector);
          }
        });
      }
    );
  }

  /**
   * Overrides the getter and setter of the properties decorated with `input` decorator.
   * The getter is overridden to return the current state from the `_props` property and the setter is
   * overridden to track the change and push to the `changes` map eventually triggering the update timer to
   * refresh the UI in the next tick.
   */
  private _applyInputs() {
    [...this._metadata.inputs].forEach(({ property, attribute, dataType }) => {
      let value;

      // If attribute is passed as `true` then read the initial value of the property from
      // DOM attribute parse it based on the data type and store it in the `_props`.
      if (attribute) {
        let attrValue: any = this.getAttr(property);

        if (attrValue !== null) {
          if (
            dataType === AttributeValueDataType.NUMBER &&
            !isNaN(parseFloat(attrValue))
          ) {
            attrValue = parseFloat(attrValue);
          } else if (dataType === AttributeValueDataType.BOOLEAN) {
            attrValue = attrValue === 'true' || attrValue === '';
          }

          value = attrValue;
        } else {
          value = this[property];
        }

        if (!isVoid(value) && value !== attrValue) {
          this.setAttr({ [property]: value });
        }
      } else {
        value = this[property];
      }

      this._pushChange(property, value);
      this._props.set(property, value);
      const target = this;
      Object.defineProperty(this, property, {
        get() {
          return target._props.get(property);
        },
        set(value) {
          if (attribute) {
            if (value) {
              target.setAttr({
                [property]: !isVoid(value) ? value.toString() : value
              });
            } else {
              target.removeAttr(property);
            }
          }

          target._pushChange(property, value);
          target._props.set(property, value);
          target._initialized && target._triggerUpdate();
        }
      });
    });
  }

  /**
   * Checks if there is really a change if yes then push it to the `_changes` map.
   * @param prop
   * @param value
   */
  private _pushChange(prop: string, value: any) {
    if (!this._changes.has(prop)) {
      this._changes.set(prop, { oldValue: this[prop], newValue: value });
      return;
    }

    const { oldValue, newValue } = this._changes.get(prop);
    if (oldValue === newValue && this._initialized) {
      this._changes.delete(prop);
      return;
    }

    this._changes.set(prop, { oldValue, newValue: value });
  }

  /**
   * Kick the UI update timer.
   */
  private _triggerUpdate() {
    if (this._updateTimer) {
      return;
    }

    this._updateTimer = setTimeout(() => this.refresh(), 0);
  }

  private _element(el: UIElement): UIElement {
    if (arguments.length === 0 || el === 'self') {
      return this;
    }

    if (el instanceof HTMLElement) {
      return el;
    }

    return this.$(el as string);
  }

  /**
   * Native life-cycle hook.
   */
  protected connectedCallback() {
    // Render the template only if it's not rendered already.
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }

    // Override the getters/setters of decorated properties.
    if (!this._initialized) {
      this._applyAccessors();
      this._applyInputs();
      this._initialized = true;
    }

    // Call our custom life-cycle hook method.
    this.onConnected();

    // Refresh the UI with the initial input property values.
    this.refresh();
  }

  /**
   * Native life-cycle hook.
   */
  protected disconnectedCallback() {
    this.onDisconnected();
  }

  /**
   * Custom life-cycle hook meant to be overridden by derived class if needed.
   */
  protected onConnected() {}

  /**
   * Custom life-cycle hook meant to be overridden by derived class if needed.
   */
  protected onDisconnected() {}

  /**
   * Invoked whenever there is a change in inputs.
   * @param changes
   */
  protected onChanges(changes: ElementChanges) {}

  /**
   * Reads the template from metadata and renders the template.
   */
  protected render() {
    if (!this._metadata.tpl) {
      return;
    }

    const template = document.createElement('template');
    template.innerHTML = this._metadata.tpl;
    this.appendChild(template.content.cloneNode(true));
  }

  /**
   * Refresh the UI by calling the `onChanges` method and clear the timer.
   */
  protected refresh() {
    this.onChanges(this._changes);
    this._changes.clear();
    this._updateTimer && window.clearTimeout(this._updateTimer);
    this._updateTimer = null;
  }

  /**
   * Returns the DOM element for the passed selector.
   * @param selector CSS selector.
   * @param [element] Optional parent element. If not passed the element is queried inside the current component.
   */
  $<T extends HTMLElement>(selector: string, element: UIElement = this): T {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return <any>this;
    }

    if (el === this) {
      return this.querySelector(selector);
    }

    if (el instanceof BaseElement) {
      return el.$(selector);
    }

    return el.querySelector(selector) as T;
  }

  /**
   * Adds single or multiple css classes.
   * @param classes
   * @param [element]
   */
  addClass(
    classes: string | Array<string>,
    element: UIElement = this
  ): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    el.classList.add(...(Array.isArray(classes) ? classes : [classes]));
    return this;
  }

  /**
   * Removes single or multiple css classes.
   * @param classes
   * @param [element]
   */
  removeClass(
    classes: string | Array<string>,
    element: UIElement = this
  ): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    el.classList.remove(...(Array.isArray(classes) ? classes : [classes]));
    return this;
  }

  /**
   * Applies passed styles.
   * @param styles
   * @param [element]
   */
  addStyle(styles: KeyValue, element: UIElement = this): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    Object.entries(styles).forEach(([k, v]) => {
      if (k.startsWith('--')) {
        el.style.setProperty(k, v);
      } else if (v === null) {
        this.removeStyles(k, el);
      } else {
        el.style[k] = v;
      }
    });
    return this;
  }

  /**
   * Removes passed styles.
   * @param styles
   * @param [element]
   */
  removeStyles(
    styles: string | Array<string>,
    element: UIElement = this
  ): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    (Array.isArray(styles) ? styles : [styles]).forEach(
      style => (el.style[style] = null)
    );
    return this;
  }

  /**
   * Returns passed attribute's value.
   * @param name
   * @param [element]
   */
  getAttr(name: string, element: UIElement = this): string {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return '';
    }

    return el.getAttribute(name);
  }

  /**
   * Sets the attributes.
   * @param obj
   * @param [element]
   */
  setAttr(obj: KeyValue, element: UIElement = this): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    Object.entries(obj).forEach(([key, value]) =>
      isVoid(value) ? this.removeAttr(key) : el.setAttribute(key, value)
    );
    return this;
  }

  /**
   * Removes the passed attributes.
   * @param attrs
   * @param [element]
   */
  removeAttr(
    attrs: string | Array<string>,
    element: UIElement = this
  ): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    (Array.isArray(attrs) ? attrs : [attrs]).forEach(attr =>
      el.removeAttribute(attr)
    );

    return this;
  }

  /**
   * Updates the inner html.
   * @param html
   * @param [element]
   */
  updateHtml(html: string, element: UIElement = this): BaseElement {
    const el = this._element(element) as HTMLElement;

    if (!el) {
      return this;
    }

    el.innerHTML = !isVoid(html) ? html : '';
    return this;
  }
}
