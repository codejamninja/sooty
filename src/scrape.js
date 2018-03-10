import Promise from 'bluebird';
import _ from 'lodash';
import newRegExp from 'newregexp';
import { evaluate } from './browser';

export default async function scrape(config) {
  const configKeys = _.keys(config);
  const results = _.zipObject(
    configKeys,
    await Promise.mapSeries(configKeys, key => {
      const { url, queries } = config[key];
      return evaluate(url, pageFunction, { queries });
    })
  );
  return filterResults(config, results);
}

function filterResults(config, results) {
  const filteredResults = {};
  _.each(results, (result, resultKey) => {
    const filteredQueries = {};
    _.each(result, (queryValue, queryKey) => {
      const queryConfig = config[resultKey].queries[queryKey];
      const filteredQueryValue = [];
      _.each(queryValue, value => {
        if (queryConfig.filter) {
          value = (value.match(newRegExp(queryConfig.filter)) || []).join('');
        }
        if (queryConfig.replace) {
          if (_.isString(queryConfig.replace)) {
            queryConfig.replace = {
              match: queryConfig.replace,
              value: ''
            };
          }
          value = value.replace(
            newRegExp(queryConfig.replace.match),
            queryConfig.replace.value
          );
        }
        if (value && value.length > 0) {
          filteredQueryValue.push(value);
        }
      });
      filteredQueries[queryKey] = filteredQueryValue;
    });
    filteredResults[resultKey] = filteredQueries;
  });
  return filteredResults;
}

/* eslint-disable no-var,no-undef,no-prototype-builtins,no-restricted-syntax,vars-on-top,no-loop-func */
// executed in browser context
function pageFunction({ queries }) {
  var results = {};
  for (key in queries) {
    if (queries.hasOwnProperty(key)) {
      var query = queries[key];
      var queryResults = [];
      document.querySelectorAll(query.selector).forEach(element => {
        queryResults.push(query.html ? element.innerHTML : element.innerText);
      });
      results[key] = queryResults;
    }
  }
  return results;
}
