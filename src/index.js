import Promise from 'bluebird';
import _ from 'lodash';
import puppeteer from 'puppeteer';
import validate from './validate';

let browser = null;

export default async function scrape(config) {
  try {
    let configKeys = _.keys(config);
    let single = false;
    if (_.includes(configKeys, 'url')) {
      single = true;
      config = { single: config };
      configKeys = _.keys(config);
    }
    await validate(config);
    const results = _.zipObject(
      configKeys,
      await Promise.mapSeries(configKeys, key => {
        const { url, queries } = config[key];
        return evaluate(url, pageFunction, { queries });
      })
    );
    await browser.close();
    if (single) return results.single;
    return results;
  } catch (err) {
    await browser.close();
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

/* eslint-disable no-var,no-undef,no-prototype-builtins,no-restricted-syntax,vars-on-top,no-loop-func */
// executed in browser context
function pageFunction({ queries }) {
  var results = {};
  for (key in queries) {
    if (queries.hasOwnProperty(key)) {
      var query = queries[key];
      var queryResults = [];
      if (typeof query === 'string') {
        query = {
          selector: query,
          html: false
        };
      }
      document.querySelectorAll(query.selector).forEach(element => {
        queryResults.push(query.html ? element.innerHTML : element.innerText);
      });
      results[key] = queryResults;
    }
  }
  return results;
}
