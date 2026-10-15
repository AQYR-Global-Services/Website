"""Read-only ABS workbook import; never changes the original workbooks.

Run with a Python environment providing xlrd 2.0.2. Generated website data is
mechanically derived from the official 2013 v1.2 tables, not inferred from codes.
"""
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path
import xlrd

SOURCES = {
    "structure": "https://www.ausstats.abs.gov.au/ausstats/subscriber.nsf/0/6A8A6C9AC322D9ABCA257B9E0011956C/$File/1220.0%20ANZSCO%20Version%201.2%20Structure%20v3.xls",
    "index": "https://www.ausstats.abs.gov.au/ausstats/subscriber.nsf/0/8ECCAC9DBB4ABFEACA257B9E00119812/$File/12200%20ANZSCO%20Version%201.2%20Index%20of%20Principal%20Titles,%20Alternative%20Titles%20and%20Specialisations%20v3.xls",
}

def load_sources():
    books, hashes = {}, {}
    for name, url in SOURCES.items():
        with urllib.request.urlopen(url, timeout=45) as response:
            raw = response.read()
        hashes[name] = hashlib.sha256(raw).hexdigest()
        books[name] = xlrd.open_workbook(file_contents=raw)
    return books, hashes

def occupation_rows(books):
    occupations = {}
    sheet = books['structure'].sheet_by_name('Table 5')
    for row in range(sheet.nrows):
        code, title, skill = sheet.row_values(row)[4:7]
        if not isinstance(code, (int, float)) or not 100000 <= code <= 999999:
            continue
        code = str(int(code))
        if 'code retired' in str(title).lower():
            continue
        if code in occupations:
            raise ValueError('Duplicate occupation: ' + code)
        if not isinstance(skill, (int, float)) or int(skill) not in range(1, 6):
            raise ValueError('Unrecognised skill level: ' + str((code, title, skill)))
        occupations[code] = {'code':code, 'title':str(title).strip(), 'skill':int(skill), 'aliases':[]}
    sheet = books['index'].sheet_by_name('Table 2')
    for row in range(sheet.nrows):
        code, title = sheet.row_values(row)
        if not isinstance(code, (int, float)):
            continue
        entry = occupations.get(str(int(code)))
        if entry is None:
            raise ValueError('Index refers to missing occupation: ' + str(code))
        alias = re.sub(r'\s+\([APSN]\)$', '', str(title)).strip()
        if alias != entry['title'] and alias not in entry['aliases']:
            entry['aliases'].append(alias)
    if len(occupations) != 1023:
        raise ValueError('Unexpected ANZSCO v1.2 occupation count: ' + str(len(occupations)))
    return sorted(occupations.values(), key=lambda row:row['code'])

if __name__ == "__main__":
    books, hashes = load_sources()
    rows = occupation_rows(books)
    root = Path(__file__).resolve().parent.parent
    if '--inspect' in sys.argv:
        print(json.dumps({'count':len(rows), 'examples':[r for r in rows if r['code'] in ['261313','351311','351411','221111','254499']]},ensure_ascii=False))
        sys.exit()
    # Mechanical conversion of ABS tables; no source files are overwritten.
    content = '// Generated from ABS ANZSCO 2013 v1.2. See assets/anzsco-source.json.\n'
    content += 'export const occupations = ' + json.dumps(rows,ensure_ascii=False,separators=(',',':')) + ';\n'
    (root/'public'/'anzsco-2013.mjs').write_text(content,encoding='utf-8')
    provenance = {'classification':'ANZSCO 2013 Version 1.2','published':'2013-06-26','retrieved':'2026-10-15','occupationCount':len(rows),
      'sourcePages':['https://www.abs.gov.au/AUSSTATS/abs@.nsf/DetailsPage/1220.02013,%20Version%201.2?OpenDocument=',
      'https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list'],
      'workbooks':{name:{'url':url,'sha256':hashes[name]} for name,url in SOURCES.items()},
      'attribution':'Australian Bureau of Statistics and Statistics New Zealand, ANZSCO 2013 Version 1.2. Titles, skill levels and index aliases extracted without inferring levels from code prefixes.',
      'copyright':'https://www.abs.gov.au/about/legislation-and-policy/copyright',
      'limitations':'Classification lookup, not a current visa occupation eligibility list. Chinese search aliases are editorial helpers, not official translated titles.'}
    (root/'assets'/'anzsco-source.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Generated '+str(len(rows))+' occupations with '+str(sum(len(r['aliases']) for r in rows))+' official alternative titles/specialisations.')
