import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifiedCases } from '../lib/verified-cases.mjs';
import { casePreparation } from '../lib/case-preparation.mjs';
import { individualCaseCopy } from '../lib/individual-case-copy.mjs';

const root = resolve(import.meta.dirname, '..');
const watermarks = JSON.parse(readFileSync(resolve(root, 'assets/case-preview-watermarks.json'), 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const bi = (tag, en, zh, attrs = '') => `<${tag}${attrs} data-en="${esc(en)}" data-zh="${esc(zh)}">${esc(en)}</${tag}>`;
const monthEn = value => new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + '-01T00:00:00Z'));
const monthZh = value => `${value.slice(0, 4)} 年 ${Number(value.slice(5))} 月`;
const image = (c, kind) => {
  const name = `${c.id}-${kind}.webp`;
  const entry = watermarks.images[name];
  if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Missing watermark manifest: ' + name);
  return `/case-previews/${name}?v=${entry.sha256.slice(0, 12)}`;
};
const arrow = '<svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"></path></svg>';
const groups = [
  { id: 'case-186', visa: '186', en: '186 · Employer Nomination Scheme', zh: '186 · 雇主提名计划', descEn: 'Direct Entry cases with nomination and visa decisions.', descZh: 'Direct Entry 类别，分别展示提名与签证批准记录。' },
  { id: 'case-482', visa: '482', en: '482 · Skills in Demand', zh: '482 · Skills in Demand', descEn: 'Core Skills and Specialist Skills cases across five occupations.', descZh: '涵盖五类职业的 Core Skills 及 Specialist Skills 获批案例。' },
  { id: 'case-858', visa: '858', en: '858 · National Innovation', zh: '858 · 国家创新签证', descEn: 'A medical AI scientist’s visa grant.', descZh: '医学 AI 科学家的签证获批记录。' },
  { id: 'case-600', visa: '600', en: '600 · Visitor', zh: '600 · 访客签证', descEn: 'A parent visitor’s successful reapplication.', descZh: '父母访客拒签后重新申请获批。' },
];

function article(c) {
  if (c.documentType === 'visa-only') return individualArticle(c);
  const preparation = casePreparation[c.id];
  if (!preparation) throw new Error('Missing preparation copy: ' + c.id);
  const details = c.subclass === '482' ? ` data-detail-src="${image(c, 'nomination-detail')}"` : '';
  return `<article class="case-study case-detailed reveal" data-case-subclass="${c.subclass}" id="${c.id}">
<div class="case-heading"><div>${bi('div', c.sectorEn, c.sectorZh, ' class="label"')}${bi('h3', `${c.en} · ${c.subclass}`, `${c.zh} · ${c.subclass}`)}</div><span class="tag">${c.subclass} · ${c.stream}</span></div>
<div class="case-detail-grid"><div class="case-context">${bi('h4', 'The case', '案件概况')}${bi('p', `This ${c.subclass} ${c.stream} case concerns the ${c.en} occupation (ANZSCO ${c.code}). The nomination was approved in ${monthEn(c.nomination)} and the visa was granted in ${monthEn(c.visa)}, with a separate decision letter for each stage.`, `本案以${c.zh}（ANZSCO ${c.code}）为提名职业，申请 ${c.subclass} ${c.stream}。提名于 ${monthZh(c.nomination)}获批，签证于 ${monthZh(c.visa)}获批，两阶段均有独立批准文件。`)}${bi('h4', 'Case focus', '案件关注点')}${bi('p', preparation.en, preparation.zh, ' class="case-challenge"')}</div>
<div class="case-work">${bi('h4', 'Nomination approved', '提名获批')}<p>${bi('time', monthEn(c.nomination), monthZh(c.nomination), ` datetime="${c.nomination}"`)}${bi('span', ` · ${c.en} (${c.code}).`, ` · ${c.zh}（${c.code}）。`)}</p>${bi('h4', 'Visa granted', '签证获批')}<p>${bi('time', monthEn(c.visa), monthZh(c.visa), ` datetime="${c.visa}"`)}${bi('span', ` · Subclass ${c.subclass}, ${c.stream}.`, ` · ${c.subclass}，${c.stream}。`)}</p></div>
<aside class="case-outcome">${bi('h4', 'Confirmed outcome', '已确认结果')}<div>${bi('p', 'Nomination approved. Visa granted.', '提名及签证均已获批。')}<a class="case-document-link" href="${image(c, 'nomination')}" target="_blank" rel="noopener noreferrer" data-case-preview data-case-en="${c.en} · ${c.subclass}" data-case-zh="${c.zh} · ${c.subclass}" data-nomination-src="${image(c, 'nomination')}" data-visa-src="${image(c, 'visa')}"${details} aria-haspopup="dialog" aria-controls="case-document-dialog">${bi('span', 'View approval documents', '查看获批文件')}${arrow}</a></div></aside></div></article>`;
}

