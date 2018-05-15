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

function runInteraction(args) {
  // eslint-disable-next-line no-undef
  return window.sooty.runInteraction(args);
}
