import { expect, describe, it } from 'vitest';
import { compile } from './index.js';

describe('some examples', () => {
  it('compiles to what we expect', () => {
    expect(compile('🟢⚪👎🐺-13')).toMatchInlineSnapshot(
      `"-(color:white OR color:green) type:wolf year<=2013"`,
    );
  });

  it('compiles to what we expect', () => {
    expect(compile('🐻👎🐻🖼️')).toMatchInlineSnapshot(
      `"-(type:bear) art:bear"`,
    );
  });
});

describe('unwrap', () => {
  it('unwraps color: prefix for art tag', () => {
    expect(compile('🟢🖼️')).toMatchInlineSnapshot(`"art:green"`);
  });

  it('unwraps type: prefix for artist', () => {
    expect(compile('🐻👨‍🎨')).toMatchInlineSnapshot(`"artist:bear"`);
  });

  it('unwraps fo: prefix as oracle phrase', () => {
    expect(compile('🐻🔮🖼️')).toBe('(art:bear art:oracle)');
  });

  it('wraps unknown prefixes as a quoted phrase', () => {
    expect(compile('🐻🖼️🖼️')).toBe('(art:bear art:art)');
  });
});
