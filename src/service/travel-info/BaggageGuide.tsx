import { BatteryCharging, ChevronDown, Droplets, Laptop, Luggage, Scissors, SprayCan } from 'lucide-react';
import { baggageRules } from '../data/baggageRules';
import type { BaggageRule } from '../data/baggageRules';
import SourceLinks from './SourceLinks';
import './BaggageGuide.css';

const icons = { 'liquids-gels': Droplets, 'power-banks': BatteryCharging, electronics: Laptop, 'sharp-objects': Scissors, 'aerosols-dangerous-goods': SprayCan };
function permission(evidence: BaggageRule['cabin']) {
  return evidence.status !== 'verified' ? '별도 확인' : evidence.value === 'prohibited' ? '불가' : evidence.value === 'allowed' ? '가능' : '조건부';
}

export default function BaggageGuide() {
  const confirmed = baggageRules.filter(rule => rule.summary?.status === 'verified');
  const pending = baggageRules.filter(rule => rule.summary?.status !== 'verified');
  return <section id="pmb-guide-baggage" className="pmb-guide-baggage pmb-checks-baggage" aria-labelledby="pmb-baggage-heading">
      <div><Luggage size={24}/><h2 id="pmb-baggage-heading">BAGGAGE GUIDE · 공식 안내 연결</h2></div>
      <p>한국 출발 국제선 기준의 주요 항공 반입 규정을 확인해 보세요.</p>
      <p className="pmb-baggage-intro">카드를 펼쳐 반입 조건과 예외를 확인하세요.</p>
      <ul className="pmb-baggage-rules">{confirmed.map(rule => {
        const Icon = icons[rule.id as keyof typeof icons] ?? Luggage;
        return <li key={rule.id}><details className="pmb-baggage-rule" name="pmb-baggage-category">
          <summary><Icon size={22} aria-hidden="true"/><span className="pmb-baggage-rule-label"><strong>{rule.name}</strong><span>{rule.summary?.value}</span><span className="pmb-baggage-status"><span>기내 {permission(rule.cabin)}</span><span data-prohibited={rule.checked.value === 'prohibited'}>위탁 {permission(rule.checked)}</span></span></span><ChevronDown className="pmb-baggage-chevron" size={18} aria-hidden="true"/></summary>
          <div className="pmb-baggage-detail"><p className="pmb-baggage-verified">확인 완료 · {rule.summary?.lastVerified}{rule.scope.effectiveFrom && ` · 시행 ${rule.scope.effectiveFrom}`}</p><ul>{rule.details?.value?.map(text => <li key={text}>{text}</li>)}</ul>{rule.unresolved?.map(text => <p className="pmb-baggage-unresolved" key={text}>{text}</p>)}<SourceLinks ids={rule.officialSourceIds}/></div>
        </details></li>;
      })}</ul>
      <details className="pmb-baggage-other"><summary>수하물 크기·무게 · 별도 확인</summary>{pending.map(rule => <p key={rule.id}><strong>{rule.name}</strong> · 세부 규정 확인 필요. 크기·무게·개수는 이용 항공사와 운임별 공식 안내를 확인해 주세요.</p>)}</details>
      <p className="pmb-guide-note">물품의 종류와 용량, 출발 국가 및 이용 항공사에 따라 반입 조건이 달라질 수 있습니다. 출국 전 공식 안내를 확인해 주세요.</p>
      <SourceLinks ids={[...new Set(confirmed.flatMap(rule => rule.officialSourceIds))]}/>
    </section>;
}
