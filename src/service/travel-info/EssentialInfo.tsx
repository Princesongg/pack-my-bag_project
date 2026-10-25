import { Banknote, Clock3, ExternalLink, Plug, Stamp, ClipboardCheck } from 'lucide-react';
import { getElectricityGuide } from '../data/electricityGuide';
import { currencies, timeZones, getCountryCurrency } from '../data/currencies';
import { entryGuides } from '../data/entryGuides';
import TravelChecks from './TravelChecks';
import { MobileInfoRow } from './MobileCompact';
import { travelNotices } from '../data/notices';
import SourceLinks from './SourceLinks';
import ElectricityInfo from './ElectricityInfo';
import { getInternationalProfile } from '../data/international';
import { InternationalEntry, InternationalCurrency } from './InternationalInfo';


function PendingInfo() {
  return <p className="pmb-guide-pending">공식 정보 확인 필요 · 선택한 국가의 검증된 자료를 준비하고 있습니다.</p>;
}

export default function EssentialInfo({ countryId, travelPurpose, tripDays, cityId = '', departureDate = '', returnDate = '' }: { countryId: string; travelPurpose: string; tripDays: number | null; cityId?:string; departureDate?:string; returnDate?:string }) {
  const jp = countryId === 'JP';
  const profile = getInternationalProfile(countryId);
  const electric = getElectricityGuide(countryId);
  const countryCurrency = getCountryCurrency(countryId);
  const currency = currencies.JP;
  const time = timeZones.JP;
  const entry = entryGuides.JP;
  return <>
    <section id="pmb-guide-essentials" className="pmb-guide-essentials" aria-labelledby="pmb-essentials-title"><div className="pmb-guide-section-title"><span className="pmb-guide-eyebrow">THE LITTLE THINGS, SORTED</span><h2 id="pmb-essentials-title">알아두면, 한결 가벼운 여행.</h2></div><div className="pmb-guide-info-grid">
      <MobileInfoRow title="전압 · 플러그" value={electric?.verified ? `${electric.main} · ${electric.typeSummary}` : '공식 출처 확인 필요'} icon={Plug}>      <ElectricityInfo countryId={countryId}/></MobileInfoRow>
      <MobileInfoRow title="통화 · 시차" value={jp ? `${currency.value?.code} · 한국과 시차 없음` : countryCurrency ? `${countryCurrency.name} · ${countryCurrency.code}` : '세부 정보 확인 필요'} icon={Banknote}>
      <article className="pmb-guide-info-card"><span className="pmb-guide-card-icon pmb-guide-card-yellow"><Banknote size={25}/></span><h3>CURRENCY & TIME</h3><h4>현지의 돈과 시간</h4>{jp ? <><div className="pmb-guide-currency"><strong>{currency.value?.code} <span>{currency.value?.symbol}</span></strong><p>{currency.value?.name}</p></div><p className="pmb-guide-time"><Clock3 size={20}/> 한국과 {time.differenceFromKoreaMinutes.value === 0 ? '시차 없음' : `${time.differenceFromKoreaMinutes.value}분 차이`}</p><p>일본 표준시 UTC+{(time.standardUtcOffsetMinutes.value ?? 0) / 60} · {time.daylightSaving.value === false ? '서머타임 미실시' : '서머타임 공식 확인 필요'}</p><p className="pmb-guide-note">기록된 공식 안내 기준입니다. 현재 환율은 제공하지 않습니다.</p><SourceLinks ids={[...currency.sourceIds, ...time.standardUtcOffsetMinutes.sourceIds, ...time.differenceFromKoreaMinutes.sourceIds, ...time.daylightSaving.sourceIds]}/></> : countryCurrency ? <InternationalCurrency countryId={countryId} cityId={cityId} departureDate={departureDate} returnDate={returnDate}/> : <PendingInfo/>}</article></MobileInfoRow>
      <MobileInfoRow title="입국 · 항공 규정" value="공식 안내 및 확인사항" icon={ClipboardCheck}><TravelChecks>
      <div className="pmb-guide-entry-panel"><span className="pmb-guide-card-icon pmb-guide-card-coral"><Stamp size={25}/></span><h3>ENTRY PREPARATION</h3><h4>출국 전에 한 번 더 확인</h4>{jp ? <><p className="pmb-guide-scope">대한민국 일반여권 · 단기 관광 조사 조건</p><p>{entry.passport.value}</p>{travelPurpose === 'business' || (tripDays !== null && tripDays > (entry.visa.value?.maximumShortStayDays ?? 0)) ? <p className="pmb-guide-pending">공식 정보 확인 필요 · 출장·업무 또는 기본 조사 기간을 벗어난 일정은 관광 기준으로 입국 가능 여부를 판단할 수 없습니다.</p> : <p>확인된 기본 조건: 단기체재 {entry.visa.value?.maximumShortStayDays}일 이내 사증 면제 대상. 입국을 보장하는 판정은 아닙니다.</p>}
        {entry.services.map(service => <div className="pmb-guide-entry-service" key={service.id}><a href={service.officialUrl} target="_blank" rel="noreferrer">{service.name}<ExternalLink size={16}/></a><p>{service.description.value}</p><p className="pmb-guide-note">모든 여행자에게 필수라고 안내하지 않습니다. 대상·절차는 공식 안내를 확인해 주세요.</p></div>)}<p className="pmb-guide-note">여권 잔여 유효기간 및 여행자별 세부 적용 조건: 공식 정보 확인 필요.</p><SourceLinks ids={[...entry.passport.sourceIds, ...entry.visa.sourceIds, ...entry.customs.sourceIds, ...entry.services.flatMap(service => service.description.sourceIds)]}/><p className="pmb-guide-note">{travelNotices.entry}</p></> : profile ? <InternationalEntry countryId={countryId}/> : <PendingInfo/>}</div>
      </TravelChecks></MobileInfoRow>
    </div></section>

  </>;
}
