import { Banknote, Clock3, ExternalLink, Plug, Stamp, ClipboardCheck } from 'lucide-react';
import { electricity, plugTypes } from '../data/electricity';
import { currencies, timeZones } from '../data/currencies';
import { entryGuides } from '../data/entryGuides';
import TravelChecks from './TravelChecks';
import { MobileInfoRow } from './MobileCompact';
import { travelNotices } from '../data/notices';
import SourceLinks from './SourceLinks';

const plugImage = new URL('../data/assets/plugs/type-a.svg', import.meta.url).href;

function PendingInfo() {
  return <p className="pmb-guide-pending">공식 정보 확인 필요 · 선택한 국가의 검증된 자료를 준비하고 있습니다.</p>;
}

export default function EssentialInfo({ countryId, travelPurpose, tripDays }: { countryId: string; travelPurpose: string; tripDays: number | null }) {
  const jp = countryId === 'JP';
  const electric = electricity.JP;
  const currency = currencies.JP;
  const time = timeZones.JP;
  const entry = entryGuides.JP;
  return <>
    <section id="pmb-guide-essentials" className="pmb-guide-essentials" aria-labelledby="pmb-essentials-title"><div className="pmb-guide-section-title"><span className="pmb-guide-eyebrow">THE LITTLE THINGS, SORTED</span><h2 id="pmb-essentials-title">알아두면, 한결 가벼운 여행.</h2></div><div className="pmb-guide-info-grid">
      <MobileInfoRow title="전압 · 플러그" value={jp ? `${electric.voltageV.value?.join(' / ')}V · ${plugTypes.A.label}` : '세부 정보 확인 필요'} icon={Plug}>      <article id="pmb-guide-electricity" className="pmb-guide-info-card"><span className="pmb-guide-card-icon"><Plug size={25}/></span><h3>PLUGS & ELECTRICITY</h3><h4>충전 준비도 잊지 마세요</h4>{jp ? <><div className="pmb-guide-plug"><img src={plugImage} width="62" height="62" alt="Type A 콘센트 형태: 평행한 두 개의 납작한 핀"/><div><strong>{electric.voltageV.value?.join(' / ')}V · {plugTypes.A.label}</strong><span>{electric.frequencyHz.value?.join(' / ')}Hz</span></div></div><p>{electric.regionalFrequency.value}</p><p>{electric.adapter.text}</p><details><summary>어댑터와 변압기 구분하기</summary><p>{electric.deviceCaution.text}</p><p>도식은 형태를 구분하기 위한 그림이며 치수·인증을 나타내지 않습니다. 시설별 콘센트는 직접 확인해 주세요.</p></details><SourceLinks ids={[...electric.voltageV.sourceIds, ...electric.frequencyHz.sourceIds, ...electric.plugTypeIds.sourceIds, ...electric.adapter.basedOn]}/></> : <PendingInfo/>}</article></MobileInfoRow>
      <MobileInfoRow title="통화 · 시차" value={jp ? `${currency.value?.code} · 한국과 시차 없음` : '세부 정보 확인 필요'} icon={Banknote}>
      <article className="pmb-guide-info-card"><span className="pmb-guide-card-icon pmb-guide-card-yellow"><Banknote size={25}/></span><h3>CURRENCY & TIME</h3><h4>현지의 돈과 시간</h4>{jp ? <><div className="pmb-guide-currency"><strong>{currency.value?.code} <span>{currency.value?.symbol}</span></strong><p>{currency.value?.name}</p></div><p className="pmb-guide-time"><Clock3 size={20}/> 한국과 {time.differenceFromKoreaMinutes.value === 0 ? '시차 없음' : `${time.differenceFromKoreaMinutes.value}분 차이`}</p><p>일본 표준시 UTC+{(time.standardUtcOffsetMinutes.value ?? 0) / 60} · {time.daylightSaving.value === false ? '서머타임 미실시' : '서머타임 공식 확인 필요'}</p><p className="pmb-guide-note">기록된 공식 안내 기준입니다. 현재 환율은 제공하지 않습니다.</p><SourceLinks ids={[...currency.sourceIds, ...time.standardUtcOffsetMinutes.sourceIds, ...time.differenceFromKoreaMinutes.sourceIds, ...time.daylightSaving.sourceIds]}/></> : <PendingInfo/>}</article></MobileInfoRow>
      <MobileInfoRow title="입국 · 항공 규정" value="공식 안내 및 확인사항" icon={ClipboardCheck}><TravelChecks>
      <div className="pmb-guide-entry-panel"><span className="pmb-guide-card-icon pmb-guide-card-coral"><Stamp size={25}/></span><h3>ENTRY PREPARATION</h3><h4>출국 전에 한 번 더 확인</h4>{jp ? <><p className="pmb-guide-scope">대한민국 일반여권 · 단기 관광 조사 조건</p><p>{entry.passport.value}</p>{travelPurpose === 'business' || (tripDays !== null && tripDays > (entry.visa.value?.maximumShortStayDays ?? 0)) ? <p className="pmb-guide-pending">공식 정보 확인 필요 · 출장·업무 또는 기본 조사 기간을 벗어난 일정은 관광 기준으로 입국 가능 여부를 판단할 수 없습니다.</p> : <p>확인된 기본 조건: 단기체재 {entry.visa.value?.maximumShortStayDays}일 이내 사증 면제 대상. 입국을 보장하는 판정은 아닙니다.</p>}
        {entry.services.map(service => <div className="pmb-guide-entry-service" key={service.id}><a href={service.officialUrl} target="_blank" rel="noreferrer">{service.name}<ExternalLink size={16}/></a><p>{service.description.value}</p><p className="pmb-guide-note">모든 여행자에게 필수라고 안내하지 않습니다. 대상·절차는 공식 안내를 확인해 주세요.</p></div>)}<p className="pmb-guide-note">여권 잔여 유효기간 및 여행자별 세부 적용 조건: 공식 정보 확인 필요.</p><SourceLinks ids={[...entry.passport.sourceIds, ...entry.visa.sourceIds, ...entry.customs.sourceIds, ...entry.services.flatMap(service => service.description.sourceIds)]}/><p className="pmb-guide-note">{travelNotices.entry}</p></> : <PendingInfo/>}</div>
      </TravelChecks></MobileInfoRow>
    </div></section>

  </>;
}
