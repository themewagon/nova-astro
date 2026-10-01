import fs from 'node:fs';
import path from 'node:path';

const isClientMode = process.argv.includes('--client');
const root = process.cwd();
const formPath = path.join(root, 'public/send-form.php');

if (!fs.existsSync(formPath)) {
  console.error('check:form: Brak public/send-form.php.');
  process.exit(1);
}

const form = fs.readFileSync(formPath, 'utf8');
const forbiddenClientValues = [
  'twojastrona.pl',
  'twojafirma.pl',
  'smtp.example.com',
  'kontakt@twojafirma.pl',
  'contact@yourcompany.com',
];

if (isClientMode) {
  const found = forbiddenClientValues.filter((value) => form.includes(value));
  if (found.length > 0) {
    console.error(`check:form: znaleziono wartości startera w konfiguracji klienta: ${found.join(', ')}`);
    process.exit(1);
  }

  if (!/https:\/\/[^'"\s]+/.test(form)) {
    console.error('check:form: brak dozwolonego adresu HTTPS w ALLOWED_ORIGINS.');
    process.exit(1);
  }

  console.log('check:form: OK, formularz ma konfigurację klienta.');
} else {
  const requiredMarkers = ['CONTACT_EMAIL', 'ALLOWED_ORIGINS', 'checkRateLimit', 'website'];
  const missing = requiredMarkers.filter((marker) => !form.includes(marker));
  if (missing.length > 0) {
    console.error(`check:form: brakuje wymaganych elementów: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('check:form: OK, formularz ma wymagane zabezpieczenia i placeholdery startera.');
}
