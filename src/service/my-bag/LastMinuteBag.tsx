import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Plane, Plus, RotateCcw, X } from 'lucide-react';
import type { BagItem } from './bag';
import { lastMinuteProgress, restoreLastMinute, type LastMinuteState } from './lastMinuteModel';
import './LastMinuteBag.css';
import './LastMinuteCompletion.css';

export default function LastMinuteBag({ items, saved, onChange }: { items: readonly BagItem[]; saved?: LastMinuteState; onChange: (state: LastMinuteState) => void }) {
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const state = restoreLastMinute(saved, items);
  const progress = lastMinuteProgress(state);
  const [phase, setPhase] = useState<'list' | 'checking' | 'folding' | 'flying' | 'complete'>(() => progress.allDone ? 'complete' : 'list');
  const previouslyDone = useRef(progress.allDone);
  const completionTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (previouslyDone.current === progress.allDone) return;
    previouslyDone.current = progress.allDone;
    if (!progress.allDone) { setPhase('list'); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('complete'); return; }
    setPhase('checking');
    const timers = [window.setTimeout(() => setPhase('folding'), 180), window.setTimeout(() => setPhase('flying'), 600), window.setTimeout(() => setPhase('complete'), 1750)];
    return () => timers.forEach(window.clearTimeout);
  }, [progress.allDone]);
  useEffect(() => { if (phase === 'complete') completionTitle.current?.focus({ preventScroll: true }); }, [phase]);
  const showingCompletion = progress.allDone && (phase === 'flying' || phase === 'complete');
  const transitioning = progress.allDone && (phase === 'checking' || phase === 'folding');
  const available = items.filter(item => !state.itemIds.includes(item.id));
  function toggle(id: string) {
    if (!state.checkedIds.includes(id)) setLastChecked(id);
    onChange({ ...state, checkedIds: state.checkedIds.includes(id) ? state.checkedIds.filter(value => value !== id) : [...state.checkedIds, id] });
  }
  return <><section className={`pmb-last-minute pmb-final-transition is-${phase}`} aria-busy={transitioning || phase === 'flying'} aria-labelledby="pmb-last-minute-title">
    {showingCompletion ? <div className="pmb-last-minute-complete">
      <div className="pmb-final-flight" aria-hidden="true"><svg viewBox="0 0 320 100" className="pmb-final-trail"><path d="M25 83 Q135 104 282 24"/></svg><Plane size={42} strokeWidth={1.7} className="pmb-final-plane"/></div>
      <div className="pmb-final-message"><span>YOUR BAG IS READY!</span><h2 ref={completionTitle} tabIndex={-1} id="pmb-last-minute-title">ALL SET.<br/>ENJOY YOUR TRIP!</h2><p>마지막 준비까지 확인했어요.<br/>이제 설레는 여행을 즐길 시간이에요!</p><button type="button" onClick={() => { setPhase('list'); requestAnimationFrame(() => document.getElementById('pmb-last-minute-title')?.focus({ preventScroll: true })); }}>다시 확인하기</button></div>
    </div> : <div className="pmb-final-fold"><div className="pmb-final-fold-inner" inert={transitioning}>
    <header className="pmb-final-checklist-heading"><h2 id="pmb-last-minute-title" tabIndex={-1}>FINAL CHECKLIST</h2><span>{progress.complete}/{progress.total} 확인 · {progress.percent}%</span></header>
    <div className="pmb-last-minute-track" role="progressbar" aria-label="출발 직전 최종 점검 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><span style={{ width: `${progress.percent}%` }}/></div>
    <p className="pmb-last-minute-feedback" role="status">{progress.allDone ? '마지막 물품까지 확인했어요!' : '일반 준비물 체크와 별개로, 출발 직전에 실제로 챙겼는지 확인해 주세요.'}</p>
    <div id="pmb-last-minute-panel">
      <ul className="pmb-last-minute-list">{state.itemIds.map(id => {
        const item = items.find(item => item.id === id)!;
        return <li key={id}><label><input type="checkbox" data-last-minute-id={id} data-final-check={id === lastChecked || undefined} checked={state.checkedIds.includes(id)} onChange={() => toggle(id)}/><span>{item.name}</span></label><button type="button" onClick={() => onChange({ itemIds: state.itemIds.filter(value => value !== id), checkedIds: state.checkedIds.filter(value => value !== id) })} aria-label={`${item.name} 최종 점검에서 제외`}><X size={17}/></button></li>;
      })}</ul>
      {!state.itemIds.length && <p>점검할 물품을 추가해 주세요. MY BAG의 준비물은 그대로 유지돼요.</p>}
      <div className="pmb-last-minute-actions"><button type="button" aria-expanded={adding} aria-controls="pmb-last-minute-add" onClick={() => setAdding(value => !value)}><Plus size={17}/>점검 물품 추가</button><button type="button" disabled={!progress.complete} onClick={() => onChange({ ...state, checkedIds: [] })}><RotateCcw size={16}/>확인 상태 초기화</button></div>
      <div id="pmb-last-minute-add" hidden={!adding}><label className="pmb-last-minute-select">기존 준비물에서 선택<select value="" onChange={event => { if (event.target.value) onChange({ ...state, itemIds: [...state.itemIds, event.target.value] }); }}><option value="" disabled>최종 점검할 준비물을 선택해 주세요</option>{available.map(item => <option key={item.id} value={item.id}>{item.name}{item.custom ? ' · 직접 추가' : ''}</option>)}</select></label><p>{available.length ? '목록에서 제외한 물품도 여기서 다시 추가할 수 있어요.' : '기존 준비물이 모두 최종 점검 목록에 있어요.'} 새 물품은 MY BAG의 ‘나만의 준비물 추가’에서 만든 뒤 선택해 주세요.</p></div>
    </div>
    </div></div>}
  </section><Link className="pmb-last-call-return" to="?view=bag">MY BAG으로 돌아가기 <ArrowRight size={18}/></Link></>;
}

