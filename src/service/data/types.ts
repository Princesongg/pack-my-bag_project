import type { destinations } from '../destination/destinations';

export type CountryId = typeof destinations[number]['id'];
export type CityId = typeof destinations[number]['cities'][number]['id'];
export type JapanCityId = Extract<typeof destinations[number], { id: 'JP' }>['cities'][number]['id'];
export type ResearchStatus = 'verified' | 'needs-research' | 'partially-verified';
export type StatisticalPeriod = { startYear: number; endYear: number };
export interface Source {
  id: string; organization: string; url: string; lastVerified: string | null;
  period: StatisticalPeriod | null; status: ResearchStatus;
  title?: string; snapshotPath?: string; sha256?: string; notes?: string;
}
export type Evidence<T> =
  | { status: 'verified'; value: T; sourceIds: string[]; lastVerified: string; notes?: string }
  | { status: 'needs-research'; value: null; sourceIds: string[]; lastVerified: null; notes: string };

export const climateMetricKeys = ['meanTemperatureC', 'meanDailyMaximumC', 'meanDailyMinimumC', 'precipitationMm'] as const;
export type ClimateMetric = typeof climateMetricKeys[number];
export interface Measurement {
  value: number | null;
  quality: 'normal' | 'quasi-normal' | 'insufficient' | 'missing' | 'unreviewed';
  raw: string; class: string;
}
export interface MonthlyObservation {
  cityId: JapanCityId; stationId: string; year: number; month: number; sourceId: string;
  metrics: Record<ClimateMetric, Measurement>;
}
export interface MonthlyNormal extends Omit<MonthlyObservation, 'year'> { }
export interface ClimateArchive {
  schemaVersion: number; verifiedOn: string; sources: Source[];
  observations: MonthlyObservation[]; normals: MonthlyNormal[];
}
export interface ClimateStatistic {
  value: number | null; sampleSize: number; expectedSampleSize: number;
  status: 'calculated' | 'needs-research'; yearsUsed: number[];
  excluded: { year: number; reason: string; raw: string | null }[];
  sourceIds: string[];
}

export function verified<T>(value: T, sourceIds: string[], notes?: string): Evidence<T> {
  return { status: 'verified', value, sourceIds, lastVerified: '2026-10-23', ...(notes ? { notes } : {}) };
}
export function pending<T>(notes: string, sourceIds: string[] = []): Evidence<T> {
  return { status: 'needs-research', value: null, sourceIds, lastVerified: null, notes };
}
