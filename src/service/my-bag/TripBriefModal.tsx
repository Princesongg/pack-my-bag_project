import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Trip } from '../trip/trip';
import { getTripClimate } from '../data/climate';
import { destinations } from '../destination/destinations';
import WeatherGuide from '../travel-info/WeatherGuide';
import ElectricityInfo from '../travel-info/ElectricityInfo';
import BaggageGuide from '../travel-info/BaggageGuide';
import '../travel-info/TravelInfo.css';
import '../travel-info/MobileCompact.css';
import './TripBriefModal.css';

export type BriefTopic = 'weather' | 'electricity' | 'baggage';
const titles = { weather: '날씨 · 옷차림', electricity: '전압 · 플러그', baggage: '항공 반입 규정' };
export default function TripBriefModal({ topic, trip, onClose, returnFocus }: { topic: BriefTopic; trip: Trip; onClose: () => void; returnFocus: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [closing, setClosing] = useState(false);
  const [month, setMonth] = useState(0);
  const climate = getTripClimate(trip.cityId, trip.departureDate, trip.returnDate);
  const city = destinations.find(country => country.id === trip.countryId)?.cities.find(city => city.id === trip.cityId);
  useEffect(() => {
    const opener = returnFocus;
    const scroll = window.scrollY;
    const style = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow };
    document.body.style.position = 'fixed'; document.body.style.top = `-${scroll}px`; document.body.style.width = '100%'; document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      window.clearTimeout(timer.current);
      Object.assign(document.body.style, style);
      window.scrollTo({ top: scroll, behavior: 'instant' });
      opener?.focus({ preventScroll: true });
    };
  }, []);
  function close() {
    if (closing) return;
    setClosing(true);
    timer.current = window.setTimeout(onClose, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140);
  }
  return createPortal(<dialog ref={dialog} className={`pmb-brief-modal ${closing ? 'is-closing' : ''}`} data-topic={topic} aria-labelledby="pmb-brief-modal-title" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(element => element.checkVisibility() && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
    if (!controls.length) return;
    event.preventDefault();
    const index = controls.indexOf(document.activeElement as HTMLElement);
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
  }} onCancel={event => { event.preventDefault(); close(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }}>
    <header className="pmb-brief-modal-header"><h2 id="pmb-brief-modal-title">{titles[topic]}</h2><button type="button" onClick={close} aria-label="상세 정보 닫기" autoFocus><X size={20}/><span>닫기</span></button></header>
    <div className="pmb-service pmb-guide-service pmb-brief-modal-content">
      {topic === 'weather' && <>{climate.length > 1 && <div className="pmb-guide-months" role="group" aria-label="여행 월 선택">{climate.map((segment, index) => <button type="button" key={`${segment.year}-${segment.month}`} aria-pressed={month === index} onClick={() => setMonth(index)}>{segment.year}년 {segment.month}월</button>)}</div>}<WeatherGuide key={month} segment={climate[month]} cityName={city?.english ?? trip.cityId} travelPurpose={trip.travelPurpose}/></>}
      {topic === 'electricity' && <ElectricityInfo countryId={trip.countryId}/>}
      {topic === 'baggage' && <BaggageGuide/>}
    </div>
  </dialog>, document.body);
}
