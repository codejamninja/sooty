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
      // eslint-disable-next-line no-console
      console.log(`listening on port ${config.port}`);
      return resolve();
    });
  });
});

afterAll(() => {
  server.close();
});

describe('new Interaction(name, url, config)', async () => {
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
          keys: [],
          scripts: [],
          scroll: undefined,
          timeout: 1000,
          waitUntil: 'load'
        },
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: undefined,
          keys: ['Enter'],
          scripts: [],
          scroll: undefined,
          timeout: 1000,
          waitUntil: 'load'
        },
        {
          clicks: [],
          delay: undefined,
          elements: undefined,
          fields: undefined,
          keys: [],
          scripts: ["console.log('Hello, world!')"],
          scroll: undefined,
          timeout: 1000,
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
          keys: [],
          scripts: [],
          scroll: undefined,
          timeout: 1000,
          waitUntil: 'load'
        }
      ]
    });
  });
});

describe('interaction.validate()', async () => {
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

describe('interaction.run()', async () => {
  it('should fill out fields', async () => {
    const interaction = new Interaction(
      'someInteraction',
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
      'someInteraction',
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
});

async function getConfig(config) {
  return {
    ...config,
    port: await detectPort(config.port)
  };
}
