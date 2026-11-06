import assert from 'node:assert/strict';
import { parse } from 'parse5';

const base = (process.argv[2] || 'http://127.0.0.1:3217').replace(/\/$/, '');
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname);
assert.equal(paths.length, 28);
const attr = (node, name) => node.attrs?.find(attr => attr.name === name)?.value;
function elements(html) {
  const nodes = [];
  function visit(node) { nodes.push(node); node.childNodes?.forEach(visit); }
  visit(parse(html));
  return nodes;
}
const pages = new Map(await Promise.all(paths.map(async path => {
  const response = await fetch(base + path, { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  const nodes = elements(await response.text());
  return [path, { nodes, ids: new Set(nodes.map(node => attr(node, 'id')).filter(Boolean)) }];
})));
const assets = new Set();
const edgeHelpers = new Set();
let checked = 0;
for (const [path, page] of pages) {
  for (const node of page.nodes.filter(node => node.tagName === 'a')) {
    const href = attr(node, 'href');
    if (!href) continue;
    const target = new URL(href, base + path);
    if (![new URL(base).hostname, 'www.hiremiiglobal.com', 'hiremiiglobal.com'].includes(target.hostname)) continue;
    // Cloudflare rewrites mailto links to a runtime decoder; these aren't website content pages.
    if (target.pathname === '/cdn-cgi/l/email-protection') { edgeHelpers.add(path); continue; }
    if (/^\/case-previews\/[a-z0-9-]+\.webp$/.test(target.pathname)) { assets.add(target.pathname); continue; }
    const destination = pages.get(target.pathname);
    assert(destination, `Internal link missing from current pages: ${path}: ${href}`);
    if (target.hash) assert(destination.ids.has(decodeURIComponent(target.hash.slice(1))), `Missing anchor: ${path}: ${href}`);
    checked++;
  }
}
for (const path of assets) assert.equal((await fetch(base + path)).status, 200, path);

const oldAbout = await fetch(base + '/about-us', { redirect: 'manual' });
assert.equal(oldAbout.status, 308, 'Old company introduction has a permanent replacement');
assert.equal(new URL(oldAbout.headers.get('location'), base).pathname, '/about');
assert.equal((await fetch(base + '/about-us')).status, 200);
assert.equal((await fetch(base + '/about-us/')).url, base + '/about');
for (const path of ['/missing-page', '/zh/missing-page', '/old/article/removed', '/news', '/services',
  '/migration-snapshot', '/talent', '/stories', '/sponsorship', '/index.html', '/zh/missing-page?email=private.invalid']) {
  const response = await fetch(base + path, { redirect: 'manual' });
  assert.equal(response.status, 404, path);
  const html = await response.text();
  assert(html.includes('Page not found.') && html.includes('未找到这个页面。'), path);
  const nodes = elements(html);
  assert(nodes.some(node => attr(node, 'name') === 'robots' && /noindex/.test(attr(node, 'content'))), path);
  assert(!nodes.some(node => attr(node, 'rel') === 'canonical'), 'A missing URL must not claim the homepage canonical');
  assert.doesNotMatch(html, /googletagmanager|analytics\.mjs|\/script\.js|private\.invalid/);
  for (const node of nodes.filter(node => node.tagName === 'a')) {
    const target = new URL(attr(node, 'href'), base);
    const page = pages.get(target.pathname);
    assert(page, `404 recovery target: ${target.pathname}`);
    if (target.hash) assert(page.ids.has(target.hash.slice(1)));
  }
}
console.log(`PASS: ${pages.size} pages, ${checked} current internal links/anchors, ${assets.size} case-image links; permanent about-us replacement; bilingual real 404s and working recovery links. Cloudflare email helpers identified on ${edgeHelpers.size} pages.`);
