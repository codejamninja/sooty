import detectPort from 'detect-port';
import path from 'path';
import { createServer } from 'http-server';
import Query from '../src/query';

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

describe('new Query(name, url, config)', () => {
  it('should load config', async () => {
    const query = new Query(
      'someQuery',
      `http://localhost:${config.port}/queries.html`,
      { selector: 'h1' }
    );
    expect(query.config).toEqual({
      filter: undefined,
      html: false,
      iframe: [],
      replace: [],
      requires: [],
      selector: 'h1'
    });
  });
});

describe('interaction.validate()', () => {
  it('should validate', async () => {
    const query = new Query(
      'someQuery',
      `http://localhost:${config.port}/queries.html`,
      { selector: 'h1' }
    );
    expect(await query.validate()).toBe(true);
  });
});

describe('interaction.run()', () => {
  it('should execute query', async () => {
    const query = new Query(
      'someQuery',
      `http://localhost:${config.port}/queries.html`,
      { selector: 'h1' }
    );
    expect(await query.run()).toEqual(['Numbers']);
  });
  it('should filter query', async () => {
    const query = new Query(
      'someFilteredQuery',
      `http://localhost:${config.port}/queries.html`,
      { selector: 'li', filter: '/On|Three/g' }
    );
    expect(await query.run()).toEqual(['On', 'Three']);
  });
  it('should replace query', async () => {
    const query = new Query(
      'someReplacedQuery',
      `http://localhost:${config.port}/queries.html`,
      { selector: 'li', replace: { match: '/On/g', value: 'bon' } }
    );
    expect(await query.run()).toEqual(['bone', 'Two', 'Three']);
  });
});

async function getConfig(config) {
  return {
    ...config,
    port: await detectPort(config.port)
  };
}
