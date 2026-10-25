import { getClimateMonth, getTripMonthSegments } from '../data/climate';
import { destinations } from '../destination/destinations';
import { getClothingPreview, type MonthlyClimate } from '../travel-info/guideModel';
import type { Trip } from '../trip/trip';

// Keep the existing per-month trip policy. Never resolve a city by its display name.
export function getWeatherSegments(trip: Trip) {
  const validCity = destinations.find(country => country.id === trip.countryId)?.cities.some(city => city.id === trip.cityId);
  return getTripMonthSegments(trip.departureDate, trip.returnDate).map(segment => ({
    ...segment,
    climate: validCity ? getClimateMonth(trip.cityId, segment.month) : missingClimate(trip.cityId, segment.month),
  }));
}

function missingClimate(cityId: string, month: number): MonthlyClimate {
  return { provenance: undefined, status: 'needs-research', cityId, month, recent: null, officialNormal: null, recommendedMetrics: null };
}

type Evidence = { value: number | null; basis: string; period: { startYear: number; endYear: number }; sourceIds: readonly string[]; comparisonGroup?: string; periodReviewRequired?: boolean };
const basis = (metric: Evidence) => metric.basis === 'derived-high-low-midpoint' ? 'all-years-of-record' : metric.basis === 'derived-normal-high-low-midpoint' ? 'official-30-year-normal' : metric.basis;

export function getWeatherBrief(climate: MonthlyClimate, purpose: string) {
  const metrics = climate.recommendedMetrics;
  const usable = (metric: Evidence | undefined) => metric && metric.value !== null && Number.isFinite(metric.value) && metric.basis !== 'needs-research' && metric.sourceIds.length > 0;
  const mean = metrics?.meanTemperatureC;
  const high = metrics?.meanDailyMaximumC;
  const low = metrics?.meanDailyMinimumC;
  const evidence: (Evidence | undefined)[] = [mean, high, low];
  const valid = evidence.every(usable);
  const comparable = valid && evidence.every(metric => metric && !metric.periodReviewRequired && basis(metric) === basis(mean!) && metric.period.startYear === mean!.period.startYear && metric.period.endYear === mean!.period.endYear && metric.comparisonGroup === (mean as Evidence).comparisonGroup);
  const range = comparable && low!.value! < high!.value! && mean!.value! >= low!.value! && mean!.value! <= high!.value!
    ? { low: low!.value!, high: high!.value!, meanPosition: (mean!.value! - low!.value!) / (high!.value! - low!.value!) * 100 } : null;
  return {
    mean: usable(mean) ? mean!.value : null,
    calculatedMean: Boolean(mean?.basis.startsWith('derived-')),
    range,
    clothing: getClothingPreview(climate, purpose).filter((item, index, items) => items.findIndex(other => other.checklistItemId === item.checklistItemId) === index).slice(0, 3),
  };
}
