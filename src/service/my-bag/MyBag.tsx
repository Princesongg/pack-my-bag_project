import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Luggage, Plus, Trash2 } from 'lucide-react';
import ServiceHeader from '../ServiceHeader';
import { useTrip } from '../trip/TripContext';
import { baggageOptions, localToday, purposes, recalculateTrip, tripComplete, type Trip } from '../trip/trip';
import { destinations } from '../destination/destinations';
import { bagCategories, bagStorageKey, getDefaultBagItems, loadBag, packingProgress, type BagState, type CategoryId } from './bag';
import '../service.css';
import './MyBag.css';
import PackLess from './PackLess';
import TripBrief from './TripBrief';
import { visibleBagItems } from './packLessModel';

const subscribeBagLayout = (notify: () => void) => {
  const media = window.matchMedia('(max-width: 768px)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export default function MyBag() {
  const { trip } = useTrip();
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  if (!country || !city) return <Navigate to="/implementation#trip-setup" replace/>;
  if (!tripComplete(trip, localToday())) return <Navigate to="/implementation#trip-setup" replace/>;
  return <BagChecklist key={bagStorageKey(trip)} trip={trip} destination={`${country.english.toUpperCase()} · ${city.english.toUpperCase()}`} cityName={`${country.name} · ${city.name}`}/>;
}

function BagChecklist({ trip, destination, cityName }: { trip: Trip; destination: string; cityName: string }) {
  const mobile = useSyncExternalStore(subscribeBagLayout, () => window.matchMedia('(max-width: 768px)').matches, () => false);
  const categoryColumns = mobile ? [bagCategories] : [
    bagCategories.filter(group => ['essentials', 'electronics', 'other'].includes(group.id)),
    bagCategories.filter(group => ['clothing', 'toiletries'].includes(group.id)),
  ];
  const defaults = useMemo(() => getDefaultBagItems(trip), [trip]);
  const key = bagStorageKey(trip);
  const [state, setState] = useState<BagState>(() => { try { return loadBag(window.localStorage, key, defaults); } catch { return { version: 1, checkedIds: [], customItems: [] }; } });
  const [saved, setSaved] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>('other');
  const [message, setMessage] = useState('');
  const allItems = [...defaults, ...state.customItems];
  const items = visibleBagItems(allItems, state.packLess?.decisions);
  const excludedItems = allItems.filter(item => !items.some(visible => visible.id === item.id));
  const progress = packingProgress(items, state.checkedIds);
  const current = recalculateTrip(trip);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); setSaved(true); }
    catch { setSaved(false); }
  }, [key, state]);
  function toggle(id: string) {
    setState(previous => ({ ...previous, checkedIds: previous.checkedIds.includes(id) ? previous.checkedIds.filter(value => value !== id) : [...previous.checkedIds, id] }));
  }
  function addItem(event: FormEvent) {
    event.preventDefault();
    const label = name.trim();
    if (!label) { setMessage('추가할 준비물 이름을 입력해 주세요.'); return; }
    const id = `custom:${crypto.randomUUID()}`;
    setState(previous => ({ ...previous, customItems: [...previous.customItems, { id, name: label, categoryId: category, custom: true }] }));
    setName(''); setMessage(`${label} 항목을 추가했어요.`);
  }
  function removeItem(id: string) {
    setState(previous => ({ ...previous, customItems: previous.customItems.filter(item => item.id !== id), checkedIds: previous.checkedIds.filter(value => value !== id) }));
    setMessage('직접 추가한 준비물을 삭제했어요.');
  }
  return <div className="pmb-service pmb-bag-service">
    <a className="pmb-skip" href="#pmb-bag-main">본문으로 건너뛰기</a><ServiceHeader currentPage="my-bag"/>
    <main id="pmb-bag-main" className="pmb-bag pmb-container">
      <header className="pmb-bag-heading"><span>MY BAG / YOUR PACKING LIST</span><h1>Ready to pack?</h1><h2>이제 여행 준비물을 챙겨볼까요?</h2><p>챙긴 물건부터 하나씩 체크해 보세요!</p></header>
      <section className="pmb-bag-trip" aria-label="선택한 여행 조건"><div><strong>{destination}</strong><span>{cityName}</span></div><div><strong>{current.tripNights}박 {current.tripDays}일 · {purposes.find(item => item.id === trip.travelPurpose)?.label}</strong><span>{trip.departureDate} — {trip.returnDate} · {baggageOptions.find(item => item.id === trip.baggageType)?.label}</span></div></section>
      <TripBrief trip={trip}/>
      <Link className="pmb-bag-edit-trip" to="/implementation#trip-setup">여행 정보 변경 <ArrowUpRight size={16}/></Link>
      <section className="pmb-bag-progress" aria-labelledby="pmb-bag-progress-title"><div><h2 id="pmb-bag-progress-title">PACKING PROGRESS</h2><strong>{progress.percent}%</strong></div><p aria-live="polite">전체 {progress.total}개 중 {progress.complete}개 체크 완료</p><div className="pmb-bag-progress-track" role="progressbar" aria-label="준비물 체크 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span style={{ width: `${progress.percent}%` }}/></div></section>

      {!saved && <p className="pmb-bag-warning" role="status">브라우저에 저장하지 못했어요. 현재 체크는 유지되지만 새로고침하면 사라질 수 있어요.</p>}
      <div className="pmb-bag-note"><Luggage size={20}/><p>나에게 필요한 물건만 챙겨보세요. 옷차림 참고 항목은 기존 여행 정보의 제안이며, 수량은 자동 계산하지 않습니다.</p><Link to="/implementation/travel-info?from=my-bag#pmb-guide-baggage">항공 반입 규정 확인 <ArrowUpRight size={16}/></Link></div>
      <div className="pmb-bag-categories">{categoryColumns.map((column, index) => <div className="pmb-bag-category-column" key={index}>{column.map(group => {
        const groupItems = items.filter(item => item.categoryId === group.id);
        return <section className="pmb-bag-category" key={group.id} aria-labelledby={`pmb-bag-${group.id}`}><header><h2 id={`pmb-bag-${group.id}`}>{group.name}</h2><span>{groupItems.filter(item => state.checkedIds.includes(item.id)).length} / {groupItems.length}</span></header><ul>{groupItems.map(item => <li key={item.id} data-item-id={item.id} className={state.checkedIds.includes(item.id) ? 'is-packed' : ''}><label title={item.note}><input type="checkbox" checked={state.checkedIds.includes(item.id)} onChange={() => toggle(item.id)}/><span>{item.name}{item.note && <small>옷차림 참고</small>}{state.packLess?.decisions[item.id]?.action === 'reduce' && <small>{state.packLess.decisions[item.id].quantity}개 · 직접 설정</small>}{item.custom && <small>직접 추가</small>}</span></label>{item.custom && <button type="button" onClick={() => removeItem(item.id)} aria-label={`${item.name} 삭제`}><Trash2 size={17}/></button>}</li>)}</ul></section>;
      })}</div>)}</div>
      {excludedItems.length > 0 && <details className="pmb-bag-excluded"><summary>제외한 준비물 · {excludedItems.length}개</summary><ul>{excludedItems.map(item => <li key={item.id}><span>{item.name}</span><button type="button" onClick={() => setState(previous => previous.packLess ? { ...previous, packLess: { ...previous.packLess, decisions: { ...previous.packLess.decisions, [item.id]: { action: 'keep' } } } } : previous)} aria-label={`${item.name} 복원`}>복원하기</button></li>)}</ul></details>}
      <PackLess items={allItems} tripDays={current.tripDays} saved={state.packLess} onApply={packLess => setState(previous => ({ ...previous, packLess }))} onUndo={() => setState(previous => previous.packLess?.previous ? { ...previous, packLess: previous.packLess.previous } : previous)}/>
      <form className="pmb-bag-add" onSubmit={addItem}><h2>나만의 준비물 추가</h2><div><label>카테고리<select value={category} onChange={event => setCategory(event.target.value as CategoryId)}>{bagCategories.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label className="pmb-bag-name">준비물 이름<input value={name} onChange={event => setName(event.target.value)} maxLength={60} placeholder="예: 여행 노트"/></label><button type="submit"><Plus size={18}/> 추가</button></div><p role="status">{message}</p></form>
      <nav className="pmb-bag-actions" aria-label="여행 준비 단계 이동"><Link to="/implementation#trip-setup"><ArrowLeft size={17}/> PREVIOUS · TRIP SETUP</Link><span>체크 상태는 이 여행에 자동 저장돼요.</span></nav>
    </main><footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span></footer>
  </div>;
}
