import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import ServiceHeader from '../ServiceHeader';
import { useTrip } from '../trip/TripContext';
import { baggageOptions, localToday, purposes, recalculateTrip, tripComplete } from '../trip/trip';
import { destinations } from '../destination/destinations';
import { getTripClimate } from '../data/climate';
import { travelNotices } from '../data/notices';
import WeatherGuide from './WeatherGuide';
import EssentialInfo from './EssentialInfo';
import { MobileMore, useCompactGuide } from './MobileCompact';
import '../service.css';
import './TravelInfo.css';
import './MobileCompact.css';

export default function TravelInfo() {
  const { trip, saved } = useTrip();
  const mobile = useCompactGuide();
  const [activeMonth, setActiveMonth] = useState(0);
  const [today, setToday] = useState(localToday);
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  const complete = tripComplete(trip, today);
  const current = recalculateTrip(trip, today);
  const segments = useMemo(() => complete ? getTripClimate(trip.cityId, trip.departureDate, trip.returnDate) : [], [complete, trip.cityId, trip.departureDate, trip.returnDate]);
  const segment = segments[Math.min(activeMonth, segments.length - 1)];
  useEffect(() => { setActiveMonth(0); }, [trip.cityId, trip.departureDate, trip.returnDate]);
  useEffect(() => {
    window.scrollTo(0, 0);
    const refresh = () => setToday(localToday());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  if (!country || !city) return <Navigate to="/implementation/destination" replace/>;
  if (!complete || !segment) return <Navigate to="/implementation/trip-details" replace/>;
  return <div className="pmb-service pmb-guide-service">
    <a href="#pmb-guide-main" className="pmb-skip">본문으로 건너뛰기</a>
    <ServiceHeader currentPage="travel-info"/>
    <main id="pmb-guide-main" className="pmb-guide pmb-container">
      <Link className="pmb-guide-back" to="/implementation/trip-details"><ArrowLeft size={16}/> 여행 일정 및 스타일 수정</Link>
      <header className="pmb-guide-heading"><span className="pmb-guide-eyebrow">YOUR TRAVEL GUIDE</span>{mobile ? <h1>{city.name} 여행 준비 정보</h1> : <><h1>여행 전 꼭 알아야 할 정보<span>More ready.<br/>More excited.</span></h1><p>여행지는 정했으니, 이제 준비를 조금 더 가볍게.<br/>선택한 여행의 기후와 꼭 필요한 정보를 모았어요.</p></>}</header>
      <section className="pmb-guide-trip" aria-label="선택한 여행 정보"><div><img src={`/flags/${country.id.toLowerCase()}.svg`} width="30" height="21" alt=""/><strong>{country.name} · {city.name}<span>{country.english.toUpperCase()} · {city.english.toUpperCase()}</span></strong></div><p><CalendarDays size={19}/><span>{trip.departureDate.replaceAll('-', '.')} — {trip.returnDate.replaceAll('-', '.')}<small>{current.tripNights}박 {current.tripDays}일 · {purposes.find(item => item.id === trip.travelPurpose)?.label} · {baggageOptions.find(item => item.id === trip.baggageType)?.label}</small></span></p><Link to="/implementation/trip-details">여행 조건 수정 <ArrowUpRight size={16}/></Link></section>
      {!saved && <p className="pmb-guide-pending" role="status">현재 선택 정보는 유지되지만 브라우저에 저장하지 못했습니다. 새로고침 시 사라질 수 있어요.</p>}
      <nav className="pmb-guide-section-nav" aria-label="여행 정보 섹션"><a href="#pmb-guide-weather">날씨와 옷차림</a><a href="#pmb-guide-essentials">여행 필수 정보</a><a href="#pmb-guide-baggage">항공 규정 확인</a></nav>
      <section id="pmb-guide-weather" aria-labelledby="pmb-weather-title"><div className="pmb-guide-section-title"><span className="pmb-guide-eyebrow"><Sparkles size={16}/> WEATHER & WHAT TO WEAR</span><h2 id="pmb-weather-title">날씨를 알아두면,<br className="pmb-guide-mobile-break"/> 가방이 가벼워져요.</h2><p>실시간 날씨 대신, 공식 관측자료로 여행할 달의 기후를 살펴보세요.</p></div>
        {segments.length > 1 && <div className="pmb-guide-months" role="group" aria-label="여행 월별 기후 선택">{segments.map((item, index) => <button type="button" key={`${item.year}-${item.month}`} data-month={`${item.year}-${item.month}`} aria-pressed={index === Math.min(activeMonth, segments.length - 1)} aria-controls="pmb-weather-panel" onClick={() => setActiveMonth(index)}>{item.year}년 {item.month}월 <span>{item.daysCovered}일 여행</span></button>)}</div>}
        <WeatherGuide segment={segment} cityName={city.english} travelPurpose={trip.travelPurpose}/>
      </section>
      <EssentialInfo countryId={country.id} travelPurpose={trip.travelPurpose} tripDays={current.tripDays}/>
      <MobileMore title="여행 정보 이용 안내"><aside className="pmb-guide-source-notice"><MapPin size={21}/><div><strong>정보를 확인하고, 나에게 맞게 준비하세요.</strong><p>{travelNotices.sources}</p><p>{travelNotices.clothing}</p></div></aside></MobileMore>
      <div className="pmb-guide-actions"><Link to="/implementation/trip-details" className="pmb-guide-back"><ArrowLeft size={17}/> PREVIOUS</Link><Link to="/implementation/my-bag" className="pmb-bag-next">NEXT · MY BAG <ArrowUpRight size={16}/></Link></div>
    </main>
    <footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span><Link to="/implementation"><ArrowLeft size={14}/> 서비스 HOME으로</Link></footer>
  </div>;
}
