import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';
import newRegExp from 'newregexp';
import { evaluate, doneEvaluate } from './browser';
import { FINISHED, READY, WAITING, WORKING } from './constants';

export default class Query {
  constructor(name, url, config, options) {
    this._status = WAITING;
    this.options = options;
    this.config = this.loadConfig(config);
    const { filter, html, iframe, replace, requires, selector } = this.config;
    this.filter = filter;
    this.html = html;
    this.iframe = iframe;
    this.name = name;
    this.replace = replace;
    this.requires = requires;
    this.result = [];
    this.scraped = null;
    this.selector = selector;
    this.url = url;
  }

  loadConfig({
    filter,
    html = false,
    iframe = [],
    replace,
    requires = [],
    selector
  }) {
    if (filter && !_.isArray(filter)) filter = [filter];
    if (!_.isArray(iframe)) iframe = [iframe];
    if (replace && !_.isArray(replace)) replace = [replace];
    replace = _.map(replace, item => {
      if (_.isString(item)) {
        return {
          match: item,
          value: ''
        };
      }
      return item;
    });
    return {
      filter,
      html,
      iframe,
      replace,
      requires,
      selector
    };
  }

  getStatus(finishedInteractions = []) {
    if (this._status !== FINISHED && this._status !== WORKING) {
      let status = READY;
      _.each(this.requires, required => {
        if ((!_.includes(finishedInteractions), required)) {
          status = WAITING;
        }
      });
      this._status = status;
    }
    return this._status;
  }

  async init() {
    return this.validate();
  }

  async run() {
    await this.runScrape();
    await this.runFilter();
    return this.result;
  }

  async runScrape() {
    this._status = WORKING;
    const { result } = await evaluate(
      this.name,
      this.url,
      scrapeQuery,
      {
        html: this.html,
        iframe: this.iframe,
        selector: this.selector
      },
      this.options
    );
    await doneEvaluate(this.name, this.url, this.options);
    this.scraped = result;
    this._status = FINISHED;
    return this.scraped;
  }

  async runFilter() {
    _.each(this.scraped, value => {
      if (this.filter) {
        _.each(this.filter, filter => {
          value = (value.match(newRegExp(filter)) || []).join('');
        });
      }
      if (this.replace) {
        _.each(this.replace, replace => {
          value = value.replace(newRegExp(replace.match), replace.value);
        });
      }
      if (value && value.length > 0) this.result.push(value);
    });
    return this.result;
  }

  async validate() {
    await joiValidate(this.config, {
      filter: joi
        .array()
        .items(joi.string())
        .optional(),
      html: joi.boolean().optional(),
      iframe: joi.array().items(joi.string()),
      replace: joi
        .array()
        .items(
          joi.object().keys({
            match: joi.string(),
            value: joi.string().allow('')
          })
        )
        .optional(),
      requires: joi
        .array()
        .items(joi.string())
        .optional(),
      selector: joi.string()
    });
    return true;
  }
}

function scrapeQuery(args) {
  return window.sooty.scrapeQuery(args);
}
