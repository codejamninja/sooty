import _ from 'lodash';
import newRegExp from 'newregexp';
import { evaluate } from './browser';
import { FINISHED, READY, WAITING, WORKING } from './constants';

export default class Query {
  constructor(
    name,
    url,
    { filter, html = false, replace, requires = [], selector }
  ) {
    this._status = WAITING;
    this.filter = filter;
    this.html = html;
    this.name = name;
    this.result = [];
    this.scraped = null;
    this.selector = selector;
    this.url = url;
    if (_.isString(requires)) {
      this.requires = [requires];
    } else {
      this.requires = requires;
    }
    if (_.isString(replace)) {
      this.replace = {
        match: replace,
        value: ''
      };
    } else {
      this.replace = replace;
    }
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
    const { result } = await evaluate(this.url, scrapeQuery, {
      html: this.html,
      selector: this.selector
    });
    this.scraped = result;
    this._status = FINISHED;
    return this.scraped;
  }

  async runFilter() {
    _.each(this.scraped, value => {
      if (this.filter) {
        value = (value.match(newRegExp(this.filter)) || []).join('');
      }
      if (this.replace) {
        value = value.replace(
          newRegExp(this.replace.match),
          this.replace.value
        );
      }
      if (value && value.length > 0) {
        this.result.push(value);
      }
    });
    return this.result;
  }

  async validate() {
    return true;
  }
}

/* eslint-disable prefer-arrow-callback,func-names,no-var,no-undef */
function scrapeQuery({ html, selector }) {
  var results = [];
  document.querySelectorAll(selector).forEach(function(element) {
    results.push(html ? element.innerHTML : element.innerText);
  });
  return results;
}
