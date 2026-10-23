import { useState } from 'react';
import { ChevronDown, Feather, RotateCcw } from 'lucide-react';
import type { BagItem } from './bag';
import { answersComplete, emptyPackLessAnswers, getPackingSuggestions, sanitizeDecisions, type PackLessAnswers, type PackLessState, type PackingDecisions } from './packLessModel';
import './PackLess.css';

const questions = [
  { key: 'accommodationAmenities', title: '숙소에 세면용품이 제공되나요?', options: [['yes', '네, 제공돼요.'], ['no', '아니요, 직접 챙겨야 해요.'], ['unknown', '아직 모르겠어요.']] },
  { key: 'laundryPlan', title: '여행 중 세탁할 계획이 있나요?', options: [['yes', '네, 있어요.'], ['no', '아니요, 없어요.']] },
  { key: 'shoppingPlan', title: '여행지에서 쇼핑할 계획인가요?', options: [['yes', '네, 있어요.'], ['no', '아니요, 없어요.']] },
] as const;
const groups = [{ id: 'keep', name: '꼭 챙길 것' }, { id: 'review', name: '확인 후 결정할 것' }, { id: 'reduce', name: '줄여도 될 것' }] as const;

export default function PackLess({ items, tripDays, saved, onApply, onUndo }: { items: BagItem[]; tripDays: number | null; saved?: PackLessState; onApply: (value: PackLessState) => void; onUndo: () => void }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  return <section className="pmb-pack-less" aria-labelledby="pmb-pack-less-title"><div className="pmb-pack-less-heading"><Feather size={24}/><div><span>PACK LESS</span><h2 id="pmb-pack-less-title">Pack lighter, travel better.</h2><p>몇 가지만 알려주면 짐을 조금 더 가볍게 정리할 수 있어요.</p></div></div>
    <div className="pmb-pack-less-entry-actions"><button type="button" onClick={() => { setOpen(value => !value); setNotice(''); }} aria-expanded={open} aria-controls="pmb-pack-less-editor">{open ? '닫기' : saved ? 'PACK LESS 설정 다시 변경' : '내 짐 가볍게 만들기'}</button>{saved?.previous && <button type="button" className="pmb-pack-less-secondary" onClick={() => { onUndo(); setOpen(false); setNotice('직전 적용 전의 설정으로 되돌렸어요. 체크 상태와 직접 추가한 물품은 유지됩니다.'); }}><RotateCcw size={16}/> 직전 적용 되돌리기</button>}</div>
    {open && <PackLessEditor key={JSON.stringify(saved)} items={items} tripDays={tripDays} saved={saved} onApply={value => { onApply(value); setOpen(false); setNotice('선택한 변경을 MY BAG에 적용했어요. 제외한 물품은 아래에서 복원할 수 있어요.'); }}/>}<p className="pmb-pack-less-notice" role="status">{notice}</p>
  </section>;
}

