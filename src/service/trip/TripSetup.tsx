import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, MapPin, Search, X } from 'lucide-react';
import CountryPicker from '../destination/CountryPicker';
import { destinations, filterDestinations, selectCountry } from '../destination/destinations';
import { useTrip } from './TripContext';
import { baggageOptions, dateErrors, localToday, purposes, recalculateTrip, tripComplete } from './trip';
import './TripSetup.css';

export default function TripSetup({ onComplete }: { onComplete?: () => void }) {
  const { trip, setSelection, updateDetails, saved, persist } = useTrip();
  const navigate = useNavigate();
  const location = useLocation();
  const [today, setToday] = useState(localToday);
  const [submitted, setSubmitted] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  const cities = filterDestinations<{ id: string; name: string; english: string }>(country?.cities ?? [], cityQuery);
  const errors = dateErrors(trip, today);
  const current = recalculateTrip(trip, today);
  const complete = tripComplete(trip, today);
  useEffect(() => {
    const refresh = () => setToday(localToday());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => {
    if (location.hash !== '#trip-setup') return;
    const frame = requestAnimationFrame(() => {
      const panel = document.getElementById('trip-setup');
      panel?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      panel?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, location.key]);
  return <section id="trip-setup" className="pmb-setup pmb-container" tabIndex={-1} aria-labelledby="pmb-setup-title"><header><span>TRIP SETUP</span><h2 id="pmb-setup-title">어떤 여행을 준비하고 있나요?</h2><p>여행지부터 스타일까지 한 번에 정하고, 나만의 가방을 만들어 보세요.</p></header>
    <form noValidate onSubmit={event => {
      event.preventDefault(); setSubmitted(true);
      if (complete) { persist(); if (onComplete) onComplete(); else navigate('/implementation/workspace?view=bag'); }
      else requestAnimationFrame(() => document.querySelector<HTMLElement>('#trip-setup [aria-invalid="true"]')?.focus());
    }}>
      <div className="pmb-setup-destinations"><div><CountryPicker aligned selectedId={trip.countryId} onSelect={id => { setSelection(current => selectCountry(current, id)); setCityQuery(''); }}/>{submitted && !country && <p className="pmb-setup-error" role="alert">국가를 선택해 주세요.</p>}</div>
      <div className="pmb-setup-city-picker" role="group" aria-labelledby="pmb-setup-city-title"><h3 id="pmb-setup-city-title" className="pmb-setup-destination-title"><MapPin size={18}/> 도시 선택</h3><div className="pmb-setup-destination-controls"><label className="pmb-search-label" htmlFor="pmb-setup-city-search">도시 검색</label><div className="pmb-search"><Search size={20} aria-hidden="true"/><input id="pmb-setup-city-search" type="search" value={cityQuery} disabled={!country} onChange={event => setCityQuery(event.target.value)} placeholder={country ? `${country.name} 도시명으로 검색해 보세요` : '나라를 먼저 선택해 주세요'} aria-controls="pmb-setup-city-results" autoComplete="off"/><button type="button" disabled={!cityQuery} style={{ visibility: cityQuery ? 'visible' : 'hidden' }} aria-label="도시 검색어 지우기" onClick={() => { setCityQuery(''); document.getElementById('pmb-setup-city-search')?.focus(); }}><X size={17}/></button></div></div>{country && <><div id="pmb-setup-city-results" className="pmb-setup-city-grid">{cities.map(item => <button key={item.id} type="button" aria-pressed={trip.cityId === item.id} onClick={() => setSelection({ countryId: country.id, cityId: item.id })}><span><strong>{item.name}</strong><small>{item.english}</small></span>{trip.cityId === item.id && <Check size={16}/>}</button>)}</div>{!cities.length && <p role="status">검색 결과가 없어요.</p>}</>}{submitted && !city && <p className="pmb-setup-error" role="alert">도시를 선택해 주세요.</p>}</div></div>
      <fieldset><legend><CalendarDays size={18}/> 여행 날짜</legend><div className="pmb-setup-date-grid">
        <label>출발일<input name="departureDate" type="date" min={today} max="9999-12-31" required value={trip.departureDate} onChange={event => updateDetails({ departureDate: event.target.value })} aria-invalid={Boolean((submitted || trip.departureDate) && errors.departure)} aria-describedby="pmb-setup-departure-error"/><span id="pmb-setup-departure-error" className="pmb-setup-error">{(submitted || trip.departureDate) && errors.departure}</span></label>
        <label>귀국일<input name="returnDate" type="date" min={trip.departureDate >= today ? trip.departureDate : today} max="9999-12-31" required value={trip.returnDate} onChange={event => updateDetails({ returnDate: event.target.value })} aria-invalid={Boolean((submitted || trip.returnDate) && errors.returning)} aria-describedby="pmb-setup-return-error"/><span id="pmb-setup-return-error" className="pmb-setup-error">{(submitted || trip.returnDate) && errors.returning}</span></label>
      </div><p className="pmb-setup-duration" role="status">{current.tripDays !== null ? `${current.tripNights}박 ${current.tripDays}일 여행이네요!` : '출발일과 귀국일을 고르면 여행 기간을 계산해 드려요.'}</p></fieldset>
      <div className="pmb-setup-style-grid"><fieldset><legend>여행 목적</legend><div className="pmb-setup-chips">{purposes.map(option => <label key={option.id}><input type="radio" name="travelPurpose" value={option.id} checked={trip.travelPurpose === option.id} onChange={() => updateDetails({ travelPurpose: option.id })}/><span>{option.label}</span></label>)}</div>{submitted && !trip.travelPurpose && <p className="pmb-setup-error" role="alert">여행 목적을 선택해 주세요.</p>}</fieldset>
      <fieldset><legend>수하물 유형</legend><div className="pmb-setup-chips">{baggageOptions.map(option => <label key={option.id}><input type="radio" name="baggageType" value={option.id} checked={trip.baggageType === option.id} onChange={() => updateDetails({ baggageType: option.id })}/><span>{option.label}</span></label>)}</div>{submitted && !trip.baggageType && <p className="pmb-setup-error" role="alert">수하물 유형을 선택해 주세요.</p>}</fieldset></div>
      {!saved && <p className="pmb-setup-error" role="status">브라우저에 저장하지 못했어요. 현재 선택은 유지되지만 새로고침 시 사라질 수 있어요.</p>}
      <div className="pmb-setup-submit"><p>{country && city ? `${country.name} · ${city.name}` : '가볍게 준비하고, 설레는 여행을 시작해요.'}{complete && ` · ${current.tripNights}박 ${current.tripDays}일`}</p><button className="pmb-cta" type="submit">MAKE MY BAG <ArrowRight size={20}/></button></div>
    </form>
  </section>;
}
