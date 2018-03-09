import Promise from 'bluebird';
import _ from 'lodash';
import puppeteer from 'puppeteer';
import validate from './validate';

let browser = null;

export default async function scrape(unvalidatedConfig) {
  try {
    const { config, format } = await validate(unvalidatedConfig);
    const configKeys = _.keys(config);
    let results = _.zipObject(
      configKeys,
      await Promise.mapSeries(configKeys, key => {
        const { url, queries } = config[key];
        return evaluate(url, pageFunction, { queries });
      })
    );
    await browser.close();
    results = filterResults(config, results);
    if (format === 'single') return results.single;
    return results;
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    throw err;
  }
}

async function evaluate(url, pageFunction, context) {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_BIN || null,
      args: ['--no-sandbox', '--headless', '--disable-gpu'],
      ignoreHTTPSErrors: false
    });
  }
  const page = await browser.newPage();
  // eslint-disable-next-line no-console
  page.on('console', message => console.log(message));
  await page.goto(url);
  return page.evaluate(pageFunction, context);
}

function filterResults(config, results) {
  const filteredResults = {};
  _.each(results, (result, resultKey) => {
    const filteredQueries = {};
    _.each(result, (queryValue, queryKey) => {
      const queryConfig = config[resultKey].queries[queryKey];
      filteredQueries[queryKey] = _.map(queryValue, value => {
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
        return value;
      });
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

function newRegExp(regexString) {
  let expression = regexString;
  let flags = '';
  if (/^\/((\\\/)|[^\/])*\//.test(regexString)) {
    expression = (regexString.match(/^\/((\\\/)|[^\/])*/g) || [])
      .join('')
      .substr(1);
    flags = (regexString.match(/[^\/]*$/g) || []).join('');
  }
  return new RegExp(expression, flags);
}
