import DestinationClock from './DestinationClock';
import EntryPreparationBanner from './EntryPreparationBanner';
import { applyEntryCheck, entryFlagIds, entryItemId, matchesEntryItem, restoreEntryChecks, type EntryCheckKind } from './entryChecks';
import { withElectricityRecommendation } from './bag';
import { getCountryCurrency } from '../data/currencies';
import FinalCheckCTA from './FinalCheckCTA';
import LastMinuteScreen from './LastMinuteScreen';
import { restoreLastMinute } from './lastMinuteModel';
import { useEffect, useLayoutEffect, useRef, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ChevronDown, Luggage, Plus, Trash2 } from 'lucide-react';
import ServiceHeader from '../ServiceHeader';
import { useTrip } from '../trip/TripContext';
import { baggageOptions, localToday, purposes, recalculateTrip, tripComplete, type Trip } from '../trip/trip';
import { destinations } from '../destination/destinations';
import { bagCategories, bagStorageKey, getDefaultBagItems, loadBag, packingProgress, type BagState, type CategoryId } from './bag';
import '../service.css';
import './MyBag.css';
import PackLess from './PackLess';
import TripBrief from './TripBrief';
import PackingRedFlags, { type RedFlagRequest } from './PackingRedFlags';
import { allowanceCheckId, type BaggageAllowance } from './baggageAllowance';
import { visibleBagItems } from './packLessModel';

