import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('kontrakt wzorców UI', () => {
  it('utrzymuje interaktywny dropdown bez zależności od frameworka', () => {
    const source = read('src/components/ui/patterns/SelectDropdown.astro');

    expect(source).toContain('data-select-dropdown');
    expect(source).toContain('data-select-value-input');
    expect(source).toContain("document.addEventListener('astro:page-load'");
    expect(source).toContain('aria-selected');
  });

  it('utrzymuje semantyczne stany komunikatu feedbacku', () => {
    const source = read('src/components/ui/patterns/ToastFeedback.astro');

    expect(source).toContain("role={type === 'error' ? 'alert' : 'status'}");
    expect(source).toContain('aria-live={type ===');
    expect(source).toContain("type?: 'success' | 'info' | 'warning' | 'error'");
  });

  it('utrzymuje osobny wzorzec statusów formularza', () => {
    const source = read('src/components/ui/patterns/FormStatus.astro');

    expect(source).toContain("type: 'loading' | 'success' | 'error'");
    expect(source).toContain("role={type === 'error' ? 'alert' : 'status'}");
    expect(source).toContain("class:list={{ 'animate-spin': type === 'loading' }}");
  });

  it('utrzymuje drawer z dialogiem i trybem overlay', () => {
    const source = read('src/components/ui/patterns/MobileDrawer.astro');

    expect(source).toContain('data-mobile-drawer');
    expect(source).toContain('role="dialog"');
    expect(source).toContain("mode?: 'inline' | 'overlay'");
    expect(source).toContain('data-mobile-drawer-close');
  });
});
