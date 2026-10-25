import PlugVisuals from '../travel-info/PlugVisuals';
import BaggageBrief from './BaggageBrief';
import { useRef, useState } from 'react';
import { CloudSun, Plug, ShieldCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import WeatherBrief from './WeatherBrief';
import { getElectricityGuide } from '../data/electricityGuide';

import TripBriefModal, { type BriefTopic } from './TripBriefModal';
import './TripBrief.css';
import type { BaggageAllowance } from './baggageAllowance';

export default function TripBrief({ trip, allowance, onSaveAllowance }: { trip: Trip; allowance?: BaggageAllowance; onSaveAllowance: (value?: BaggageAllowance) => void }) {


  const electric = getElectricityGuide(trip.countryId);
  const [topic, setTopic] = useState<BriefTopic | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const cards = [
    { id: 'weather' as const, title: '날씨 · 옷차림', icon: CloudSun, summary: <WeatherBrief trip={trip}/>, note: '' },
    { id: 'electricity' as const, title: '전압 · 플러그', icon: Plug, summary: electric?.main ?? '공식 출처 확인 필요', note: electric?.preparation[1].reason ?? '플러그와 기기 Input 전압 확인' },
    { id: 'baggage' as const, title: '항공 수하물 안내', icon: ShieldCheck, summary: '기내 반입 · 보조배터리·액체류 등', note: '' },
  ];
  return <section className="pmb-trip-brief" aria-labelledby="pmb-trip-brief-title"><header><h2 id="pmb-trip-brief-title">YOUR TRIP BRIEF</h2><p>이번 여행에서 꼭 확인할 정보예요.</p><span>기본 확인 항목 3가지 · 공식 통계와 서비스 제안</span></header><div className="pmb-trip-brief-grid">
    {cards.map(card => <button className="pmb-trip-brief-card" data-topic={card.id} type="button" key={card.id} aria-haspopup="dialog" onClick={event => { opener.current = event.currentTarget; setTopic(card.id); }}><span className="pmb-trip-brief-card-title"><card.icon size={21}/><strong>{card.title}</strong></span><span className={card.id === 'weather' ? 'pmb-trip-brief-temperatures' : 'pmb-trip-brief-summary'}>{card.summary}</span>{card.id === 'electricity' && <span className="pmb-trip-brief-plug-types">{electric?.typeSummary}</span>}{card.id === 'electricity' && <PlugVisuals countryId={trip.countryId} compact/>}{card.id === 'electricity' && <span className="pmb-trip-brief-card-note">{card.note}</span>}{card.id === 'baggage' && <BaggageBrief allowance={allowance}/>}<span className="pmb-trip-brief-more">자세히 보기</span></button>)}
  </div>{topic && <TripBriefModal key={`${trip.countryId}/${trip.cityId}/${trip.departureDate}/${trip.returnDate}`} topic={topic} trip={trip} allowance={allowance} onSaveAllowance={onSaveAllowance} returnFocus={opener.current} onClose={() => setTopic(null)}/>}</section>;
}
