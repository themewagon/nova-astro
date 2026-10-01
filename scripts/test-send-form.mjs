import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const PUBLIC_DIR = resolve('./public');
const FORM_URL = '/send-form.php';
const BASE_PORTS = [8899, 8900, 8901, 8902, 8903, 8904, 8905];

let passed = 0;
let failed = 0;

function report(name, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
  if (ok) passed++;
  else failed++;
}

// Sends a POST with form fields (application/x-www-form-urlencoded)
async function postForm(port, fields = {}) {
  const body = new URLSearchParams(fields).toString();
  const res = await fetch(`http://127.0.0.1:${port}${FORM_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

// Waits until the PHP server starts responding (up to ~5 s)
async function waitForServer(port, tries = 20) {
  for (let i = 0; i < tries; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}${FORM_URL}`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
}

// Ubija serwer PHP (fallback taskkill na Windows)
function killServer(child, port) {
  if (!child || child.exitCode !== null) return;
  try {
    child.kill();
  } catch {
    // ignore - the process may have already disappeared
  }
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // taskkill may not exist - we do nothing
    }
  }
}

async function run() {
  console.log('Testy public/send-form.php');

  // 0. PHP must be in the PATH - without it, tests are skipped (CI/server)
  const phpCheck = spawnSync('php', ['-v'], { encoding: 'utf8' });
  if (phpCheck.error || phpCheck.status !== 0) {
    console.log('  [SKIP] PHP nie jest dostępny w PATH — pomijam testy formularza.');
    console.log('         Uruchom na środowisku z PHP: `node scripts/test-send-form.mjs`');
    console.log('Wynik: SKIP (brak PHP)');
    process.exit(0);
  }

  const phpVersion = (phpCheck.stdout || '').split('\n')[0] || 'PHP (nieznana wersja)';
  console.log(`  PHP: ${phpVersion}`);

  // 1. Lint syntax
  console.log('Test 1: lint składni (php -l)');
  const lint = spawnSync('php', ['-l', resolve('./public/send-form.php')], { encoding: 'utf8' });
  report('lint public/send-form.php', lint.status === 0, (lint.stderr || lint.stdout || '').trim());

  // 2. Launch the built-in PHP server and send secure requests
  let child = null;
  let port = null;
  for (const candidate of BASE_PORTS) {
    try {
      child = spawn('php', ['-S', `127.0.0.1:${candidate}`, '-t', PUBLIC_DIR], {
        stdio: 'ignore',
      });
    } catch {
      continue;
    }
    if (await waitForServer(candidate)) {
      port = candidate;
      break;
    }
    killServer(child, candidate);
    child = null;
  }

  if (!port) {
    console.log('  [FAIL] Nie udało się uruchomić serwera PHP (żaden port nie odpowiedział).');
    process.exit(1);
  }

  console.log(`  Serwer PHP: http://127.0.0.1:${port} (tests do not send any emails)`);

  try {
    // Test 2: honeypot - the completed hidden field 'website' should receive the OK status
    // without sending an e-mail (reply before any sending)
    console.log('Test 2: honeypot (ukryte pole website)');
    const honeypot = await postForm(port, { website: 'spam-bot', name: 'Bot' });
    report(
      'honeypot → 200 {"status":"ok"}',
      honeypot.status === 200 && honeypot.json.status === 'ok',
      `status=${honeypot.status} body=${JSON.stringify(honeypot.json)}`
    );

    // Test 3: missing required fields → 400 with message
    console.log('Test 3: brak wymaganych pól');
    const empty = await postForm(port, {});
    report(
      'brak pól → 400 + komunikat',
      empty.status === 400 && empty.json.status === 'error' && /Wypełnij wymagane pola/.test(empty.json.message || ''),
      `status=${empty.status} body=${JSON.stringify(empty.json)}`
    );

    // Test 4: niepoprawny email → 400 z komunikatem
    console.log('Test 4: niepoprawny adres email');
    const badEmail = await postForm(port, { name: 'Jan Test', email: 'jan', message: 'Test' });
    report(
      'zły email → 400 + komunikat',
      badEmail.status === 400 && badEmail.json.status === 'error' && /Podaj poprawny adres email/.test(badEmail.json.message || ''),
      `status=${badEmail.status} body=${JSON.stringify(badEmail.json)}`
    );
  } finally {
    killServer(child, port);
  }

  console.log(`Wynik: ${failed === 0 ? 'SUKCES' : 'PORAŻKA'} (${passed} pass, ${failed} fail)`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
