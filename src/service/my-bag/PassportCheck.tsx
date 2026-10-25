import { useState } from 'react';
import type { Trip } from '../trip/trip';
import { getPassportRule } from '../data/passportRules';
import SourceLinks from '../travel-info/SourceLinks';
import { assessPassport, type PassportContext } from './passportModel';

// Deliberately local state: unmounting this screen discards all passport inputs.
export default function PassportCheck({ trip }: { trip: Trip }) {
  const [expiry, setExpiry] = useState('');
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [route, setRoute] = useState<PassportContext['route']>('unknown');
  const rule = getPassportRule(trip.countryId);
  const result = assessPassport(trip.countryId, trip.departureDate, trip.returnDate, expiry, { scopeConfirmed: scopeConfirmed && trip.travelPurpose !== 'business', route });
  return <div className="pmb-passport-check">
    <p><strong>여행 국가: {rule?.name ?? trip.countryId}</strong><br/>여행 일정: {trip.departureDate} — {trip.returnDate}</p>
    <p className="pmb-passport-rule">{rule?.requirement ?? '해당 국가의 공식 여권 유효기간 기준을 확인해 주세요.'}</p>
    <label className="pmb-passport-date">내 여권 만료일 <span>이 화면에서만 임시 사용 · 저장하지 않음</span><input type="date" value={expiry} onChange={event => setExpiry(event.target.value)} max="9999-12-31" autoComplete="off" aria-describedby="pmb-passport-date-notice"/></label>
    <label className="pmb-passport-scope"><input type="checkbox" checked={scopeConfirmed} onChange={event => setScopeConfirmed(event.target.checked)} disabled={trip.travelPurpose === 'business'}/>한국 일반여권으로 단기 관광하며 일반 무비자 기준을 확인해요. (미국 ESTA·호주 ETA 등은 별도 확인)</label>
    {trip.travelPurpose === 'business' && <p>출장·업무는 이 관광 기준의 적용 대상인지 별도 확인이 필요해요.</p>}
    <label className="pmb-passport-date">경유 조건<select value={route} onChange={event => setRoute(event.target.value as PassportContext['route'])}><option value="unknown">아직 확인하지 않았어요</option><option value="direct">직항으로 여행해요</option><option value="checked">경유지의 추가 여권 요건을 확인했어요</option></select></label>
    <div id="pmb-passport-date-notice" role="status" className="pmb-passport-result" data-passport-status={result.status}>
      <strong>{result.title}</strong><p>{result.message}</p>
      {result.requiredExpiry && <p>{rule?.method === 'entry-six-months' ? `입국일로 사용하는 여행 시작일 ${trip.departureDate}에 달력 기준 6개월을 더해 계산해요.` : '여행 종료일을 예정 체류 종료일로 사용해요.'}<br/>필요한 만료일: <b>{result.requiredExpiry} 또는 이후</b>{rule?.method === 'entry-six-months' && ' · 여행 종료일까지도 유효해야 해요.'}</p>}
      <p>{result.action}</p>
    </div>
    <p>{rule?.extra}</p>
    <details><summary>적용 범위와 실제 입국일 확인</summary><p>한국 국적·일반여권·단기 관광의 기본 유효기간만 비교해요. 국적, 여권 종류, 비자, 방문 목적, 경유지와 항공사에 따라 달라질 수 있어요.</p><p>여행 시작일을 현지 입국일로 계산해요. 야간·경유 항공편으로 실제 입국일이 다르면 실제 일정에 맞춰 여행 날짜를 확인하세요. 입국 허가나 비자 발급을 확정하는 결과가 아니에요.</p></details>
    {rule ? <><SourceLinks ids={rule.sourceIds}/>{rule.relatedSourceIds && <details><summary>추가 공식 안내 · 확인 상태 보기</summary><SourceLinks ids={rule.relatedSourceIds}/></details>}</> : <a className="pmb-red-flags-official" href="https://www.0404.go.kr/" target="_blank" rel="noreferrer">외교부 해외안전여행 · 공식 안내 확인</a>}
  </div>;
}
