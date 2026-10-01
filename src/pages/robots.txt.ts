import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).href;
  
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    // Tool pages: component gallery (dev) and fixture QA.
    // Sitemap also filters them, but Disallow closes the topic when crawling.
    'Disallow: /dev/',
    'Disallow: /qa/',
    '',
    `Sitemap: ${sitemapUrl}`
  ].join('\n');

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
