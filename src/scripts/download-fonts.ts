import fs from 'fs';
import path from 'path';

const FONTS_DIR = path.join(process.cwd(), 'public/fonts');
const CSS_FILE = path.join(process.cwd(), 'src/styles/fonts.css');

// Fonty używane w template, self-hosted.
// Satoshi i Gambarino: Fontshare, ITF Free Font License, darmowa komercyjnie.
// Outfit: Google Fonts, OFL, darmowa komercyjnie, domyślny font sans Nova.
// Playfair Display nie jest częścią profilu Nova, więc nie pobieramy zbędnych
// plików fontu do template’u.
const FONT_SOURCES: Record<string, 'fontshare' | 'google'> = {
  Satoshi: 'fontshare',
  Gambarino: 'fontshare',
  Outfit: 'google',
};

// Wagi pobierane z Fontshare jako osobne pliki, bez unicode-range.
const FONTSHARE_WEIGHTS: Record<string, string> = {
  Satoshi: '400,500,700,900',
  Gambarino: '400,500',
};

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function downloadGoogleFont(fontName: string) {
  const url = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  const css = await response.text();

  const fontUrls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+)\)/g)].map(m => m[1]);
  let localCss = css;

  for (const fontUrl of fontUrls) {
    const fileName = path.basename(fontUrl);
    const filePath = path.join(FONTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`   ⬇️ Pobieram: ${fileName}`);
      const res = await fetch(fontUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }

    localCss = localCss.replace(fontUrl, `/fonts/${fileName}`);
  }

  return localCss;
}

// Fontshare zwraca CSS z URL-ami do cdn.fontshare.com, pobieramy tylko woff2.
// (najmniejszy format, wspierany we wszystkich nowoczesnych przegladarkach).
async function downloadFontshareFont(fontName: string) {
  const weights = FONTSHARE_WEIGHTS[fontName] || '400;500;700';
  const url = `https://api.fontshare.com/v2/css?f[]=${fontName.toLowerCase()}@${weights}&display=swap`;
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } });
  const css = await response.text();

  const fontUrls = [...css.matchAll(/url\((?:https:)?\/\/cdn\.fontshare\.com\/wf\/[^)]+\.woff2\)/g)].map(m => m[0].replace('url(', '').replace(/^\/\//, 'https://').replace(/\)$/, ''));
  let localCss = css;

  // Fontshare CSS ma osobne wpisy dla każdej wagi, więc generujemy czysty CSS.
  const blocks = css.split('@font-face').filter(b => b.includes('font-family'));
  let out = '';
  for (const block of blocks) {
    const weightMatch = block.match(/font-weight:\s*(\d+);/);
    const srcMatch = block.match(/url\((?:https:)?\/\/cdn\.fontshare\.com\/wf\/[^)]+\.woff2\)/);
    if (!weightMatch || !srcMatch) continue;

    const weight = weightMatch[1];
    const remoteUrl = srcMatch[0].replace('url(', '').replace(/^\/\//, 'https://').replace(/\)$/, '');
    const fileName = `${fontName.toLowerCase().replace(/ /g, '-')}-${weight}.woff2`;
    const filePath = path.join(FONTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`   ⬇️ Pobieram: ${fileName}`);
      const res = await fetch(remoteUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }

    out += `@font-face {\n  font-family: '${fontName}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;\n  src: url(/fonts/${fileName}) format('woff2');\n}\n`;
  }

  return out;
}

async function run() {
  // If fonts.css exists, we heuristically check whether it contains complete
  // @font-face entries before skipping download (zero network requests).
  // Crucial for fast builds in CI, fonts do not change without script change.
  if (fs.existsSync(CSS_FILE)) {
    const css = fs.readFileSync(CSS_FILE, 'utf-8');
    // Split @font-face blocks by keyword to check pairs
    // family + weight within a single entry, not across the whole file.
    const blocks = css.split('@font-face').filter((b) => b.includes('font-family'));
    const fontFiles = fs.existsSync(FONTS_DIR)
      ? fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith('.woff2'))
      : [];

    // Completeness heuristic: every per-weight woff2 file of a family
    // (e.g. satoshi-400.woff2) must have a matching @font-face entry in CSS.
    // Catches case where files are on disk but CSS entries are missing
    // (e.g. after manual edit) and page renders system fallback.
    const cssComplete = Object.keys(FONT_SOURCES).every((fontName) => {
      const familyPrefix = `${fontName.toLowerCase().replace(/ /g, '-')}-`;
      const familyFiles = fontFiles.filter((f) => f.startsWith(familyPrefix));
      // Google Fonts (Outfit) uses hashed filenames, so weights cannot
      // be matched to files by name, presence of family in CSS is enough.
      if (familyFiles.length === 0) {
        return blocks.some((b) => b.includes(`font-family: '${fontName}';`));
      }
      // Fontshare: every weight from a separate file must have its @font-face.
      return familyFiles.every((file) => {
        const weight = file.replace(familyPrefix, '').replace('.woff2', '');
        return blocks.some(
          (b) => b.includes(`font-family: '${fontName}';`) && b.includes(`font-weight: ${weight};`)
        );
      });
    });

    if (cssComplete) {
      console.log('✨ Fonty juz pobrane, pomijam (kompletne @font-face w fonts.css).');
      return;
    }
    console.log('⚠️ fonts.css niekompletny (brakuje @font-face dla pobranych plików), pobieram ponownie...');
  }
  console.log('🚀 Start pobierania fontów...');
  let fullCss = '/* Generated by download-fonts.ts */\n';

  for (const font of Object.keys(FONT_SOURCES)) {
    console.log(`📡 Szukam fonta: ${font}...`);
    const css = FONT_SOURCES[font] === 'fontshare'
      ? await downloadFontshareFont(font)
      : await downloadGoogleFont(font);
    fullCss += css + '\n';
  }

  fs.writeFileSync(CSS_FILE, fullCss);
  console.log(`✨ Fonty gotowe! CSS zapisany w ${CSS_FILE}`);
}

run();
