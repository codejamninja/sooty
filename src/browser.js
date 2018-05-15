import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

let browser = null;
const pages = {};

export async function evaluate(url, pageFunction, context = {}) {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROME_BIN || null,
      args: ['--no-sandbox', '--headless', '--disable-gpu'],
      ignoreHTTPSErrors: false
    });
  }
  let page = pages[url];
  if (!page) {
    page = await browser.newPage();
    pages[url] = page;
    // eslint-disable-next-line no-console
    page.on('console', message => console.log(message));
    await page.goto(url);
    const scripts = fs.readFileSync(
      path.resolve(__dirname, 'scripts.js'),
      'utf8'
    );
    // eslint-disable-next-line no-new-func
    await page.evaluate(new Function(scripts));
  }
  const result = await page.evaluate(pageFunction, context);
  return { page, result };
}

export async function closeBrowser() {
  if (browser) return browser.close();
  return null;
}

export default {
  evaluate,
  closeBrowser
};