function individualArticle(c) {
  const copy = individualCaseCopy[c.id];
  if (!copy) throw new Error('Missing individual case copy: ' + c.id);
  return `<article class="case-study case-detailed reveal" data-case-subclass="${c.subclass}" id="${c.id}">
<div class="case-heading"><div>${bi('div', c.sectorEn, c.sectorZh, ' class="label"')}${bi('h3', `${c.en} · ${c.subclass}`, `${c.zh} · ${c.subclass}`)}</div><span class="tag">${c.subclass} · ${c.stream}</span></div>
<div class="case-detail-grid"><div class="case-context">${bi('h4', 'The case', '案件概况')}${bi('p', copy.contextEn, copy.contextZh)}${bi('h4', 'Case focus', '案件关注点')}${bi('p', copy.preparationEn, copy.preparationZh, ' class="case-challenge"')}</div>
<div class="case-work">${bi('h4', 'Visa granted', '签证获批')}<p>${bi('time', monthEn(c.visa), monthZh(c.visa), ` datetime="${c.visa}"`)}</p>${bi('p', copy.detailEn, copy.detailZh)}</div>
<aside class="case-outcome">${bi('h4', 'Confirmed outcome', '已确认结果')}<div>${bi('p', copy.outcomeEn, copy.outcomeZh)}<a class="case-document-link" href="${image(c, 'visa')}" target="_blank" rel="noopener noreferrer" data-case-preview data-case-en="${c.en} · ${c.subclass}" data-case-zh="${c.zh} · ${c.subclass}" data-visa-src="${image(c, 'visa')}" aria-haspopup="dialog" aria-controls="case-document-dialog">${bi('span', 'View visa grant', '查看签证批准信')}${arrow}</a></div></aside></div></article>`;
}

const directory = `<nav class="case-directory" aria-label="Case directory" data-aria-label-en="Case directory" data-aria-label-zh="案例目录"><div class="case-directory-track">${groups.map(g => `<div><h3><a href="#${g.id}">${bi('span', `${g.visa} cases`, `${g.visa} 案例`)}</a></h3><ul>${verifiedCases.filter(c => c.subclass === g.visa).map(c => `<li><a href="#${c.id}">${bi('span', c.en, c.zh)}</a></li>`).join('')}</ul></div>`).join('')}</div></nav>`;
const dialog = `<dialog class="case-document-dialog" id="case-document-dialog" aria-labelledby="case-document-title" aria-describedby="case-document-privacy"><div class="case-document-shell"><header class="case-document-header"><div>${bi('p', 'APPROVAL DOCUMENTS', '获批文件', ' class="label"')}<h2 id="case-document-title"></h2></div><button type="button" class="case-document-close" data-close-preview aria-label="Close document preview" data-aria-label-en="Close document preview" data-aria-label-zh="关闭文件预览"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button></header><div class="case-document-toolbar"><div class="case-document-switch" role="group" aria-label="Choose a document" data-aria-label-en="Choose a document" data-aria-label-zh="选择文件"><button type="button" data-document-kind="nomination" aria-pressed="true">${bi('span', 'Nomination approval', '提名批准信')}</button><button type="button" data-document-kind="visa" aria-pressed="false">${bi('span', 'Visa grant', '签证批准信')}</button></div><a class="plain-link" data-document-full target="_blank" rel="noopener noreferrer">${bi('span', 'Open large image', '打开大图')}${arrow}</a></div>${bi('p', 'Redacted PDF excerpts. Personal, employer and application identifiers are withheld; the original files are not published.', '以下为真实 PDF 的脱敏节选图，已隐去个人、雇主和申请识别信息，未公开原件。', ' id="case-document-privacy" class="case-document-privacy"')}<div class="case-document-body" tabindex="0" role="region" aria-label="Document preview" data-aria-label-en="Document preview" data-aria-label-zh="文件预览"><p class="case-document-error" role="status" hidden></p><figure><img class="case-document-image" data-preview-image width="1075" height="1521" alt=""><figcaption data-primary-caption></figcaption></figure><figure data-detail-figure hidden><img class="case-document-image" data-preview-detail width="1075" height="1521" alt=""><figcaption>${bi('span', 'Nomination notice · occupation details', '提名批准通知 · 职业详情页')}</figcaption></figure></div></div></dialog>`;
const cases = `${groups.map(g => `<div class="case-group" id="${g.id}" role="group" aria-labelledby="${g.id}-label"><div class="case-group-intro reveal">${bi('p', g.en, g.zh, ` class="label" id="${g.id}-label"`)}${bi('p', g.descEn, g.descZh)}</div><div class="case-studies">${verifiedCases.filter(c => c.subclass === g.visa).map(article).join('\n')}</div></div>`).join('\n')}${bi('p', 'These are selected individual decisions, not a success-rate sample. Nomination approval and visa grant are separate outcomes. Past results do not guarantee approval or processing time for another application.', '以上为精选个案记录，并非成功率统计。提名批准与签证批准是不同结果；过往个案不代表其他申请一定获批，也不保证审理时间。', ' class="note"')}${dialog}`;
const result = `<!-- Generated by scripts/build-verified-cases.mjs. Public-safe facts and redacted images only. -->\n<!-- fragment:directory -->\n${directory}\n<!-- /fragment -->\n<!-- fragment:cases -->\n${cases}\n<!-- /fragment -->\n`;
const target = resolve(root, 'content/partials/verified-cases.html');
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== result) throw new Error('Verified case markup is stale');
  console.log('Verified case markup is current.');
} else {
  writeFileSync(target, result);
  console.log(`Built ${verifiedCases.length} document-backed cases in the existing reading layout.`);
}
