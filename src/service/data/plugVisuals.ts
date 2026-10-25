import { getCountryElectricity } from './electricity';
import { getInternationalProfile } from './international';

export type PlugVisualKind = 'A' | 'B' | 'C' | 'F' | 'O' | 'I2' | 'I3';
export const plugVisuals: Record<PlugVisualKind, { label: string; shortLabel: string; description: string; grounded: boolean }> = {
  O: { label: 'TYPE O', shortLabel: '둥근 3핀·접지', description: '둥근 전원 핀 2개 + 둥근 접지 핀 1개', grounded: true },
  F: { label: 'TYPE F', shortLabel: '둥근 2핀·접지', description: '둥근 2핀 + 접지 접점', grounded: true },
  C: { label: 'TYPE C', shortLabel: '둥근 2핀', description: '둥근 2핀', grounded: false },
  A: { label: 'TYPE A', shortLabel: '납작한 2핀', description: '평행한 납작한 핀 2개', grounded: false },
  B: { label: 'TYPE B', shortLabel: '접지 있는 3핀', description: '평행한 납작한 핀 2개 + 접지 핀', grounded: true },
  I2: { label: 'TYPE I · 2핀', shortLabel: 'V자형 2핀', description: '역 V자 형태의 납작한 핀 2개', grounded: false },
  I3: { label: 'TYPE I · 3핀', shortLabel: 'V자형 3핀', description: '역 V자 납작한 핀 2개 + 중앙 접지 핀', grounded: true },
};
export function getCountryPlugVisuals(countryId: string): PlugVisualKind[] {
  if (countryId === 'TH') return ['C', 'O'];
  if (countryId === 'VN') return ['C', 'A'];
  if (countryId === 'US' || countryId === 'TW') return ['A', 'B'];
  if (countryId === 'AU') return ['I2', 'I3'];
  if (countryId === 'JP') return ['A'];
  return [];
}

// Sources belong to country facts, never to the reusable shape drawing or a default country.
export function getElectricitySourceIds(countryId: string) {
  const data = getCountryElectricity(countryId);
  if (data) return [...new Set([...data.voltageV.sourceIds, ...data.frequencyHz.sourceIds, ...data.plugTypeIds.sourceIds,
    ...data.adapter.basedOn, ...data.deviceCaution.basedOn])];
  return [...(getInternationalProfile(countryId)?.electricity.sourceIds ?? [])];
}
