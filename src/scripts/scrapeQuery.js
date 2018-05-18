import _ from 'lodash';
import nestedIframe from 'nested-iframe';
import { window } from 'isomorphic-dom';

const { document } = window;

async function scrapeQuery({ html, iframe, selector }) {
  const { contentDocument } = nestedIframe(iframe) || {
    contentDocument: document
  };
  const results = [];
  _.each(contentDocument.querySelectorAll(selector), element => {
    results.push(html ? element.innerHTML : element.innerText);
  });
  return results;
}

window.sooty = {
  ...(window.sooty || {}),
  scrapeQuery
};
export default scrapeQuery;
