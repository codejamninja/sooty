import _ from 'lodash';
import { window } from 'isomorphic-dom';

const { document } = window;

async function scrapeQuery({ html, selector }) {
  const results = [];
  _.each(document.querySelectorAll(selector), element => {
    results.push(html ? element.innerHTML : element.innerText);
  });
  return results;
}

window.sooty = {
  ...(window.sooty || {}),
  scrapeQuery
};
export default scrapeQuery;
