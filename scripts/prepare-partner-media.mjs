import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');
const root = resolve(import.meta.dirname, '..');
const manifestPath = resolve(root, 'assets/partner-logos.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const sourcePath = resolve(root, 'content/partials/partner-network.html');
let source = await readFile(sourcePath, 'utf8');
let saved = 0;
for (const logo of manifest.logos) {
  const original = logo.originalFile || logo.file;
  if (!original.endsWith('.png')) continue;
  const input = await readFile(resolve(root, 'public/partners', original));
  // Keep the original, dimensions and visible pixels; only change the delivery format.
  const output = await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
  if (output.length >= input.length) continue;
  const file = original.replace(/\.png$/, '-lossless.webp');
  await writeFile(resolve(root, 'public/partners', file), output);
  source = source.replaceAll(`/partners/${logo.file}"`, `/partners/${file}"`)
    .replaceAll(`/partners/${original}"`, `/partners/${file}"`);
  logo.originalFile = original;
  logo.file = file;
  saved += input.length - output.length;
}
await writeFile(sourcePath, source);
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Lossless partner delivery saves ${saved.toLocaleString()} bytes; original artwork retained.`);
