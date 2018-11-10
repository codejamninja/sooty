import Promise from 'bluebird';
import _ from 'lodash';
import fs from 'fs-extra';
import joi from 'joi';
import joiValidate from 'easy-joi';
import path from 'path';
import { FINISHED, READY, WORKING } from './constants';
import { evaluate, doneEvaluate } from './browser';

export default class Interaction {
  constructor(name, url, config, options) {
    this._status = READY;
    this.options = options;
    this.config = this.loadConfig(config);
    const { steps } = this.config;
    this.name = name;
    this.steps = steps;
    this.url = url;
  }

  loadConfig(steps) {
    if (!_.isArray(steps)) steps = [steps];
    steps = _.map(steps, step => {
      const {
        click,
        clicks = [],
        delay,
        elements,
        fields,
        key,
        keys = [],
        script,
        waitUntil = 'load'
      } = step;
      let { focus = [], hover = [], iframe = [], scripts = [], scroll } = step;
      if (click) clicks.push(click);
      if (key) keys.push(key);
      if (script) scripts.push(script);
      if (!_.isArray(focus)) focus = [focus];
      if (!_.isArray(hover)) hover = [hover];
      if (!_.isArray(iframe)) iframe = [iframe];
      scripts = _.map(scripts, script => {
        if (/^[\w\s_\-./\\]+$/g.test(script)) {
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
      return {
        clicks,
        delay,
        elements,
        fields,
        focus,
        hover,
        iframe,
        keys,
        scripts,
        scroll,
        waitUntil
      };
    });
    return { steps };
  }

  async init() {
    return this.validate();
  }

  async validate() {
    await joiValidate(this.config, {
      steps: joi.array().items(
        joi.object().keys({
          clicks: joi
            .array()
            .items(joi.string())
            .optional(),
          delay: joi.number().optional(),
          elements: joi
            .array()
            .items(
              joi.object().keys({
                selector: joi.string(),
                value: joi.any()
              })
            )
            .optional(),
          fields: joi.object().optional(),
          focus: joi.array().items(joi.string()),
          hover: joi.array().items(joi.string()),
          iframe: joi.array().items(joi.string()),
          keys: joi
            .array()
            .items(joi.string(), joi.array().items(joi.string())),
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
          timeout: joi.number(),
          waitUntil: joi.string()
        })
      )
    });
    return true;
  }

  getStatus() {
    return this._status;
  }

  async run() {
    this._status = WORKING;
    const result = Promise.mapSeries(this.steps, async step => {
      let waitForPage = null;
      if (
        step.clicks.length ||
        _.includes(
          _.map(step.keys, key => {
            if (_.isArray(key) && key.length >= 2 && key[0] !== 'type') {
              return key[1].toLowerCase();
            }
            return null;
          }),
          'enter'
        )
      ) {
        waitForPage = {
          timeout: step.delay || 3000,
          waitUntil: step.waitUntil
        };
      }
      const { dom, page } = await evaluate(
        this.name,
        this.url,
        runInteraction,
        {
          clicks: step.clicks,
          elements: step.elements,
          fields: step.fields,
          iframe: step.iframe,
          scripts: step.scripts
        },
        { ...this.options, waitForPage }
      );
      if (!waitForPage && step.delay) {
        await new Promise(r => setTimeout(r, step.delay));
      }
      if (step.hover) {
        await Promise.mapSeries(step.hover, async hover => {
          return page.hover(hover);
        });
      }
      if (step.focus) {
        await Promise.mapSeries(step.focus, async focus => {
          return page.focus(focus);
        });
      }
      if (step.keys) {
        await Promise.mapSeries(step.keys, async key => {
          if (_.isArray(key) && key.length >= 2) {
            await page.keyboard[key[0]](key[1]);
          } else {
            await page.keyboard.type(key);
          }
          await page
            .waitForNavigation({
              timeout: step.delay || 10000,
              waitUntil: step.waitUntil
            })
            .catch(() => {});
        });
      }
      await doneEvaluate(this.name, this.url, this.options);
      return { dom, page };
    });
    this._status = FINISHED;
    return result;
  }
}

function runInteraction(args) {
  return window.sooty.runInteraction(args);
}
