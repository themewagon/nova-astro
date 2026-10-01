import fs from 'node:fs';
import path from 'node:path';
import { PageConfigSchema, SectionDataSchema } from '@config/data-contracts';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const pagesDir = path.join(projectRoot, 'src', 'data', 'pages');
const sectionsDir = path.join(projectRoot, 'src', 'data', 'sections');
const errors: string[] = [];

function formatIssue(issue: { path: PropertyKey[]; message: string }): string {
  const location = issue.path.length > 0 ? issue.path.join('.') : '$';
  return `${location}: ${issue.message}`;
}

function readJson(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${path.relative(projectRoot, filePath)}: invalid JSON (${message})`);
    return null;
  }
}

function checkSections(): number {
  let checked = 0;

  for (const file of fs.readdirSync(sectionsDir).filter((name) => name.endsWith('.json')).sort()) {
    const filePath = path.join(sectionsDir, file);
    const data = readJson(filePath);
    if (data === null) continue;

    const result = SectionDataSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(`${path.relative(projectRoot, filePath)}: ${formatIssue(issue)}`);
      });
      continue;
    }

    checked += 1;
  }

  return checked;
}

function isPageConfigCandidate(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  return (
    Object.prototype.hasOwnProperty.call(data, 'sections')
    || Object.prototype.hasOwnProperty.call(data, 'heading')
    || Object.prototype.hasOwnProperty.call(data, 'enabled')
  );
}

function checkPages(): number {
  let checked = 0;

  for (const file of fs.readdirSync(pagesDir).filter((name) => name.endsWith('.json')).sort()) {
    const filePath = path.join(pagesDir, file);
    const data = readJson(filePath);
    if (data === null || !isPageConfigCandidate(data)) continue;

    const result = PageConfigSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(`${path.relative(projectRoot, filePath)}: ${formatIssue(issue)}`);
      });
      continue;
    }

    checked += 1;
  }

  return checked;
}

const sectionsChecked = checkSections();
const pagesChecked = checkPages();

if (errors.length > 0) {
  console.error(`check:data: ${errors.length} issue(s) detected.`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`check:data: ${sectionsChecked} section file(s) and ${pagesChecked} page config(s) match their contracts.`);
