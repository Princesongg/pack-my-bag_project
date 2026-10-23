import { ArrowLeft, Plane, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { destinations } from '../destination/destinations';
import { recalculateTrip, type Trip } from '../trip/trip';
import type { BagItem } from './bag';
import type { LastMinuteState } from './lastMinuteModel';
import LastMinuteBag from './LastMinuteBag';
import './LastMinuteScreen.css';

export default function LastMinuteScreen({ trip, items, saved, onChange, storageSaved }: { trip: Trip; items: readonly BagItem[]; saved?: LastMinuteState; onChange: (state: LastMinuteState) => void; storageSaved: boolean }) {
  const country = destinations.find(country => country.id === trip.countryId)!;
  const city = country.cities.find(city => city.id === trip.cityId)!;
  const current = recalculateTrip(trip);
  return <div className="pmb-service pmb-last-call">
    <a className="pmb-skip" href="#pmb-last-call-main">본문으로 건너뛰기</a>
    <header className="pmb-last-call-nav"><Link to="/implementation" className="pmb-last-call-brand">PACK MY BAG ✳</Link><Link to="?view=bag"><ArrowLeft size={17}/> MY BAG으로 돌아가기</Link></header>
    <main id="pmb-last-call-main" className="pmb-last-call-main">
      <header className="pmb-last-call-heading"><span><Plane size={18}/> LAST MINUTE BAG</span><h1>LAST CALL<span>!</span></h1><p>집을 나서기 전, 마지막 체크.</p></header>
      <section className="pmb-last-call-ticket" aria-label="선택한 여행 요약"><div className="pmb-last-call-destination"><span><Ticket size={18}/> YOUR TRIP</span><h2>{city.english.toUpperCase()}</h2><p>{country.flag} {country.name} · {city.name}</p></div><dl><div><dt>출발일</dt><dd>{trip.departureDate.replaceAll('-', '.')}</dd></div><div><dt>여행 기간</dt><dd>{current.tripNights}박 {current.tripDays}일</dd></div></dl></section>
      {!storageSaved && <p role="status" className="pmb-bag-warning">브라우저에 저장하지 못했어요. 현재 확인 상태는 유지되지만 새로고침하면 사라질 수 있어요.</p>}
      <LastMinuteBag items={items} saved={saved} onChange={onChange}/>
    </main>
  </div>;
}
