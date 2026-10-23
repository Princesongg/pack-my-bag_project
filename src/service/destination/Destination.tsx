import { useTrip } from '../trip/TripContext';
import TripProgress from '../trip/TripProgress';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, Plane, Search } from 'lucide-react';
import ServiceHeader from '../ServiceHeader';
import CountryPicker from './CountryPicker';
import { citySearchThreshold, filterDestinations, destinations, selectCountry } from './destinations';
import '../service.css';
import './Destination.css';

export default function Destination() {
  const { trip: selection, setSelection, saved, persist } = useTrip();
  const navigate = useNavigate();
  const [cityQuery, setCityQuery] = useState('');
  const country = destinations.find(item => item.id === selection.countryId);
  const city = country?.cities.find(item => item.id === selection.cityId);
  const cities = filterDestinations<{ id: string; name: string; english: string }>(country?.cities ?? [], cityQuery);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return <div className="pmb-service pmb-destination-service">
    <a className="pmb-skip" href="#pmb-destination-main">본문으로 건너뛰기</a>
    <ServiceHeader />
    <main id="pmb-destination-main" className="pmb-destination pmb-container">
      <Link to="/implementation" className="pmb-destination-back"><ArrowLeft size={16}/> 서비스 HOME으로</Link>
      <TripProgress current={1} />
      <header className="pmb-destination-heading"><span className="pmb-kicker">STEP 01 / YOUR DESTINATION</span><h1>Where are you<br className="pmb-destination-break"/> <span>heading?</span><Plane size={36} aria-hidden="true"/></h1><h2>어디로 떠나시나요?</h2><p>여행할 나라를 선택해 주세요. 여행지에 맞는 정보를 준비해 드릴게요.</p></header>
      <CountryPicker selectedId={selection.countryId} onSelect={countryId => { setSelection(current => selectCountry(current, countryId)); setCityQuery(''); }} />
      {country ? <fieldset className="pmb-choice-group pmb-city-group" key={country.id}><legend><span>02</span> 어느 도시로 떠나세요? <small>{country.name}</small></legend><p className="pmb-choice-help">이번 여행에서 방문할 도시 한 곳을 선택해 주세요.</p>{country.cities.length >= citySearchThreshold && <div className="pmb-city-search"><label className="pmb-search-label" htmlFor="pmb-city-search">도시 검색</label><div className="pmb-search"><Search size={20} aria-hidden="true"/><input id="pmb-city-search" type="search" placeholder="한글 또는 영문 도시명" value={cityQuery} onChange={event => setCityQuery(event.target.value)}/></div></div>}<div className="pmb-city-grid">{cities.map(item => <label className="pmb-choice pmb-city-choice" key={item.id}><input type="radio" name="city" value={item.id} checked={selection.cityId === item.id} onChange={() => setSelection({ countryId: country.id, cityId: item.id })}/><span className="pmb-choice-content"><MapPin size={22} aria-hidden="true"/><span><strong>{item.name}</strong><span className="pmb-choice-english">{item.english}</span></span><span className="pmb-choice-check"><Check size={15}/></span></span></label>)}</div>{cities.length === 0 && <p className="pmb-search-empty" role="status">검색 결과가 없어요. 도시명을 확인해 주세요.</p>}</fieldset> : <div className="pmb-city-placeholder"><MapPin size={24}/><span>나라를 고르면 도시 목록이 여기에 나타나요.</span></div>}
      <div className="pmb-selection-summary" role="status" aria-live="polite"><MapPin size={19}/><div><small>YOUR DESTINATION</small><p>{country ? `${country.name} / ${city?.name ?? '도시를 선택해 주세요'}` : '국가와 도시를 선택해 주세요'}</p></div>{country && city && <span className="pmb-selection-complete"><Check size={14}/> 선택 완료</span>}</div>
      {!saved && <p className="pmb-storage-note" role="status">브라우저 저장 공간을 사용할 수 없어 이 화면에서만 선택이 유지돼요.</p>}
      <div className="pmb-destination-actions"><Link to="/implementation" className="pmb-destination-back"><ArrowLeft size={16}/> 이전 화면</Link><div><button type="button" className="pmb-cta" disabled={!country || !city} aria-describedby="pmb-next-note" onClick={() => { persist(); navigate('/implementation/trip-details'); }}>NEXT <ArrowRight size={18}/></button><p id="pmb-next-note">다음: 일정 및 여행 스타일 설정</p></div></div>
    </main>
    <footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span><Link to="/implementation"><ArrowLeft size={14}/> 서비스 HOME으로</Link></footer>

  </div>;
}
