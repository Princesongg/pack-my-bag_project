import { batteryCarryLabels } from '../data/baggageLabels';
import './StatusBadge.css';

export type StatusBadgeVariant = 'carry-on' | 'checked-banned' | 'info' | 'allowed' | 'warning' | 'check-required' | 'danger' | 'prohibited' | 'success' | 'completed' | 'neutral';
export default function StatusBadge({ label, variant, className = '' }: { label: string; variant?: StatusBadgeVariant; className?: string }) {
  const kind = variant ?? (label === batteryCarryLabels.checked ? 'checked-banned' : label === batteryCarryLabels.cabin ? 'carry-on' : /확인 후 결정|확인 필요|별도.*확인/.test(label) ? 'check-required' : 'info');
  return <span className={`pmb-status-badge ${className}`.trim()} data-variant={kind}>{label}</span>;
}

export function BaggageStatusSummary({ text }: { text: string }) {
  return <span className="pmb-status-summary">{text.split(' · ').map((part, index) =>
    part === batteryCarryLabels.cabin || part === batteryCarryLabels.checked
      ? <StatusBadge key={index} label={part}/>
      : <span key={index}>{part}</span>,
  )}</span>;
}
