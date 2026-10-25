import { pending, verified, type Evidence } from './types';

interface CountryElectricity {
  voltageV: Evidence<number[]>; frequencyHz: Evidence<number[]>; regionalFrequency: Evidence<string>;
  plugTypeIds: Evidence<readonly string[]>;
  adapter: { kind: string; required: string; basedOn: string[]; text: string };
  deviceCaution: { kind: string; basedOn: string[]; text: string };
  otherPlugTypes: Evidence<string[]>;
  brief?: { includeFrequency: boolean; note: string };
  travelerAdvice?: readonly string[];
  additionalVoltage?: Evidence<string>;
}
const vnSources = ['vn-tourism-electricity', 'vn-icao-electricity', 'vn-panasonic-electricity'];
const thSources = ['th-tat-electricity', 'th-tat-plugs', 'th-qsncc-electricity', 'th-am2026-electricity'];
const thVerified = <T,>(value: T): Evidence<T> => ({ status: 'verified', value, sourceIds: thSources, lastVerified: '2026-10-25' });
const vnVerified = <T,>(value: T): Evidence<T> => ({ status: 'verified', value, sourceIds: vnSources, lastVerified: '2026-10-25' });
export const vietnamAdapterItem = { id: 'electronic:travel-adapter', name: '여행용 변환 어댑터(돼지코)',
  reason: '베트남 숙소는 콘센트 모양이 다를 수 있어요. 한국 플러그가 맞는지 확인해 보세요.' } as const;
export function isTravelAdapterItem(item: { categoryId: string; name: string }) {
  return item.categoryId === 'electronics' && ['여행용변환어댑터(돼지코)', '여행용변환어댑터', '변환어댑터(돼지코)', '변환어댑터', '돼지코'].includes(item.name.replace(/\s+/g, ''));
}
const twSources = ['taiwan-tourism-electricity', 'taoyuan-tourism-electricity'];
function taiwanVerified<T>(value: T, sourceIds = twSources): Evidence<T> {
  return { status: 'verified', value, sourceIds, lastVerified: '2026-10-25' };
}

export const plugTypes = {
  O: { id: 'plug-type-o', label: 'Type O', geometry: 'two-round-power-pins-with-round-earth-pin-triangle', evidence: { ...thVerified('둥근 전원 핀 2개와 둥근 접지 핀 1개가 삼각형으로 배치'), sourceIds: ['th-am2026-electricity', 'th-qsncc-electricity'] } },
  F: { id: 'plug-type-f', label: 'Type F', geometry: 'two-round-pins-with-earth-contacts', evidence: thVerified('둥근 2핀과 접지 접점') },
  C: { id: 'plug-type-c', label: 'Type C', geometry: 'two-round-pins', evidence: vnVerified('둥근 2핀') },
  A: {
    id: 'plug-type-a', label: 'Type A', geometry: 'two-parallel-flat-pins',
    svgAssetPath: 'src/service/data/assets/plugs/type-a.svg',
    assetStatus: 'schematic-not-to-scale',
    evidence: verified('평행한 두 개의 납작한 핀', ['jnto-plan', 'jnto-faq']),
  },
  B: {
    id: 'plug-type-b', label: 'Type B', geometry: 'two-flat-pins-with-ground-pin',
    evidence: taiwanVerified('북미형 3핀', ['taoyuan-tourism-electricity']),
  },
} as const;

