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
  const [dateTouched, setDateTouched] = useState({ departure: false, returning: false });
  const [cityQuery, setCityQuery] = useState('');
  const [editingCountry, setEditingCountry] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  // Disclosure affects only presentation; the trip remains the source of truth.
  const focusOnCompact = (id: string) => requestAnimationFrame(() => {
    if (window.matchMedia('(max-width:640px)').matches) document.getElementById(id)?.focus({ preventScroll: true });
  });
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  const cities = filterDestinations<{ id: string; name: string; english: string }>(country?.cities ?? [], cityQuery);
  const errors = dateErrors(trip, today);
  const departureError = (submitted || dateTouched.departure) ? errors.departure : '';
  const returnError = (submitted || dateTouched.returning) ? errors.returning : '';
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
      <div className="pmb-setup-destinations"><div className={`pmb-setup-country-picker ${country && !editingCountry ? 'is-summarized' : ''}`}>
        {country && <div className="pmb-setup-selection-summary"><span><small>국가</small><strong>{country.name}</strong></span><button id="pmb-country-change" data-change-country type="button" aria-label="국가 변경" aria-expanded={editingCountry} aria-controls="pmb-all-countries" onClick={() => { setEditingCountry(value => !value); focusOnCompact('pmb-country-search'); }}>변경</button></div>}
        <CountryPicker aligned selectedId={trip.countryId} onSelect={id => { setSelection(current => selectCountry(current, id)); setCityQuery(''); setEditingCountry(false); setEditingCity(false); focusOnCompact('pmb-country-change'); }}/>{submitted && !country && <p className="pmb-setup-error" role="alert">국가를 선택해 주세요.</p>}</div>
      <div className={`pmb-setup-city-picker ${city && !editingCity ? 'is-summarized' : ''}`} role="group" aria-labelledby="pmb-setup-city-title">{city && <div className="pmb-setup-selection-summary"><span><small>도시</small><strong>{city.name}</strong></span><button id="pmb-city-change" data-change-city type="button" aria-label="도시 변경" aria-expanded={editingCity} aria-controls="pmb-setup-city-results" onClick={() => { setEditingCity(value => !value); setCityQuery(''); focusOnCompact('pmb-setup-city-search'); }}>변경</button></div>}<h3 id="pmb-setup-city-title" className="pmb-setup-destination-title"><MapPin size={18}/> 도시 선택</h3><div className="pmb-setup-destination-controls"><label className="pmb-search-label" htmlFor="pmb-setup-city-search">도시 검색</label><div className="pmb-search"><Search size={20} aria-hidden="true"/><input id="pmb-setup-city-search" type="search" value={cityQuery} disabled={!country} onChange={event => setCityQuery(event.target.value)} placeholder={country ? `${country.name} 도시명으로 검색해 보세요` : '나라를 먼저 선택해 주세요'} aria-controls="pmb-setup-city-results" autoComplete="off"/><button type="button" disabled={!cityQuery} style={{ visibility: cityQuery ? 'visible' : 'hidden' }} aria-label="도시 검색어 지우기" onClick={() => { setCityQuery(''); document.getElementById('pmb-setup-city-search')?.focus(); }}><X size={17}/></button></div></div>{country && <><div id="pmb-setup-city-results" className="pmb-setup-city-grid">{cities.map(item => <button key={item.id} type="button" aria-pressed={trip.cityId === item.id} onClick={() => { setSelection({ countryId: country.id, cityId: item.id }); setEditingCity(false); focusOnCompact('pmb-city-change'); }}><span><strong>{item.name}</strong><small>{item.english}</small></span>{trip.cityId === item.id && <Check size={16}/>}</button>)}</div>{!cities.length && <p role="status">검색 결과가 없어요.</p>}</>}{submitted && !city && <p className="pmb-setup-error" role="alert">도시를 선택해 주세요.</p>}</div></div>
      <fieldset><legend><CalendarDays size={18}/> 여행 날짜</legend><div className="pmb-setup-date-grid">
        <label><span>출발일</span><span className="pmb-setup-date-control"><input name="departureDate" type="date" min={today} max="9999-12-31" required value={trip.departureDate} onChange={event => { setDateTouched(previous=>({...previous,departure:false})); updateDetails({ departureDate: event.target.value }); }} onBlur={()=>setDateTouched(previous=>({...previous,departure:true}))} aria-invalid={Boolean(departureError)} aria-describedby="pmb-setup-date-help pmb-setup-departure-error"/></span></label>
        <label><span>귀국일</span><span className="pmb-setup-date-control"><input name="returnDate" type="date" min={trip.departureDate >= today ? trip.departureDate : today} max="9999-12-31" required value={trip.returnDate} onChange={event => { setDateTouched(previous=>({...previous,returning:false})); updateDetails({ returnDate: event.target.value }); }} onBlur={()=>setDateTouched(previous=>({...previous,returning:true}))} aria-invalid={Boolean(returnError)} aria-describedby="pmb-setup-date-help pmb-setup-return-error"/></span></label>
      </div><div className="pmb-setup-date-feedback" aria-live="polite"><p id="pmb-setup-date-help">날짜를 선택하면 여행 기간을 계산해요.</p><div className="pmb-setup-date-errors"><p id="pmb-setup-departure-error" className="pmb-setup-error">{departureError}</p><p id="pmb-setup-return-error" className="pmb-setup-error">{returnError}</p></div><p className="pmb-setup-duration">{current.tripDays !== null ? `${current.tripNights}박 ${current.tripDays}일 여행이네요!` : ''}</p></div></fieldset>
      <div className="pmb-setup-style-grid"><fieldset><legend>여행 목적</legend><div className="pmb-setup-chips">{purposes.map(option => <label key={option.id}><input type="radio" name="travelPurpose" value={option.id} checked={trip.travelPurpose === option.id} onChange={() => updateDetails({ travelPurpose: option.id })}/><span>{option.label}</span></label>)}</div>{submitted && !trip.travelPurpose && <p className="pmb-setup-error" role="alert">여행 목적을 선택해 주세요.</p>}</fieldset>
      <fieldset><legend>수하물 유형</legend><div className="pmb-setup-chips">{baggageOptions.map(option => <label key={option.id}><input type="radio" name="baggageType" value={option.id} checked={trip.baggageType === option.id} onChange={() => updateDetails({ baggageType: option.id })}/><span>{option.label}</span></label>)}</div>{submitted && !trip.baggageType && <p className="pmb-setup-error" role="alert">수하물 유형을 선택해 주세요.</p>}</fieldset></div>
      {!saved && <p className="pmb-setup-error" role="status">브라우저에 저장하지 못했어요. 현재 선택은 유지되지만 새로고침 시 사라질 수 있어요.</p>}
      <div className="pmb-setup-submit"><p>{country && city ? `${country.name} · ${city.name}` : '가볍게 준비하고, 설레는 여행을 시작해요.'}{complete && ` · ${current.tripNights}박 ${current.tripDays}일`}</p><button className="pmb-cta" type="submit">MAKE MY BAG <ArrowRight size={20}/></button></div>
    </form>
  </section>;
}
