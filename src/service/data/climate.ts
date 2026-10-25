import { getAUClimateMonth } from './auClimate';
import { getStationClimateMonth } from './stationClimate';
import { getUSClimateMonth } from './usClimate';
import { climateArchive } from './climate.generated';
import { japanStations, seasonalFeatures } from './cities';
import { dayNumber } from '../trip/trip';
import { climateMetricKeys, type ClimateArchive, type ClimateMetric, type ClimateStatistic, type JapanCityId, type MonthlyObservation } from './types';

export const recentPeriod = { startYear: 2016, endYear: 2025 } as const;
export const normalPeriod = { startYear: 1991, endYear: 2020 } as const;
export const recentClimateLabel = '최근 10년 관측자료 기반 평균';
export const normalClimateLabel = '일본 기상청 공식 30년 평년값';
export const climateMethod = {
  id: 'pmb-same-calendar-month-unweighted-mean-v1',
  author: 'PACK MY BAG', kind: 'service-calculation',
  formula: '같은 도시·같은 관측소·같은 달의 2016–2025년 월별 관측값 10개 합계 / 10',
  temperatureDefinition: 'meanDailyMaximumC/meanDailyMinimumC는 각 월의 일최고/일최저 기온 평균이며 월중 극값이 아니다.',
  precipitationDefinition: '각 연도 월강수량 합계를 같은 달끼리 평균한 mm 값. 비가 올 확률·강수일수·여행 기간 예상 강수량이 아니다.',
  missingPolicy: '순수 숫자 정상값 10개가 모두 있을 때만 산출. 준정상·자료부족·결측·미확인 표시는 보간하거나 0으로 대체하지 않는다.',
  precision: '원본 소수값에서 산술평균 후 소수 둘째 자리로 반올림. 화면 표시 반올림은 별도.',
  weighting: '연도별 동일 가중치. 서로 다른 달·도시·기준기간은 혼합하지 않는다.',
  stationPolicy: 'JMA 관측소 ID를 유지하며 별도 이전·통계 단절 검토 상태를 반환. 자체 동질성 보정이나 기후변화 추정은 하지 않는다.',
} as const;

function isJapanCity(value: string): value is JapanCityId {
  return Object.prototype.hasOwnProperty.call(japanStations, value);
}

export function calculateRecentMetric(
  rows: readonly MonthlyObservation[], cityId: JapanCityId, month: number, metric: ClimateMetric,
): ClimateStatistic {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be 1..12');
  const used: { year: number; value: number; sourceId: string }[] = [];
  const excluded: ClimateStatistic['excluded'] = [];
  for (let year = recentPeriod.startYear; year <= recentPeriod.endYear; year++) {
    const matches = rows.filter(row => row.cityId === cityId && row.year === year && row.month === month);
    const row = matches[0];
    const measurement = row?.metrics[metric];
    if (matches.length !== 1 || row?.stationId !== japanStations[cityId].stationId || !measurement || measurement.quality !== 'normal' || measurement.value === null || !Number.isFinite(measurement.value)) {
      excluded.push({ year, reason: matches.length > 1 ? 'duplicate-observation' : row && row.stationId !== japanStations[cityId].stationId ? 'station-mismatch' : measurement?.quality ?? 'missing-observation', raw: measurement?.raw ?? null });
    } else used.push({ year, value: measurement.value, sourceId: row.sourceId });
  }
  const complete = used.length === 10;
  return {
    value: complete ? Number((used.reduce((sum, entry) => sum + entry.value, 0) / 10).toFixed(2)) : null,
    sampleSize: used.length, expectedSampleSize: 10,
    status: complete ? 'calculated' : 'needs-research', yearsUsed: used.map(entry => entry.year), excluded,
    sourceIds: used.map(entry => entry.sourceId),
  };
}

export function getClimateMonth(cityId: string, month: number, archive: ClimateArchive = climateArchive) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be 1..12');
  const stationClimate = getStationClimateMonth(cityId, month);
  if (stationClimate) return stationClimate;
  const auClimate = getAUClimateMonth(cityId, month);
  if (auClimate) return auClimate;
  const usClimate = getUSClimateMonth(cityId, month);
  if (usClimate) return usClimate;
  if (!isJapanCity(cityId)) return { provenance: undefined, status: 'needs-research' as const, cityId, month, recent: null, officialNormal: null, recommendedMetrics: null };
  const metrics = Object.fromEntries(climateMetricKeys.map(metric => [metric, calculateRecentMetric(archive.observations, cityId, month, metric)])) as Record<ClimateMetric, ClimateStatistic>;
  const normal = archive.normals.find(row => row.cityId === cityId && row.month === month);
  // Fallback is explicitly labelled PER METRIC; a normal is never renamed a 10-year mean.
  const recommendedMetrics = Object.fromEntries(climateMetricKeys.map(metric => {
    const recent = metrics[metric];
    const fallback = normal?.metrics[metric];
    return [metric, recent.value !== null
      ? { value: recent.value, basis: 'recent-10-year-observations', label: recentClimateLabel, period: recentPeriod, sourceIds: recent.sourceIds, lastVerified: archive.verifiedOn }
      : { value: fallback?.quality === 'normal' ? fallback.value : null, basis: fallback?.quality === 'normal' ? 'official-30-year-normal' : 'needs-research', label: normalClimateLabel, period: normalPeriod, sourceIds: normal ? [normal.sourceId] : [], lastVerified: archive.verifiedOn }];
  }));
  return {
    provenance: undefined, status: 'partially-verified' as const, cityId, month,
    stationId: japanStations[cityId].stationId,
    continuityReview: japanStations[cityId].continuityReview,
    warnings: ['과거 월별 기후 평균이며 실제 여행 날짜의 일기예보가 아닙니다.', '관측 환경·이전·통계 단절 이력의 전체 검토는 추가 조사 필요입니다.', ...japanStations[cityId].notes],
    seasonalFeatures: seasonalFeatures[cityId],
    recent: { label: recentClimateLabel, period: recentPeriod, methodId: climateMethod.id, metrics },
    officialNormal: normal ? { label: normalClimateLabel, period: normalPeriod, ...normal, lastVerified: archive.verifiedOn } : null,
    recommendedMetrics,
  };
}

// Inclusive trip segments, preserving year AND month across December/January.
// Do not scale monthly rainfall into a made-up forecast for these days.
export function getTripMonthSegments(departureDate: string, returnDate: string) {
  const startDay = dayNumber(departureDate);
  const endDay = dayNumber(returnDate);
  if (startDay === null || endDay === null || endDay < startDay) throw new RangeError('Valid ordered ISO dates are required');
  const segments: { year: number; month: number; daysCovered: number }[] = [];
  let cursor = startDay;
  while (cursor <= endDay) {
    const date = new Date(cursor * 86400000);
    const next = new Date(date);
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    const segmentEnd = Math.min(endDay, next.getTime() / 86400000 - 1);
    segments.push({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, daysCovered: segmentEnd - cursor + 1 });
    cursor = segmentEnd + 1;
  }
  return segments;
}

export function getTripClimate(cityId: string, departureDate: string, returnDate: string) {
  return getTripMonthSegments(departureDate, returnDate).map(segment => ({ ...segment, climate: getClimateMonth(cityId, segment.month) }));
}

export const monthlyClimate = Object.keys(japanStations).flatMap(cityId => Array.from({ length: 12 }, (_, index) => getClimateMonth(cityId, index + 1)));
