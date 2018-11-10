import detectPort from 'detect-port';
import path from 'path';
import { createServer } from 'http-server';
import Interaction from '../src/interaction';

let config = {
  port: 8080
};

let server = null;

beforeAll(async () => {
  config = await getConfig(config);
  server = createServer({
    root: path.resolve(__dirname, 'public')
  });
  await new Promise((resolve, reject) => {
    server.server.on('error', err => reject(err));
    server.listen(config.port, err => {
      if (err) return reject(err);
      console.log(`listening on port ${config.port}`);
      return resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

describe('new Interaction(name, url, config)', () => {
  it('should load config', async () => {
    const interaction = new Interaction(
      'searchCatFunnyVideos',
      'https://google.com',
      [
        {
          fields: {
            q: 'funny cat videos'
          }
        },
        {
          key: 'Enter'
        },
        {
          script: "console.log('Hello, world!')"
        }
      ]
    );
    expect(interaction.config).toEqual({
      steps: [
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: {
            q: 'funny cat videos'
          },
          iframe: [],
          keys: [],
          scripts: [],
          scroll: undefined,
          waitUntil: 'load'
        },
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: undefined,
          iframe: [],
          keys: ['Enter'],
          scripts: [],
          scroll: undefined,
          waitUntil: 'load'
        },
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: undefined,
          iframe: [],
          keys: [],
          scripts: ["console.log('Hello, world!')"],
          scroll: undefined,
          waitUntil: 'load'
        }
      ]
    });
  });
  it('should guess steps', async () => {
    const interaction = new Interaction(
      'searchCatFunnyVideos',
      'https://google.com',
      {
        fields: {
          q: 'funny cat videos'
        }
      }
    );
    expect(interaction.config).toEqual({
      steps: [
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: {
            q: 'funny cat videos'
          },
          iframe: [],
          keys: [],
          scripts: [],
          scroll: undefined,
          waitUntil: 'load'
        }
      ]
    });
  });
});

describe('interaction.validate()', () => {
  it('should validate', async () => {
    const interaction = new Interaction(
      'searchCatFunnyVideos',
      'https://google.com',
      [
        {
          fields: {
            q: 'funny cat videos'
          }
        },
        {
          key: 'Enter'
        },
        {
          script: "console.log('Hello, world!')"
        }
      ]
    );
    await interaction.validate();
  });
  it('should invalidate', async () => {
    const interaction = new Interaction(
      'searchCatFunnyVideos',
      'https://google.com',
      { fields: 5000 }
    );
    try {
      await interaction.validate();
    } catch (err) {
      expect(err.message).toBe(
        'child "steps" fails because ["steps" at position 0 fails because ' +
          '[child "fields" fails because ["fields" must be an object]]]'
      );
    }
  });
});

describe('interaction.run()', () => {
  it('should fill out fields', async () => {
    const interaction = new Interaction(
      'someFieldInteraction',
      `http://localhost:${config.port}/interactions.html`,
      {
        fields: {
          firstName: 'Darth',
          lastName: 'Vader'
        }
      },
      { debug: true }
    );
    const [result] = await interaction.run();
    const { dom } = result;
    expect(dom.window.document.getElementsByName('firstName')[0].value).toBe(
      'Darth'
    );
    expect(dom.window.document.getElementsByName('lastName')[0].value).toBe(
      'Vader'
    );
  });
  it('should click buttons', async () => {
    const interaction = new Interaction(
      'someClickInteraction',
      `http://localhost:${config.port}/interactions.html`,
      {
        click: '#submit'
      },
      { debug: true }
    );
    const [result] = await interaction.run();
    const { dom } = result;
    expect(dom.window.document.getElementById('submit')).toBeFalsy();
  });
  it('should modify elements', async () => {
    const interaction = new Interaction(
      'someElementInteraction',
      `http://localhost:${config.port}/interactions.html`,
      {
        elements: [
          {
            selector: '#submit',
            value: {
              style: 'background-color:#FF9900'
            }
          }
        ]
      },
      { debug: true }
    );
    const [result] = await interaction.run();
    const { dom } = result;
    expect(
      dom.window.document.getElementById('submit').style.backgroundColor
    ).toBe('rgb(255, 153, 0)');
  });
  it('should work with iframes', async () => {
    const interaction = new Interaction(
      'someIframeInteraction',
      `http://localhost:${config.port}/interactions.html`,
      {
        iframe: '#iframe',
        elements: [
          {
            selector: 'h1',
            value: {
              style: 'color:red'
            }
          }
        ]
      },
      { debug: true }
    );
    await interaction.run();
  });
});

async function getConfig(config) {
  return {
    ...config,
    port: await detectPort(config.port)
  };
}
