import { closeBrowser } from './browser';
import scrape from './scrape';
import validate from './validate';

export default async function sooty(unvalidatedConfig) {
  try {
    const { config, format } = await validate(unvalidatedConfig);
    const results = await scrape(config);
    await closeBrowser();
    if (format === 'single') return results.single;
    return results;
  } catch (err) {
    await closeBrowser();
    throw err;
  }
}
