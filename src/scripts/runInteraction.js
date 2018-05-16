import _ from 'lodash';
import { window } from 'isomorphic-dom';

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

async function runInteraction({ clicks, elements, fields, scripts, scroll }) {
  _.each(fields, (field, key) => {
    _.each(window.document.getElementsByName(key), element => {
      element.focus();
      if (element.type === 'checkbox') {
        element.setAttribute('checked', !!field);
      } else if (_.isString(field)) {
        element.setAttribute('value', field);
      } else {
        _.each(element.attributes, (attribute, key) => {
          element.setAttribute(key, _.merge(element[key], field));
        });
      }
      element.dispatchEvent(new Event('change'));
      element.blur();
    });
  });
  _.each(elements, elementConfig => {
    _.each(document.querySelectorAll(elementConfig.selector), element => {
      if (elementConfig.field) element.focus();
      _.each(element.attributes, (attribute, key) => {
        element.setAttribute(key, _.merge(element[key], elementConfig.value));
      });
      if (elementConfig.field) {
        element.dispatchEvent(new Event('change'));
        element.blur();
      }
    });
  });
  if (clicks) {
    _.each(clicks, click => {
      _.each(document.querySelectorAll(click), element => {
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
