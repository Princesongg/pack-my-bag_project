import { useState } from 'react';
import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { destinations } from '../destination/destinations';
import WeatherGuide from '../travel-info/WeatherGuide';
import ElectricityInfo from '../travel-info/ElectricityInfo';
import BaggageGuide from '../travel-info/BaggageGuide';
import '../travel-info/TravelInfo.css';
import '../travel-info/MobileCompact.css';
import ServiceModal from './ServiceModal';
import { InternationalCurrency } from '../travel-info/InternationalInfo';
import { getInternationalProfile } from '../data/international';
import BaggageAllowanceForm from './BaggageAllowanceForm';
import type { BaggageAllowance } from './baggageAllowance';

export type BriefTopic = 'weather' | 'electricity' | 'baggage';
const titles = { weather: '날씨 · 옷차림', electricity: '전압 · 플러그', baggage: '항공 수하물 안내' };
export default function TripBriefModal({ topic, trip, allowance, onSaveAllowance, onClose, returnFocus }: { topic: BriefTopic; trip: Trip; allowance?: BaggageAllowance; onSaveAllowance: (value?: BaggageAllowance) => void; onClose: () => void; returnFocus: HTMLElement | null }) {
  const [month, setMonth] = useState(0);
  const [baggageTab, setBaggageTab] = useState<'restrictions' | 'allowance'>('restrictions');
  const climate = getTripClimate(trip.cityId, trip.departureDate, trip.returnDate);
  const city = destinations.find(country => country.id === trip.countryId)?.cities.find(city => city.id === trip.cityId);
  return <ServiceModal title={titles[topic]} topic={topic} onClose={onClose} returnFocus={returnFocus}>
    <div className="pmb-service pmb-guide-service pmb-brief-modal-content">
      {topic === 'weather' && <>{climate.length > 1 && <div className="pmb-guide-months" role="group" aria-label="여행 월 선택">{climate.map((segment, index) => <button type="button" key={`${segment.year}-${segment.month}`} aria-pressed={month === index} onClick={() => setMonth(index)}>{segment.year}년 {segment.month}월</button>)}</div>}<WeatherGuide key={month} segment={climate[month]} cityName={city?.english ?? trip.cityId} travelPurpose={trip.travelPurpose}/></>}
      {topic === 'electricity' && <><ElectricityInfo countryId={trip.countryId}/>{getInternationalProfile(trip.countryId) && <section aria-label="통화와 도시별 시차"><h3>통화 · 도시별 시차</h3><InternationalCurrency countryId={trip.countryId} cityId={trip.cityId} departureDate={trip.departureDate} returnDate={trip.returnDate}/></section>}</>}
      {topic === 'baggage' && <><div className="pmb-baggage-tabs" role="group" aria-label="항공 수하물 안내 선택"><button type="button" aria-pressed={baggageTab === 'restrictions'} onClick={() => setBaggageTab('restrictions')}>반입 제한</button><button type="button" aria-pressed={baggageTab === 'allowance'} onClick={() => setBaggageTab('allowance')}>내 수하물 허용량</button></div><div hidden={baggageTab !== 'restrictions'}><BaggageGuide/></div><div hidden={baggageTab !== 'allowance'}><BaggageAllowanceForm value={allowance} cabinOnly={trip.baggageType === 'cabin-only'} onSave={onSaveAllowance}/></div></>}
    </div>
  </ServiceModal>;
}
