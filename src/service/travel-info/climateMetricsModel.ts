import type { getClimateMonth } from '../data/climate';

export const climateMetricLabels = [
  ['meanTemperatureC', '월평균 기온', '°C'],
  ['meanDailyMaximumC', '평균 최고기온', '°C'],
  ['meanDailyMinimumC', '평균 최저기온', '°C'],
  ['precipitationMm', '월평균 강수량', 'mm'],
] as const;

export function getVisibleClimateMetrics(climate: ReturnType<typeof getClimateMonth>) {
  return climateMetricLabels.flatMap(([key, label, unit]) => {
    const metric = climate.recommendedMetrics?.[key];
    return metric && metric.value !== null && Number.isFinite(metric.value) && metric.basis !== 'needs-research'
      ? [{ key, label, unit, metric }] : [];
  });
}
