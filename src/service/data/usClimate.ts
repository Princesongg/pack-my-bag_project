import { climateMetricKeys, pending, type Source } from './types';

export const usNormalPeriod = { startYear: 1991, endYear: 2020 } as const;
const verifiedOn = '2026-10-23';
export const usClimateSources: Source[] = [
  { id: 'nws-central-park-normal', organization: 'NWS', title: 'New York Central Park · 1991–2020 Climate Normals', url: 'https://www.weather.gov/media/okx/Climate/CentralPark/nycnormals.pdf', period: usNormalPeriod, status: 'verified', lastVerified: verifiedOn, snapshotPath: 'src/service/data/raw/us/new-york-central-park.pdf', sha256: '1244af3cb47e74d7dc43f5a459d9549e0dd8cecd62e6c4a0f39d0c19f7e62bc2', notes: 'PDF 1쪽 월별 평균·평균 최고·평균 최저 화씨 수치를 대조. 2026-01-01 갱신본.' },
  { id: 'noaa-lax-normal', organization: 'NOAA/NCEI', title: 'Los Angeles International Airport · USW00023174 · 1991–2020 Climate Normals', url: 'https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&endDate=9996-12-31&format=pdf&startDate=0001-01-01&stations=USW00023174', period: usNormalPeriod, status: 'verified', lastVerified: verifiedOn, snapshotPath: 'src/service/data/raw/us/los-angeles-usw00023174.pdf', sha256: '95e32c848ab6b7cba94cf966cf3c9abc942d5f0d96da66205363ce1acab7a152', notes: 'PDF 1쪽 Mean / Daily Max / Daily Min. 관측소는 LA 도심이 아닌 LAX 공항.' },
];

// Source PDF temperatures in °F: [monthly mean, mean daily maximum, mean daily minimum].
export const usNormalStations = {
  'new-york': { organization: 'NWS', stationName: 'New York Central Park', stationId: 'Central Park', sourceId: 'nws-central-park-normal', fahrenheit: [
    [33.7,39.5,27.9], [35.9,42.2,29.5], [42.8,49.9,35.8], [53.7,61.8,45.5],
    [63.2,71.4,55.0], [72.0,79.7,64.4], [77.5,84.9,70.1], [76.1,83.3,68.9],
    [69.2,76.2,62.3], [57.9,64.5,51.4], [48.0,54.0,42.0], [39.1,44.3,33.8],
  ] },
  'los-angeles': { organization: 'NOAA/NCEI', stationName: 'Los Angeles International Airport', stationId: 'USW00023174', sourceId: 'noaa-lax-normal', fahrenheit: [
    [57.9,66.3,49.4], [57.9,65.6,50.1], [59.1,66.1,52.2], [61.1,68.1,54.2],
    [63.6,69.5,57.6], [66.4,72.0,60.9], [69.6,75.1,64.0], [70.7,76.7,64.8],
    [70.1,76.5,63.7], [67.1,74.4,59.8], [62.3,70.9,53.7], [57.6,66.1,49.1],
  ] },
} as const;

export function getUSClimateMonth(cityId: string, month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be 1..12');
  if (cityId !== 'new-york' && cityId !== 'los-angeles') return null;
  const station = usNormalStations[cityId];
  const temperatures = station.fahrenheit[month - 1].map(value => Number(((value - 32) * 5 / 9).toFixed(1)));
  const recommendedMetrics = Object.fromEntries(climateMetricKeys.map((key, index) => [key, {
    value: index < 3 ? temperatures[index] : null,
    basis: index < 3 ? 'official-30-year-normal' as const : 'needs-research' as const,
    label: '1991–2020 기후 평년값', period: usNormalPeriod,
    sourceIds: index < 3 ? [station.sourceId] : [], lastVerified: verifiedOn,
  }]));
  return {
    status: 'partially-verified' as const, cityId, month, stationId: station.stationId,
    recent: null, officialNormal: null,
    recommendedMetrics: recommendedMetrics as Record<typeof climateMetricKeys[number], typeof recommendedMetrics[string]>,
    provenance: { organization: station.organization, stationName: station.stationName, period: usNormalPeriod, label: '1991\u20132020 \uae30\ud6c4 \ud3c9\ub144\uac12', season: undefined, lastVerified: verifiedOn, method: '공식 원본의 화씨 온도를 (°F − 32) × 5/9로 섭씨 환산하고 소수 첫째 자리까지 반올림했습니다.' },
    seasonalFeatures: pending<string[]>('강설·습도·바람의 월별 특징은 이번 데이터에 포함하지 않습니다.'),
    warnings: ['1991–2020년 공식 평년값이며 실제 여행일의 일기예보가 아닙니다.', '관측 지점은 도시 전체의 미기후를 대표하지 않습니다. 강수량·강설·습도·바람은 이번 연결 범위에 포함하지 않습니다.'],
  };
}
