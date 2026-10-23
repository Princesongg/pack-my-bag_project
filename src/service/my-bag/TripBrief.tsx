import { useRef, useState } from 'react';
import { CloudSun, Plug, ShieldCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { electricity, plugTypes } from '../data/electricity';
import { baggageRules } from '../data/baggageRules';
import { getClothingPreview, formatClimateValue } from '../travel-info/guideModel';
import TripBriefModal, { type BriefTopic } from './TripBriefModal';
import './TripBrief.css';
import { getInternationalProfile } from '../data/international';
import { allowanceLabel, type BaggageAllowance } from './baggageAllowance';

export default function TripBrief({ trip, allowance, onSaveAllowance }: { trip: Trip; allowance?: BaggageAllowance; onSaveAllowance: (value?: BaggageAllowance) => void }) {
  const climate = getTripClimate(trip.cityId, trip.departureDate, trip.returnDate);

  const power = baggageRules.find(rule => rule.id === 'power-banks');
  const electric = trip.countryId === 'JP' ? electricity.JP : null;
  const profile = getInternationalProfile(trip.countryId);
  const [topic, setTopic] = useState<BriefTopic | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const temperature = climate.map(segment => {
    const mean = segment.climate.recommendedMetrics?.meanTemperatureC;
    return `${segment.month}월 ${mean?.value !== null && mean?.value !== undefined ? formatClimateValue(mean.value, '°C') : '자료 확인 필요'}`;
  }).join(' / ');
  const clothing = [...new Set(climate.flatMap(segment => getClothingPreview(segment.climate, trip.travelPurpose).map(item => item.name)))].slice(0, 3);
  const cards = [
    { id: 'weather' as const, title: '날씨 · 옷차림', icon: CloudSun, summary: temperature, note: clothing.length ? clothing.join(' · ') : '선택한 도시의 기후자료를 확인해 주세요.' },
    { id: 'electricity' as const, title: '전압 · 플러그', icon: Plug, summary: electric ? `${electric.voltageV.value?.join(' / ')}V · ${plugTypes.A.label}` : profile?.electricity.value ?? '세부 정보 확인 필요', note: '플러그와 기기 Input 전압 확인' },
    { id: 'baggage' as const, title: '항공 수하물 안내', icon: ShieldCheck, summary: '기내 반입 · 보조배터리·액체류 등', note: power?.summary?.value ?? '주요 반입 제한 확인' },
  ];
  return <section className="pmb-trip-brief" aria-labelledby="pmb-trip-brief-title"><header><h2 id="pmb-trip-brief-title">YOUR TRIP BRIEF</h2><p>이번 여행에서 꼭 확인할 정보예요.</p><span>기본 확인 항목 3가지 · 공식 통계와 서비스 제안</span></header><div className="pmb-trip-brief-grid">
    {cards.map(card => <button className="pmb-trip-brief-card" type="button" key={card.id} aria-haspopup="dialog" onClick={event => { opener.current = event.currentTarget; setTopic(card.id); }}><span className="pmb-trip-brief-card-title"><card.icon size={21}/><strong>{card.title}</strong></span><span className="pmb-trip-brief-summary">{card.summary}</span><span className="pmb-trip-brief-card-note">{card.note}</span>{card.id === 'baggage' && <span className="pmb-trip-brief-allowance"><strong>{allowanceLabel(allowance)}</strong><small>{allowance ? '사용자 직접 입력 · 항공권 확인' : '내 무료 위탁수하물 허용량'}</small></span>}<span className="pmb-trip-brief-more">자세히 보기</span></button>)}
  </div>{topic && <TripBriefModal topic={topic} trip={trip} allowance={allowance} onSaveAllowance={onSaveAllowance} returnFocus={opener.current} onClose={() => setTopic(null)}/>}</section>;
}
