import { Backpack, Droplets, Luggage } from 'lucide-react';
import { baggageRules } from '../data/baggageRules';
import { electronicsGuidance } from '../data/electronicsGuidance';
import { BaggageStatusSummary } from '../travel-info/StatusBadge';
import { allowanceLabel, type BaggageAllowance } from './baggageAllowance';

// These tiles describe what to check; numerical limits remain in baggageRules.
export function BaggageComparison({ compact = false }: { compact?: boolean }) {
  const batteries = electronicsGuidance.cards.find(card => card.id === 'power-banks-spares');
  return <span className={`pmb-baggage-comparison${compact ? ' is-compact' : ''}`}>
    {!compact && <strong className="pmb-baggage-comparison-title">수하물 한눈에 보기</strong>}
    <span className="pmb-baggage-comparison-grid">
      <span className="pmb-baggage-comparison-tile" data-baggage-kind="cabin"><Backpack size={compact ? 28 : 44} strokeWidth={1.5} aria-hidden="true"/>{compact ? <span className="pmb-baggage-comparison-copy"><strong>기내 휴대</strong><span>배터리 조건 확인</span></span> : <><strong>기내 휴대</strong><span>{batteries?.title ?? '배터리'} 반입 조건 확인</span></>}</span>
      <span className="pmb-baggage-comparison-tile" data-baggage-kind="checked"><Luggage size={compact ? 28 : 44} strokeWidth={1.5} aria-hidden="true"/>{compact ? <span className="pmb-baggage-comparison-copy"><strong>위탁수하물</strong></span> : <><strong>위탁수하물</strong><span>무료 허용량은 항공권·운임별 확인</span></>}</span>
    </span>
  </span>;
}

export default function BaggageBrief({ allowance }: { allowance?: BaggageAllowance }) {
  const power = baggageRules.find(rule => rule.id === 'power-banks');
  const liquids = baggageRules.find(rule => rule.id === 'liquids-gels');
  const liquidSummary = liquids?.summary?.status === 'verified' && liquids.details?.status === 'verified' && liquids.scope.departureCountryId === 'KR'
    ? liquids.summary.value?.replace('지퍼백', '투명 지퍼백') : null;
  return <span className="pmb-baggage-brief">
    <span className="pmb-baggage-power"><strong>{power?.name ?? '보조배터리'}{power?.scope.departureCountryId === 'KR' && ' · 한국 출발 기준'}</strong><BaggageStatusSummary text={power?.summary?.value ?? '공식 반입 조건 확인 필요'}/></span>
    <BaggageComparison compact/>
    <span className="pmb-baggage-footer-info">
      <span className="pmb-baggage-info-row"><Droplets size={16} strokeWidth={1.5} aria-hidden="true"/><span><strong>액체류</strong> · {liquidSummary ? <>한국 출발 국제선 · {liquidSummary}</> : '규정 확인 필요'}</span></span>
      <span className="pmb-baggage-info-row"><Luggage size={16} strokeWidth={1.5} aria-hidden="true"/><span><strong>무료 위탁 허용량</strong> · {allowance ? '직접 확인한 기록 아래 표시' : '항공사·운임별 확인'}</span></span>
    </span>
    {allowance && <span className="pmb-trip-brief-allowance"><strong>{allowanceLabel(allowance)}</strong><small>사용자 직접 입력 · {allowance.airline || '항공권 확인'}</small></span>}
  </span>;
}
