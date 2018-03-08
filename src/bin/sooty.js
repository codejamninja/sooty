#!/usr/bin/env node

import 'babel-polyfill';
import commander from 'commander';
import action from '../lib/action';
import error from '../lib/error';
import { version } from '../package';

commander.version(version);
commander.option('-r --root [path]', 'root path');
commander.option('-c --config [path]', 'config path');
commander.action((cmd, options) => action(cmd, options).catch(error));
commander.parse(process.argv);
