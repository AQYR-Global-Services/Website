import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { verifiedCases } from '../lib/verified-cases.mjs';
import { casePreparation } from '../lib/case-preparation.mjs';
import { individualCaseCopy } from '../lib/individual-case-copy.mjs';
import { loadPageSource } from '../lib/content-source.mjs';
import { safeCasePreviewSource } from '../public/case-document-preview.mjs';

const root = resolve(import.meta.dirname, '..');
const base = process.argv[2];
const watermarks = JSON.parse(await readFile(resolve(root, 'assets/case-preview-watermarks.json'), 'utf8'));
assert.equal(watermarks.text, 'AQYR GLOBAL SERVICES');
assert.equal(watermarks.flattened, true);
assert.equal(watermarks.opacity, 0.18);
assert.equal(watermarks.angle, 28);
assert.equal(Object.keys(watermarks.images).length, 21);
assert.equal(safeCasePreviewSource('/case-previews/sample-visa.webp?v=123456abcdef'), '/case-previews/sample-visa.webp?v=123456abcdef');
for (const unsafe of ['https://example.com/x.webp', '/case-previews/../secret.webp', '/case-previews/x.webp?v=invalid', '/case-previews/x.webp?v=123456abcdef&extra=1']) {
  assert.equal(safeCasePreviewSource(unsafe), null);
}
const sources = JSON.parse(await readFile(resolve(root, 'scripts/case-preview-sources.json'), 'utf8'));
assert.equal(verifiedCases.length, 9);
assert.equal(new Set(verifiedCases.map(c => c.id)).size, 9);
assert.deepEqual(Object.keys(casePreparation).sort(), verifiedCases.filter(c => c.documentType !== 'visa-only').map(c => c.id).sort());
assert.deepEqual(Object.keys(individualCaseCopy).sort(), verifiedCases.filter(c => c.documentType === 'visa-only').map(c => c.id).sort());
assert.equal(new Set(Object.values(casePreparation).map(c => c.zh)).size, 7);
for (const copy of Object.values(casePreparation)) {
  assert(copy.en.length > 100 && copy.en.split(/\s+/).length <= 55, 'Keep English preparation copy brief');
  assert(copy.zh.length > 40 && copy.zh.length <= 95, 'Keep Chinese preparation copy brief');
  assert.doesNotMatch(copy.zh, /我们(?:成功|解决|协助)|团队(?:解决|整理|补充)|补件|拒签|加急|保证/);
  assert.doesNotMatch(copy.zh, /可(?:将|围绕|结合|分别|按|以)|建议|您应/);
  assert.doesNotMatch(copy.en, /a useful focus|can be (?:matched|organised)|can (?:explain|make|clarify|keep)/i);
}
const assets = new Set();
for (const record of verifiedCases) {
  if (record.documentType === 'visa-only') {
    assert.equal(record.nomination, undefined, 'No invented nomination for an individual case');
    assert.equal(record.code, undefined, 'Do not assign an unsupported occupation code');
    assert.deepEqual([record.subclass, record.visa], {
      'ai-scientist-858': ['858', '2025-11'],
      'parent-visitor-600': ['600', '2026-04'],
    }[record.id]);
    const copy = individualCaseCopy[record.id];
    assert(copy.contextEn && copy.contextZh && copy.preparationEn && copy.preparationZh);
    assets.add(`${record.id}-visa.webp`);
    continue;
  }
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
assert.equal(assets.size, 21);
const actual = await readdir(resolve(root, 'public/case-previews'));
assert.deepEqual(actual.sort(), [...assets].sort(), 'Only the expected raster excerpts belong in the public case folder');
assert.deepEqual(Object.keys(watermarks.images).sort(), [...assets].sort());
for (const name of assets) {
  const bytes = await readFile(resolve(root, 'public/case-previews', name));
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  assert(!bytes.includes(Buffer.from('EXIF')), 'No source file metadata in public images');
  assert(!bytes.includes(Buffer.from('XMP ')), 'No hidden source metadata');
  const entry = watermarks.images[name];
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, 'Confirmed watermarked asset: ' + name);
  assert.deepEqual([entry.width, entry.height], [1075, 1521]);
  if (base) {
    const response = await fetch(`${base}/case-previews/${name}?v=${entry.sha256.slice(0, 12)}`, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, name);
    assert.match(response.headers.get('content-type'), /image\/webp/);
    const liveBytes = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(liveBytes).digest('hex'), entry.sha256, 'Live watermarked bytes: ' + name);
  }
}
const page = loadPageSource('case-studies.html', root);
assert.equal((page.match(/data-case-preview /g) || []).length, 9);
assert.equal((page.match(/<dialog /g) || []).length, 1);
assert.doesNotMatch(page, /Applicant_|Mr_W|\.pdf["']|case_data|without a further information request|未收到进一步补充材料要求/);
assert.doesNotMatch(page, /case-filters|outcome-library|outcome-featured/);
assert.match(page, /Past results do not guarantee approval or processing time/);
assert.equal((page.match(/data-en="Case focus" data-zh="案件关注点"/g) || []).length, 9);
assert.equal((page.match(/class="section project-cases"/g) || []).length, 1);
for (const c of verifiedCases) {
  assert(page.includes(`id="${c.id}"`));
  assert(page.includes(`href="#${c.id}"`));
  const name = `${c.id}-visa.webp`;
  assert(page.includes(`data-visa-src="/case-previews/${name}?v=${watermarks.images[name].sha256.slice(0, 12)}"`));
}
for (const subclass of ['186', '482', '858', '600']) assert(page.includes(`id="case-${subclass}"`));
assert.match(page, /three-year multiple.entry/);
assert.match(page, /earlier refusal/);
assert.match(page, /Medical AI Scientist/);
assert.match(page, /medical AI scientist/);
assert.match(page, /医学 AI 科学家/);
assert.doesNotMatch(page, /three years of continuous stay|连续停留三年/);
for (const route of ['index', 'employers', 'about', 'employer-sponsorship', 'sponsored-visas']) {
  const source = loadPageSource(route + '.html', root);
  assert.doesNotMatch(source, /case-studies#(?:business-cases|individual-cases|fintech-software-engineer|civil-engineering-draftsperson)/);
}
console.log('PASS: 9 cases; all 21 metadata-free, watermarked raster previews match the verified manifest; cache-versioned safe preview URLs.');
