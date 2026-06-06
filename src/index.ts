import { tokenize } from './tokenize.js';
import { stringify } from './stringify.js';
import { execute } from './execute.js';

export function compile(input: string) {
  const tokens = tokenize(input);
  const stack = execute(tokens);

  return stringify(stack);
}
