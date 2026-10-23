"""One-time official JMA collection; no requests from the running web app.

python scripts/collect_jma.py --verified-on 2026-10-23
python scripts/collect_jma.py --verified-on 2026-10-23 --offline
Snapshots are exact response bytes (gzip), with SHA-256, URL and review date.
Only four requested numeric columns are extracted. Quality markers are retained.
"""
import argparse
import gzip
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/service/data'
RAW = DATA / 'raw/jma'
STATIONS = {
    'tokyo': ('44', '47662', '東京', 'Tokyo'),
    'osaka': ('62', '47772', '大阪', 'Osaka'),
    'fukuoka': ('82', '47807', '福岡', 'Fukuoka'),
    'sapporo': ('14', '47412', '札幌', 'Sapporo'),
}
METRICS = {'meanTemperatureC': 7, 'meanDailyMaximumC': 8,
           'meanDailyMinimumC': 9, 'precipitationMm': 3}


class Tables(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []
        self.active = None
        self.row = None
        self.cell = None
        self.cell_attrs = None

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.active = {'attrs': dict(attrs), 'rows': []}
        elif tag == 'tr' and self.active is not None:
            self.row = []
        elif tag in ('td', 'th') and self.row is not None:
            self.cell, self.cell_attrs = [], dict(attrs)
        elif tag == 'br' and self.cell is not None:
            self.cell.append(' ')

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append({'raw': ' '.join(''.join(self.cell).split()),
                             'class': self.cell_attrs.get('class', '')})
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.active['rows'].append(self.row)
            self.row = None
        elif tag == 'table' and self.active is not None:
            self.tables.append(self.active)
            self.active = None


def decode(body):
    match = re.search(br'charset\s*=\s*["\']?([\w-]+)', body[:3000], re.I)
    encoding = match.group(1).decode('ascii') if match else 'utf-8'
    if encoding.lower() in ('shift_jis', 'shift-jis'):
        encoding = 'cp932'
    return body.decode(encoding, errors='strict')


def measurement(cell):
    raw = cell['raw']
    if re.fullmatch(r'-?\d+(?:\.\d+)?', raw):
        return {'value': float(raw), 'quality': 'normal', **cell}
    match = re.fullmatch(r'(-?\d+(?:\.\d+)?)\s*([)\]])', raw)
    if match:
        return {'value': float(match.group(1)),
                'quality': 'quasi-normal' if match.group(2) == ')' else 'insufficient', **cell}
    # No imputation: even '--' is not silently converted to zero.
    return {'value': None, 'quality': 'missing' if raw in ('', '--', '///', '×', '#') else 'unreviewed', **cell}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--verified-on', required=True)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', args.verified_on):
        parser.error('verified-on must be YYYY-MM-DD')
    RAW.mkdir(parents=True, exist_ok=True)
    sources, observations, normals = [], [], []
    manifest_path = RAW / 'collection-manifest.json'
    manifest = None
    if args.offline:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        if manifest['verifiedOn'] != args.verified_on:
            raise ValueError('Offline reproduction must preserve the original verification date')

    def fetch(source_id, url, period):
        path = RAW / f'{source_id}.html.gz'
        if args.offline:
            body = gzip.decompress(path.read_bytes())
            expected = next(item for item in manifest['sources'] if item['id'] == source_id)
            if hashlib.sha256(body).hexdigest() != expected['sha256'] or expected['url'] != url:
                raise ValueError(f'Archive hash/URL mismatch: {source_id}')
        else:
            req = Request(url, headers={'User-Agent': 'PACK-MY-BAG-source-review/1.0'})
            with urlopen(req, timeout=45) as response:
                body = response.read()
            path.write_bytes(gzip.compress(body, mtime=0))
            time.sleep(0.25)
        text = decode(body)
        sources.append({'id': source_id, 'organization': 'Japan Meteorological Agency (JMA)',
                        'url': url, 'lastVerified': args.verified_on, 'period': period,
                        'status': 'verified', 'snapshotPath': f'raw/jma/{path.name}',
                        'sha256': hashlib.sha256(body).hexdigest()})
        return text

    for city_id, (prec, station, japanese, _) in STATIONS.items():
        for year in range(2016, 2026):
            source_id = f'jma-{city_id}-{year}'
            url = f'https://www.data.jma.go.jp/stats/etrn/view/monthly_s1.php?prec_no={prec}&block_no={station}&year={year}&month=&day=&view='
            text = fetch(source_id, url, {'startYear': year, 'endYear': year})
            if japanese not in text or str(year) not in text:
                raise ValueError(f'Station/year mismatch: {source_id}')
            tables = Tables()
            tables.feed(text)
            table = next(t for t in tables.tables if t['attrs'].get('id') == 'tablefix1')
            header = ' '.join(c['raw'] for row in table['rows'][:3] for c in row)
            # Fail closed if JMA changes table layout or metric definitions.
            for expected in ['降水量', '気温', '日平均', '日最高', '日最低']:
                if expected not in header:
                    raise ValueError(f'Unexpected headers in {source_id}: {expected}')
            monthly = [row for row in table['rows'] if len(row) >= 10 and re.fullmatch(r'\d{1,2}', row[0]['raw'])]
            if [int(row[0]['raw']) for row in monthly] != list(range(1, 13)):
                raise ValueError(f'Expected exactly months 1..12: {source_id}')
            for row in monthly:
                observations.append({'cityId': city_id, 'stationId': station, 'year': year,
                                     'month': int(row[0]['raw']), 'sourceId': source_id,
                                     'metrics': {key: measurement(row[index]) for key, index in METRICS.items()}})
            print(f'{source_id}: 12 months', flush=True)

    url = 'https://www.data.jma.go.jp/stats/en/normal/normal.html'
    text = fetch('jma-normals-1991-2020', url, {'startYear': 1991, 'endYear': 2020})
    if '1991' not in text or '2020' not in text:
        raise ValueError('Normal period missing')
    tables = Tables()
    tables.feed(text)
    climate_tables = [t for t in tables.tables if any(row and row[0]['raw'] == 'Tokyo' for row in t['rows'])]
    # JMA publishes these tables in this exact order. Verify headings too.
    headings = ['Mean temperature', 'Daily Maximum temperature', 'Daily Minimum temperature', 'Precipitation']
    positions = [text.index(heading) for heading in headings]
    if positions != sorted(positions) or len(climate_tables) < 4:
        raise ValueError('Unexpected normals table order')
    for city_id, (_, station, _, english) in STATIONS.items():
        series = [next(row for row in table['rows'] if row and row[0]['raw'] == english) for table in climate_tables[:4]]
        for month in range(1, 13):
            values = [measurement(row[month]) for row in series]
            if any(value['quality'] != 'normal' for value in values):
                raise ValueError(f'Unexpected normal quality: {city_id}/{month}')
            normals.append({'cityId': city_id, 'stationId': station, 'month': month,
                            'sourceId': 'jma-normals-1991-2020',
                            'metrics': dict(zip(METRICS, values))})
    result = {'schemaVersion': 1, 'verifiedOn': args.verified_on, 'sources': sources,
              'observations': observations, 'normals': normals}
    prefix = '// Generated by scripts/collect_jma.py; edit the collector, not the data.\n'
    prefix += "import type { ClimateArchive } from './types';\nexport const climateArchive: ClimateArchive = "
    (DATA / 'climate.generated.ts').write_text(prefix + json.dumps(result, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    if not args.offline:
        manifest_path.write_text(json.dumps({'verifiedOn': args.verified_on, 'sources': sources}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Collected {len(observations)} observation rows, {len(normals)} normal rows, {len(sources)} sources')


if __name__ == '__main__':
    main()
