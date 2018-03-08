import _ from 'lodash';
import fs from 'fs';
import jsYaml from 'js-yaml';
import puppeteer from 'puppeteer';
import setEnvs from 'set-envs';
import log from './log';
import validate from './validate';

export default async function action(cmd, options) {
  const args = await validate(cmd, options);
  const config = await loadConfig(args.config);
  log.info('config', config);
}

async function loadConfig(configPath) {
  const configString = await new Promise((resolve, reject) => {
    fs.readFile(configPath, (err, data) => {
      if (err) return reject(err);
      return resolve(setEnvs(data.toString()));
    });
  });
  return jsYaml.safeLoad(configString);
}
