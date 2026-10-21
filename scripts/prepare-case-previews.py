"""Render decision-letter first pages with a strict public-field allowlist.

Only raster previews enter public/. Originals and temporary overlay PDFs stay
outside the web root. All content except the government masthead and explicitly
allowed decision facts is covered before rendering. Never serve the overlay PDF:
its underlying source text is not removed by a visual cover.
"""
import argparse
import io
import json
import re
import subprocess
from datetime import date
from pathlib import Path

import pdfplumber
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', required=True)
parser.add_argument('--work-dir', required=True)
parser.add_argument('--poppler', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = Path(args.source_dir).resolve()
work = Path(args.work_dir).resolve()
public = root / 'public' / 'case-previews'
assert not work.is_relative_to(root / 'public'), 'Temporary PDFs must remain private'
work.mkdir(parents=True, exist_ok=True)
public.mkdir(parents=True, exist_ok=True)
records = json.loads((root / 'scripts/case-preview-sources.json').read_text('utf-8'))
audit = []
contact_images = []

def is_allowed(text):
    """Fail closed: a new or wrapped template line is hidden, not guessed safe."""
    patterns = [
        r'\d{1,2} [A-Z][a-z]+ 20\d{2}',
        r'20\d{2}\.',
        r'(?:Visa program |Visa )?(?:Employer Nomination Scheme \(subclass 186\)(?: visa)?|Skills in Demand \(subclass 482\)(?: visa)?|Temporary Skill Shortage \(subclass 482\)(?: visa)?)(?:: Granted)?',
        r'visa',
        r'Stream (?:Direct Entry|Core Skills|Specialist Skills)',
        r'Approval of a Nominated Position in the ENS Nomination \(Direct Entry\)',
        r'Notification of approval of a nomination',
        r'Your nomination application has been approved on \d{1,2} [A-Z][a-z]+ 20\d{2}\.',
        r'We have granted you a (?:Employer Nomination Scheme \(subclass 186\)|Skills in Demand \(subclass 482\)|Temporary Skill Shortage \(subclass 482\)) visa on \d{1,2} [A-Z][a-z]+(?: 20\d{2}\.)?',
        r'Application status',
        r'Visa summary',
        r'Date of grant \d{1,2} [A-Z][a-z]+ 20\d{2}',
        r'Occupation: (?:Mechanical Engineer - 233512|Electrical Engineer - 233311)',
        r'Occupation / Code (?:Dental Technician - 411213|ICT Project Manager - 135112|Hotel or Motel Manager - 141311|Taxation Accountant - 221113|Recruitment Consultant - 223112)',
        r'NOMINATION APPROVAL NOTICE',
        r'FOR SUBCLASS 482 VISA',
        r'Details of approved nomination',
        r'Visa Program Skills in Demand \(subclass 482\) visa',
    ]
    return any(re.fullmatch(p, text.strip()) for p in patterns)

for record in records:
    for kind, suffix in [('nomination', 'Nomination_Approval'), ('nomination-detail', 'Nomination_Approval'), ('visa', 'Visa_Grant')]:
        path = source / record['folder'] / (record['prefix'] + '_' + suffix + '.pdf')
        with pdfplumber.open(path) as pdf:
            first = pdf.pages[0]
            page_index = 0
            if kind == 'nomination-detail':
                if record['code'] in (first.extract_text() or ''):
                    continue
                page_index = next(i for i, page in enumerate(pdf.pages) if record['code'] in (page.extract_text() or ''))
                first = pdf.pages[page_index]
            lines = first.extract_text_lines()
            full_text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
            expected = date.fromisoformat(record['visa' if kind == 'visa' else 'nomination']).strftime('%d %B %Y')
            assert expected in full_text, (record['id'], kind, 'Decision date mismatch')
            if kind.startswith('nomination'):
                assert record['code'] in full_text, (record['id'], 'Occupation mismatch')
            assert 'subclass ' + record['folder'] in full_text, (record['id'], 'Subclass mismatch')
            allowed = [line for line in lines if is_allowed(line['text'])]
            if kind == 'nomination-detail':
                assert any(record['code'] in line['text'] for line in allowed), 'Occupation must be visible'
            else:
                assert any(expected in line['text'] for line in allowed), 'Decision must be visible'
            width, height = float(first.width), float(first.height)
            # The masthead contains only the government insignia and department name.
            # Everything below it is hidden except exact whitelisted lines.
            ranges = [(0, 116)] + [(line['top'] - 1.5, line['bottom'] + 1.5) for line in allowed]
            ranges.sort()
            merged = []
            for top, bottom in ranges:
                if merged and top <= merged[-1][1]:
                    merged[-1][1] = max(merged[-1][1], bottom)
                else:
                    merged.append([max(0, top), min(height, bottom)])
            buf = io.BytesIO()
            overlay = canvas.Canvas(buf, pagesize=(width, height))
            overlay.setFillColorRGB(1, 1, 1)
            cursor = 0
            for top, bottom in merged + [[height, height]]:
                if top > cursor:
                    overlay.rect(0, height - top, width, top - cursor, stroke=0, fill=1)
                cursor = max(cursor, bottom)
            # Uniform bands make the omitted identity sections visibly deliberate.
            overlay.setFillColorRGB(.16, .18, .17)
            for line in lines:
                if re.search(r'(?:Name of applicant|Name of nominee|^Name |^Dear |Date of birth|Application ID|File number|Nomination transaction|Visa grant number|Passport|Transaction reference|^Sponsor )', line['text'], re.I):
                    top, bottom = line['top'] - 1, line['bottom'] + 1
                    if top >= 116 and not any(top < b and bottom > a for a, b in merged):
                        overlay.rect(70, height - bottom, min(width - 140, 310), bottom - top, stroke=0, fill=1)
            overlay.setFillColorRGB(.34, .42, .38)
            overlay.setFont('Helvetica', 8)
            overlay.drawString(70, 26, 'REDACTED PDF EXCERPT / SOURCE PAGE ' + str(page_index + 1))
            overlay.save()
            original_page = PdfReader(path).pages[page_index]
            original_page.merge_page(PdfReader(buf).pages[0])
            writer = PdfWriter()
            writer.add_page(original_page)
            temp_pdf = work / (record['id'] + '-' + kind + '.pdf')
            with temp_pdf.open('wb') as stream:
                writer.write(stream)
            prefix = work / (record['id'] + '-' + kind)
            subprocess.run([args.poppler, '-f', '1', '-singlefile', '-r', '130', '-png', str(temp_pdf), str(prefix)], check=True, capture_output=True)
            with Image.open(prefix.with_suffix('.png')) as picture:
                picture.convert('RGB').save(public / (prefix.name + '.webp'), 'WEBP', quality=88, method=6, exif=b'')
                thumb = ImageOps.contain(picture.convert('RGB'), (280, 400))
                tile = Image.new('RGB', (300, 430), '#e8eee9')
                tile.paste(thumb, ((300 - thumb.width) // 2, 0))
                ImageDraw.Draw(tile).text((8, 407), record['id'] + ' / ' + kind, fill='black')
                contact_images.append(tile)
            audit.append({'id':record['id'], 'kind':kind, 'visible_lines':[l['text'] for l in allowed], 'source_pages':len(pdf.pages), 'source_page':page_index + 1})
            print(record['id'], kind, 'OK')

sheet = Image.new('RGB', (1500, 430 * ((len(contact_images) + 4) // 5)), 'white')
for i, tile in enumerate(contact_images):
    sheet.paste(tile, ((i % 5) * 300, (i // 5) * 430))
sheet.save(work / 'redaction-contact-sheet.jpg', quality=92)
(work / 'preview-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2), 'utf-8')
print('Created', len(contact_images), 'raster-only excerpts. No source PDFs copied to public/.')
