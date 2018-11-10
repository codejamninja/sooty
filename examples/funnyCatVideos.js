import Sooty from '../src';

async function main() {
  const scrapper = new Sooty({
    url: 'https://google.com', // go to google search page
    interactions: {
      search: [
        {
          // fill out Google search
          fields: { q: 'funny cat videos' }
        },
        {
          // press "Google Search" button
          click: 'input[name=btnK]',
          waitUntil: 'networkidle0'
        }
      ]
    },
    queries: {
      catVideos: {
        // query google search results
        selector: '.rc .r a',
        requires: ['search']
      }
    }
  });
  const results = await scrapper.run();
  results.catVideos.forEach(catVideo => {
    console.log(`${catVideo}\n`);
  });
}

if (typeof require !== 'undefined' && require.main === module) main();

export default main;
