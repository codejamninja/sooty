import _ from 'lodash';
import { window } from 'isomorphic-dom';

const { document, Event } = window;

function mergeElement(element, config) {
  _.each(config, (key, configValue) => {
    let elementValue = element[key];
    if (Array.isArray(elementValue)) {
      elementValue = elementValue.concat(configValue);
    } else if (typeof elementValue === 'object') {
      Object.assign(elementValue, configValue);
    } else {
      elementValue = configValue;
    }
  });
}

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

async function runInteraction({ click, elements, fields, scripts, scroll }) {
  _.each(fields, (field, key) => {
    _.each(window.document.getElementsByName(key), element => {
      element.focus();
      if (element.type === 'checkbox') {
        element.checked = !!field;
      } else if (_.isString(field)) {
        element.value = field;
      } else {
        mergeElement(element, field);
      }
      element.dispatchEvent(new Event('change'));
      element.blur();
    });
  });
  _.each(elements, elementConfig => {
    _.each(document.querySelectorAll(elementConfig.selector), element => {
      if (elementConfig.field) element.focus();
      mergeElement(element, elementConfig.value);
      if (elementConfig.field) {
        element.dispatchEvent(new Event('change'));
        element.blur();
      }
    });
  });
  if (click) {
    if (_.isString(click)) {
      _.each(document.querySelectorAll(click), element => {
        element.click();
      });
    } else {
      _.each(click, selector => {
        _.each(document.querySelectorAll(selector), element => {
          element.click();
        });
      });
    }
  }
  if (scroll) await scrollToBottom(scroll.count, scroll.timeout);
  if (scripts) {
    _.each(scripts, script => {
      // eslint-disable-next-line no-eval
      eval(script);
    });
  }
}

window.sooty = {
  ...(window.sooty || {}),
  runInteraction
};
export default runInteraction;
