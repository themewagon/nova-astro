import { describe, expect, it } from 'vitest';
import { isKnownBaselineIssue, type BaselineEntry } from '@utils/mobile-audit-baseline';

describe('mobile audit baseline matching', () => {
  const baseline: BaselineEntry[] = [
    {
      file: 'src/components/registry/faq/FaqListBlock.astro',
      rule: 'empty-href',
      line: 99,
      reason: 'Pre-existing issue',
    },
  ];

  it('matches the exact file, rule, and line', () => {
    expect(isKnownBaselineIssue(baseline, 'src/components/registry/faq/FaqListBlock.astro', {
      rule: 'empty-href',
      line: 99,
    })).toBe(true);
  });

  it('does not hide a new issue on another line in the same file', () => {
    expect(isKnownBaselineIssue(baseline, 'src/components/registry/faq/FaqListBlock.astro', {
      rule: 'empty-href',
      line: 120,
    })).toBe(false);
  });

  it('normalizes Windows paths before matching', () => {
    expect(isKnownBaselineIssue(baseline, 'src\\components\\registry\\faq\\FaqListBlock.astro', {
      rule: 'empty-href',
      line: 99,
    })).toBe(true);
  });
});
