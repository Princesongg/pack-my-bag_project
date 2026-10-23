import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Backpack, BriefcaseBusiness, CalendarDays, Check, Compass, Luggage, MapPin, Mountain, Sun } from 'lucide-react';
import ServiceHeader from '../ServiceHeader';
import { destinations } from '../destination/destinations';
import { useTrip } from './TripContext';
import { baggageOptions, dateErrors, localToday, purposes, recalculateTrip, tripComplete } from './trip';
import TripProgress from './TripProgress';
import '../service.css';
import './TripDetails.css';

const icons = { compass: Compass, sun: Sun, mountain: Mountain, briefcase: BriefcaseBusiness, backpack: Backpack, luggage: Luggage };

export default function TripDetails() {
  const { trip, updateDetails, saved, persist } = useTrip();
  const [today, setToday] = useState(localToday);
  const navigate = useNavigate();
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  const errors = dateErrors(trip, today);
  const current = recalculateTrip(trip, today);
  const complete = tripComplete(trip, today);
  const purpose = purposes.find(item => item.id === trip.travelPurpose);
  const baggage = baggageOptions.find(item => item.id === trip.baggageType);

  useEffect(() => {
    window.scrollTo(0, 0);
    const refresh = () => setToday(localToday());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);

  if (!country || !city) return <Navigate to="/implementation/destination" replace />;

  const missing = [errors.departure, errors.returning, !purpose && '여행 스타일을 선택해 주세요.', !baggage && '수하물 유형을 선택해 주세요.'].filter(Boolean);
  const destinationLabel = `${country.english.toUpperCase()} · ${city.english.toUpperCase()}`;
  const formatDate = (value: string) => value.replaceAll('-', '.');

  return <div className="pmb-service pmb-details-service">
    <a href="#pmb-details-main" className="pmb-skip">본문으로 건너뛰기</a>
    <ServiceHeader />
    <main id="pmb-details-main" className="pmb-details pmb-container">
      <Link to="/implementation/destination" className="pmb-details-back"><ArrowLeft size={16}/> 국가·도시 선택으로</Link>
      <TripProgress current={2} />
      <header className="pmb-details-heading"><span className="pmb-kicker">STEP 02 / TRIP DETAILS</span><h1>When are you<br/><span>taking off?</span></h1><h2>어떤 여행을 계획하고 있나요?</h2><p>여행 일정과 스타일을 알려주세요.<br className="pmb-details-mobile-break"/> 여행에 필요한 준비물을 정리해 드릴게요.</p></header>
      <div className="pmb-details-destination"><img src={`/flags/${country.id.toLowerCase()}.svg`} alt="" width="28" height="20"/><div><strong>{destinationLabel}</strong><span>{country.name} · {city.name}</span></div><Link to="/implementation/destination">여행지 변경 <ArrowRight size={14}/></Link></div>
      <form noValidate onSubmit={event => { event.preventDefault(); if (complete) { persist(); navigate('/implementation/travel-info'); } }}>
        <fieldset className="pmb-details-section"><legend><span>01</span> 언제 여행을 떠나시나요?</legend><div className="pmb-date-grid">
          <div><label htmlFor="pmb-departure">출발일</label><input id="pmb-departure" name="departureDate" type="date" required min={today} max="9999-12-31" value={trip.departureDate} onChange={event => updateDetails({ departureDate: event.target.value })} aria-invalid={!!trip.departureDate && !!errors.departure} aria-describedby="pmb-departure-error"/><p id="pmb-departure-error" className={trip.departureDate && errors.departure ? 'pmb-details-error' : 'pmb-date-hint'}>{trip.departureDate ? errors.departure : '오늘 이후의 날짜를 선택해 주세요.'}</p></div>
          <div><label htmlFor="pmb-return">귀국일</label><input id="pmb-return" name="returnDate" type="date" required min={trip.departureDate && trip.departureDate >= today ? trip.departureDate : today} max="9999-12-31" value={trip.returnDate} onChange={event => updateDetails({ returnDate: event.target.value })} aria-invalid={!!trip.returnDate && !!errors.returning} aria-describedby="pmb-return-error"/><p id="pmb-return-error" className={trip.returnDate && errors.returning ? 'pmb-details-error' : 'pmb-date-hint'}>{trip.returnDate ? errors.returning : '출발일과 같거나 늦은 날짜를 선택해 주세요.'}</p></div>
        </div><p className="pmb-duration" role="status"><CalendarDays size={18}/>{current.tripDays !== null ? `${current.tripNights}박 ${current.tripDays}일 여행이네요!` : '출발일과 귀국일을 고르면 여행 기간을 계산해 드려요.'}</p></fieldset>
        <fieldset className="pmb-details-section"><legend><span>02</span> 이번 여행은 어떤 스타일인가요?</legend><p className="pmb-details-help">가장 가까운 여행 스타일 하나를 선택해 주세요.</p><div className="pmb-purpose-grid">{purposes.map(option => {
          const Icon = icons[option.icon];
          return <label key={option.id} className="pmb-detail-option"><input type="radio" name="travelPurpose" required value={option.id} checked={trip.travelPurpose === option.id} onChange={() => updateDetails({ travelPurpose: option.id })}/><span><Icon size={23} aria-hidden="true"/><strong>{option.label}</strong><i><Check size={14}/></i></span></label>;
        })}</div></fieldset>
        <fieldset className="pmb-details-section"><legend><span>03</span> 짐은 어떻게 가져가시나요?</legend><div className="pmb-baggage-grid">{baggageOptions.map(option => {
          const Icon = icons[option.icon];
          return <label key={option.id} className="pmb-detail-option"><input type="radio" name="baggageType" required value={option.id} checked={trip.baggageType === option.id} onChange={() => updateDetails({ baggageType: option.id })}/><span><Icon size={23} aria-hidden="true"/><strong>{option.label}</strong><i><Check size={14}/></i></span></label>;
        })}</div></fieldset>
        <section className="pmb-trip-summary" aria-labelledby="pmb-summary-heading"><h2 id="pmb-summary-heading"><MapPin size={18}/> MY TRIP SUMMARY</h2><strong>{destinationLabel}</strong><dl><div><dt>여행 일정</dt><dd>{trip.departureDate ? formatDate(trip.departureDate) : '출발일 미선택'} — {trip.returnDate ? formatDate(trip.returnDate) : '귀국일 미선택'}{current.tripDays !== null && <b>{current.tripNights}박 {current.tripDays}일</b>}</dd></div><div><dt>여행 스타일</dt><dd>{purpose?.label ?? '미선택'}</dd></div><div><dt>수하물</dt><dd>{baggage?.label ?? '미선택'}</dd></div></dl></section>
        {!saved && <p className="pmb-details-error" role="status">브라우저 저장 공간을 사용할 수 없어 새로고침하면 정보가 사라질 수 있어요. 현재 화면 이동 중에는 유지돼요.</p>}
        <div className="pmb-details-actions"><Link to="/implementation/destination" className="pmb-details-back"><ArrowLeft size={16}/> PREVIOUS</Link><button type="submit" className="pmb-cta" disabled={!complete} aria-describedby="pmb-details-status">NEXT <ArrowRight size={18}/></button></div>
        <p id="pmb-details-status" className="pmb-details-status">{complete ? '입력 완료! NEXT를 눌러 여행 필수 정보를 확인해 보세요.' : missing.join(' ')}</p>
      </form>
    </main>
    <footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span><Link to="/implementation"><ArrowLeft size={14}/> 서비스 HOME으로</Link></footer>

  </div>;
}
