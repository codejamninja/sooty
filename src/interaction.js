import { FINISHED, READY, WORKING } from './constants';
import { evaluate } from './browser';

export default class Interaction {
  constructor(
    name,
    url,
    { click, delay, elements = [], fields = {}, keys, timeout }
  ) {
    this._status = READY;
    this.click = click;
    this.delay = delay;
    this.elements = elements;
    this.fields = fields;
    this.keys = keys;
    this.name = name;
    this.url = url;
    this.timeout =
      timeout !== true && Number(timeout) > 0 ? Number(timeout) : 1000;
    this.url = url;
    this.waitUntil = timeout ? 'networkidle' : 'load';
  }

  async init() {
    return this.validate();
  }

  async validate() {
    return true;
  }

  getStatus() {
    return this._status;
  }

  async run() {
    this._status = WORKING;
    const { page } = await evaluate(this.url, runInteraction, {
      click: this.click,
      elements: this.elements,
      fields: this.fields
    });
    if (!this.click && !this.keys && this.delay) {
      await new Promise(r => setTimeout(r, this.delay));
    }
    if (this.step.click) {
      await page
        .waitForNavigation({
          timeout: this.delay || 10000,
          waitUntil: this.waitUntil,
          networkIdleTimeout: this.timeout
        })
        .catch(() => {});
    }
    if (this.keys) {
      await Promise.mapSeries(this.keys, key => {
        return Promise.mapSeries([
          page.keyboard.press(key),
          page
            .waitForNavigation({
              timeout: this.delay || 10000,
              waitUntil: this.waitUntil,
              networkIdleTimeout: this.timeout
            })
            .catch(() => {})
        ]);
      });
    }
    this._status = FINISHED;
  }
}

/* eslint-disable prefer-arrow-callback,func-names,no-var,no-undef */
async function runInteraction({ click, fields, elements }) {
  function mergeElement(element, config) {
    Object.keys(config).forEach(function(key) {
      var configValue = config[key];
      var elementValue = element[key];
      if (Array.isArray(elementValue)) {
        elementValue = elementValue.concat(configValue);
      } else if (typeof elementValue === 'object') {
        Object.assign(elementValue, configValue);
      } else {
        elementValue = configValue;
      }
    });
  }
  Object.keys(fields).forEach(function(key) {
    var field = fields[key];
    document.getElementsByName(key).forEach(function(element) {
      element.focus();
      if (element.type === 'checkbox') {
        element.checked = !!field;
      } else if (typeof field === 'string') {
        element.value = field;
      } else {
        mergeElement(element, field);
      }
      element.dispatchEvent(new Event('change'));
      element.blur();
    });
  });
  elements.forEach(elementConfig => {
    document
      .querySelectorAll(elementConfig.selector)
      .forEach(function(element) {
        if (elementConfig.field) element.focus();
        mergeElement(element, elementConfig.value);
        if (elementConfig.field) {
          element.dispatchEvent(new Event('change'));
          element.blur();
        }
      });
  });
  if (click) {
    if (typeof click === 'string') {
      document.querySelectorAll(click).forEach(function(element) {
        element.click();
      });
    } else {
      click.forEach(function(selector) {
        document.querySelectorAll(selector).forEach(function(element) {
          element.click();
        });
      });
    }
  }
}
