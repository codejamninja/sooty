#!/usr/bin/env node
'use strict';

require('babel-polyfill');

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _action = require('../lib/action');

var _action2 = _interopRequireDefault(_action);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _package = require('../package');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.version(_package.version);
_commander2.default.option('-c --compose [path]', 'docker compose path');
_commander2.default.option('-f --dockerfile [path]', 'dockerfile path');
_commander2.default.option('-i --image [name]', 'name of image');
_commander2.default.option('-r --root [path]', 'root path');
_commander2.default.option('-s --service [name]', 'name of the service');
_commander2.default.option('-t --tag [name]', 'tag of docker image');
_commander2.default.option('-v --verbose', 'verbose logging');
_commander2.default.option('--root-context', 'use root path as context path');
_commander2.default.command('build [service]');
_commander2.default.command('info [service]');
_commander2.default.command('pull [service]');
_commander2.default.command('push [service]');
_commander2.default.command('run [service]');
_commander2.default.command('ssh [service]');
_commander2.default.command('up');
_commander2.default.action(function (cmd, options) {
  return (0, _action2.default)(cmd, options).catch(_error2.default);
});
_commander2.default.parse(process.argv);