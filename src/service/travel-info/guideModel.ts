import { clothingItems, clothingRules, clothingPolicy } from '../data/clothing';
import type { getClimateMonth } from '../data/climate';

export type MonthlyClimate = ReturnType<typeof getClimateMonth>;

// Preview the existing draft rules; never enable them or generate a checklist.
export function getClothingPreview(climate: MonthlyClimate, travelPurpose: string) {
  if (!climate.recommendedMetrics) return [];
  const metrics = climate.recommendedMetrics;
  const temperatureMetrics = [metrics.meanTemperatureC, metrics.meanDailyMaximumC, metrics.meanDailyMinimumC];
  if (temperatureMetrics.some(metric => metric.value === null || !Number.isFinite(metric.value))) return [];
  // Do not combine a 10-year high with a 30-year low to infer clothing or range.
  const basis = (metric: typeof metrics.meanTemperatureC) => `${metric.basis === 'derived-high-low-midpoint' ? 'all-years-of-record' : metric.basis}/${metric.period.startYear}/${metric.period.endYear}`;
  const bases = new Set(temperatureMetrics.map(basis));
  if (bases.size !== 1) return [];
  const values: Record<string, number | null> = Object.fromEntries(Object.entries(metrics).map(([key, metric]) => [key, metric.value]));
  // Missing rainfall must not suppress temperature-only rules or become a fabricated zero.
  const independentRecordRain = metrics.precipitationMm.basis === 'all-years-of-record' && metrics.meanDailyMaximumC.basis === 'all-years-of-record';
  if ((!independentRecordRain && basis(metrics.precipitationMm) !== basis(metrics.meanTemperatureC)) || !Number.isFinite(metrics.precipitationMm.value)) values.precipitationMm = null;
  const high = metrics.meanDailyMaximumC.value;
  const low = metrics.meanDailyMinimumC.value;
  values.dailyTemperatureRangeC = high !== null && low !== null ? high - low : null;
  return clothingRules.filter(rule => {
    if (rule.purposeIds && !rule.purposeIds.includes(travelPurpose)) return false;
    return rule.allClimateConditions.every(condition => {
      const value = values[condition.metric];
      if (value === null || value === undefined) return false;
      return condition.comparison === 'gte' ? value >= condition.value : condition.comparison === 'lte' ? value <= condition.value : value < condition.value;
    });
  }).flatMap(rule => {
    const item = clothingItems.find(item => item.id === rule.itemId);
    return item ? [{ ...item, ruleId: rule.id, reason: rule.reason, priority: rule.priority,
      reviewNotes: rule.seasonalReview, status: 'review-required' as const,
      author: clothingPolicy.author, kind: clothingPolicy.kind }] : [];
  });
}

export function formatClimateValue(value: number | null, unit: '°C' | 'mm') {
  return value === null || !Number.isFinite(value) ? '공식 정보 확인 필요' : `${value.toFixed(1)}${unit}`;
}

export function formatClimateBasis(metric: { basis: string; period: { startYear: number; endYear: number } }) {
  if (metric.basis === 'derived-high-low-midpoint') return '전체 가용 관측기간 · 계산 참고값';
  if (metric.basis === 'all-years-of-record') return `전체 가용 관측기간 · ${metric.period.startYear}–${metric.period.endYear}`;
  return `${metric.period.startYear}–${metric.period.endYear} · ${metric.basis === 'recent-10-year-observations' ? '관측 10년 평균' : '공식 30년 평년값'}`;
}

// Describe available statistics, never infer snowfall, humidity, wind or a daily forecast.
export function getWeatherPoints(climate: MonthlyClimate, travelPurpose: string) {
  const metrics = climate.recommendedMetrics;
  if (!metrics) return null;
  const usable = (metric: typeof metrics.meanTemperatureC) => metric.basis !== 'needs-research' && metric.value !== null && Number.isFinite(metric.value);
  const observations: string[] = [];
  const suggestions: string[] = [];
  const mean = metrics.meanTemperatureC;
  const high = metrics.meanDailyMaximumC;
  const low = metrics.meanDailyMinimumC;
  const rain = metrics.precipitationMm;
  if (usable(mean)) observations.push(mean.basis === 'derived-high-low-midpoint' ? `평균 최고·최저로 계산한 참고 기온은 ${formatClimateValue(mean.value, '°C')}입니다. BOM의 직접 월평균 기온 통계가 아닙니다.` : `이달의 월평균 기온은 ${formatClimateValue(mean.value, '°C')}입니다.`);
  const comparable = high.basis === low.basis && high.period.startYear === low.period.startYear && high.period.endYear === low.period.endYear;
  if (usable(high) && usable(low) && comparable && high.value! >= low.value!) {
    observations.push(`평균 최고 ${formatClimateValue(high.value, '°C')}, 평균 최저 ${formatClimateValue(low.value, '°C')}로 두 평균의 차이는 ${(high.value! - low.value!).toFixed(1)}°C입니다. 실제 여행일의 일교차 예측은 아닙니다.`);
  }
  if (usable(rain) && rain.value! >= 0) {
    observations.push(`월강수량 평균은 ${formatClimateValue(rain.value, 'mm')}입니다. 여행 중 비가 올 확률이나 강수량을 뜻하지 않습니다.`);
    if (rain.value! > 0) suggestions.push('출발 전 강수 예보를 확인해 우산·우비가 필요한지 살펴보세요.');
  }
  if (!observations.length) return null;
  const clothing = getClothingPreview(climate, travelPurpose).filter(item => !['rain-protection', 'walking-shoes', 'shirt'].includes(item.id));
  if (clothing.length) suggestions.unshift(`기온을 고려해 ${clothing.map(item => item.name).join('·')} 등을 검토해 보세요.${clothing.some(item => item.id === 'cardigan') ? ' 벗고 입기 쉬운 겹옷으로 기온 차이에 대비하세요.' : ''}`);
  return { observations, suggestions };
}
