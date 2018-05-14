import _ from 'lodash';
import fs from 'fs-extra';
import joi from 'joi';
import joiValidate from 'easy-joi';
import path from 'path';
import { FINISHED, READY, WORKING } from './constants';
import { evaluate } from './browser';

export default class Interaction {
  constructor(name, url, config) {
    this._status = READY;
    this.config = this.loadConfig(config);
    const {
      click,
      delay,
      elements = [],
      fields = {},
      keys,
      scripts,
      scroll,
      timeout
    } = this.config;
    this.click = click;
    this.delay = delay;
    this.elements = elements;
    this.fields = fields;
    this.keys = keys;
    this.name = name;
    this.url = url;
    this.scripts = scripts;
    this.scroll = scroll;
    this.timeout =
      timeout !== true && Number(timeout) > 0 ? Number(timeout) : 1000;
    this.url = url;
    this.waitUntil = timeout ? 'networkidle' : 'load';
  }

  loadConfig({
    click,
    delay,
    elements,
    fields,
    key,
    keys = [],
    script,
    scripts = [],
    scroll,
    timeout
  }) {
    if (key) keys.push(key);
    if (script) scripts.push(script);
    scripts = _.map(scripts, script => {
      if (/[\w\s_\-.\/\\]+/g.text(script)) {
        try {
          return fs.readFileSync(path.resolve(script), 'utf8');
        } catch (err) {
          return '';
        }
      }
      return script;
    });
    if (_.isNumber(scroll)) {
      scroll = {
        count: scroll,
        timeout: 10000
      };
    }
    return { click, delay, elements, fields, keys, scripts, scroll, timeout };
  }

  async init() {
    return this.validate();
  }

  async validate() {
    await joiValidate(this.config, {
      click: joi
        .array()
        .keys(joi.string())
        .optional(),
      delay: joi.number().optional(),
      elements: joi.array().optional(),
      fields: joi.object().optional(),
      keys: joi
        .array()
        .items(joi.string())
        .optional(),
      scripts: joi
        .array()
        .items(joi.string())
        .optional(),
      scroll: joi
        .object()
        .keys({
          count: joi.number(),
          timeout: joi.number()
        })
        .optional(),
      timeout: joi.number().optional()
    });
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
      fields: this.fields,
      scripts: this.scripts
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
async function runInteraction({ click, elements, fields, scripts, scroll }) {
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
  function scrollToBottom(count, timeout) {
    count--;
    return new Promise(resolve => {
      window.setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
        if (count > 0) return resolve(scroll(count, timeout));
        return resolve();
      }, timeout);
    });
  }
  return Promise.resolve()
    .then(() => {
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
      return null;
    })
    .then(() => {
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
      return null;
    })
    .then(() => {
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
      return null;
    })
    .then(() => {
      if (scroll) return scrollToBottom(scroll.count, scroll.timeout);
      return null;
    })
    .then(() => {
      if (scripts) {
        scripts.forEach(function(script) {
          // eslint-disable-next-line no-eval
          eval(script);
        });
      }
    });
}
