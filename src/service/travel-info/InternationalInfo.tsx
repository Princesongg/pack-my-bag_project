import { getInternationalProfile, getTripTimeOffsets } from '../data/international';
import SourceLinks from './SourceLinks';

export function InternationalEntry({ countryId }: { countryId:string }) {
  const profile=getInternationalProfile(countryId);
  if(!profile) return null;
  return <><p>{profile.entry.value}</p><p>특정 국적·자격을 가정한 입국 판정이 아닙니다. 국가별 여권 잔여 유효기간과 본인의 비자 조건은 공식 안내에서 확인해 주세요.</p><a className="pmb-guide-text-link" href={profile.entryUrl} target="_blank" rel="noreferrer">{profile.entryLabel}</a><SourceLinks ids={profile.entry.sourceIds}/></>;
}
export function InternationalCurrency({ countryId,cityId,departureDate,returnDate }: {countryId:string;cityId:string;departureDate:string;returnDate:string}) {
  const profile=getInternationalProfile(countryId);
  if(!profile) return null;
  const time=getTripTimeOffsets(cityId,departureDate,returnDate);
  return <><strong>{profile.currency.value}</strong>{time && <><p>{time.ianaId}</p><p>여행 날짜 기준 한국보다 {time.differenceFromKoreaMinutes.map(minutes=>`${Math.abs(minutes)/60}시간 ${minutes<0?'느림':'빠름'}`).join(' / ')}</p><p>{time.differenceFromKoreaMinutes.length>1 ? '여행 중 서머타임 전환으로 시차가 달라집니다.' : '여행 날짜의 서머타임 적용을 반영했습니다.'}</p><details><summary>시차 계산 기준</summary><p>{time.method}</p></details></>}<p>환율은 제공하지 않습니다. 미국·호주 전체의 단일 시차가 아닌 선택한 도시 기준입니다.</p><SourceLinks ids={[...profile.currency.sourceIds,...(time?.sourceIds??[])]}/></>;
}
