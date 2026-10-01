import { describe, expect, it } from 'vitest';
import { maskSourceComments } from './source-comments';

describe('maskSourceComments', () => {
  it('removes markup and line comments without changing line numbers', () => {
    const source = '<!-- href="#" -->\n// href="#"\n<a href="/kontakt/">Kontakt</a>';
    const masked = maskSourceComments(source);

    expect(masked).not.toContain('href="#"');
    expect(masked.split('\n')).toHaveLength(3);
    expect(masked.split('\n')[2]).toContain('href="/kontakt/"');
  });

  it('keeps URLs inside strings intact', () => {
    const source = 'const url = "https://example.com/path";';

    expect(maskSourceComments(source)).toContain('https://example.com/path');
  });
});
