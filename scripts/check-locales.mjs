import assert from 'node:assert/strict';
import { parse, parseFragment } from 'parse5';
import { localizeMarkup } from '../lib/localized-content.mjs';
import { publicPagePaths, localizedPath, localizedHref } from '../public/site-language.mjs';
import { captureCalculatorControls, restoreCalculatorControls, saveCalculatorHandoff, takeCalculatorHandoff } from '../public/calculator-language-state.mjs';
const base = process.argv[2] || 'http://127.0.0.1:3217';
const attr = (node, name) => node.attrs?.find(row => row.name === name)?.value;
const all = node => [node, ...(node.childNodes || []).flatMap(all)];
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const normalized = value => value.replace(/\s+/g, ' ').trim();
const fixture = localizeMarkup('<p data-en="Hi &lt;strong&gt;there&lt;/strong&gt;" data-zh="您好 &lt;strong&gt;世界&lt;/strong&gt;">old</p><a href="/contact?service=skilled#enquiry">Go</a><button type="button" data-language-toggle>中文</button>', 'zh', '/about');
assert.match(fixture, /您好 <strong>世界<\/strong>/);
assert.match(fixture, /href="\/zh\/contact\?service=skilled#enquiry"/);
assert.match(fixture, /<a data-language-toggle="" href="\/about"/);
assert.equal(localizedHref('/api/unknown?x=1', 'zh'), '/api/unknown?x=1');
assert.equal(localizedHref('https://example.com/about', 'zh'), 'https://example.com/about');

// Temporary handoff must exclude free text, validate options, expire and be single-use.
const controls = [
  { id: 'pc-age', tagName: 'INPUT', type: 'number', value: '29' },
  { id: 'pc-occupation-query', tagName: 'INPUT', type: 'text', value: 'private search' },
  { id: 'enquiry-name', tagName: 'INPUT', type: 'text', value: 'private name' },
  { id: 'pc-ranking-confirm', tagName: 'INPUT', type: 'checkbox', checked: true },
  { id: 'pc-state', tagName: 'SELECT', value: 'act', options: [{ value: 'act' }] },
];
const captured = captureCalculatorControls(controls);
assert.deepEqual(captured.map(row => row.id), ['pc-age', 'pc-ranking-confirm', 'pc-state']);
assert(!JSON.stringify(captured).includes('private'));
controls[0].value = ''; controls[3].checked = false;
restoreCalculatorControls(controls, captured);
assert.equal(controls[0].value, '29'); assert.equal(controls[3].checked, true);
restoreCalculatorControls(controls, [{ id: 'pc-state', value: 'injected' }, { id: 'pc-age', value: '<script>' }]);
assert.equal(controls[4].value, 'act'); assert.equal(controls[0].value, '29');
const stateControl = { id: 'pc-state', tagName: 'INPUT', type: 'hidden', value: 'vic' };
restoreCalculatorControls([stateControl], [{ id: 'pc-state', value: 'act' }]);
assert.equal(stateControl.value, 'act');
restoreCalculatorControls([stateControl], [{ id: 'pc-state', value: 'injected' }]);
assert.equal(stateControl.value, 'act');
let raw; const storage = { setItem: (_, value) => raw = value, getItem: () => raw, removeItem: () => raw = null };
saveCalculatorHandoff(storage, controls, '/zh/points-calculator', 1000);
assert.equal(takeCalculatorHandoff(storage, '/zh/points-calculator', 2000).length, 3);
assert.deepEqual(takeCalculatorHandoff(storage, '/zh/points-calculator', 2000), []);
saveCalculatorHandoff(storage, controls, '/zh/points-calculator', 1000);
assert.deepEqual(takeCalculatorHandoff(storage, '/zh/points-calculator', 301001), []);
saveCalculatorHandoff(storage, controls, '/zh/points-calculator', 1000);
assert.deepEqual(takeCalculatorHandoff(storage, '/points-calculator', 2000), []);

const titles = new Set(), descriptions = new Set();
for (const path of publicPagePaths) for (const language of ['en', 'zh']) {
  const route = localizedPath(path, language);
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const nodes = all(parse(await response.text()));
  const find = predicate => nodes.find(predicate);
  assert.equal(attr(find(node => node.tagName === 'html'), 'lang'), language === 'zh' ? 'zh-Hans' : 'en');
  const title = text(find(node => node.tagName === 'title'));
  const description = attr(find(node => attr(node, 'name') === 'description'), 'content');
  assert(title && description); titles.add(title); descriptions.add(description);
  if (language === 'zh') { assert.match(title, /[\u3400-\u9fff]/); assert.match(description, /[\u3400-\u9fff]/); }
  const canonical = attr(find(node => attr(node, 'rel') === 'canonical'), 'href');
  assert.equal(new URL(canonical).pathname, route);
  assert.equal(new URL(canonical).origin, 'https://www.hiremiiglobal.com');
  for (const [code, target] of [['en', path], ['zh-Hans', localizedPath(path, 'zh')], ['x-default', path]]) {
    assert.equal(new URL(attr(find(node => attr(node, 'hreflang') === code && attr(node, 'rel') === 'alternate'), 'href')).href, new URL(target, canonical).href);
  }
  for (const node of nodes.filter(node => attr(node, `data-${language}`) !== undefined)) {
    const expected = text(parseFragment(node, attr(node, `data-${language}`)));
    assert.equal(normalized(text(node)), normalized(expected), `Initial HTML translation: ${route}: ${node.tagName}`);
  }
  const toggle = find(node => attr(node, 'data-language-toggle') !== undefined);
  assert.equal(toggle.tagName, 'a');
  assert.equal(attr(toggle, 'href'), localizedPath(path, language === 'zh' ? 'en' : 'zh'));
  for (const node of nodes.filter(node => node.tagName === 'a' && node !== toggle)) {
    const href = attr(node, 'href');
    if (href?.startsWith('/') && publicPagePaths.includes(localizedPath(new URL(href, base).pathname, 'en'))) {
      assert.equal(new URL(href, base).pathname, localizedPath(new URL(href, base).pathname, language), `Internal locale: ${route}: ${href}`);
    }
  }
  assert.equal(attr(find(node => attr(node, 'property') === 'og:url'), 'content'), canonical);
  assert.equal(attr(find(node => attr(node, 'property') === 'og:locale'), 'content'), language === 'zh' ? 'zh_CN' : 'en_AU');
  assert.equal(attr(find(node => attr(node, 'property') === 'og:title'), 'content'), title);
}
assert.equal(titles.size, 28); assert.equal(descriptions.size, 28);
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, 28);
assert.equal((sitemap.match(/hreflang="en"/g) || []).length, 28);
assert.equal((sitemap.match(/hreflang="zh-Hans"/g) || []).length, 28);
for (const path of ['/zh/not-a-public-page', '/not-a-public-page']) assert.equal((await fetch(base + path)).status, 404);
console.log('PASS: 28 server-translated language URLs, localized metadata, reciprocal alternates, self-canonicals, native language links, localized navigation, sitemap, 404s and private single-use calculator handoff.');