function PackLessEditor({ items, tripDays, saved, onApply }: { items: BagItem[]; tripDays: number | null; saved?: PackLessState; onApply: (value: PackLessState) => void }) {
  const [answers, setAnswers] = useState<PackLessAnswers>(() => ({ ...(saved?.answers ?? emptyPackLessAnswers) }));
  const [decisions, setDecisions] = useState<PackingDecisions>(() => ({ ...saved?.decisions }));
  const [results, setResults] = useState(false);
  const suggestions = getPackingSuggestions(items, answers, tripDays);
  const invalid = Object.entries(decisions).filter(([, value]) => value.action === 'reduce' && (!Number.isInteger(value.quantity) || value.quantity! < 1 || value.quantity! > 999));
  const changes = items.filter(item => {
    const before = saved?.decisions[item.id] ?? { action: 'keep' };
    const after = decisions[item.id] ?? { action: 'keep' };
    return before.action !== after.action || before.quantity !== after.quantity;
  });
  return <div id="pmb-pack-less-editor" className="pmb-pack-less-editor">
    {!results ? <><div className="pmb-pack-less-questions">{questions.map((question, index) => <fieldset key={question.key}><legend><span>0{index + 1}</span> {question.title}</legend>{question.options.map(([value, label]) => <label key={value}><input type="radio" name={`pack-less-${question.key}`} value={value} checked={answers[question.key] === value} onChange={() => setAnswers(previous => ({ ...previous, [question.key]: value }))}/><span>{label}</span></label>)}</fieldset>)}</div><p className="pmb-pack-less-note">사용자 답변을 바탕으로 제안합니다. 숙소 시설을 자동 확인하지 않으며, 아무 물품도 자동 제외하지 않습니다.</p><button type="button" disabled={!answersComplete(answers)} onClick={() => setResults(true)}>답변으로 제안 보기</button></> : <>
      <div className="pmb-pack-less-result-heading"><h3>필요한 짐만, 내가 결정해요</h3><button type="button" className="pmb-pack-less-secondary" onClick={() => setResults(false)}>답변 수정</button></div>
      <p className="pmb-pack-less-note">제안은 출발 전 확인을 돕는 참고입니다. 답변을 바꿔도 기존의 직접 선택은 유지됩니다. 수량은 처음에 지정되어 있지 않으므로, 줄이기를 선택하면 최종 챙길 수량을 직접 입력하세요.</p>
      {answers.shoppingPlan === 'yes' && <p className="pmb-pack-less-shopping">쇼핑할 계획이라고 답하셨어요. 구매할 물품을 넣을 여유 공간을 남겨두는 것을 추천해요.</p>}
      {groups.map(group => {
        const rows = suggestions.filter(item => item.group === group.id);
        return <details key={group.id} name="pmb-pack-less-results" className="pmb-pack-less-group"><summary>{group.name}<span>{rows.length}개</span><ChevronDown size={18} aria-hidden="true"/></summary>{!rows.length ? <p>현재 답변에서 해당하는 물품이 없어요.</p> : <ul>{rows.map(({ item, reason, protected: protectedItem }) => <li key={item.id} data-suggestion-id={item.id}><div><strong>{item.name}</strong><p>{reason}</p></div>{protectedItem ? <span className="pmb-pack-less-protected">중요 물품 · 유지</span> : <div className="pmb-pack-less-decision"><label><span className="pmb-pack-less-field-label">{item.name} 결정</span><select aria-label={`${item.name} 결정`} value={decisions[item.id]?.action ?? ''} onChange={event => {
          const action = event.target.value;
          setDecisions(previous => {
            const next = { ...previous };
            if (!action) delete next[item.id];
            else next[item.id] = action === 'reduce' ? { action, quantity: previous[item.id]?.quantity } : { action: action as 'keep' | 'exclude' };
            return next;
          });
        }}><option value="">선택하지 않음</option><option value="keep">유지하기</option><option value="reduce">수량 줄이기</option><option value="exclude">목록에서 제외하기</option></select></label>{decisions[item.id]?.action === 'reduce' && <label>최종 챙길 수량<input aria-label={`${item.name} 최종 수량`} type="number" min="1" max="999" step="1" value={decisions[item.id]?.quantity ?? ''} onChange={event => setDecisions(previous => ({ ...previous, [item.id]: { action: 'reduce', quantity: event.target.value === '' ? undefined : Number(event.target.value) } }))}/></label>}</div>}</li>)}</ul>}</details>;
      })}
      <section className="pmb-pack-less-preview" aria-labelledby="pmb-pack-less-preview-title"><h3 id="pmb-pack-less-preview-title">적용 전 미리 보기 · 변경 {changes.length}개</h3>{changes.length ? <ul>{changes.map(item => { const decision = decisions[item.id]; const before = saved?.decisions[item.id]; return <li key={item.id}>{item.name} · {decision?.action === 'exclude' ? '목록에서 제외' : decision?.action === 'reduce' ? `${before?.quantity ?? '미지정'} → ${decision.quantity ?? '입력 필요'}개` : before?.action === 'exclude' ? '목록에 복원' : '수량 조정 해제 · 유지'}</li>; })}</ul> : <p>물품 변경 없이 답변만 저장할 수 있어요.</p>}<p>체크 완료 상태와 직접 추가한 준비물은 그대로 유지됩니다.</p></section>
      {invalid.length > 0 && <p className="pmb-pack-less-error" role="alert">수량 줄이기를 선택한 물품의 최종 수량을 1~999의 정수로 입력해 주세요.</p>}
      <button type="button" disabled={invalid.length > 0} onClick={() => onApply({ answers, decisions: sanitizeDecisions(decisions, items), previous: { answers: saved?.answers ?? { ...emptyPackLessAnswers }, decisions: saved?.decisions ?? {} } })}>MY BAG에 적용하기</button>
    </>}
  </div>;
}
