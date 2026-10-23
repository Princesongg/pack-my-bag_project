import { ExternalLink } from 'lucide-react';
import { getSource } from '../data/sources';

export default function SourceLinks({ ids }: { ids: readonly string[] }) {
  const entries = [...new Set(ids)].flatMap(id => { const source = getSource(id); return source ? [source] : []; });
  if (!entries.length) return <p className="pmb-guide-note">공식 정보 확인 필요 · 확인된 출처가 없습니다.</p>;
  return <details className="pmb-guide-sources"><summary>출처 및 확인일 · {entries.length}건</summary><ul>{entries.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.organization} · {source.title ?? (source.period ? `${source.period.startYear}년 관측자료` : '공식 자료')}<ExternalLink size={14}/></a><span>{source.period && `${source.period.startYear}–${source.period.endYear} 기준 · `}{source.lastVerified ? `마지막 확인 ${source.lastVerified}` : '본문 공식 확인 필요'}{source.status !== 'verified' && ' · 세부 내용 확인 필요'}</span></li>)}</ul></details>;
}
