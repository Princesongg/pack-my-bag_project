import { useRef, useState } from 'react';
import { BatteryCharging, ChevronDown, Droplets, ExternalLink, Laptop, Luggage, Scissors, SprayCan, X } from 'lucide-react';
import { baggageRules } from '../data/baggageRules';
import { baggagePermissionLabel, batteryCarryLabels } from '../data/baggageLabels';
import SourceLinks from './SourceLinks';
import { getSource } from '../data/sources';
import './BaggageGuide.css';
import ElectronicsGuidance from './ElectronicsGuidance';
import { electronicsGuidance } from '../data/electronicsGuidance';
import StatusBadge, { BaggageStatusSummary } from './StatusBadge';

const icons = { 'liquids-gels': Droplets, 'power-banks': BatteryCharging, electronics: Laptop, 'sharp-objects': Scissors, 'aerosols-dangerous-goods': SprayCan };

export default function BaggageGuide() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const confirmed = baggageRules.filter(rule => rule.summary?.status === 'verified');
  const pending = baggageRules.filter(rule => rule.summary?.status !== 'verified');
  const selected = confirmed.find(rule => rule.id === selectedId);
  function closePanel() {
    setSelectedId(null);
    if (selectedId) triggers.current.get(selectedId)?.focus();
  }
  return <section id="pmb-guide-baggage" className="pmb-guide-baggage pmb-checks-baggage" aria-labelledby="pmb-baggage-heading">
      <div><Luggage size={24}/><h2 id="pmb-baggage-heading">BAGGAGE GUIDE · 공식 안내 연결</h2></div>
      <p>한국 출발 국제선 기준의 주요 항공 반입 규정을 확인해 보세요.</p>
      <p className="pmb-baggage-intro">카드를 펼쳐 반입 조건과 예외를 확인하세요.</p>
      <ul className="pmb-baggage-rules">{confirmed.map(rule => {
        const Icon = icons[rule.id as keyof typeof icons] ?? Luggage;
        return <li key={rule.id}><button type="button" className="pmb-baggage-rule" id={`pmb-baggage-trigger-${rule.id}`} ref={element => { if (element) triggers.current.set(rule.id, element); else triggers.current.delete(rule.id); }} aria-expanded={selectedId === rule.id} aria-controls="pmb-baggage-detail-panel" onClick={() => setSelectedId(current => current === rule.id ? null : rule.id)}>
          <Icon size={22} aria-hidden="true"/><span className="pmb-baggage-rule-label"><strong>{rule.name}</strong><BaggageStatusSummary text={rule.summary?.value ?? ''}/></span><ChevronDown className="pmb-baggage-chevron" size={18} aria-hidden="true"/>
        </button></li>;
      })}</ul>
      <div className="pmb-baggage-panel-shell" data-open={Boolean(selected)}><div className="pmb-baggage-panel-clip">
        <section id="pmb-baggage-detail-panel" className="pmb-baggage-detail" hidden={!selected} aria-labelledby={selected ? `pmb-baggage-trigger-${selected.id}` : undefined} onKeyDown={event => { if (event.key === 'Escape') closePanel(); }}>
          {selected && <div key={selected.id} className="pmb-baggage-panel-content"><header><h3>{selected.id === 'electronics' ? electronicsGuidance.title : selected.name + ' · 상세 규정'}</h3><button type="button" onClick={closePanel} aria-label="상세 규정 닫기"><X size={18}/> 닫기</button></header>{selected.id === 'electronics' ? <ElectronicsGuidance/> : <><p className="pmb-baggage-verified">확인 완료 · {selected.summary?.lastVerified}{selected.scope.effectiveFrom && ` · 시행 ${selected.scope.effectiveFrom}`}</p><div className="pmb-baggage-status"><StatusBadge label={baggagePermissionLabel(selected.cabin, 'cabin', selected.id === 'power-banks')}/><StatusBadge label={baggagePermissionLabel(selected.checked, 'checked')}/></div>{selected.id === 'power-banks' && <p>{batteryCarryLabels.conditions}</p>}<ul>{selected.details?.value?.map(text => <li key={text}>{text}</li>)}</ul>{Boolean(selected.unresolved?.length) && <div className="pmb-baggage-cautions"><h4>주의사항 · 추가 확인</h4>{selected.unresolved?.map(text => <p className="pmb-baggage-unresolved" key={text}>{text}</p>)}</div>}<div className="pmb-baggage-official-links">{selected.officialSourceIds.map(id => { const source = getSource(id); return source ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.organization} · {source.title}<ExternalLink size={14}/></a> : null; })}</div><SourceLinks ids={selected.officialSourceIds}/></>}</div>}
        </section>
      </div></div>
      <details className="pmb-baggage-other"><summary>수하물 크기·무게 · 별도 확인</summary>{pending.map(rule => <p key={rule.id}><strong>{rule.name}</strong> · 세부 규정 확인 필요. 크기·무게·개수는 이용 항공사와 운임별 공식 안내를 확인해 주세요.</p>)}</details>
      <p className="pmb-guide-note">물품의 종류와 용량, 출발 국가 및 이용 항공사에 따라 반입 조건이 달라질 수 있습니다. 출국 전 공식 안내를 확인해 주세요.</p>
      <SourceLinks ids={[...new Set(confirmed.flatMap(rule => rule.officialSourceIds))]}/>
    </section>;
}
