import puppeteer from 'puppeteer';

let browser = null;

export async function evaluate(url, pageFunction, context = {}) {
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

export async function closeBrowser() {
  if (browser) return browser.close();
  return null;
}

export default {
  evaluate,
  closeBrowser
};