const subscribeBagLayout = (notify: () => void) => {
  const media = window.matchMedia('(max-width: 768px)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export default function MyBag({ lastMinuteView = false }: { lastMinuteView?: boolean }) {
  const { trip } = useTrip();
  const country = destinations.find(item => item.id === trip.countryId);
  const city = country?.cities.find(item => item.id === trip.cityId);
  if (!country || !city) return <Navigate to="/implementation/workspace" replace/>;
  if (!tripComplete(trip, localToday())) return <Navigate to="/implementation/workspace" replace/>;
  return <BagChecklist lastMinuteView={lastMinuteView} key={bagStorageKey(trip)} trip={trip} destination={`${country.english.toUpperCase()} · ${city.english.toUpperCase()}`} cityName={`${country.name} · ${city.name}`}/>;
}

function BagChecklist({ trip, destination, cityName, lastMinuteView }: { trip: Trip; destination: string; cityName: string; lastMinuteView: boolean }) {
  const navigate = useNavigate();
  const bagScroll = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (lastMinuteView) { if (bagScroll.current === null) bagScroll.current = window.scrollY; window.scrollTo({ top: 0, behavior: 'instant' }); }
    else if (bagScroll.current !== null) { window.scrollTo({ top: bagScroll.current, behavior: 'instant' }); bagScroll.current = null; document.getElementById('pmb-last-minute-entry')?.focus({ preventScroll: true }); }
  }, [lastMinuteView]);
  const mobile = useSyncExternalStore(subscribeBagLayout, () => window.matchMedia('(max-width: 768px)').matches, () => false);
  const orderedCategories = mobile ? bagCategories : ['essentials', 'clothing', 'electronics', 'toiletries', 'other'].flatMap(id => bagCategories.filter(group => group.id === id));
  const defaults = useMemo(() => {
    const baseline = getDefaultBagItems(trip);
    try { return getDefaultBagItems(trip, loadBag(window.localStorage, bagStorageKey(trip), baseline).customItems); }
    catch { return baseline; }
  }, [trip]);
  const key = bagStorageKey(trip);
  const [state, setState] = useState<BagState>(() => { try { const loaded = loadBag(window.localStorage, key, defaults); return { ...loaded, lastMinute: restoreLastMinute(loaded.lastMinute, [...defaults, ...loaded.customItems]) }; } catch { return { version: 1, checkedIds: [], customItems: [] }; } });
  const [saved, setSaved] = useState(true);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>('other');
  const [message, setMessage] = useState('');
  const [redFlagRequest, setRedFlagRequest] = useState<RedFlagRequest | null>(null);
  // Defaults depend on current custom aliases, not only the list loaded on mount.
  const activeDefaults = useMemo(() => getDefaultBagItems(trip, state.customItems), [trip, state.customItems]);
  const allItems = [...activeDefaults, ...state.customItems].map(item => withElectricityRecommendation(item, trip.countryId));
  const items = visibleBagItems(allItems, state.packLess?.decisions);
  const excludedItems = allItems.filter(item => !items.some(visible => visible.id === item.id));
  const progress = packingProgress(items, state.checkedIds);
  const [expandedGroups, setExpandedGroups] = useState<Partial<Record<CategoryId, boolean>>>(() => {
    const first = bagCategories.find(group => items.some(item => item.categoryId === group.id && !state.checkedIds.includes(item.id))) ?? bagCategories[0];
    return { [first.id]: true };
  });
  const current = recalculateTrip(trip);
  const currency = getCountryCurrency(trip.countryId);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)); setSaved(true); }
    catch { setSaved(false); }
  }, [key, state]);
  function saveAllowance(baggageAllowance?: BaggageAllowance) {
    setState(previous => {
      const checks = (previous.redFlagCheckedIds ?? []).filter(id => id !== allowanceCheckId);
      return { ...previous, baggageAllowance, redFlagCheckedIds: baggageAllowance ? [...checks, allowanceCheckId] : checks };
    });
  }
  function toggle(id: string) {
    const kind=(['authorization','procedure'] as const).find(kind=>entryItemId(allItems,kind)===id);
    if(kind){updateEntryCheck(kind,!state.checkedIds.includes(id));return;}
    setState(previous => ({ ...previous, checkedIds: previous.checkedIds.includes(id) ? previous.checkedIds.filter(value => value !== id) : [...previous.checkedIds, id] }));
  }
  function updateEntryCheck(kind:EntryCheckKind,checked:boolean){setState(previous=>applyEntryCheck(previous,allItems,kind,checked));}
  function toggleRedFlag(id:string){
    const kind=(['authorization','procedure'] as const).find(kind=>entryFlagIds[kind]===id);
    if(kind){updateEntryCheck(kind,!(state.redFlagCheckedIds??[]).includes(id));return;}
    setState(previous=>{const checked=previous.redFlagCheckedIds??[];return {...previous,redFlagCheckedIds:checked.includes(id)?checked.filter(value=>value!==id):[...checked,id]};});
  }
  function addItem(event: FormEvent) {
    event.preventDefault();
    const label = name.trim();
    if (!label) { setMessage('추가할 준비물 이름을 입력해 주세요.'); return; }
    const candidate = { id:'custom:candidate',name:label,categoryId:category,custom:true as const };
    const entryKind=(['authorization','procedure'] as const).find(kind=>matchesEntryItem(candidate,kind));
    const existing=allItems.find(item=>item.name.replace(/\s/g,'')===label.replace(/\s/g,'')) ?? (entryKind?allItems.find(item=>matchesEntryItem(item,entryKind)):undefined);
    if(existing){setName('');setMessage(`이미 있는 '${existing.name}' 항목을 확인해 주세요.`);return;}
    const id = `custom:${crypto.randomUUID()}`;
    setState(previous => ({ ...previous, customItems: [...previous.customItems, { id, name: label, categoryId: category, custom: true }] }));
    setExpandedGroups(previous => ({ ...previous, [category]: true }));
    setName(''); setMessage(`${label} 항목을 추가했어요.`);
  }
  function removeItem(id: string) {
    setState(previous => {
      const customItems=previous.customItems.filter(item=>item.id!==id);
      const next={...previous,customItems,checkedIds:previous.checkedIds.filter(value=>value!==id)};
      return restoreEntryChecks(next,[...getDefaultBagItems(trip,customItems),...customItems]);
    });
    setMessage('직접 추가한 준비물을 삭제했어요.');
  }
  if (lastMinuteView) return <LastMinuteScreen trip={trip} items={allItems} saved={state.lastMinute} onChange={lastMinute => setState(previous => ({ ...previous, lastMinute }))} storageSaved={saved}/>;
  return <div className="pmb-service pmb-bag-service">
    <a className="pmb-skip" href="#pmb-bag-main">본문으로 건너뛰기</a><ServiceHeader currentPage="my-bag" mode="workspace"/>
    <main id="pmb-bag-main" className="pmb-bag pmb-container">
      <header className="pmb-bag-heading"><span>MY BAG / YOUR PACKING LIST</span><h1>Ready to pack?</h1><h2>이제 여행 준비물을 챙겨볼까요?</h2><div className="pmb-bag-heading-actions"><p>챙긴 물건부터 하나씩 체크해 보세요!</p><Link className="pmb-bag-edit-trip" to="/implementation/workspace">여행 정보 변경 <ArrowUpRight size={16}/></Link></div></header>
      <div className="pmb-bag-trip-with-edit"><section className="pmb-bag-trip" aria-label="선택한 여행 조건"><div className="pmb-bag-trip-details"><div className="pmb-bag-trip-copy"><strong>{destination}</strong><span>{cityName}</span><strong>{current.tripNights}박 {current.tripDays}일 · {purposes.find(item => item.id === trip.travelPurpose)?.label}</strong><span>{trip.departureDate} — {trip.returnDate} · {baggageOptions.find(item => item.id === trip.baggageType)?.label}</span>{currency && <span className="pmb-bag-trip-currency">통화 · {currency.code} ({currency.symbol}) · {currency.name}</span>}</div><div className="pmb-bag-country-stamp" aria-hidden="true"><span className="pmb-country-stamp-label">TRAVEL</span><img src={`/flags/${trip.countryId.toLowerCase()}.svg`} alt="" width="48" height="32"/><strong>{trip.countryId}</strong></div></div><DestinationClock cityId={trip.cityId}/></section>
      </div>
      <EntryPreparationBanner trip={trip} confirmed={state.entryPreparationConfirmed === true} onConfirm={checked=>updateEntryCheck('authorization',checked)}/>
      <TripBrief trip={trip} allowance={state.baggageAllowance} onSaveAllowance={saveAllowance}/>

      <PackingRedFlags allowance={state.baggageAllowance} trip={trip} checkedIds={state.redFlagCheckedIds ?? []} request={redFlagRequest} onOpen={setRedFlagRequest} onClose={() => setRedFlagRequest(null)} onToggle={toggleRedFlag}/>
      <section className="pmb-bag-progress" aria-labelledby="pmb-bag-progress-title"><div><h2 id="pmb-bag-progress-title">PACKING PROGRESS</h2><strong>{progress.percent}%</strong></div><p aria-live="polite">전체 {progress.total}개 중 {progress.complete}개 체크 완료</p><div className="pmb-bag-progress-track" role="progressbar" aria-label="준비물 체크 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span style={{ width: `${progress.percent}%` }}/></div></section>

      {!saved && <p className="pmb-bag-warning" role="status">브라우저에 저장하지 못했어요. 현재 체크는 유지되지만 새로고침하면 사라질 수 있어요.</p>}
      <div className="pmb-bag-note"><Luggage size={20}/><p>나에게 필요한 물건만 챙겨보세요. 옷차림 참고 항목은 기존 여행 정보의 제안이며, 수량은 자동 계산하지 않습니다.</p><Link to="/implementation/travel-info?from=my-bag#pmb-guide-baggage">항공 반입 규정 확인 <ArrowUpRight size={16}/></Link></div>
      <div className="pmb-bag-categories">{orderedCategories.map(group => {
        const groupItems = items.filter(item => item.categoryId === group.id);
        const expanded = expandedGroups[group.id] === true;
        return <section className={`pmb-bag-category${group.id === 'other' ? ' pmb-bag-category-other' : ''}${expanded ? '' : ' is-collapsed'}`} key={group.id} aria-labelledby={`pmb-bag-${group.id}`}><header><h2 id={`pmb-bag-${group.id}`}>{group.name}</h2><span>{groupItems.filter(item => state.checkedIds.includes(item.id)).length} / {groupItems.length}</span><button className="pmb-category-toggle" type="button" aria-label={`${group.name} ${expanded ? '접기' : '펼치기'}`} aria-expanded={expanded} aria-controls={`pmb-category-list-${group.id}`} onClick={() => setExpandedGroups(previous => ({ ...previous, [group.id]: !expanded }))}><span>{expanded ? '접기' : '펼치기'}</span><ChevronDown size={16}/></button></header><ul id={`pmb-category-list-${group.id}`}>{groupItems.map(item => <li key={item.id} data-item-id={item.id} className={state.checkedIds.includes(item.id) ? 'is-packed' : ''}><label title={item.note}><input type="checkbox" checked={state.checkedIds.includes(item.id)} onChange={() => toggle(item.id)}/><span>{item.name}{item.note && <small>{item.recommendation === 'electricity' ? (item.recommendationStatus ?? '확인 후 결정') + ' · ' + item.note : item.recommendation === 'entry' || trip.countryId === 'TH' ? item.note : '옷차림 참고'}</small>}{state.packLess?.decisions[item.id]?.action === 'reduce' && <small>{state.packLess.decisions[item.id].quantity}개 · 직접 설정</small>}{item.custom && <small>직접 추가</small>}</span></label>{(item.id === 'essential:passport' || item.id === 'essential:payment') && <button type="button" className="pmb-item-check-link" aria-haspopup="dialog" onClick={event => setRedFlagRequest({ group: item.id === 'essential:passport' ? 'passport' : 'payment', trigger: event.currentTarget })}>{item.id === 'essential:passport' ? '여권 점검' : '결제 점검'}</button>}{item.custom && <button type="button" onClick={() => removeItem(item.id)} aria-label={`${item.name} 삭제`}><Trash2 size={17}/></button>}</li>)}</ul></section>;
      })}</div>

      <PackLess items={allItems} tripDays={current.tripDays} saved={state.packLess} onApply={packLess => setState(previous => ({ ...previous, packLess }))} onUndo={() => setState(previous => previous.packLess?.previous ? { ...previous, packLess: previous.packLess.previous } : previous)}/>
      {excludedItems.length > 0 && <details className="pmb-bag-excluded"><summary>제외한 준비물 · {excludedItems.length}개</summary><ul>{excludedItems.map(item => <li key={item.id}><span>{item.name}</span><button type="button" onClick={() => setState(previous => previous.packLess ? { ...previous, packLess: { ...previous.packLess, decisions: { ...previous.packLess.decisions, [item.id]: { action: 'keep' } } } } : previous)} aria-label={`${item.name} 복원`}>복원하기</button></li>)}</ul></details>}
      <form className="pmb-bag-add" onSubmit={addItem}><h2>나만의 준비물 추가</h2><div><label>카테고리<select value={category} onChange={event => setCategory(event.target.value as CategoryId)}>{bagCategories.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label className="pmb-bag-name">준비물 이름<input value={name} onChange={event => setName(event.target.value)} maxLength={60} placeholder="예: 여행 노트"/></label><button type="submit"><Plus size={18}/> 추가</button></div><p role="status">{message}</p></form>
      <FinalCheckCTA total={progress.total} complete={progress.complete} onContinue={scroll => { bagScroll.current = scroll; navigate('?view=last-minute'); }}/>
      <nav className="pmb-bag-actions" aria-label="여행 준비 단계 이동"><Link to="/implementation/workspace"><ArrowLeft size={17}/> PREVIOUS · TRIP SETUP</Link><span>체크 상태는 이 여행에 자동 저장돼요.</span></nav>
    </main><footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span></footer>
  </div>;
}
