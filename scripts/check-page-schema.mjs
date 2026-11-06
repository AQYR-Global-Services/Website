import assert from 'node:assert/strict';
import { parse } from 'parse5';

const base = (process.argv[2] || 'http://127.0.0.1:3217').replace(/\/$/, '');
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
assert.equal(urls.length, 28);
const attr = (node, name) => node.attrs?.find(row => row.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const flatten = node => [node, ...(node.childNodes || []).flatMap(flatten)];
let breadcrumbs = 0;

await Promise.all(urls.map(async url => {
  const response = await fetch(base + url.pathname);
  assert.equal(response.status, 200);
  const nodes = flatten(parse(await response.text()));
  const graph = nodes.filter(node => node.tagName === 'script' && attr(node, 'type') === 'application/ld+json')
    .flatMap(node => { const data = JSON.parse(text(node)); return data['@graph'] || [data]; });
  const webpage = graph.filter(node => node['@type'] === 'WebPage');
  assert.equal(webpage.length, 1, url.pathname);
  const page = webpage[0];
  const canonical = new URL(attr(nodes.find(node => attr(node, 'rel') === 'canonical'), 'href')).href;
  assert.equal(page.url, canonical);
  assert.equal(page['@id'], canonical + '#webpage');
  assert.equal(page.name, text(nodes.find(node => node.tagName === 'title')));
  assert.equal(page.description, attr(nodes.find(node => attr(node, 'name') === 'description'), 'content'));
  assert.equal(page.inLanguage, attr(nodes.find(node => node.tagName === 'html'), 'lang'));
  for (const reference of [page.isPartOf, page.publisher]) {
    assert(graph.some(node => node['@id'] === reference['@id']), 'Missing related entity');
  }
  const navigation = nodes.filter(node => attr(node, 'class')?.split(' ').includes('page-breadcrumbs'));
  const lists = graph.filter(node => node['@type'] === 'BreadcrumbList');
  if (['/', '/zh'].includes(url.pathname)) {
    assert.equal(navigation.length, 0);
    assert.equal(lists.length, 0);
    assert.equal(page.breadcrumb, undefined);
    return;
  }
  assert.equal(navigation.length, 1);
  assert.equal(lists.length, 1);
  const nav = navigation[0];
  assert.equal(nav.tagName, 'nav');
  assert(attr(nav, 'aria-label'));
  const items = flatten(nav).filter(node => node.tagName === 'li');
  const list = lists[0];
  assert.equal(page.breadcrumb['@id'], list['@id']);
  assert.equal(list.itemListElement.length, items.length);
  const prefix = page.inLanguage === 'zh-Hans' ? '/zh' : '';
  const rootPath = url.pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
  const parent = ['employer-sponsorship', 'labour-agreements'].includes(rootPath.slice(1)) ? '/employers'
    : ['sponsored-visas', 'points-calculator'].includes(rootPath.slice(1)) ? '/visa-services' : null;
  assert.equal(items.length, parent ? 3 : 2, url.pathname);
  assert.equal(new URL(list.itemListElement[0].item).pathname, prefix || '/');
  if (parent) assert.equal(new URL(list.itemListElement[1].item).pathname, prefix + parent);
  list.itemListElement.forEach((entry, index) => {
    assert.equal(entry['@type'], 'ListItem');
    assert.equal(entry.position, index + 1);
    assert.equal(entry.name, text(items[index]));
    assert.equal(new URL(entry.item).origin, new URL(canonical).origin);
    assert(urls.some(url => url.href === entry.item), 'Breadcrumb URL outside sitemap');
    if (index < items.length - 1) {
      const link = flatten(items[index]).find(node => node.tagName === 'a');
      assert.equal(new URL(attr(link, 'href'), canonical).href, entry.item);
    } else {
      assert.equal(entry.item, canonical);
      assert(flatten(items[index]).some(node => attr(node, 'aria-current') === 'page'));
      assert(!flatten(items[index]).some(node => node.tagName === 'a'));
    }
  });
  breadcrumbs++;
}));
assert.equal(breadcrumbs, 26);
console.log('PASS: 28 localized WebPage entities match metadata; 26 visible breadcrumb trails match their structured data, language, parents and live sitemap.');
