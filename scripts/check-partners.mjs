import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadPageSource } from '../lib/content-source.mjs';
import { initPartnerMarquee, wrapPartnerOffset } from '../public/partner-marquee.mjs';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const source = loadPageSource('index.html');
const links = [...source.matchAll(/<a class="partner-logo[^>]*>[\s\S]*?<\/a>/g)].map(([link]) => link);
const manifest = JSON.parse(await readFile(new URL('../assets/partner-logos.json', import.meta.url), 'utf8'));
assert.equal(links.length, 18);
assert.equal(manifest.logos.length, 18);
assert.doesNotMatch(source, /partner-motion-toggle/);
assert.equal(new Set(links.map(link => link.match(/href="([^"]+)"/)[1])).size, 18);
for (const logo of manifest.logos) {
  const link = links.find(link => link.includes(`/partners/${logo.file}"`));
  assert(link, `Listed logo: ${logo.file}`);
  if (logo.website) assert(link.includes(`href="${logo.website}"`));
  const image = await sharp(fileURLToPath(new URL(`../public/partners/${logo.file}`, import.meta.url))).metadata();
  assert.equal(Number(link.match(/width="(\d+)"/)[1]), image.width);
  assert.equal(Number(link.match(/height="(\d+)"/)[1]), image.height);
}
assert.equal(wrapPartnerOffset(3601.75, 3600), 1.75);
assert.equal(wrapPartnerOffset(7200, 3600), 0);
assert.equal(wrapPartnerOffset(-2, 3600), 3598);
assert.equal(wrapPartnerOffset(4, 0), 0);

// Exercise the actual controller deterministically, without waiting through a full loop.
class Target {
  listeners = new Map(); dataset = {}; attrs = {};
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  emit(name, event = {}) { this.listeners.get(name)?.(event); }
  setAttribute(name, value) { this.attrs[name] = value; }
}
const viewport = new Target(); viewport.scrollLeft = 0;
const originals = Array.from({ length: 18 }, () => new Target());
viewport.contains = element => element === viewport || originals.includes(element);
const copy = new Target(); const clones = originals.map(() => new Target());
copy.classList = { add() {} }; copy.querySelectorAll = () => clones;
const group = { cloneNode: () => copy, getBoundingClientRect: () => ({ width: 3600 }) };
let copies = 0; const rail = { append() { copies++; } };
const section = new Target(); section.querySelector = selector => ({ '.partner-marquee': viewport, '.partner-rail': rail, '.partner-group': group })[selector];
const doc = new Target(); doc.documentElement = { dataset: { lang: 'en' } }; doc.querySelector = () => section; doc.activeElement = null;
const motion = new Target(); motion.matches = false;
const win = new Target(); win.matchMedia = () => motion;
const frames = new Map(); let frameId = 0;
Object.assign(globalThis, {
  window: win, document: doc,
  requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
  cancelAnimationFrame: id => frames.delete(id),
});
function pump(time) { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn(time)); }
initPartnerMarquee(); initPartnerMarquee();
assert.equal(copies, 1, 'No duplicate initialization');
assert.equal(copy.attrs['aria-hidden'], 'true');
assert(clones.every(link => link.attrs.tabindex === '-1'), 'Copies never add tab stops');
pump(100); pump(164);
assert(viewport.scrollLeft > 0, 'Autoplay advances');
viewport.scrollLeft = 3599; doc.emit('visibilitychange'); pump(200); pump(264);
assert(Math.abs(viewport.scrollLeft - 1.048) < 0.001, 'Crosses the seam without losing the fractional remainder');
viewport.emit('pointerenter', { pointerType: 'mouse' }); const hovered = viewport.scrollLeft; pump(328); assert.equal(viewport.scrollLeft, hovered);
viewport.emit('pointerleave'); pump(400); pump(464); assert(viewport.scrollLeft > hovered, 'Autoplay resumes after hover');
doc.activeElement = originals[0]; viewport.emit('focusin'); const focused = viewport.scrollLeft; pump(592); assert.equal(viewport.scrollLeft, focused);
doc.activeElement = null; doc.hidden = true; doc.emit('visibilitychange'); pump(656); assert.equal(viewport.scrollLeft, focused);
doc.hidden = false; motion.matches = true; motion.emit('change'); pump(720); assert.equal(viewport.scrollLeft, focused); assert.equal(section.dataset.reducedMotion, 'true');
motion.matches = false; motion.emit('change'); pump(800); pump(864); assert(viewport.scrollLeft > focused);
console.log('Passed: 18 official logo assets/links/dimensions; seamless wrap; autoplay; no pause button; hover pause/resume; keyboard focus; background tab; reduced motion.');
