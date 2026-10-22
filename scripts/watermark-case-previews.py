"""Burn the approved AQYR watermark into already-redacted document excerpts.

Input must be a separate, private copy of the clean raster excerpts. Original
application PDFs are never opened. Only flattened, metadata-free WebP files are
written to public/. Intermediate PDFs and the review bundle stay outside it.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageOps
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', required=True, help='Private, clean redacted WebP copies, not original PDFs')
parser.add_argument('--work-dir', required=True, help='Private work/review directory outside the repository')
parser.add_argument('--poppler', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = Path(args.source_dir).resolve()
work = Path(args.work_dir).resolve()
target = root / 'public' / 'case-previews'
assert not source.is_relative_to(root), 'Keep the clean redacted input copies outside the repository'
assert not work.is_relative_to(root), 'Keep intermediate PDFs outside the repository'
names = sorted(p.name for p in target.glob('*.webp'))
assert len(names) == 21 and names == sorted(p.name for p in source.glob('*.webp'))
manifest_path = root / 'assets' / 'case-preview-watermarks.json'
if manifest_path.exists():
    previous = json.loads(manifest_path.read_text('utf-8'))
    for name in names:
        assert digest(source / name) != previous['images'][name]['sha256'], 'Refusing to watermark an already-watermarked source'
before = {name: digest(source / name) for name in names}
temporary = work / 'tmp' / 'pdfs'
output = work / 'output' / 'pdf'
temporary.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)

width, height = A4
layered = temporary / 'watermark-layout.pdf'
c = canvas.Canvas(str(layered), pagesize=A4, pageCompression=1)
c.setTitle('AQYR Global Services - redacted case copies')
c.setAuthor('AQYR Global Services')
for name in names:
    with Image.open(source / name) as original:
        assert original.size == (1075, 1521)
    c.drawImage(ImageReader(str(source / name)), 0, 0, width=width, height=height)
    for y in (220, 420, 620):
        c.saveState()
        c.translate(width / 2, y)
        c.rotate(28)
        c.setFillColor(HexColor('#35594A'))
        c.setFillAlpha(0.18)
        c.setFont('Helvetica-Bold', 34)
        c.drawCentredString(0, 0, 'AQYR GLOBAL SERVICES')
        c.restoreState()
    c.setFillColor(HexColor('#61766B'))
    c.setFont('Helvetica', 7)
    c.drawCentredString(width / 2, 16, 'AQYR GLOBAL SERVICES  |  REDACTED CASE COPY  |  hiremiiglobal.com')
    c.showPage()
c.save()
subprocess.run([args.poppler, '-png', '-r', '130', str(layered), str(temporary / 'watermarked')], check=True)
pages = sorted(temporary.glob('watermarked-*.png'), key=lambda p: int(p.stem.rsplit('-', 1)[1]))
assert len(pages) == len(names)

manifest = {
    'version': 1,
    'text': 'AQYR GLOBAL SERVICES',
    'angle': 28,
    'opacity': 0.18,
    'flattened': True,
    'source': 'Previously redacted raster excerpts only; original PDFs are not used.',
    'images': {},
}
tiles = []
for name, page in zip(names, pages):
    with Image.open(page) as rendered:
        picture = rendered.convert('RGB')
        assert picture.size == (1075, 1521)
        # Lossless encoding avoids another lossy pass over the decision text.
        picture.save(target / name, 'WEBP', lossless=True, method=6, exif=b'')
        tile = Image.new('RGB', (240, 370), '#e8eee9')
        thumbnail = ImageOps.contain(picture, (224, 330))
        tile.paste(thumbnail, ((240 - thumbnail.width) // 2, 4))
        draw = ImageDraw.Draw(tile)
        label = name.removesuffix('.webp')
        split = label.rfind('-', 0, 28)
        if split > 0:
            label = label[:split] + '\n' + label[split + 1:]
        draw.multiline_text((8, 340), label, fill='#1f4434', spacing=2)
        tiles.append(tile)
    data = (target / name).read_bytes()
    assert b'EXIF' not in data and b'XMP ' not in data
    manifest['images'][name] = {'sha256': digest(target / name), 'width': 1075, 'height': 1521}
    assert manifest['images'][name]['sha256'] != before[name]
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

bundle = output / 'aqyr-all-redacted-watermarked.pdf'
c = canvas.Canvas(str(bundle), pagesize=A4, pageCompression=1)
c.setTitle('AQYR Global Services - watermarked redacted case copies (21 pages)')
c.setAuthor('AQYR Global Services')
for name in names:
    c.drawImage(ImageReader(str(target / name)), 0, 0, width=width, height=height)
    c.showPage()
c.save()
reader = PdfReader(bundle)
assert len(reader.pages) == 21
for page in reader.pages:
    assert not (page.extract_text() or '').strip()
    assert len(page.images) == 1
    assert not page.get('/Annots')
assert before == {name: digest(source / name) for name in names}
for index in range(0, len(tiles), 7):
    sheet = Image.new('RGB', (240 * 4, 370 * 2), 'white')
    for position, tile in enumerate(tiles[index:index + 7]):
        sheet.paste(tile, ((position % 4) * 240, (position // 4) * 370))
    sheet.save(output / f'review-{index // 7 + 1}.png')
print('PASS: all 21 excerpts watermarked and flattened; no original PDFs opened; clean source copies unchanged.')
print('Review bundle:', bundle)
