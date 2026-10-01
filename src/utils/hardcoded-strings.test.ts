import { describe, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Test wykrywajacy "sztywno" wpisane tresci w plikach .astro.
 * Pomaga w identyfikacji tekstów, które powinny trafić do plików JSON.
 */
describe('Hardcoded Text Scanner', () => {
  const COMPONENTS_DIR = path.resolve(process.cwd(), 'src/components');
  
  const getAstroFiles = (dir: string): string[] => {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results.push(...getAstroFiles(fullPath));
      } else if (file.endsWith('.astro')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const scanFile = (filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Usun frontmatter
    let clean = content.replace(/^---[\s\S]*?---/, '');
    
    // 2. Usun tagi <script> i <style>
    clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // 3. Usun komentarze HTML
    clean = clean.replace(/<!--[\s\S]*?-->/g, '');
    
    // 4. Usun wyrazenia JS w klamrach { ... }
    clean = clean.replace(/\{[\s\S]*?\}/g, '');
    
    // 5. Usun tagi HTML <...> ale zostaw ich zawartosc
    clean = clean.replace(/<[^>]+>/g, '\n');
    
    // 6. Podziel na linie i oczysc
    const lines = clean.split('\n');
    const hardcoded: { line: number, text: string }[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      // Szukamy tekstow ktore:
      // - maja wiecej niz 2 znaki
      // - zawieraja polskie znaki LUB sa dluzszymi slowami (prawdopodobnie tresc)
      // - nie sa czystymi liczbami/symbolami
      const hasPolishChars = /[ąęółńćźżśĄĘÓŁŃĆŹŻŚ]/.test(trimmed);
      const isContent = trimmed.length > 3 && /[a-zA-Z]/.test(trimmed);
      
      if (trimmed && (hasPolishChars || isContent)) {
        // Ignorujemy techniczne nazwy jak "slot" czy "class" (choc regex tagow powinien to wylapac)
        if (!['slot', 'fragment'].includes(trimmed.toLowerCase())) {
          hardcoded.push({ line: index + 1, text: trimmed });
        }
      }
    });
    
    return hardcoded;
  };

  it('powinien wylistować sztywno wpisane treści w komponentach', () => {
    const files = getAstroFiles(COMPONENTS_DIR);
    const report: Record<string, any[]> = {};
    let totalFound = 0;

    files.forEach((file) => {
      const relativePath = path.relative(process.cwd(), file);
      const findings = scanFile(file);
      if (findings.length > 0) {
        report[relativePath] = findings;
        totalFound += findings.length;
      }
    });

    if (totalFound > 0) {
      console.log('\n🔍 ZNALEZIONO SZTYWNE TEKSTY W KOMPONENTACH:\n');
      Object.entries(report).forEach(([file, findings]) => {
        console.log(`\n📄 ${file}:`);
        findings.forEach((f) => {
          console.log(`   [L?] "${f.text}"`);
        });
      });
      console.log(`\nTotal: ${totalFound} fraz w ${Object.keys(report).length} plikach.\n`);
    } else {
      console.log('✅ Nie znaleziono sztywnych tekstów (z polskimi znakami).');
    }
  });
});
