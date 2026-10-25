import PlugVisuals from '../travel-info/PlugVisuals';
import { BaggageStatusSummary } from '../travel-info/StatusBadge';
import { useRef, useState } from 'react';
import { CloudSun, Plug, ShieldCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { getElectricityGuide } from '../data/electricityGuide';
import { baggageRules } from '../data/baggageRules';
import { getClothingPreview, formatClimateValue } from '../travel-info/guideModel';
import TripBriefModal, { type BriefTopic } from './TripBriefModal';
import './TripBrief.css';
import { allowanceLabel, type BaggageAllowance } from './baggageAllowance';

export default function TripBrief({ trip, allowance, onSaveAllowance }: { trip: Trip; allowance?: BaggageAllowance; onSaveAllowance: (value?: BaggageAllowance) => void }) {
  const climate = getTripClimate(trip.cityId, trip.departureDate, trip.returnDate);

  const power = baggageRules.find(rule => rule.id === 'power-banks');
  const electric = getElectricityGuide(trip.countryId);
  const [topic, setTopic] = useState<BriefTopic | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const temperature = climate.map(segment => {
    const mean = segment.climate.recommendedMetrics?.meanTemperatureC;
    const available = mean?.value !== null && mean?.value !== undefined;
    const provenance = segment.climate.provenance;
    const stationNote = provenance && 'displayNote' in provenance ? provenance.displayNote : undefined;
    return <span className="pmb-trip-brief-temperature" key={`${segment.year}-${segment.month}`}>
      <span className="pmb-trip-brief-temperature-label">{segment.month}월 평균기온{(mean?.basis === 'derived-high-low-midpoint' || mean?.basis === 'derived-normal-high-low-midpoint') && ' (계산 참고)'}</span>
      <strong className={available ? 'pmb-trip-brief-temperature-value' : 'pmb-trip-brief-temperature-missing'}>{available ? formatClimateValue(mean.value, '°C') : '자료 확인 필요'}</strong>
      {stationNote && <small>{stationNote}</small>}
    </span>;
  });
  const clothing = [...new Set(climate.flatMap(segment => getClothingPreview(segment.climate, trip.travelPurpose).map(item => item.name)))].slice(0, 3);
  const cards = [
    { id: 'weather' as const, title: '날씨 · 옷차림', icon: CloudSun, summary: temperature, note: clothing.length ? clothing.join(' · ') : '선택한 도시의 기후자료를 확인해 주세요.' },
    { id: 'electricity' as const, title: '전압 · 플러그', icon: Plug, summary: electric?.main ?? '공식 출처 확인 필요', note: electric?.preparation[1].reason ?? '플러그와 기기 Input 전압 확인' },
    { id: 'baggage' as const, title: '항공 수하물 안내', icon: ShieldCheck, summary: '기내 반입 · 보조배터리·액체류 등', note: power?.summary?.value ?? '주요 반입 제한 확인' },
  ];
  return <section className="pmb-trip-brief" aria-labelledby="pmb-trip-brief-title"><header><h2 id="pmb-trip-brief-title">YOUR TRIP BRIEF</h2><p>이번 여행에서 꼭 확인할 정보예요.</p><span>기본 확인 항목 3가지 · 공식 통계와 서비스 제안</span></header><div className="pmb-trip-brief-grid">
    {cards.map(card => <button className="pmb-trip-brief-card" data-topic={card.id} type="button" key={card.id} aria-haspopup="dialog" onClick={event => { opener.current = event.currentTarget; setTopic(card.id); }}><span className="pmb-trip-brief-card-title"><card.icon size={21}/><strong>{card.title}</strong></span><span className={card.id === 'weather' ? 'pmb-trip-brief-temperatures' : 'pmb-trip-brief-summary'}>{card.summary}</span>{card.id === 'electricity' && <span className="pmb-trip-brief-plug-types">{electric?.typeSummary}</span>}{card.id === 'electricity' && <PlugVisuals countryId={trip.countryId} compact/>}<span className="pmb-trip-brief-card-note">{card.id === 'baggage' ? <BaggageStatusSummary text={card.note}/> : card.note}</span>{card.id === 'baggage' && <span className="pmb-trip-brief-allowance"><strong>{allowanceLabel(allowance)}</strong><small>{allowance ? '사용자 직접 입력 · 항공권 확인' : '내 무료 위탁수하물 허용량'}</small></span>}<span className="pmb-trip-brief-more">자세히 보기</span></button>)}
  </div>{topic && <TripBriefModal topic={topic} trip={trip} allowance={allowance} onSaveAllowance={onSaveAllowance} returnFocus={opener.current} onClose={() => setTopic(null)}/>}</section>;
}
