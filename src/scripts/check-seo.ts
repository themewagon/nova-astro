import fs from 'node:fs';
import path from 'node:path';

const isClientMode = process.argv.includes('--client');
const root = process.cwd();
const htmlPath = path.join(root, 'dist/index.html');
const seoPath = path.join(root, 'src/data/global/seo.json');
const siteConfigPath = path.join(root, 'site.config.mjs');

function fail(message: string): never {
  console.error(`check:seo: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) fail('Brak dist/index.html. Uruchom najpierw npm run build.');

const html = fs.readFileSync(htmlPath, 'utf8');
const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8')) as {
  index?: boolean;
  follow?: boolean;
};
const siteConfig = fs.readFileSync(siteConfigPath, 'utf8');
const siteUrl = siteConfig.match(/export const SITE_URL = ['"]([^'"]+)['"]/i)?.[1]?.replace(/\/$/, '') ?? '';

const getMeta = (attribute: 'name' | 'property', value: string): string => {
  const pattern = new RegExp(String.raw`<meta\s+[^>]*${attribute}=["']${value}["'][^>]*>`, 'i');
  return html.match(pattern)?.[0] ?? '';
};

const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
const description = getMeta('name', 'description');
const robots = getMeta('name', 'robots');
const canonical = html.match(/<link\s+rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
const ogUrl = getMeta('property', 'og:url');
const ogImage = getMeta('property', 'og:image');
const schemaCount = (html.match(/application\/ld\+json/gi) ?? []).length;

if (!title) fail('Brak tytułu strony.');
if (!description) fail('Brak meta description.');
if (!canonical) fail('Brak linku canonical.');
if (!ogUrl) fail('Brak og:url.');
if (!ogImage) fail('Brak og:image.');
if (schemaCount === 0) fail('Brak JSON-LD schema.');

const robotsContent = robots.match(/content=["']([^"']+)["']/i)?.[1] ?? '';
const shouldIndex = isClientMode || seo.index === true;
const expectedIndex = shouldIndex ? 'index' : 'noindex';
const expectedFollow = seo.follow !== false ? 'follow' : 'nofollow';

if (!robotsContent.includes(expectedIndex) || !robotsContent.includes(expectedFollow)) {
  fail(`Niepoprawna polityka robots. Oczekiwano "${expectedIndex}, ${expectedFollow}", otrzymano "${robotsContent}".`);
}

if (isClientMode && !seo.index) {
  fail('Tryb klienta wymaga seo.index=true w src/data/global/seo.json.');
}

if (!/^https?:\/\//i.test(siteUrl)) fail('SITE_URL w site.config.mjs musi byc pelnym adresem HTTP albo HTTPS.');
if (!canonical.includes(siteUrl)) fail(`Canonical nie wskazuje na SITE_URL (${siteUrl}).`);

// Twitter/X: brak twitter:card = brak podgladu karty przy udostepnianiu.
const twitterCard = getMeta('name', 'twitter:card');
if (!twitterCard) fail('Brak meta twitter:card.');

// og:image: SVG nie renderuje sie na Facebooku, LinkedIn ani Twitterze.
const ogImageContent = ogImage.match(/content=["']([^"']+)["']/i)?.[1] ?? '';
// og:image musi byc absolutny: social platformy ignoruja sciezki wzgledne.
if (!ogImageContent.startsWith('http')) {
  fail('[og-image-relative] og:image musi być absolutnym URL (https://...).');
}
if (ogImageContent.endsWith('.svg')) {
  fail('og:image wskazuje na plik SVG, którego social platformy nie renderują. Użyj PNG/JPG min. 1200x630.');
}

// Sitemap: strony /dev/ i /qa/ maja meta noindex, wiec nie moga wyciekac
// to sitemap (conflicting signal for Google, bug found on webscale).
// Additionally, lastmod gives Google a signal of freshness of the content.
const sitemapCandidates = ['sitemap-0.xml', 'sitemap-index.xml'];
const sitemapFile = sitemapCandidates
  .map((name) => path.join(root, 'dist', name))
  .find((p) => fs.existsSync(p));
if (sitemapFile) {
  const sitemap = fs.readFileSync(sitemapFile, 'utf8');
  const leaked = ['dev', 'qa'].filter((dir) => sitemap.includes(`/${dir}/`));
  if (leaked.length > 0) fail(`Sitemap zawiera strony narzędziowe z noindex: /${leaked.join('/ i /')}/.`);
  if (!sitemap.includes('<lastmod>')) fail('Sitemap nie zawiera lastmod (brak sygnału świeżości dla Google).');
} else {
  fail('Brak dist/sitemap-0.xml ani dist/sitemap-index.xml. Sprawdź integrację @astrojs/sitemap.');
}

console.log(`check:seo: OK, ${isClientMode ? 'projekt klienta indeksowalny' : 'starter bezpiecznie ustawiony jako noindex'}, ${schemaCount} schema`);
