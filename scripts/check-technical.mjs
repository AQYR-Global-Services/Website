import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { parse } from 'parse5';
import { loadPageSource } from '../lib/content-source.mjs';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const base = process.argv[2];
const sourcePages = (await readdir('content')).filter(file => file.endsWith('.html'));
const samples = base
  ? await Promise.all(sourcePages.flatMap(file => {
    const route = file === 'index.html' ? '' : file.replace('.html', '');
    return [route ? '/' + route : '/', '/zh' + (route ? '/' + route : '')];
  }).map(async route => {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, route);
    return [route, await response.text()];
  }))
  : sourcePages.map(file => [file, loadPageSource(file)]);

for (const [route, html] of samples) {
  const nodes = [];
  function visit(node) { nodes.push(node); node.childNodes?.forEach(visit); }
  visit(parse(html));
  const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
  const ids = nodes.filter(node => attr(node, 'id')).map(node => attr(node, 'id'));
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs: ${route}`);
  assert.equal(nodes.filter(node => node.tagName === 'h1').length, 1, `One primary heading: ${route}`);
  const main = nodes.find(node => node.tagName === 'main');
  assert.equal(attr(main, 'id'), 'main-content', route);
  assert.equal(attr(main, 'tabindex'), '-1', `Skip target can receive focus: ${route}`);
  assert(nodes.some(node => attr(node, 'class')?.split(' ').includes('skip-link') && attr(node, 'href') === '#main-content'), route);
  for (const image of nodes.filter(node => node.tagName === 'img')) {
    assert.notEqual(attr(image, 'alt'), undefined, `Image alternative: ${route}`);
    assert(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0, `Reserve image space: ${route}`);
  }
  for (const control of nodes.filter(node => ['input', 'textarea', 'select'].includes(node.tagName) && attr(node, 'type') !== 'hidden')) {
    const hasLabel = attr(control, 'aria-label') || attr(control, 'aria-labelledby') || nodes.some(node => node.tagName === 'label' && attr(node, 'for') === attr(control, 'id'));
    let parent = control.parentNode;
    while (parent && parent.tagName !== 'label') parent = parent.parentNode;
    assert(hasLabel || parent, `Form control label: ${route}`);
  }
}

const css = await readFile('style.css', 'utf8');
assert.doesNotMatch(css, /@import.*fonts\.googleapis|https:\/\/fonts\.gstatic/, 'Font delivery must stay local');
const fontManifest = JSON.parse(await readFile('assets/font-sources.json', 'utf8'));
for (const font of fontManifest.fonts) {
  const data = await readFile('public/fonts/' + font.file);
  assert.equal(data.toString('ascii', 0, 4), 'wOF2');
  assert.equal(createHash('sha256').update(data).digest('hex'), font.sha256);
  assert(css.includes('./public/fonts/' + font.file));
}
for (const name of ['albertsans', 'rethinksans']) assert.match(await readFile(`public/fonts/${name}-OFL.txt`, 'utf8'), /SIL OPEN FONT LICENSE/);
if (base) {
  const home = parse(samples[0][1]);
  const stylesheets = [];
  function styles(node) {
    if (node.tagName === 'link' && node.attrs.some(a => a.name === 'rel' && a.value === 'stylesheet')) {
      stylesheets.push(node.attrs.find(a => a.name === 'href').value);
    }
    node.childNodes?.forEach(styles);
  }
  styles(home);
  assert(stylesheets.length, 'Built stylesheet is present');
  const fontUrls = new Set();
  for (const path of stylesheets) {
    const cssUrl = new URL(path, base);
    const response = await fetch(cssUrl);
    assert.equal(response.status, 200);
    const builtCss = await response.text();
    assert.doesNotMatch(builtCss, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
    for (const [, path] of builtCss.matchAll(/url\(["']?([^\s)"']+\.woff2)["']?\)/g)) fontUrls.add(new URL(path, cssUrl).href);
  }
  assert.equal(fontUrls.size, 4, 'All font subsets are emitted by the build');
  for (const url of fontUrls) {
    assert.equal(new URL(url).origin, new URL(base).origin);
    const response = await fetch(url);
    assert.equal(response.status, 200, url);
    assert.equal(Buffer.from(await response.arrayBuffer()).toString('ascii', 0, 4), 'wOF2');
  }
}
const partners = JSON.parse(await readFile('assets/partner-logos.json', 'utf8'));
let saved = 0;
for (const logo of partners.logos.filter(logo => logo.originalFile)) {
  const original = await readFile('public/partners/' + logo.originalFile);
  const delivered = await readFile('public/partners/' + logo.file);
  assert(delivered.length < original.length, logo.file);
  for (const background of ['#ffffff', '#000000']) {
    // Compare visible pixels on both backgrounds, including semitransparent edges.
    const decode = bytes => sharp(bytes).flatten({ background }).raw().toBuffer();
    assert.deepEqual(await decode(delivered), await decode(original), `Lossless artwork: ${logo.file}`);
  }
  saved += original.length - delivered.length;
}
console.log(`PASS: ${samples.length} pages: heading, skip focus, unique IDs, image dimensions and form labels. Local licensed fonts verified. Partner images save ${saved.toLocaleString()} bytes with identical visible pixels.`);
