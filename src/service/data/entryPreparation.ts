import { recalculateTrip, type Trip } from '../trip/trip';
import type { Source } from './types';
import { getPassportRule, passportSources } from './passportRules';
import { entryGuides } from './entryGuides';
import { getInternationalProfile } from './international';
import { getEntryRegulation } from './entryRegulations';

export const entryPreparationSources: Source[] = [
  { id: 'entry-us-esta', organization: '미국 정부 USAGov', title: 'Visa Waiver Program and ESTA application', url: 'https://www.usa.gov/visa-waiver-esta', period: null, status: 'verified', lastVerified: '2026-10-25', notes: 'VWP 여행 전 ESTA, 공식 신청·상태 확인 경로 확인. 정부 수수료는 앱 이용료와 별개이며 금액은 표시하지 않음.' },
  { id: 'entry-us-esta-definition', organization: '미국 CBP · GovInfo 보존 자료', title: '2018 보존자료 · 허가 성격만 참고 (요금·세부 절차 제외)', url: 'https://www.govinfo.gov/content/pkg/GOVPUB-HS4_100-PURL-gpo172341/pdf/GOVPUB-HS4_100-PURL-gpo172341.pdf', period: null, status: 'verified', lastVerified: '2026-10-25', notes: '2018 자료의 허가 성격, 입국 비보장, 유효 B1/B2 비자와의 구분만 확인. 오래된 수수료·육로 규정은 사용하지 않음. 최신 신청 경로는 USAGov와 대조.' },
  { id: 'entry-au-eta-korea', organization: '주한 호주대사관', title: 'Electronic Travel Authority · 한국 여권 신청 안내', url: 'https://southkorea.embassy.gov.au/seol/ETA601.html', period: null, status: 'verified', lastVerified: '2026-10-25', notes: '한국 국적자의 관광·방문/사업방문 목적과 Australian ETA App 신청 경로 확인. 모든 방문 목적·여권의 자동 자격으로 확대하지 않음.' },
  { id: 'entry-au-eta-601', organization: '호주 내무부', title: 'Electronic Travel Authority · subclass 601', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601', period: null, status: 'partially-verified', lastVerified: null, notes: '공식 비자 안내 경로. 동적 본문 추출 제한으로 세부 자격·수수료는 재확인 필요. 한국 여권의 신청 방법은 주한 호주대사관 본문으로 별도 확인.' },
];

function getBaseEntryPreparation(trip: Trip) {
  const rule = getPassportRule(trip.countryId);
  if (!rule) return null;
  const profile = getInternationalProfile(trip.countryId);
  const stay = recalculateTrip(trip).tripDays;
  const scopeUnclear = trip.travelPurpose === 'business';
  const base = {
    countryId: trip.countryId, title: `${rule.name} 입국 준비`,
    body: '무비자 적용 조건과 여권 유효기간을 출발 전에 확인하세요.',
    passportRequirement: rule.requirement, sourceIds: rule.sourceIds,
    needsReview: true,
    reviewReason: '여권 기준 외의 무비자 자격·입국신고 절차는 추가 확인이 필요해요. 국적·목적·체류기간에 맞는 공식 안내를 확인하세요.',
    details: [rule.extra],
    links: rule.sourceIds.slice(0, 1).flatMap(id => { const source = passportSources.find(source => source.id === id); return source ? [{ label: `${rule.name} 공식 입국·여권 안내`, url: source.url }] : []; }),
  };
  if (trip.countryId === 'US') return { ...base, title: '미국 입국 준비 · ESTA',
    body: '비자면제프로그램으로 여행한다면 출발 전 ESTA 승인을 확인하세요.',
    needsReview: scopeUnclear || stay === null || stay > 90, reviewReason: '방문 목적·체류기간에 맞는 VWP 자격 또는 비자 조건을 별도로 확인해 주세요.',
    details: ['ESTA는 비자가 아니라 비자면제프로그램(VWP) 여행을 위한 전자여행허가예요.', '여행 목적에 맞는 유효한 미국 비자를 사용한다면 ESTA가 필요하지 않을 수 있어요. 본인의 비자 조건을 확인하세요.', 'ESTA 승인과 최종 입국 허가는 별개예요. 승인이 입국을 보장하지 않아요.', '공식 ESTA 사이트에서 신청하거나 기존 신청 상태를 직접 확인하세요. 이 서비스는 정부 승인 상태를 조회하지 않아요.', profile?.entry.value ?? rule.extra, '신청에는 정부 수수료가 발생할 수 있어요. 최신 금액과 결제 조건은 공식 사이트에서 확인하세요.'],
    sourceIds: ['entry-us-esta', 'entry-us-esta-definition', ...rule.sourceIds],
    links: [{ label: '공식 ESTA 신청 · 승인 상태 확인', url: 'https://esta.cbp.dhs.gov/' }],
  };
  if (trip.countryId === 'AU') return { ...base, title: '호주 입국 준비 · ETA',
    body: '한국 일반여권으로 관광한다면 ETA 등 적합한 비자 승인 여부를 출발 전에 확인하세요.',
    needsReview: scopeUnclear, reviewReason: '방문 목적에 맞는 ETA 또는 다른 비자 자격을 별도로 확인해 주세요.',
    details: ['호주 ETA는 전자여행허가 방식의 비자(subclass 601)예요. 비자가 아닌 미국 ESTA와 성격이 달라요.', '한국 여권의 관광 등 해당 목적이라면 Australian ETA App 신청 안내를 확인하세요. 목적·체류기간·여권에 따라 다른 비자가 필요할 수 있어요.', '호주 내무부 공식 안내와 Australian ETA App에서 본인의 승인 결과와 조건을 직접 확인하세요.', 'ETA 승인이 최종 입국을 보장하지 않아요. 이 서비스는 정부 승인 상태를 조회하지 않아요.', '앱 다운로드와 비자 신청 비용은 별개예요. 신청 서비스 수수료 등 최신 비용은 공식 안내에서 확인하세요.'],
    sourceIds: ['entry-au-eta-korea', 'entry-au-eta-601', ...rule.sourceIds],
    links: [{ label: '호주 내무부 · ETA (subclass 601) 공식 안내', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601' }, { label: '주한 호주대사관 · Australian ETA App 신청 안내', url: 'https://southkorea.embassy.gov.au/seol/ETA601.html' }],
  };
  if (trip.countryId === 'JP') {
    const entry = entryGuides.JP;
    return { ...base, body: '단기체류의 무비자 적용 조건과 Visit Japan Web 이용 안내를 확인하세요.',
      needsReview: scopeUnclear || stay === null || stay > (entry.visa.value?.maximumShortStayDays ?? 0),
      reviewReason: '방문 목적·체류기간이 기존 단기체류 안내 범위에 맞는지 별도 확인해 주세요.',
      details: [`기존 확인 자료는 한국 일반여권의 단기체류 ${entry.visa.value?.maximumShortStayDays}일 이내 비자면제 기본 조건이에요. 모든 방문 목적이나 입국을 보장하는 안내가 아니에요.`, entry.services[0].description.value ?? '', 'Visit Japan Web의 대상 절차와 최신 이용 방법은 공식 안내에서 확인하세요. 모든 여행자에게 필수라고 단정하지 않아요.'],
      sourceIds: [...rule.sourceIds, ...entry.visa.sourceIds, ...entry.services[0].description.sourceIds],
      links: [{ label: '주대한민국 일본국대사관 · 영사 안내', url: 'https://www.kr.emb-japan.go.jp/itpr_ko/consulate.html' }, { label: 'Visit Japan Web · 공식 이용 안내', url: entry.services[0].officialUrl }],
    };
  }
  return base;
}

export function getEntryPreparation(trip: Trip) {
  const base=getBaseEntryPreparation(trip),requirements=getEntryRegulation(trip);
  if(!base||!requirements)return null;
  const bodies:Record<string,string>={VN:'일반 비자면제45일 조건과 입국 공항의 준비 절차를 확인하세요.',TH:'여권·TDAC을 준비하고 한국 여권의 최신 무비자 체류기간을 확인하세요.',TW:'무비자90일 조건과 입국 전 TWAC 제출을 확인하세요.'};
  return {...base,body:bodies[trip.countryId]??base.body,requirements,
    needsReview:requirements.needsReview,
    reviewReason:[requirements.outOfScope?'이번 일정은 한국 일반여권·단기 관광 기본 안내 범위에 맞는지 별도 확인이 필요해요.':'',...requirements.unresolved].filter(Boolean).join(' '),
    details:[...new Set([...base.details,...requirements.notes])],sourceIds:requirements.sourceIds,links:requirements.links};
}

export function entryPreparationStatus(needsReview: boolean, confirmed: boolean) {
  return needsReview ? { label: '추가 확인 필요', variant: 'check-required' as const }
    : confirmed ? { label: '직접 확인함', variant: 'info' as const } : { label: '확인 필요', variant: 'check-required' as const };
}
