import _ from 'lodash';
import { window } from 'isomorphic-dom';
import nestedIframe from 'nested-iframe';

const { document, Event } = window;

async function scrollToBottom(count, timeout) {
  count--;
  return new Promise(resolve => {
    window.setTimeout(() => {
      window.scrollTo(0, window.document.body.scrollHeight);
      if (count > 0) return resolve(scrollToBottom(count, timeout));
      return resolve();
    }, timeout);
  });
}

async function runInteraction({
  clicks,
  elements,
  fields,
  scripts,
  scroll,
  iframe
}) {
  const { contentDocument } = (await nestedIframe(iframe)) || {
    contentDocument: document
  };
  _.each(fields, (field, key) => {
    _.each(contentDocument.getElementsByName(key), element => {
      element.focus();
      if (element.type === 'checkbox') {
        element.setAttribute('checked', !!field);
      } else if (_.isObjectLike(field)) {
        _.each(field, (value, key) => {
          if (_.isObjectLike(value)) {
            element[key] = _.merge(element[key], value);
          } else {
            element.setAttribute(key, value);
          }
        });
      } else {
        element.setAttribute('value', field);
      }
      element.dispatchEvent(new Event('change'));
      element.blur();
    });
  });
  _.each(elements, elementConfig => {
    _.each(
      contentDocument.querySelectorAll(elementConfig.selector),
      element => {
        if (elementConfig.field) element.focus();
        _.each(elementConfig.value, (value, key) => {
          if (_.isObjectLike(value)) {
            element[key] = _.merge(element[key], value);
          } else {
            element.setAttribute(key, value);
          }
        });
        if (elementConfig.field) {
          element.dispatchEvent(new Event('change'));
          element.blur();
        }
      }
    );
  });
  if (clicks) {
    _.each(clicks, click => {
      _.each(contentDocument.querySelectorAll(click), element => {
        element.click();
      });
    });
  }
  if (scroll) await scrollToBottom(scroll.count, scroll.timeout);
  if (scripts) {
    _.each(scripts, script => {
      // eslint-disable-next-line no-eval
      eval(script);
    });
  }
  return true;
}

window.sooty = {
  ...(window.sooty || {}),
  runInteraction
};
export default runInteraction;
