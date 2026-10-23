import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ClipboardCheck } from 'lucide-react';
import BaggageGuide from './BaggageGuide';
import './TravelChecks.css';

const tabs = [
  { id: 'entry', label: '입국 준비', english: 'ENTRY PREPARATION' },
  { id: 'baggage', label: '항공 반입 규정', english: 'BAGGAGE GUIDE' },
] as const;
type Tab = typeof tabs[number]['id'];

export default function TravelChecks({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Tab>('entry');
  useEffect(() => {
    // Preserve the existing section link, including direct links and repeated clicks.
    const revealBaggage = () => {
      if (window.location.hash === '#pmb-guide-baggage') {
        const disclosure = document.getElementById('pmb-guide-baggage')?.closest<HTMLDetailsElement>('.pmb-mobile-info-row');
        if (disclosure) disclosure.open = true;
        setActive('baggage');
      }
    };
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href="#pmb-guide-baggage"]')) {
        const disclosure = document.getElementById('pmb-guide-baggage')?.closest<HTMLDetailsElement>('.pmb-mobile-info-row');
        if (disclosure) disclosure.open = true;
        setActive('baggage');
      }
    };
    revealBaggage();
    window.addEventListener('hashchange', revealBaggage);
    document.addEventListener('click', onClick);
    return () => { window.removeEventListener('hashchange', revealBaggage); document.removeEventListener('click', onClick); };
  }, []);
  useEffect(() => {
    if (active === 'baggage' && window.location.hash === '#pmb-guide-baggage') document.getElementById('pmb-guide-baggage')?.scrollIntoView();
  }, [active]);
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (index + 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    document.getElementById(`pmb-checks-tab-${tabs[next].id}`)?.focus();
  }
  return <article className="pmb-guide-info-card pmb-travel-checks" aria-labelledby="pmb-checks-title">
    <span className="pmb-guide-card-icon"><ClipboardCheck size={25}/></span>
    <h3 id="pmb-checks-title">TRAVEL CHECKS</h3>
    <p>출국 전에 필요한 입국 정보와 항공 규정을 확인하세요.</p>
    <div className="pmb-checks-tabs" role="tablist" aria-label="출국 전 확인 정보">
      {tabs.map((tab, index) => <button key={tab.id} id={`pmb-checks-tab-${tab.id}`} type="button" role="tab" aria-selected={active === tab.id} aria-controls={`pmb-checks-panel-${tab.id}`} tabIndex={active === tab.id ? 0 : -1} onClick={() => setActive(tab.id)} onKeyDown={event => onKeyDown(event, index)}>{tab.label}<span>{tab.english}</span></button>)}
    </div>
    <div id="pmb-checks-panel-entry" role="tabpanel" aria-labelledby="pmb-checks-tab-entry" hidden={active !== 'entry'} tabIndex={0}>{children}</div>
    <div id="pmb-checks-panel-baggage" role="tabpanel" aria-labelledby="pmb-checks-tab-baggage" hidden={active !== 'baggage'} tabIndex={0}><BaggageGuide/></div>
  </article>;
}
