import { Link } from 'react-router-dom';
import { ArrowUpRight, CloudSun, Plug, ShieldCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { electricity, plugTypes } from '../data/electricity';
import { baggageRules } from '../data/baggageRules';
import { getClothingPreview, formatClimateValue } from '../travel-info/guideModel';
import SourceLinks from '../travel-info/SourceLinks';
import './TripBrief.css';

export default function TripBrief({ trip }: { trip: Trip }) {
  const climate = getTripClimate(trip.cityId, trip.departureDate, trip.returnDate);
  const sourceIds = [...new Set(climate.flatMap(segment => Object.values(segment.climate.recommendedMetrics ?? {}).flatMap(metric => metric.value !== null ? metric.sourceIds : [])))];
  const power = baggageRules.find(rule => rule.id === 'power-banks');
  const electric = trip.countryId === 'JP' ? electricity.JP : null;
  return <section className="pmb-trip-brief" aria-labelledby="pmb-trip-brief-title"><header><h2 id="pmb-trip-brief-title">YOUR TRIP BRIEF</h2><p>이번 여행에서 꼭 확인할 정보예요.</p><span>기본 확인 항목 3가지 · 공식 통계와 서비스 제안</span></header><div className="pmb-trip-brief-grid">
    <article><Link className="pmb-trip-brief-link" to="/implementation/travel-info?from=my-bag#pmb-guide-weather"><CloudSun size={21}/><h3>날씨 · 옷차림</h3><ArrowUpRight size={17}/></Link>{climate.map((segment, index) => {
      const mean = segment.climate.recommendedMetrics?.meanTemperatureC;
      const clothing = getClothingPreview(segment.climate, trip.travelPurpose).filter(item => item.id !== 'walking-shoes');
      return <div className="pmb-trip-brief-month" key={`${segment.year}-${segment.month}`}><Link to={`/implementation/travel-info?from=my-bag&month=${index}#pmb-guide-weather`}>{segment.month}월 · {mean?.value !== null && mean?.value !== undefined ? `월평균 ${formatClimateValue(mean.value, '°C')}` : '기후자료 확인 필요'}<ArrowUpRight size={14}/></Link>{mean?.value !== null && mean?.value !== undefined && <small>{mean.period.startYear}–{mean.period.endYear} · {mean.basis === 'recent-10-year-observations' ? '관측 10년 평균' : '공식 평년값'}</small>}{clothing.length > 0 && <p>옷차림 참고: {clothing.slice(0, 3).map(item => item.name).join(' · ')}</p>}</div>;
    })}<SourceLinks ids={sourceIds}/></article>
    <article><Link className="pmb-trip-brief-link" to="/implementation/travel-info?from=my-bag#pmb-guide-electricity"><Plug size={21}/><h3>전압 · 플러그</h3><ArrowUpRight size={17}/></Link>{electric ? <><strong>{electric.voltageV.value?.join(' / ')}V · {plugTypes.A.label}</strong><p>플러그 모양과 기기의 Input 전압을 확인하세요. 어댑터는 전압을 바꾸지 않습니다.</p><SourceLinks ids={[...electric.voltageV.sourceIds, ...electric.plugTypeIds.sourceIds]}/></> : <p>선택한 국가의 전압·플러그 자료는 아직 검증되지 않았어요. 상세 안내에서 확인해 주세요.</p>}</article>
    <article><Link className="pmb-trip-brief-link" to="/implementation/travel-info?from=my-bag#pmb-guide-baggage"><ShieldCheck size={21}/><h3>항공 반입 규정</h3><ArrowUpRight size={17}/></Link><strong>한국 출발 국제선 기준</strong>{power?.summary?.status === 'verified' && <p>보조배터리: {power.summary.value}</p>}<p>기내 사용·충전 금지 및 항공사 승인 조건을 상세 안내에서 확인하세요.</p><SourceLinks ids={power?.officialSourceIds ?? []}/></article>
  </div></section>;
}
