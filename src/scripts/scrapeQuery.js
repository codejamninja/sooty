import _ from 'lodash';
import nestedIframe from 'nested-iframe';
import { window } from 'isomorphic-dom';

const { document } = window;

async function scrapeQuery({ html, iframe, selector, attribute }) {
  let contentDocument = document;
  if (iframe.length) {
    ({ contentDocument } = nestedIframe(iframe) || {
      contentDocument: document
    });
  }
  const results = [];
  _.each(contentDocument.querySelectorAll(selector), element => {
    if (attribute) {
      results.push(element[attribute]);
    } else {
      results.push(html ? element.innerHTML : element.innerText);
    }
  });
  return results;
}

window.sooty = {
  ...(window.sooty || {}),
  scrapeQuery
};
export default scrapeQuery;
