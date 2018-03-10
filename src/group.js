import Promise from 'bluebird';
import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';
import Interaction from './interaction';
import Query from './query';
import { FINISHED, READY, WORKING } from './constants';

export default class Group {
  constructor(name, { interactions = {}, queries = {}, url }) {
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
    return Promise.mapSeries(
      _.keys(this.queries, async key => {
        const query = this.queries[key];
        if (query.getStatus(this.finishedInteractions) === READY) {
          await query.run();
          this.results[query.name] = query.result;
        }
      })
    );
  }

  async run() {
    this._status = WORKING;
    await Promise.mapSeries(this.interactions, interaction => {
      return interaction.init();
    });
    await Promise.mapSeries(this.queries, query => {
      return query.init();
    });
    await this.continueScraping();
    await Promise.mapSeries(_.keys(this.interactions), async key => {
      const interaction = this.interactions[key];
      await interaction.run();
      this.finishedInteractions.push(interaction.name);
      await this.continueScraping();
    });
    this._status = FINISHED;
    return this.results;
  }

  async validate() {
    return joiValidate(
      {
        interactions: this.interactions,
        queries: this.queries,
        url: this.url
      },
      joi.object({
        interactions: joi.object(),
        queries: joi.object(),
        url: joi.string().required()
      }),
      this.name
    );
  }
}
