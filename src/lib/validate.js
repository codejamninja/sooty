import _ from 'lodash';
import boom from 'boom';
import commander from 'commander';
import joi from 'joi';
import joiValidate from 'easy-joi';
import path from 'path';

export default async function validate(cmd, options) {
  const args = {};
  if (_.isString(options)) {
    throw boom.badRequest(`command '${options}' not allowed`);
  }
  args.root = path.resolve(
    await joiValidate(commander.root || process.cwd(), joi.string(), 'root')
  );
  args.config = path.resolve(
    args.root,
    await joiValidate(commander.config || 'sooty.yml', joi.string(), 'config')
  );
  return args;
}
