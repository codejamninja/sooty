import Promise from 'bluebird';
import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';
import Interaction from './interaction';
import Query from './query';
import { FINISHED, READY, WORKING } from './constants';

export default class Group {
  constructor(name, config = {}) {
    const { interactions = {}, queries = {}, url } = config;
    this.config = config;
    this._status = READY;
    this.finishedInteractions = [];
    this.interactions = {};
    this.name = name;
    this.queries = {};
    this.results = {};
    this.url = url;
    _.each(interactions, (interaction, key) => {
      this.interactions[key] = new Interaction(key, this.url, interaction);
    });
    _.each(queries, (query, key) => {
      this.queries[key] = new Query(key, this.url, query);
    });
  }

  getStatus() {
    return this._status;
  }

  async continueScraping() {
    const queryKeys = _.keys(this.queries);
    if (!queryKeys.length) return null;
    return Promise.mapSeries(queryKeys, async key => {
      const query = this.queries[key];
      if (query.getStatus(this.finishedInteractions) === READY) {
        await query.run();
        this.results[query.name] = query.result;
      }
    });
  }

  async run() {
    this._status = WORKING;
    const interactionKeys = _.keys(this.interactions);
    const queryKeys = _.keys(this.queries);
    if (interactionKeys.length) {
      await Promise.mapSeries(interactionKeys, key => {
        const interaction = this.interactions[key];
        return interaction.init();
      });
    }
    if (queryKeys.length) {
      await Promise.mapSeries(queryKeys, async key => {
        const query = this.queries[key];
        const done = await query.init();
        return done;
      });
    }
    await this.continueScraping();
    if (interactionKeys.length) {
      await Promise.mapSeries(interactionKeys, async key => {
        const interaction = this.interactions[key];
        await interaction.run();
        this.finishedInteractions.push(interaction.name);
        await this.continueScraping();
      });
    }
    this._status = FINISHED;
    return this.results;
  }

  async validate() {
    await joiValidate(
      this.config,
      joi.object().keys({
        url: joi.string(),
        interactions: joi.object().optional(),
        queries: joi.object().optional()
      })
    );
    return true;
  }
}
