import Promise from 'bluebird';
import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';
import Group from './group';
import { FINISHED, WORKING, READY } from './constants';
import { closeBrowser } from './browser';

export default class Sooty {
  constructor(config, options = {}) {
    this._status = READY;
    this.options = options;
    this.format = 'multiple';
    this.config = this.loadConfig(config);
    this.groups = {};
    this.results = {};
  }

  loadConfig(config) {
    if (_.includes(_.keys(config), 'url') && _.isString(config.url)) {
      this.format = 'single';
      config = { config };
    }
    return config;
  }

  getStatus() {
    return this._status;
  }

  async run() {
    try {
      this._status = WORKING;
      await this.validate();
      await Promise.mapSeries(_.keys(this.config), async key => {
        const groupConfig = this.config[key];
        const group = new Group(key, groupConfig, this.options);
        this.groups[key] = group;
        await group.run();
        this.results[key] = group.results;
      });
      await closeBrowser();
      if (this.format === 'single') this.results = this.results.config;
      this._status = FINISHED;
      return this.results;
    } catch (err) {
      await closeBrowser();
      throw err;
    }
  }

  async validate() {
    await joiValidate(this.config, joi.object());
    return true;
  }
}
