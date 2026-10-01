const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const COMPANY_JSON = path.join(process.cwd(), 'src/data/global/company.json');

// Default House Icon SVG Path (similar to ph-house-line)
const DEFAULT_ICON_PATH = 'M12,3L2,12h3v8h14v-8h3L12,3z M17,18h-2v-4h-2v4H7v-7.8l5-4.5l5,4.5V18z';

async function generateFavicons() {
  // Jesli wszystkie favikony juz istnieja - pomijamy (przyspiesza build w CI).
  // Favikony zmieniaja sie tylko przy zmianie public/icon.svg.
  const existing = ['favicon-32x32.png', 'apple-touch-icon.png', 'favicon.ico', 'logo.svg']
    .map((f) => path.join(PUBLIC_DIR, f))
    .filter((f) => fs.existsSync(f) && fs.statSync(f).size > 0);
  if (existing.length === 4) {
    console.log('OK Favikony i logo.svg juz istnieja, pomijam generowanie.');
    return;
  }
  console.log('🎨 Generowanie zestawu favikon...');

  let company;
  try {
    company = JSON.parse(fs.readFileSync(COMPANY_JSON, 'utf8'));
  } catch (e) {
    console.error('Błąd odczytu company.json');
    return;
  }

  // Determine which SVG to use
  let svgContent;
  const customIconPath = path.join(PUBLIC_DIR, 'icon.svg');
  
  if (fs.existsSync(customIconPath)) {
    console.log('✅ Używam własnego pliku public/icon.svg');
    svgContent = fs.readFileSync(customIconPath, 'utf8');
  } else {
    console.log('ℹ️ Nie znaleziono public/icon.svg, używam ikony domyślnej (Dom).');
    // Simple clean SVG house icon without background
    svgContent = `
      <svg width="512" height="512" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L4 9V21H20V9L12 3ZM18 19H6V10L12 5.5L18 10V19Z" fill="#2a438c"/>
        <path d="M10 13H14V17H10V13Z" fill="#2a438c"/>
      </svg>
    `;
  }

  const svgBuffer = Buffer.from(svgContent);

  try {
    // 1. favicon-32x32.png
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

    // 2. apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

    // 3. favicon.ico (Multiple sizes)
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFormat('png')
      .toFile(path.join(PUBLIC_DIR, 'favicon.ico')); // Simple ico fallback

    // 4. logo.svg (logo fallback in the menu and footer when the client did not upload his own)
    // Why: Logo.astro uses company.branding.logoImage || '/logo.svg',
    // so the file must exist in public/ so that the page does not show a broken image.
    const logoColor = (company?.branding?.logoColor) || '#2a438c';
    const logoFallback = fs.existsSync(customIconPath)
      ? svgContent
      : `
      <svg width="512" height="512" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L4 9V21H20V9L12 3ZM18 19H6V10L12 5.5L18 10V19Z" fill="${logoColor}"/>
        <path d="M10 13H14V17H10V13Z" fill="${logoColor}"/>
      </svg>
    `;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), logoFallback.trim(), 'utf8');

    console.log('✅ Favikony i logo.svg wygenerowane pomyślnie w folderze public/');
  } catch (err) {
    console.error('❌ Błąd podczas generowania favikon:', err);
  }
}

generateFavicons();

