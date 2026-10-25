// Offline only: derive the static dataset from saved, publicly available CWA tables.
// Never fetch data when the app runs. Recollection/review is a separate manual step.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = 'src/service/data/raw/tw/';
const metrics = {
  meanTemperatureC: 'tx', meanDailyMaximumC: 'meantxmax', meanDailyMinimumC: 'meantxmin',
  precipitationMm: 'precp', relativeHumidityPct: 'rh', precipitationDays: 'precpday',
};
const titles = { tx: '월평균 기온', meantxmax: '평균 일최고기온', meantxmin: '평균 일최저기온', precp: '월강수량 평균', rh: '월평균 상대습도', precpday: '월평균 강수일수 (≥0.1mm)' };
const stations = {
  taipei: { countryId: 'TW', cityId: 'taipei', stationId: '466920', stationName: '臺北 (Taipei)', rowName: '臺北',
    stationNotes: 'CWA 관측소 이력·통계 설명에는 타이베이의 1992.02–1997.08 관측소 466921 연결이 기록되어 있습니다. 게시된 도시별 평년값을 그대로 사용하며 자체 보정·재계산하지 않았습니다.' },
  kaohsiung: { countryId: 'TW', cityId: 'kaohsiung', stationId: '467440', stationName: '高雄 (Kaohsiung · 구 관측소)', rowName: '高雄',
    stationNotes: 'CWA 월평년값 페이지는 가오슝 자료가 구 관측소 467440 기준임을 명시합니다. 2022년 이전 이후 관측값이나 신 관측소 467441 자료와 혼합하지 않았습니다.' },
};
const manifest = Object.values(metrics).map(code => {
  const snapshotPath = `${root}Taiwan_${code}.html`;
  return { id: `cwa-normal-${code}`, organization: '대만 중앙기상서 CWA',
    title: `1991–2020 월별 기후 평년값 · ${titles[code]}`,
    url: `https://www.cwa.gov.tw/V8/C/C/Statistics/MonthlyMean/MOD/Taiwan_${code}.html`,
    period: { startYear: 1991, endYear: 2020 }, status: 'verified', lastVerified: '2026-10-25',
    snapshotPath, sha256: createHash('sha256').update(readFileSync(snapshotPath)).digest('hex') };
});
for(const [id, title, url, file] of [
  ['cwa-normal-guide', '월평년값 안내 · 가오슝 구 관측소 기준', 'https://www.cwa.gov.tw/V8/C/C/Statistics/monthlymean.html', 'monthlymean.html'],
  ['cwa-normal-method', '통계자료 산출 과정 · 평균과 절대 극값 구분', 'https://climate.cwa.gov.tw/data/pdf_2.pdf', 'statistical-method.pdf'],
  ['cwa-station-history', '관측소 변천 이력', 'https://climate.cwa.gov.tw/data/pdf_1.pdf', 'station-history.pdf'],
]) {
  const snapshotPath = root + file;
  manifest.push({ id, organization: '대만 중앙기상서 CWA', title, url, period: null, status: 'verified', lastVerified: '2026-10-25', snapshotPath, sha256: createHash('sha256').update(readFileSync(snapshotPath)).digest('hex') });
}
for (const station of Object.values(stations)) {
  station.referencePeriod = { startYear: 1991, endYear: 2020 };
  station.verificationStatus = 'verified';
  station.monthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1 }));
  for (const [metric, code] of Object.entries(metrics)) {
    const html = readFileSync(`${root}Taiwan_${code}.html`, 'utf8');
    const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].filter(match => match[1].includes(`>${station.rowName}</th>`));
    if (rows.length !== 1) throw Error(`Ambiguous row: ${station.rowName}/${code}`);
    const row = rows[0][1];
    if (!/headers="period">1991~2020<\/td>/.test(row)) throw Error('Unexpected reference period');
    for (let index = 0; index < 12; index++) {
      const raw = row.match(new RegExp(`headers="m${index}">([^<]+)</td>`))?.[1];
      if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) throw Error(`Missing/flagged value: ${station.rowName}/${code}/${index + 1}`);
      station.monthly[index][metric] = Number(raw);
    }
  }
  delete station.rowName;
}
writeFileSync('src/service/data/twClimate.generated.ts', `// Generated offline by scripts/build_tw_climate.mjs from preserved CWA HTML.\nexport const twStations = ${JSON.stringify(stations, null, 2)} as const;\n\nexport const twClimateSources = ${JSON.stringify(manifest, null, 2)} as const;\n`);
writeFileSync(`${root}collection-manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
