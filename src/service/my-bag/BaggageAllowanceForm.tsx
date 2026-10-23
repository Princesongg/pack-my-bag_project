import { useState, type FormEvent } from 'react';
import { allowanceLabel, restoreBaggageAllowance, type BaggageAllowance } from './baggageAllowance';
import './BaggageAllowance.css';

export default function BaggageAllowanceForm({ value, cabinOnly, onSave }: { value?: BaggageAllowance; cabinOnly: boolean; onSave: (value?: BaggageAllowance) => void }) {
  const [system, setSystem] = useState<'pieces' | 'total-weight'>(value?.system ?? 'pieces');
  const [airline, setAirline] = useState(value?.airline ?? '');
  const [pieces, setPieces] = useState(value?.system === 'pieces' ? String(value.pieces) : '');
  const [weight, setWeight] = useState(value?.system === 'pieces' && value.kgPerPiece !== null ? String(value.kgPerPiece) : '');
  const [total, setTotal] = useState(value?.system === 'total-weight' ? String(value.totalKg) : '');
  const [confirmed, setConfirmed] = useState(value?.confirmed ?? false);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const count = pieces === '' ? NaN : Number(pieces);
  const weightValue = weight === '' ? NaN : Number(weight);
  const totalValue = total === '' ? NaN : Number(total);
  const countError = system === 'pieces' && (!Number.isInteger(count) || count < 0 || count > 99) ? '무료 위탁 개수를 0~99의 정수로 입력해 주세요.' : '';
  const weightError = system === 'pieces' && count > 0 && (!Number.isFinite(weightValue) || weightValue <= 0 || weightValue > 999) ? '가방 1개당 허용 무게를 0보다 큰 값으로 입력해 주세요.' : '';
  const totalError = system === 'total-weight' && (!Number.isFinite(totalValue) || totalValue < 0 || totalValue > 999) ? '합산 허용 무게를 0~999kg 범위로 입력해 주세요.' : '';
  function submit(event: FormEvent) {
    event.preventDefault(); setAttempted(true); setMessage('');
    if (countError || weightError || totalError || !confirmed) return;
    const result = restoreBaggageAllowance({ source: 'user-confirmed-ticket', confirmed, airline, system, pieces: count, kgPerPiece: weightValue, totalKg: totalValue });
    if (result) { onSave(result); setMessage('직접 확인한 허용량을 저장했어요. 항공 반입 점검에도 반영됩니다.'); }
  }
  return <section className="pmb-allowance" aria-labelledby="pmb-allowance-title"><h3 id="pmb-allowance-title">내 무료 위탁수하물 허용량</h3><p>항공권 또는 항공사에서 무료 수하물 허용량을 확인해 주세요.</p><p className="pmb-allowance-note">{cabinOnly ? '기내수하물만 선택한 여행입니다. 위탁 허용량 기록은 선택 사항이에요.' : '위탁수하물 포함 선택은 무료 허용량이 확정됐다는 의미가 아닙니다.'} 항공사·노선·운임·좌석 등급별로 조건이 다르며 자동 검증하지 않습니다.</p>
    {value && <p className="pmb-allowance-saved">저장된 기록: {allowanceLabel(value)} · 사용자 직접 입력</p>}
    <form noValidate onSubmit={submit}><label>항공사명 <span>(선택)</span><input name="allowanceAirline" value={airline} maxLength={80} onChange={event => { setAirline(event.target.value); setConfirmed(false); }} placeholder="항공권에 표시된 항공사"/></label>
      <label>허용량 기준<select name="allowanceSystem" value={system} onChange={event => { setSystem(event.target.value as typeof system); setConfirmed(false); }}><option value="pieces">개수제 · 가방 1개당 무게</option><option value="total-weight">총중량제 · 모든 가방 합산</option></select></label>
      <div className="pmb-allowance-grid">{system === 'pieces' ? <><label>무료 위탁수하물 개수<input name="allowancePieces" type="number" min="0" max="99" step="1" value={pieces} onChange={event => { setPieces(event.target.value); setConfirmed(false); }} aria-invalid={attempted && !!countError} aria-describedby="pmb-allowance-count-error"/><span id="pmb-allowance-count-error" className="pmb-allowance-error">{attempted && countError}</span></label><label>가방 1개당 허용 무게 (kg)<input name="allowanceKg" type="number" min="0.1" max="999" step="any" value={count === 0 ? '' : weight} disabled={count === 0} onChange={event => { setWeight(event.target.value); setConfirmed(false); }} aria-invalid={attempted && !!weightError} aria-describedby="pmb-allowance-weight-error"/><span id="pmb-allowance-weight-error" className="pmb-allowance-error">{count === 0 ? '0개는 개당 무게 입력이 필요하지 않습니다.' : attempted && weightError}</span></label></> : <label>모든 가방의 합산 허용 무게 (kg)<input name="allowanceTotalKg" type="number" min="0" max="999" step="any" value={total} onChange={event => { setTotal(event.target.value); setConfirmed(false); }} aria-invalid={attempted && !!totalError}/><span className="pmb-allowance-error">{attempted && totalError}</span></label>}</div>
      <label className="pmb-allowance-confirm"><input name="allowanceConfirmed" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/><span>항공권에서 확인했어요</span></label>{attempted && !confirmed && <p className="pmb-allowance-error" role="alert">현재 입력한 값을 항공권에서 확인한 뒤 체크해 주세요.</p>}
      <div className="pmb-allowance-actions"><button type="submit">허용량 저장</button>{value && <button className="pmb-allowance-delete" type="button" onClick={() => { onSave(undefined); setAirline(''); setPieces(''); setWeight(''); setTotal(''); setConfirmed(false); setAttempted(false); setMessage('기록을 삭제했어요. 허용량 확인 필요 상태로 돌아갑니다.'); }}>기록 삭제</button>}</div><p role="status">{message}</p>
    </form><p className="pmb-allowance-note">개수제와 총중량제를 바꿔 계산하지 않습니다. 구간별·운임별 조건은 항공권에서 확인하세요. 기록한 값은 현재 여행의 참고 메모이며 실제 무료 위탁 권리를 보장하지 않습니다.</p></section>;
}
