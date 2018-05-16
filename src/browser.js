import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import { murmurHash } from 'murmurhash-native';

let browser = null;
const pages = {};

export async function evaluate(
  name,
  url,
  pageFunction,
  context = {},
  options = {}
) {
  const {
    debug = false,
    debugPath = path.resolve('.tmp', 'debug'),
    waitForPage
  } = options;
  const hash = murmurHash(`${name}=${url}`);
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_BIN || null,
      args: ['--no-sandbox', '--headless', '--disable-gpu'],
      ignoreHTTPSErrors: false
    });
  }
  let { page, ref } = pages[hash] || {};
  if (page) {
    ref++;
  } else {
    page = await browser.newPage();
    ref = 0;
    pages[hash] = {
      page,
      ref
    };
    page.on('console', message => {
      // eslint-disable-next-line no-console
      if (message._type) return console[message._type](message._text);
      // eslint-disable-next-line no-console
      return console.log(message);
    });
    await page.goto(url);
    const scripts = fs.readFileSync(
      path.resolve(__dirname, '../lib/scripts.js'),
      'utf8'
    );
    // eslint-disable-next-line no-new-func
    await page.evaluate(new Function(scripts));
  }
  const result = await page.evaluate(pageFunction, context);
  if (waitForPage) {
    await page.waitForNavigation(waitForPage).catch(() => {});
  }
  const dom = new JSDOM(await page.evaluate(getHTML));
  if (debug) {
    const htmlPath = path.resolve(debugPath, 'html');
    const screenshotsPath = path.resolve(debugPath, 'screenshots');
    fs.mkdirsSync(htmlPath);
    fs.mkdirsSync(screenshotsPath);
    fs.writeFileSync(
      path.resolve(htmlPath, `${name}-${hash}-${ref}.html`),
      dom.window.document.body.innerHTML
    );
    await page.screenshot({
      fullPage: true,
      path: path.resolve(screenshotsPath, `${name}-${hash}-${ref}.png`)
    });
  }
  return { dom, page, result };
}

function getHTML() {
  // eslint-disable-next-line no-undef
  return document.documentElement.innerHTML;
}

export async function closeBrowser() {
  if (browser) return browser.close();
  return null;
}

export default {
  evaluate,
  closeBrowser
};
