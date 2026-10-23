import './TripProgress.css';

export default function TripProgress({ current }: { current: 1 | 2 }) {
  return <ol className="pmb-input-progress" aria-label="여행 입력 진행 상태">
    {[{ no: 1, label: 'DESTINATION', korean: '국가 및 도시 선택' }, { no: 2, label: 'TRIP DETAILS', korean: '일정 및 여행 스타일' }].map(step => <li key={step.no} aria-current={step.no === current ? 'step' : undefined}><span>{String(step.no).padStart(2, '0')}</span><div><strong>STEP {String(step.no).padStart(2, '0')} — {step.label}</strong><small>{step.korean}</small></div></li>)}
  </ol>;
}
