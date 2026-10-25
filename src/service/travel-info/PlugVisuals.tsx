import { useId } from 'react';
import { getCountryPlugVisuals, plugVisuals, type PlugVisualKind } from '../data/plugVisuals';
import './PlugVisuals.css';

function Shape({ kind, plug = false, card = false }: { kind: PlugVisualKind; plug?: boolean; card?: boolean }) {
  const id = useId();
  const angled = kind === 'I2' || kind === 'I3';
  const earth = kind === 'B' || kind === 'O' || angled && (!plug || kind === 'I3');
  const color = plug ? '#a58038' : '#243b50';
  return <svg viewBox={card ? '10 3 92 100' : '0 0 112 108'} role="img" aria-labelledby={id}>
    <title id={id}>{plugVisuals[kind].label} {plug ? '플러그 핀 정면' : angled ? '3구 콘센트 정면 예시' : '콘센트 정면'} · {plugVisuals[kind].description}</title>
    {plug ? <><path d="M42 99V82H70V99" fill="#e0c98e" stroke="#a58038" strokeWidth="2"/><rect x="17" y="8" width="78" height="79" rx="26" fill="#f7efd4" stroke="#a58038" strokeWidth="2"/></> : <rect x="12" y="5" width="88" height="96" rx="18" fill="#fffdf7" stroke="#55749c" strokeWidth="2"/>}
    {kind === 'F' && !plug && <circle cx="56" cy="50" r="35" fill="none" stroke="#55749c" strokeWidth="2"/>}
    <g fill={color}>
      {kind === 'O' ? <><circle data-pin-role="power" cx="36" cy="61" r="6"/><circle data-pin-role="power" cx="76" cy="61" r="6"/></> : (kind === 'C' || kind === 'F') ? <><circle cx="38" cy="42" r="6"/><circle cx="74" cy="42" r="6"/></> : angled ? <><rect x="33" y="26" width="9" height="27" rx="1" transform="rotate(30 37.5 39.5)"/><rect x="70" y="26" width="9" height="27" rx="1" transform="rotate(-30 74.5 39.5)"/></> : <><rect x="34" y="24" width="8" height="29" rx="1"/><rect x="70" y="24" width="8" height="29" rx="1"/></>}
      {kind === 'F' && <><rect x="51" y="12" width="10" height="10" fill="#a58038"/><rect x="51" y="78" width="10" height="10" fill="#a58038"/></>}
      {earth && (kind === 'O' ? <circle data-pin-role="earth" cx="56" cy="36" r="6"/> : angled ? <rect x="52" y="62" width="8" height="23" rx="1"/> : <path d="M49 75V70a7 7 0 0 1 14 0v5Z"/>)}
    </g>
    {plug && kind !== 'C' && kind !== 'F' && kind !== 'O' && <g stroke="#e6d5ac" strokeWidth="2" fill="none"><path d={angled ? 'M42 28L31 48M70 28L80 48' : 'M36 27V49M72 27V49'}/></g>}
  </svg>;
}
export default function PlugVisuals({ countryId, compact = false }: { countryId: string; compact?: boolean }) {
  const kinds = getCountryPlugVisuals(countryId);
  if (!kinds.length) return null;
  if (compact) return <span className="pmb-plug-mini" aria-label="현지 콘센트 형태">{kinds.filter(kind => kind !== 'I2').map(kind => <span key={kind} title={plugVisuals[kind].description}><Shape kind={kind} card/><span>{plugVisuals[kind].shortLabel}</span><span>{kind.startsWith('I') ? 'TYPE I' : `TYPE ${kind}`}</span></span>)}</span>;
  return <section className="pmb-plug-visuals" aria-label="콘센트와 플러그 형태 비교">
    <div className="pmb-plug-visual-grid">{kinds.map(kind => <figure key={kind} data-plug-kind={kind}>
      <figcaption><strong>{plugVisuals[kind].description}</strong><span>{plugVisuals[kind].label}</span></figcaption>
      <div className="pmb-plug-pair"><div><Shape kind={kind}/><span>콘센트 {kind.startsWith('I') ? '(3구 예시)' : '(구멍)'}</span></div><div><Shape kind={kind} plug/><span>플러그 (핀 정면)</span></div></div>
      <p>{plugVisuals[kind].grounded ? '접지 핀 포함' : '접지 핀 없는 플러그'}</p>
    </figure>)}</div>
    <p className="pmb-plug-visual-note">형태 식별용 도식이며 실제 크기·치수는 아닙니다. 변환 어댑터는 현지 콘센트에 맞는 출력 핀과 가져갈 기기에 맞는 입력부를 확인하세요. 접지가 필요한 기기의 접지 핀을 제거하지 마세요.</p>
  </section>;
}
