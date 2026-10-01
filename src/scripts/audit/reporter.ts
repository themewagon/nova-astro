/**
 * Report generation: JSON, Markdown (audit), Markdown (full text).
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { PageData, AuditReport, SiteWideIssues } from './types.js';

// === RAPORT TECHNICZNY (MD) ===

export function generateAuditMarkdown(report: AuditReport): string {
  const L: string[] = [];

  L.push('# 🔍 Audyt Techniczny Strony\n');
  L.push(`**Data:** ${report.timestamp}`);
  L.push(`**URL:** ${report.baseUrl}`);
  L.push(`**Przeskanych stron:** ${report.totalPages}\n`);

  // Podsumowanie
  L.push('## 📊 Podsumowanie\n');
  L.push('| Status | Ilość |');
  L.push('|--------|-------|');
  L.push(`| ✅ Bez problemów | ${report.summary.ok} |`);
  L.push(`| ⚠️ Ostrzeżenia | ${report.summary.warnings} |`);
  L.push(`| ❌ Błędy | ${report.summary.errors} |\n`);

  const sw = report.siteWide;

  // Strony z problemami
  const problemPages = report.pages.filter(p => p.issues.length > 0);
  if (problemPages.length > 0) {
    L.push('## 🚨 Strony z Problemami\n');
    for (const p of problemPages) {
      L.push(`### ${p.path}`);
      L.push(`- **Status:** ${p.status}`);
      L.push(`- **Tytuł:** ${p.title || '(brak)'}`);
      L.push(`- **Słów:** ${p.wordCount}`);
      L.push(`- **Czas ładowania:** ${p.loadTime}ms`);
      L.push('');
      L.push('**Problemy:**');
      for (const issue of p.issues) L.push(`- ${issue}`);
      L.push('');
    }
  }

  // Problemy globalne
  L.push('## 🌐 Problemy Globalne\n');

  if (sw.brokenLinks.length > 0) {
    L.push('### 🔗 Uszkodzone linki');
    for (const b of sw.brokenLinks) L.push(`- ${b.page} → ${b.link} (${b.status})`);
    L.push('');
  }

  if (sw.placeholders.length > 0) {
    L.push('### 🏷️ Wykryte placeholder-y');
    for (const p of sw.placeholders) {
      L.push(`- **${p.page}:** ${p.matches.join(', ')}`);
    }
    L.push('');
  }

  if (sw.languageIssues.length > 0) {
    L.push('### 🇵🇱 Problemy językowe (polskie znaki)');
    for (const i of sw.languageIssues) L.push(`- ${i.page}: ${i.issue}`);
    L.push('');
  }

  if (sw.duplicateTitles.length > 0) {
    L.push('### 📋 Duplikaty tytułów');
    for (const d of sw.duplicateTitles) L.push(`- ${d}`);
    L.push('');
  }

  if (sw.duplicateMetaDescriptions.length > 0) {
    L.push('### 📋 Duplikaty meta descriptions');
    for (const d of sw.duplicateMetaDescriptions) L.push(`- ${d}`);
    L.push('');
  }

  if (sw.missingH1.length > 0) {
    L.push('### 📝 Brak H1');
    for (const p of sw.missingH1) L.push(`- ${p}`);
    L.push('');
  }

  if (sw.tooShortContent.length > 0) {
    L.push('### 📄 Za mało treści');
    for (const i of sw.tooShortContent) L.push(`- ${i.page}: ${i.wordCount} słów`);
    L.push('');
  }

  if (sw.missingAltTexts.length > 0) {
    L.push('### 🖼️ Zdjęcia bez alt text');
    for (const i of sw.missingAltTexts) L.push(`- ${i.page}: ${i.images.length} zdjęć`);
    L.push('');
  }

  // Tabela wszystkich stron
  L.push('## 📄 Wszystkie Strony\n');
  L.push('| Path | Status | Tytuł | Słów | Issues |');
  L.push('|------|--------|-------|------|--------|');
  for (const p of report.pages) {
    const ic = p.issues.length;
    const icon = ic === 0 ? '✅' : p.issues.some(i => i.startsWith('❌')) ? '❌' : '⚠️';
    L.push(`| ${p.path} | ${icon} ${p.status} | ${p.title || '(brak)'} | ${p.wordCount} | ${ic} |`);
  }

  L.push('\n---');
  L.push('*Wygenerowano automatycznie przez audit-site.ts*');
  return L.join('\n');
}

// === FULL TEXT OF PAGES (MD) ===

/**
 * Generujeczytelny Markdown ze WSZYSTKIM tekstem ze wszystkich stron.
 * Each text is full, not truncated. Formatted by section (h2).
 */
export function generateTextDump(pages: PageData[]): string {
  const L: string[] = [];

  L.push('# 📝 Pełny Tekst Stron — Audyt Treści\n');
  L.push('> Ten plik zawiera CAŁY tekst ze wszystkich przeskanych stron.');
  L.push('> Sprawdź pod kątem błędów ortograficznych, interpunkcyjnych, placeholderów i jakości.\n');
  L.push('---\n');

  // Contents
  L.push('## Spis treści\n');
  for (const page of pages) {
    if (page.status !== 200) continue;
    const anchor = page.path.replace(/\//g, '').replace(/[^a-zA-Z0-9-]/g, '') || 'home';
    L.push(`- [${page.path}](#${anchor}) (${page.wordCount} słów)`);
  }
  L.push('\n---\n');

  // Text of each page
  for (const page of pages) {
    if (page.status !== 200) continue;

    L.push(`## ${page.path}\n`);
    L.push(`**Tytuł:** ${page.title || '(brak)'}`);
    L.push(`**Meta:** ${page.metaDescription || '(brak)'}`);
    L.push(`**H1:** ${page.h1.join(', ') || '(brak)'}`);
    L.push(`**Słów:** ${page.wordCount}`);
    L.push('');

    // Sekcje pogrupowane wg h2
    if (page.structuredText.length > 0) {
      for (const section of page.structuredText) {
        if (section.heading !== '(przed pierwszym nagłówkiem)') {
          L.push(`### ${section.heading}\n`);
        }
        // Formatuj tekst w akapity
        const paragraphs = section.text.split(/(?<=[.!?])\s+/);
        for (const para of paragraphs) {
          if (para.trim().length > 0) {
            L.push(`${para.trim()}\n`);
          }
        }
      }
    } else {
      // Fallback - all text together
      const paragraphs = page.bodyText.split(/(?<=[.!?])\s+/);
      for (const para of paragraphs) {
        if (para.trim().length > 0) {
          L.push(`${para.trim()}\n`);
        }
      }
    }

    L.push('---\n');
  }

  L.push('*Wygenerowano automatycznie przez audit-site.ts*');
  return L.join('\n');
}

// === ZAPIS ===

export interface ReportFiles {
  json: string;
  auditMd: string;
  textDumpMd: string;
}

export function saveReports(report: AuditReport, outputDir: string): ReportFiles {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

  const jsonPath = join(outputDir, `audit-${ts}.json`);
  const auditMdPath = join(outputDir, `audit-${ts}.md`);
  const textDumpPath = join(outputDir, `text-dump-${ts}.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  writeFileSync(auditMdPath, generateAuditMarkdown(report));
  writeFileSync(textDumpPath, generateTextDump(report.pages));

  return { json: jsonPath, auditMd: auditMdPath, textDumpMd: textDumpPath };
}
