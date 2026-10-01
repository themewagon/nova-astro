/**
 * Entry point - runs the crawler, analysis and generates reports.
 *
 * Uruchomienie: npm run audit:site
 */

import { join } from 'path';
import { crawlSite } from './crawler.js';
import { analyzeSiteWide } from './analyzer.js';
import { saveReports } from './reporter.js';
import type { AuditReport } from './types.js';

const BASE_URL = 'http://localhost:4321';
const OUTPUT_DIR = join(process.cwd(), 'audit-reports');

async function main() {
  console.log('🚀 Starter Kit — Audyt Techniczny + Pełny Tekst\n');
  console.log(`📌 Bazowy URL: ${BASE_URL}`);
  console.log('');

  try {
    // 1. Crawl
    const { pages, internalLinks } = await crawlSite({ baseUrl: BASE_URL });

    // 2. Analiza site-wide
    console.log('\n📊 Analizuję zebrane dane...\n');
    const siteWide = analyzeSiteWide(pages, internalLinks);

    // 3. File a report
    const ok = pages.filter(p => p.issues.length === 0).length;
    const warnings = pages.filter(p => p.issues.some(i => i.startsWith('⚠️'))).length;
    const errors = pages.filter(p => p.issues.some(i => i.startsWith('❌'))).length;

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      totalPages: pages.length,
      summary: { ok, warnings, errors },
      pages,
      siteWide,
    };

    // 4. Zapisz raporty
    const files = saveReports(report, OUTPUT_DIR);

    console.log('✅ Raporty zapisane:\n');
    console.log(`   📄 JSON (dane surowe):     ${files.json}`);
    console.log(`   📄 MD  (audyt techniczny): ${files.auditMd}`);
    console.log(`   📄 MD  (pełny tekst):      ${files.textDumpMd}`);

    // 5. Podsumowanie
    console.log('\n📊 PODSUMOWANIE:');
    console.log(`   ✅ Bez problemów: ${ok}`);
    console.log(`   ⚠️  Ostrzeżenia: ${warnings}`);
    console.log(`   ❌ Błędy: ${errors}`);
    console.log(`   📄 Przeskanych stron: ${pages.length}`);

    if (siteWide.brokenLinks.length > 0) {
      console.log(`\n🔗 Uszkodzone linki: ${siteWide.brokenLinks.length}`);
      for (const b of siteWide.brokenLinks) {
        console.log(`   ${b.page} → ${b.link} (${b.status})`);
      }
    }
    if (siteWide.placeholders.length > 0) {
      console.log(`\n🏷️  Placeholdery: ${siteWide.placeholders.length} stron`);
      for (const p of siteWide.placeholders) {
        console.log(`   ${p.page}: ${p.matches.join(', ')}`);
      }
    }
    if (siteWide.languageIssues.length > 0) {
      console.log(`\n🇵🇱 Problemy językowe: ${siteWide.languageIssues.length}`);
      for (const i of siteWide.languageIssues) {
        console.log(`   ${i.page}: ${i.issue}`);
      }
    }

    console.log(`\n💡 Otwórz ${files.textDumpMd} aby przeglądnąć pełny tekst stron.`);

  } catch (error) {
    console.error('❌ Błąd podczas audytu:', error);
    process.exit(1);
  }
}

main();
