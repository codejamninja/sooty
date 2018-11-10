![sooty2011](https://user-images.githubusercontent.com/6234038/37239922-524b796a-2443-11e8-961b-9ed61344b1b1.png)

# sooty

[![Beerpay](https://beerpay.io/codejamninja/sooty/badge.svg?style=beer-square)](https://beerpay.io/codejamninja/sooty)
[![Beerpay](https://beerpay.io/codejamninja/sooty/make-wish.svg?style=flat-square)](https://beerpay.io/codejamninja/sooty?focus=wish)
[![GitHub stars](https://img.shields.io/github/stars/codejamninja/sooty.svg?style=social&label=Stars)](https://github.com/codejamninja/sooty)

> A bit of oofle dust to scrape websites

 it useful &#9733; &#9733; &#9733;


## Features

* Scrape by query selector
* Built on headless chrome


## Installation

```sh
npm install --save sooty
```


## Dependencies

* [NodeJS](https://nodejs.org)
* [Chrome](https://www.google.com/chrome)


## Usage

```js
import Sooty from 'sooty';

const scrapper = new Sooty({
  url: 'https://google.com',              // go to google search page
  interactions: {
    search: [
      {                                   // fill out Google search
        fields: { q: 'funny cat videos' }
      },
      {                                   // press "Google Search" button
        click: 'input[name=btnK]',
        waitUntil: 'networkidle0'
      }
    ]
  },
  queries: {
    catVideos: {                          // query google search results
      selector: '.rc .r a',
      requires: ['search']
    }
  }
});
scrapper.run().then(results => {
  results.catVideos.forEach(catVideo => {
    console.log(`${catVideo}\n`);
  });
});
```


## Support

Submit an [issue](https://github.com/codejamninja/sooty/issues/new)


## Screenshots

[Contribute](https://github.com/codejamninja/sooty/blob/master/CONTRIBUTING.md) a screenshot


## Contributing

Review the [guidelines for contributing](https://github.com/codejamninja/sooty/blob/master/CONTRIBUTING.md)


## License

[MIT License](https://github.com/codejamninja/sooty/blob/master/LICENSE)

[Jam Risser](https://jam.codejam.ninja) &copy; 2018


## Changelog

Review the [changelog](https://github.com/codejamninja/sooty/blob/master/CHANGELOG.md)


## Credits

* [Jam Risser](https://jam.codejam.ninja) - Author


## Support on Beerpay (actually, I drink coffee)

A ridiculous amount of coffee :coffee: :coffee: :coffee: was consumed in the process of building this project.

[Add some fuel](https://beerpay.io/codejamninja/sooty) if you'd like to keep me going!

[![Beerpay](https://beerpay.io/codejamninja/sooty/badge.svg?style=beer-square)](https://beerpay.io/codejamninja/sooty)
[![Beerpay](https://beerpay.io/codejamninja/sooty/make-wish.svg?style=flat-square)](https://beerpay.io/codejamninja/sooty?focus=wish)
