import { climateMetricKeys, pending, type StatisticalPeriod } from './types';
import { twStations } from './twClimate.generated';
import { vnStations } from './vnClimate.generated';
import { thStations } from './thClimate.generated';

// Shared adapter for static official station normals. Country data files contain no lookup/UI logic.
interface StationNormal {
  countryId: string; cityId: string; stationId: string; stationName: string;
  referencePeriod: StatisticalPeriod; verificationStatus: 'verified'; stationNotes: string;
  organization?: string; method?: string; meanBasis?: 'derived-normal-high-low-midpoint';
  displayNote?: string;
  metricSourceIds?: Partial<Record<typeof climateMetricKeys[number], readonly string[]>>;
  monthly: readonly { month: number; meanTemperatureC: number; meanDailyMaximumC: number | null;
    meanDailyMinimumC: number | null; precipitationMm: number; relativeHumidityPct?: number; precipitationDays?: number }[];
}
const stationNormals: Readonly<Record<string, StationNormal>> = { ...twStations, ...vnStations, ...thStations };

export function getStationClimateMonth(cityId: string, month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be 1..12');
  const station = Object.prototype.hasOwnProperty.call(stationNormals, cityId) ? stationNormals[cityId] : undefined;
  const row = station?.monthly.find(row => row.month === month);
  if (!station || !row) return null;
  const sourceCodes = { meanTemperatureC: 'tx', meanDailyMaximumC: 'meantxmax', meanDailyMinimumC: 'meantxmin',
    precipitationMm: 'precp', relativeHumidityPct: 'rh', precipitationDays: 'precpday' } as const;
  const mixedProviders = station.countryId === 'TH' || cityId === 'danang';
  const periodReview = cityId === 'hanoi' || cityId === 'danang';
  const reviewNote = [station.displayNote,
    mixedProviders ? '평균기온·강수량은 JMA, 최고·최저는 별도 기관 자료예요. 같은 관측 기록으로 확인되지 않아 항목별로 참고해 주세요.' : '',
    periodReview ? 'WMO 자료의 게시 통계기간과 제공 이력은 추가 확인 중이에요. 기간이 완전히 검증된 단일 통계로 해석하지 마세요.' : '',
  ].filter(Boolean).join(' ');
  const metricEvidence = (key: keyof typeof sourceCodes) => {
    const primary = station.metricSourceIds?.[key as typeof climateMetricKeys[number]]?.[0];
    const wmo = primary?.startsWith('vn-wmo-') || primary === 'vn-kma-hanoi';
    const provider = wmo ? 'WMO' : primary?.startsWith('th-tmd-') ? 'TMD' : station.countryId === 'TW' ? 'CWA' : 'JMA';
    const reference = cityId === 'danang' && wmo ? '도시 지점 656' : cityId === 'hanoi' ? '도시 지점 308' : station.stationId;
    return {
      comparisonGroup: `${provider}/${reference}/${station.referencePeriod.startYear}-${station.referencePeriod.endYear}`,
      periodReviewRequired: Boolean(wmo && periodReview),
      evidenceNote: mixedProviders ? `${provider} · ${reference} · 항목별 별도 자료` : undefined,
    };
  };
  const metric = (key: keyof typeof sourceCodes) => ({ value: row[key] ?? null, basis: row[key] == null ? 'needs-research' : key === 'meanTemperatureC' && station.meanBasis ? station.meanBasis : 'official-30-year-normal',
    period: station.referencePeriod, label: row[key] == null ? '공식 정보 확인 필요' : key === 'meanTemperatureC' && station.meanBasis ? '1991–2020 최고·최저 평균 계산 참고값' : '1991–2020 공식 30년 평년값',
    sourceIds: station.metricSourceIds ? [...(station.metricSourceIds[key as typeof climateMetricKeys[number]] ?? [])] : [`cwa-normal-${sourceCodes[key]}`, 'cwa-normal-guide', 'cwa-normal-method', 'cwa-station-history'], lastVerified: '2026-10-25', ...metricEvidence(key) });
  return {
    status: 'partially-verified' as const, countryId: station.countryId, cityId, month, stationId: station.stationId,
    recent: null, officialNormal: null,
    recommendedMetrics: Object.fromEntries(climateMetricKeys.map(key => [key, metric(key)])) as Record<typeof climateMetricKeys[number], ReturnType<typeof metric>>,
    additionalMetrics: { relativeHumidityPct: metric('relativeHumidityPct'), precipitationDays: metric('precipitationDays') },
    provenance: { organization: station.organization ?? '대만 중앙기상서 CWA', stationName: station.stationName, period: station.referencePeriod,
      displayNote: [station.displayNote, mixedProviders ? '항목별 기관·관측 기준 다름' : '', periodReview ? 'WMO 통계기간 이력 확인 중' : ''].filter(Boolean).join(' · ') || undefined,
      reviewNote: reviewNote || undefined,
      label: periodReview ? '게시 통계기간 1991–2020 · WMO 기간 이력 추가 확인' : mixedProviders ? '1991–2020 · 항목별 기관 자료 (동질성 추가 확인)' : '1991–2020 공식 30년 평년값', lastVerified: '2026-10-25', season: undefined,
      method: station.method ? `${station.method} ${station.stationNotes}` : `공식 월평균 기온을 직접 사용합니다. 평균 최고·최저는 일최고·일최저 기온의 월평균에 대한 평년값이며 관측기간 절대 극값이 아닙니다. 강수일수는 일강수량 0.1mm 이상인 날의 월별 평균 일수입니다. 관측소 ${station.stationId}. ${station.stationNotes}` },
    seasonalFeatures: pending<string[]>('월평년값 외 정성적 계절·태풍·자외선 통계는 추가하지 않았습니다.'),
    warnings: [station.stationNotes, '공식 게시 평년값을 그대로 사용하며 연도별 결측을 임의 보완하거나 다른 관측소 수치를 대입하지 않았습니다. 항목별 유효 연수는 이 표에서 제공하지 않습니다.', '1991–2020 월별 기후 평년값이며 실제 여행일 예보나 도시 전체의 미기후를 뜻하지 않습니다.'],
  };
}
