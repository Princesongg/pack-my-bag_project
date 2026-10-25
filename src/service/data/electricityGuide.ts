import { getCountryElectricity, vietnamAdapterItem } from './electricity';
import { getInternationalProfile } from './international';
import { getElectricitySourceIds, getCountryPlugVisuals } from './plugVisuals';
import { getSource } from './sources';

export type PreparationStatus = '필수' | '챙기기' | '준비 권장' | '확인 후 결정';
export interface PreparationItem { id?: string; name: string; status: PreparationStatus; reason: string; notes?: string[] }
export const vietnamUsageCopy = {
  title: '한국에서 쓰던 전자제품, 가져가도 될까요?',
  lead: '한국에서 사용하던 일부 충전기는 베트남에서도 그대로 사용할 수 있어요!',
  explanation: '다만 숙소마다 콘센트 모양이 달라 플러그가 맞지 않을 수 있어요. 충전기 입력 사양을 확인하고, 필요할 때 사용할 여행용 변환 어댑터를 준비해 주세요.',
  compatibility: '충전기에 INPUT 100–240V · 50/60Hz라고 적혀 있다면 일반적으로 베트남에서도 사용할 수 있어요. 표시가 없거나 지원 여부가 불명확하면 제조사 안내를 확인하세요.',
  dryerTitle: '드라이어·고데기는 사용 전 꼭 확인하세요!',
  dryerSummary: '베트남은 한국과 전압은 같지만 주파수가 달라요. 가져간다면 50Hz 지원 여부와 제품의 소비전력을 확인해 주세요.',
  dryerPower: '콘센트나 변환 어댑터의 허용 전력을 초과하지 마세요. 규격에 맞지 않는 제품은 과열, 차단기 작동 또는 기기 손상으로 이어질 수 있어요.',
  dryerCheck: '220V·60Hz 전용이거나 50Hz 호환 여부가 불명확하면 제조사 안내를 확인하세요. 숙소에 드라이어가 제공되면 객실 비품을 이용하는 것도 방법이에요.',
} as const;
export const thailandUsageCopy = {
  title: '한국에서 쓰던 전자제품, 태국에서도 사용할 수 있을까요?',
  lead: '한국에서 사용하던 충전기도 태국에서 사용할 수 있는 경우가 많아요!',
  explanation: '태국은 한국과 같은 220V를 사용하지만, 주파수와 숙소 콘센트 모양이 다를 수 있어요. 플러그가 맞는지 확인하고, 필요하면 여행용 변환 어댑터를 준비해 주세요.',
  compatibility: '휴대폰·태블릿·노트북 충전기에 INPUT 100–240V · 50/60Hz라고 적혀 있다면 일반적으로 사용할 수 있어요. 표시가 없거나 50Hz 지원 여부가 불명확하면 제품 제조사 안내를 확인하세요.',
  dryerTitle: '드라이어·고데기는 꼭 확인하세요!',
  dryerSummary: '태국은 한국과 전압은 같지만 주파수는 50Hz예요. 드라이어·고데기를 가져간다면 제품이 50Hz를 지원하는지 확인해 주세요.',
  dryerPower: '전력을 많이 사용하는 제품은 콘센트와 변환 어댑터의 허용 전력도 확인해야 해요. 제품이 호환되지 않거나 연결이 불안정하면 과열이나 기기 손상이 발생할 수 있어요.',
  dryerCheck: '제품별 입력 사양과 제조사 안내를 확인하세요. 숙소에 드라이어가 제공된다면 객실 비품을 사용하는 것도 좋은 방법이에요.',
} as const;
const countryCopy: Record<string, { name: string; comparison: string; adapter: string; status: PreparationStatus; shapes: string; details: string[] }> = {
  JP: { name: '일본', comparison: '한국보다 전압이 낮아요. 일본은 100V이며 동부는 50Hz, 서부는 60Hz예요.', adapter: '납작한 2핀 콘센트에 맞는 어댑터를 준비하세요.', status: '준비 권장', shapes: '납작한 2핀(Type A)을 확인하세요.', details: ['220V 전용 기기는 어댑터만으로 쓸 수 없어요. 일본의 지역별 50/60Hz와 기기의 대응 여부도 확인하세요.'] },
  VN: { name: '베트남', comparison: '한국과 같은 220V이지만 주파수는 50Hz로 달라요.', adapter: vietnamAdapterItem.reason, status: '준비 권장', shapes: '둥근 2핀(Type C)과 납작한 2핀(Type A)을 확인하세요.', details: ['관광청은 대부분 둥근 2핀을 수용한다고 설명해요. ICAO는 A/C/D, Panasonic은 A/C/F를 안내하므로 숙소에 실제 형태를 확인하세요.', '두꺼운 접지형 한국 플러그(Type F)는 Type C 콘센트에 맞지 않을 수 있어요.'] },
  TH: { name: '태국', comparison: '한국과 같은 220V이지만 주파수는 50Hz로 달라요.', adapter: '숙소 콘센트에 한국 플러그가 맞는지 확인한 뒤 준비하세요.', status: '확인 후 결정', shapes: '둥근 2핀(Type C)과 둥근 3핀·접지형(Type O)을 먼저 비교해 보세요. 숙소마다 실제 콘센트가 다를 수 있어요.', details: ['QSNCC 공식 행사장 안내는 C/O를 주요 형태로 설명하고, 행사장에는 Type O를 표준으로 사용한다고 안내해요. 모든 숙소가 같은 형태라는 뜻은 아니에요.', 'Type A/B는 납작한 핀을 받는 복합 콘센트에서 사용되는 경우가 있어요. Type F는 관광청과 정부 행사 안내의 호환 설명을 참고하되, 한국 접지형 플러그가 맞는지와 접지가 유지되는지는 숙소에 확인하세요.', 'Type O는 둥근 전원 핀 2개와 둥근 접지 핀 1개가 삼각형으로 배치돼요. 모양이 맞아도 제품의 입력 전압·50Hz 대응, 접지·허용 전력은 별도로 확인하세요. 맞지 않거나 헐거우면 억지로 연결하지 마세요.'] },
  TW: { name: '대만', comparison: '한국보다 전압이 낮은 110V이며 주파수는 한국과 같은 60Hz예요.', adapter: '납작한 2핀·접지 3핀 콘센트와 한국 플러그 모양이 달라요.', status: '준비 권장', shapes: '납작한 2핀(Type A)과 접지 핀이 있는 3핀(Type B)을 확인하세요.', details: ['일부 건물에는 220V 콘센트도 있어요. 실제 전압 표시를 확인하고 기본 110V와 혼동하지 마세요.'] },
  US: { name: '미국', comparison: '한국보다 전압이 낮은 110–120V이며 주파수는 한국과 같은 60Hz예요.', adapter: '납작한 핀의 미국 콘센트에 맞는 어댑터를 준비하세요.', status: '준비 권장', shapes: '납작한 2핀(Type A)과 접지 핀이 있는 3핀(Type B)을 확인하세요.', details: ['미국 에너지부는 2핀·3핀과 접지 핀의 역할을 설명해요. 220V 전용 제품은 그대로 쓸 수 있다고 생각하지 마세요.'] },
  AU: { name: '호주', comparison: '220–240V 전원을 사용하며 주파수는 한국과 다른 50Hz예요.', adapter: '한국과 핀 모양이 달라요. 호주용 어댑터를 준비하세요.', status: '준비 권장', shapes: 'V자형 납작한 핀(Type I)을 사용해요. 접지 핀이 있는 3핀도 확인하세요.', details: ['호주정부관광청은 역 V자 2핀과 중앙 접지가 있는 형태를 안내해요. 240V와 50Hz까지 제품이 지원하는지 확인하세요.'] },
};
export function getElectricityGuide(countryId: string) {
  const copy = countryCopy[countryId];
  if (!Object.prototype.hasOwnProperty.call(countryCopy, countryId) || !copy) return null;
  const electric = getCountryElectricity(countryId), profile = getInternationalProfile(countryId);
  const sourceIds = getElectricitySourceIds(countryId);
  const evidence = electric ? [electric.voltageV, electric.frequencyHz, electric.plugTypeIds] : profile ? [profile.electricity] : [];
  const verified = evidence.length > 0 && evidence.every(e => e.status === 'verified' && e.value !== null && e.sourceIds.length > 0)
    && sourceIds.length > 0 && sourceIds.every(id => { const source = getSource(id); return source?.status === 'verified' && Boolean(source.lastVerified) && source.url.startsWith('https://'); });
  const main = electric ? `${electric.voltageV.value?.join(' / ')}V · ${electric.frequencyHz.value?.join(' / ')}Hz`
    : profile?.electricity.value?.split(' · ').slice(0, 2).join(' · ') ?? '공식 출처 확인 필요';
  const preparation: PreparationItem[] = [
    { id: 'electronic:charger', name: '충전기 · 케이블', status: '챙기기', reason: '가져가는 기기의 충전기와 케이블을 챙겨주세요. 충전기의 입력 전압과 주파수도 확인해 주세요.' },
    { id: vietnamAdapterItem.id, name: vietnamAdapterItem.name, status: copy.status, reason: copy.adapter },
    { name: ['JP', 'TW', 'US'].includes(countryId) ? '변압기 · 전압이 맞지 않는 제품을 가져갈 때' : '드라이어·고데기 등 · 가져가는 경우', status: '확인 후 결정', reason: '제품 사양과 제조사 안내, 접지·허용 전력을 확인한 뒤 결정하세요.' },
  ];
  if (countryId === 'VN') {
    preparation[1].notes = ['숙소 콘센트 모양이 다를 경우를 대비해 준비하세요.', '한국 플러그와 현지 콘센트에 모두 맞는지 확인하세요.', '접지가 필요한 기기는 접지 연결 가능 여부를 확인하세요.'];
    preparation[2] = { name: '드라이어·고데기', status: '확인 후 결정', reason: '제품의 50Hz 호환 여부, 소비전력과 어댑터 허용 전력, 숙소 제공 여부를 확인하세요.' };
  }
  if (countryId === 'TH') {
    preparation[0].reason = '평소 사용하는 충전기를 챙기고 입력 전압과 주파수를 확인해 주세요.';
    preparation[1].status = '준비 권장';
    preparation[1].reason = '숙소마다 콘센트 모양이 다를 수 있어요. 한국 플러그와 태국 콘센트에 모두 맞는 어댑터를 준비하면 좋아요.';
    preparation[2] = { name: '드라이어 · 고데기', status: '확인 후 결정', reason: '가져가는 경우 제품의 50Hz 지원 여부와 소비전력을 확인해 주세요.' };
  }
  return { countryId, ...copy, status: preparation[1].status, adapter: preparation[1].reason, main: verified ? main : '공식 출처 확인 필요', verified, sourceIds, preparation,
    visualKinds: verified ? getCountryPlugVisuals(countryId) : [],
    compatibility: countryId === 'VN' ? vietnamUsageCopy.compatibility : countryId === 'TH' ? thailandUsageCopy.compatibility : 'INPUT 100–240V, 50/60Hz는 확인 예시예요. 내 제품에 실제로 적혀 있을 때만 해당 전원에서의 사용을 검토하세요. 표시가 없으면 제조사에 확인하세요.',
    cautions: countryId === 'VN' ? ['변환 어댑터는 플러그 모양만 바꿔요. 전압·주파수는 바꾸지 않아요. 변압기도 주파수를 바꾸지는 않아요.', '두꺼운 접지형 한국 플러그(Type F)가 모든 Type C 콘센트에 맞는 것은 아니에요. 맞지 않거나 헐거우면 억지로 연결하지 마세요.', '접지가 필요한 기기는 접지가 유지되는 연결을 사용하세요. 접지 핀을 제거하거나 일반 무접지 어댑터로 대신하지 마세요.'] : ['변환 어댑터는 모양만 바꾸고 전압·주파수는 바꾸지 않아요. 변압기는 전압을 바꾸는 장치이며 주파수는 바꾸지 않아요.', '접지는 감전 위험을 줄이는 연결이에요. 접지가 필요한 기기는 이 연결이 유지돼야 해요. 접지 핀을 제거하거나 무접지 어댑터로 대신하지 마세요.', '드라이어·고데기·면도기는 제품별 전압·주파수를 확인하세요. 220V·60Hz 전용 제품은 제조사 확인이 필요해요. 고전력 제품은 어댑터 허용 전력도 확인하세요.', ...(electric ? [electric.deviceCaution.text, ...(electric.travelerAdvice ?? [])] : [])],
    typeSummary: `Type ${[...new Set(getCountryPlugVisuals(countryId).map(kind => kind.startsWith('I') ? 'I' : kind))].join(' / ')}`,
  };
}
export function getElectricityPreparation(countryId: string) {
  const guide = getElectricityGuide(countryId);
  return guide?.verified ? guide.preparation.filter(item => item.id) : [];
}
