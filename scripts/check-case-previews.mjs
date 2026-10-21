import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifiedCases } from '../lib/verified-cases.mjs';
import { casePreparation } from '../lib/case-preparation.mjs';
import { loadPageSource } from '../lib/content-source.mjs';

const root = resolve(import.meta.dirname, '..');
const base = process.argv[2];
const sources = JSON.parse(await readFile(resolve(root, 'scripts/case-preview-sources.json'), 'utf8'));
assert.equal(verifiedCases.length, 7);
assert.equal(new Set(verifiedCases.map(c => c.id)).size, 7);
assert.deepEqual(Object.keys(casePreparation).sort(), verifiedCases.map(c => c.id).sort());
assert.equal(new Set(Object.values(casePreparation).map(c => c.zh)).size, 7);
for (const copy of Object.values(casePreparation)) {
  assert(copy.en.length > 100 && copy.en.split(/\s+/).length <= 55, 'Keep English preparation copy brief');
  assert(copy.zh.length > 40 && copy.zh.length <= 95, 'Keep Chinese preparation copy brief');
  assert.doesNotMatch(copy.zh, /我们(?:成功|解决|协助)|团队(?:解决|整理|补充)|补件|拒签|加急|保证/);
}
const assets = new Set();
for (const record of verifiedCases) {
  const source = sources.find(c => c.id === record.id);
  assert(source);
  assert.equal(record.code, source.code);
  assert.equal(record.en, source.occupation);
  assert.equal(record.subclass, source.folder);
  assert.equal(record.stream, source.stream);
  for (const type of ['nomination', 'visa']) {
    assert.equal(record[type], source[type].slice(0, 7));
    assets.add(`${record.id}-${type}.webp`);
  }
  if (record.subclass === '482') assets.add(`${record.id}-nomination-detail.webp`);
  assert(record.nomination <= record.visa);
  assert.deepEqual(Object.keys(record).sort(), ['id','en','zh','code','subclass','stream','sectorEn','sectorZh','nomination','visa'].sort());
}
assert.equal(assets.size, 19);
const actual = await readdir(resolve(root, 'public/case-previews'));
assert.deepEqual(actual.sort(), [...assets].sort(), 'Only the expected raster excerpts belong in the public case folder');
for (const name of assets) {
  const bytes = await readFile(resolve(root, 'public/case-previews', name));
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  assert(!bytes.includes(Buffer.from('EXIF')), 'No source file metadata in public images');
  if (base) {
    const response = await fetch(`${base}/case-previews/${name}`);
    assert.equal(response.status, 200, name);
    assert.match(response.headers.get('content-type'), /image\/webp/);
  }
}
const page = loadPageSource('case-studies.html', root);
assert.equal((page.match(/data-case-preview /g) || []).length, 7);
assert.equal((page.match(/<dialog /g) || []).length, 1);
assert.doesNotMatch(page, /Applicant_|Mr_W|\.pdf["']|case_data|without a further information request|未收到进一步补充材料要求/);
assert.doesNotMatch(page, /case-filters|outcome-library|outcome-featured/);
assert.match(page, /decision letters do not record case-specific challenges or work performed/);
assert.equal((page.match(/class="section project-cases"/g) || []).length, 1);
for (const c of verifiedCases) {
  assert(page.includes(`id="${c.id}"`));
  assert(page.includes(`href="#${c.id}"`));
  assert(page.includes(`data-visa-src="/case-previews/${c.id}-visa.webp"`));
}
for (const route of ['index', 'employers', 'about', 'employer-sponsorship', 'sponsored-visas']) {
  const source = loadPageSource(route + '.html', root);
  assert.doesNotMatch(source, /case-studies#(?:business-cases|individual-cases|fintech-software-engineer|civil-engineering-draftsperson)/);
}
console.log('PASS: 7 paired, document-backed cases; 19 metadata-free raster previews; original PDFs remain private; one existing case layout.');
