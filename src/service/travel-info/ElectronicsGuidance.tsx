import { BatteryCharging, Laptop, ShieldCheck } from 'lucide-react';
import { electronicsGuidance } from '../data/electronicsGuidance';
import StatusBadge from './StatusBadge';
import SourceLinks from './SourceLinks';
import './ElectronicsGuidance.css';

const icons = [Laptop, BatteryCharging, ShieldCheck];
export default function ElectronicsGuidance() {
  return <div className="pmb-electronics-guidance">
    <p className="pmb-electronics-scope">{electronicsGuidance.scope}</p>
    <div className="pmb-electronics-cards">{electronicsGuidance.cards.map((card, index) => {
      const Icon = icons[index];
      return <article key={card.id} className="pmb-electronics-card" data-battery-kind={card.id}>
        <h4><Icon size={21} aria-hidden="true"/>{card.title}</h4>
        <div className="pmb-electronics-badges">{card.badges.map(badge => <StatusBadge key={badge} label={badge}/>)}</div>
        {card.description.map(text => <p key={text}>{text}</p>)}
      </article>;
    })}</div>
    <details className="pmb-electronics-additional"><summary>추가 확인 사항 · 용량·승인·국가별 적용</summary>
      {electronicsGuidance.cards.map(card => <section key={card.id}><h4>{card.title}</h4><ul>{card.additional.map(text => <li key={text}>{text}</li>)}</ul></section>)}
      <p>목적지 국가를 변경해도 실제 운항 항공사의 규정이 자동으로 결정되지는 않습니다. 출발 전 항공사 공식 안내에서 최종 확인하세요.</p>
    </details>
    <footer className="pmb-electronics-sources"><h4>공식 출처</h4><p>자료 확인: {electronicsGuidance.checkedOn}</p>
      <SourceLinks ids={electronicsGuidance.sourceIds}/>
      <p>국토교통부 발표: 2026-04-08 · 한국 기준 시행: 2026-04-20. 국제 지침·각국 적용·항공사 추가 제한은 구분해 확인하세요.</p>
    </footer>
  </div>;
}
