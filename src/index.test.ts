import { expect, describe, it } from 'vitest';
import { compile } from './index.js';

describe('some examples', () => {
  it('compiles to what we expect', () => {
    expect(compile('💚🤍👎🐺-13')).toMatchInlineSnapshot(
      `"-(color:white OR color:green) type:wolf year<=2013"`,
    );
  });

  it('compiles to what we expect', () => {
    expect(compile('🐻👎🐻🖼️')).toMatchInlineSnapshot(
      `"-(type:bear) art:bear"`,
    );
  });
});
