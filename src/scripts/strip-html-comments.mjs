import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.join(process.cwd(), 'dist');
const HTML_COMMENT_RE = /<!--(?!\s*\[if\b)[\s\S]*?-->/gi;

function collectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

const files = collectHtmlFiles(DIST_DIR);
let removedComments = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const comments = source.match(HTML_COMMENT_RE);
  if (!comments) continue;

  fs.writeFileSync(file, source.replace(HTML_COMMENT_RE, ''), 'utf8');
  removedComments += comments.length;
}

console.log(`✅ Usunięto komentarze HTML: ${removedComments} w ${files.length} plikach.`);
