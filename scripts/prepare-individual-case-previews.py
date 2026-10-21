"""Create raster-only, fail-closed excerpts of two supplied visa grant notices.

Only exact allowlisted text rectangles and the government masthead are copied
onto a clean bitmap. Source PDFs, original renders and audit files stay outside
the repository; no PDF objects, hidden text or source metadata enter public/.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

import pdfplumber
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--talent-pdf', required=True)
parser.add_argument('--visitor-pdf', required=True)
parser.add_argument('--work-dir', required=True)
parser.add_argument('--poppler', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
work = Path(args.work_dir).resolve()
assert not work.is_relative_to(root), 'Private renders must remain outside the repository'
work.mkdir(parents=True, exist_ok=True)
target = root / 'public' / 'case-previews'

common = {'Application status', 'Visa duration and travel', 'Visa summary'}
records = [
    ('ai-scientist-858', args.talent_pdf, common | {
        'We have granted you a National Innovation (subclass 858) visa on 05 November 2025.',
        'National Innovation (subclass 858): Granted',
        'Date of grant 05 November 2025',
        'Must not arrive after 05 November 2030',
        'Length of stay Indefinite from the date of each arrival',
        'Visa National Innovation (subclass 858)',
    }),
    ('parent-visitor-600', args.visitor_pdf, common | {
        'We have granted you a Visitor (subclass 600) visa on 29 April 2026.',
        'Visitor (subclass 600): Granted',
        'Visa conditions',
        '8501 - Maintain health insurance',
        '8558 - Maximum 12 months stay in 18 months',
        '8101 - No work',
        '8201 - Maximum three months study',
        'Date of grant 29 April 2026',
        'Must not arrive after 29 April 2029',
        'Length of stay 12 month(s) from the date of each arrival',
        'Travel Multiple entries',
        'Visa Visitor (subclass 600)',
        'Stream Tourist',
    }),
]
audit = []
for case_id, source, allowlist in records:
    with pdfplumber.open(source) as document:
        page = document.pages[0]
        lines = page.extract_text_lines()
        allowed = [line for line in lines if line['text'].strip() in allowlist]
        assert {line['text'].strip() for line in allowed} == allowlist, 'Source template changed; review allowlist'
        assert min(line['top'] for line in lines) > 116, 'Review masthead bounds'
        prefix = work / (case_id + '-private-source')
        subprocess.run([args.poppler, '-f', '1', '-singlefile', '-r', '130', '-png', source, str(prefix)], check=True, capture_output=True)
        with Image.open(prefix.with_suffix('.png')) as original:
            original = original.convert('RGB')
            clean = Image.new('RGB', original.size, 'white')
            sx, sy = original.width / float(page.width), original.height / float(page.height)
            clean.paste(original.crop((0, 0, original.width, math.floor(116 * sy))), (0, 0))
            for line in allowed:
                box = (math.floor((line['x0'] - 1) * sx), math.floor((line['top'] - 1) * sy),
                       math.ceil((line['x1'] + 1) * sx), math.ceil((line['bottom'] + 1) * sy))
                # Reject a crop if it intersects any unapproved text line.
                for other in lines:
                    if other not in allowed:
                        assert other['bottom'] * sy <= box[1] or other['top'] * sy >= box[3], 'Unsafe adjacent line'
                clean.paste(original.crop(box), box[:2])
            draw = ImageDraw.Draw(clean)
            for line in lines:
                if line['text'].startswith(('Dear ', 'Name ', 'Date of birth ', 'Visa grant number ', 'Passport ', 'Application ID ', 'Transaction reference number ')):
                    draw.rectangle((70 * sx, line['top'] * sy, 360 * sx, line['bottom'] * sy), fill='#292e2b')
            draw.text((70 * sx, clean.height - 35 * sy), 'REDACTED PDF EXCERPT / SOURCE PAGE 1', fill='#576b61')
            clean.save(target / (case_id + '-visa.webp'), 'WEBP', quality=90, method=6, exif=b'')
        audit.append({'id': case_id, 'visible_lines': [line['text'] for line in allowed], 'source_page': 1, 'source_pages': len(document.pages)})
        print(case_id, 'OK: raster-only allowlisted excerpt')
(work / 'individual-redaction-audit.json').write_text(json.dumps(audit, indent=2), encoding='utf-8')
