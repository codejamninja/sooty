import Promise from 'bluebird';
import _ from 'lodash';
import joi from 'joi';
import joiValidate from 'easy-joi';

export default async function validateConfig(config) {
  await Promise.mapSeries(_.keys(config), async key => {
    return joiValidate(
      config[key] || {},
      {
        url: joi.string().required(),
        queries: joi.object().required()
      },
      key
    );
  });
  return config;
}