export const electricity = {
  TH: {
    voltageV: thVerified([220]), frequencyHz: thVerified([50]),
    regionalFrequency: thVerified('태국은 한국과 같은 220V이지만 주파수는 50Hz로 달라요.'),
    plugTypeIds: { ...thVerified(['C', 'O']), sourceIds: ['th-qsncc-electricity', 'th-am2026-electricity'] }, otherPlugTypes: { ...thVerified(['A', 'B', 'F']), sourceIds: ['th-am2026-electricity', 'th-tat-plugs'] },
    adapter: { kind: 'service-guidance', required: 'depends-on-device-plug', basedOn: thSources, text: '숙소 콘센트와 한국 플러그가 맞는지 확인한 뒤 어댑터를 준비하세요.' },
    deviceCaution: { kind: 'service-guidance', basedOn: thSources, text: '제품의 전압·주파수·접지와 어댑터 허용 전력을 확인하세요. 모양이 맞아도 사용 가능하다고 단정할 수 없어요.' },
    brief: { includeFrequency: true, note: '숙소 플러그 모양을 확인한 뒤 준비하세요.' },
  },
  VN: {
    voltageV: vnVerified([220]), frequencyHz: vnVerified([50]),
    regionalFrequency: vnVerified('베트남은 한국과 같은 220V를 사용하지만, 주파수는 50Hz로 달라요.'),
    plugTypeIds: vnVerified(['C', 'A']), otherPlugTypes: vnVerified(['D', 'F']),
    adapter: { kind: 'service-guidance', required: 'depends-on-device-plug', basedOn: vnSources, text: vietnamAdapterItem.reason },
    deviceCaution: { kind: 'service-guidance', basedOn: vnSources, text: '변환 어댑터는 플러그 모양만 바꿀 뿐 전압·주파수를 바꾸지 않습니다. 접지가 필요한 기기는 접지가 유지되는 연결을 사용하고, 일반 무접지 어댑터가 항상 적합하다고 생각하지 마세요.' },
    brief: { includeFrequency: true, note: '숙소에 따라 콘센트 모양이 달라요.' },

  },
  JP: {
    voltageV: verified([100], ['jnto-electricity']),
    frequencyHz: verified([50, 60], ['jnto-electricity']),
    regionalFrequency: verified('일본 동부 50Hz, 서부 60Hz. 주파수와 기기 대응 여부도 확인한다.', ['jnto-electricity']),
    plugTypeIds: verified(['A' as const], ['jnto-faq']),
    // Device compatibility is conditional, never a country-wide safety verdict.
    adapter: { kind: 'service-guidance', required: 'depends-on-device-plug', basedOn: ['jnto-faq', 'jnto-electricity'], text: '가져갈 기기의 플러그 모양이 현지 콘센트와 맞는지 확인하고, 맞지 않으면 형태 변환 어댑터를 준비한다.' },
    deviceCaution: { kind: 'service-guidance', basedOn: ['jnto-electricity'], text: '플러그 어댑터는 모양을 바꿀 뿐 전압을 바꾸지 않는다. 기기의 Input 전압·주파수 및 제조사 안내를 확인한다. 220V 전용 기기를 100V에서 사용할 수 있다고 단정하지 않는다. 변압기의 필요성과 용량은 기기별로 확인한다.' },
    otherPlugTypes: pending<string[]>('공식 확인한 Type A 이외의 유형은 추가 조사 전 등록하지 않는다.'),
  },
  TW: {
    voltageV: taiwanVerified([110]),
    frequencyHz: taiwanVerified([60]),
    regionalFrequency: taiwanVerified('대만의 일반적인 전기 규격은 110V · 60Hz입니다.'),
    plugTypeIds: taiwanVerified(['A', 'B'], ['taoyuan-tourism-electricity']),
    adapter: { kind: 'service-guidance', required: 'depends-on-device-plug', basedOn: twSources,
      text: '대만은 한국과 콘센트 모양이 다르므로 변환 어댑터를 준비하는 것이 좋습니다.' },
    deviceCaution: { kind: 'service-guidance', basedOn: twSources,
      text: '변환 어댑터는 플러그 모양만 바꾸며 전압을 바꾸지 않습니다. 제품의 INPUT 전압·주파수와 제조사 안내를 확인하세요.' },
    travelerAdvice: [
      '휴대전화·노트북 등의 충전기가 INPUT 100–240V를 지원하고 60Hz에 대응한다면 일반적으로 변환 어댑터만으로 사용할 수 있습니다.',
      '220V 전용 전자제품은 대만의 일반적인 110V 콘센트에서 변환 어댑터만으로 사용할 수 없으며, 제품 사양에 맞는 변압기가 필요할 수 있습니다.',
    ],
    additionalVoltage: taiwanVerified('일부 건물에는 220V 콘센트도 있으므로 실제 콘센트의 전압 표시를 확인하세요.', ['taoyuan-tourism-electricity']),
    otherPlugTypes: pending<string[]>('Type A / B 이외의 유형은 이번 공식 확인 범위에 포함하지 않습니다.'),
    brief: { includeFrequency: true, note: 'Type A / B · 변환 어댑터 준비' },
  },
} satisfies Record<string, CountryElectricity>;

// Canonical country IDs are shared with trip/destination selection. City data cannot override these values.
export function getCountryElectricity(countryId: string): CountryElectricity | null {
  return countryId === 'JP' || countryId === 'TW' || countryId === 'VN' || countryId === 'TH' ? electricity[countryId] : null;
}

export function getElectricityBrief(countryId: string) {
  const data = getCountryElectricity(countryId);
  if (!data) return null;
  return {
    main: data.brief?.includeFrequency
      ? `${data.voltageV.value?.join(' / ')}V · ${data.frequencyHz.value?.join(' / ')}Hz`
      : `${data.voltageV.value?.join(' / ')}V · ${data.plugTypeIds.value?.map(id => plugTypes[id as keyof typeof plugTypes]?.label ?? id).join(' / ')}`,
    note: data.brief?.note ?? '플러그와 기기 Input 전압 확인',
  };
}
