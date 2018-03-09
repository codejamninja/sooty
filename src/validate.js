import Promise from 'bluebird';
import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';

export default async function validateConfig(config) {
  const validatedConfig = {};
  let configKeys = _.keys(config);
  let format = 'multiple';
  if (_.includes(configKeys, 'url')) {
    format = 'single';
    config = { single: config };
    configKeys = _.keys(config);
  }
  await Promise.mapSeries(configKeys, async key => {
    return joiValidate(
      config[key] || {},
      {
        url: joi.string().required(),
        queries: joi.object().required()
      },
      key
    );
  });
  _.each(config, (query, key) => {
    if (_.isString(query)) {
      query = {
        selector: query,
        html: false
      };
    }
    validatedConfig[key] = query;
  });
  return { config: validatedConfig, format };
}
