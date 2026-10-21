import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Rasterise the existing official vector mark, not a redesigned or enlarged bitmap.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const root = resolve(import.meta.dirname, '..');
const source = await readFile(resolve(root, 'public/aqyr-github-avatar.svg'), 'utf8');
const mark = source.match(/<path\b[^>]*\/>/)?.[0].replace(/ transform="[^"]*"/, '');
assert(mark?.includes('fill="#45C487"'), 'Expected the official AQYR vector mark');
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="-4.2 -2 44 44">${mark}</svg>`);
const pngAt = size => sharp(svg).resize(size, size).png().toBuffer();
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(pngAt));
// Standard ICO directory with PNG-encoded images at each supported size.
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((bytes, i) => {
  const entry = 6 + i * 16;
  header[entry] = header[entry + 1] = sizes[i] === 256 ? 0 : sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(bytes.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += bytes.length;
});
const outputs = [['aqyr-favicon.png', await pngAt(192)], ['favicon.ico', Buffer.concat([header, ...images])]];
for (const [name, bytes] of outputs) {
  const target = resolve(root, 'public', name);
  if (process.argv.includes('--check')) assert.deepEqual(await readFile(target), bytes, `${name} is stale`);
  else await writeFile(target, bytes);
}
console.log('AQYR favicons: 192px PNG and 16/32/48/64/128/256px ICO; original vector and legacy WebP retained.');
