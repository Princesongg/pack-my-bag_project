import { batteryCarryLabels } from '../data/baggageLabels';
import PassportCheck from './PassportCheck';
import { getEntryRegulation } from '../data/entryRegulations';
import SourceLinks from '../travel-info/SourceLinks';
import { useState } from 'react';
import { CreditCard, ExternalLink, Flag, IdCard, ShieldCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import BaggageGuide from '../travel-info/BaggageGuide';
import ServiceModal from './ServiceModal';
import { redFlagGroups, redFlagProgress, type RedFlagGroup } from './redFlagsModel';
import './PackingRedFlags.css';
import { allowanceLabel, type BaggageAllowance } from './baggageAllowance';

export type RedFlagRequest = { group: RedFlagGroup; trigger: HTMLElement };
type Props = { trip: Trip; allowance?: BaggageAllowance; checkedIds: string[]; onToggle: (id: string) => void; request: RedFlagRequest | null; onOpen: (value: RedFlagRequest) => void; onClose: () => void };
const groupIcons = { passport: IdCard, payment: CreditCard, baggage: ShieldCheck };
export default function PackingRedFlags(props: Props) {
  const progress = redFlagProgress(props.checkedIds);
  return <section className="pmb-red-flags" aria-labelledby="pmb-red-flags-title"><div className="pmb-red-flags-copy"><span><Flag size={18}/> PACKING RED FLAGS</span><h2 id="pmb-red-flags-title">출발 전, 놓친 건 없나요?</h2><p>여권, 결제 카드, 항공 반입 규정을 미리 확인해 보세요.</p><div className="pmb-red-flags-chips">{redFlagGroups.map(group => { const Icon = groupIcons[group.id]; return <span key={group.id}><Icon size={15}/>{group.id === 'passport' ? '여권' : group.id === 'payment' ? '결제 카드' : '항공 반입 규정'}</span>; })}</div></div><div className="pmb-red-flags-action"><p role="status"><span className="pmb-red-flags-count-full">3개 중 {progress.filter(group => group.complete).length}개 영역 확인</span><span className="pmb-red-flags-count-compact">확인 필요 {progress.filter(group => !group.complete).length}개</span></p><button type="button" aria-haspopup="dialog" onClick={event => props.onOpen({ group: 'passport', trigger: event.currentTarget })}>출발 전 점검하기</button><small>사용자가 직접 확인한 상태예요.</small></div>{props.request && <RedFlagsModal key={props.request.group} {...props}/>}</section>;
}
function RedFlagsModal({ trip, allowance, checkedIds, onToggle, request, onClose }: Props) {
  const entry=getEntryRegulation(trip);
  const [active, setActive] = useState<RedFlagGroup>(request!.group);
  const group = redFlagGroups.find(group => group.id === active)!;
  const progress = redFlagProgress(checkedIds);
  return <ServiceModal title="PACKING RED FLAGS" topic="red-flags" onClose={onClose} returnFocus={request!.trigger}><div className="pmb-service pmb-guide-service pmb-brief-modal-content pmb-red-flags-modal"><p className="pmb-red-flags-disclaimer">확인 완료는 사용자가 직접 점검했다는 표시입니다. 시스템이 여권·카드의 실제 유효성이나 반입 가능 여부를 검증한 결과가 아닙니다.</p>
    <div className="pmb-red-flags-tabs" role="group" aria-label="점검 영역">{redFlagGroups.map(group => <button key={group.id} type="button" aria-pressed={active === group.id} onClick={() => setActive(group.id)}>{group.name}<small>{progress.find(p => p.id === group.id)!.complete ? '확인 완료' : '확인 전'} · {progress.find(p => p.id === group.id)!.checked}/{group.items.length}</small></button>)}</div>
    <section aria-labelledby="pmb-red-flags-group-title"><h3 id="pmb-red-flags-group-title">{group.title} — {group.name}</h3>
      {active === 'passport' && <PassportCheck key={[trip.countryId, trip.departureDate, trip.returnDate, trip.travelPurpose].join(':')} trip={trip}/>}
      {active==='passport'&&entry&&<section className="pmb-entry-key-points" aria-label="입국신고 점검"><h4>입국신고 절차</h4><p>{entry.arrival}</p><SourceLinks ids={trip.countryId==='JP'?['digital-agency-vjw']:trip.countryId==='VN'?['entry-vn-pai']:trip.countryId==='TH'?['entry-th-tdac']:trip.countryId==='TW'?['entry-tw-twac']:trip.countryId==='AU'?['entry-au-ipc','entry-au-atd']:['entry-us-vwp-current']}/></section>}
      {active === 'payment' && <><p>자신의 카드사 앱·공식 안내에서 직접 확인해 주세요. 카드번호·CVC·비밀번호는 입력받지 않으며, 카드사 내부 상태를 자동 조회하지 않습니다.</p><div className="pmb-red-flags-payment-note"><strong>해외 이용 차단 ≠ 해외 원화 결제(DCC) 차단</strong><p>해외 이용 차단은 해외 거래 자체의 이용 설정입니다. DCC 차단은 해외 가맹점의 원화(KRW) 결제를 제한하는 별도 설정입니다. DCC 차단만으로 해외 결제 전체가 불가능하다고 판단하지 마세요. 현지통화 결제와 실제 카드 이용 조건은 카드사에서 확인하세요.</p></div><details><summary>카드사 공식 안내 · 확인일 2026-10-23</summary><a className="pmb-red-flags-official" href="https://mapps.kbcard.com/SVC/DVIEW/HSDMCXPRISVCD0029" target="_blank" rel="noreferrer">KB국민카드 · 해외거래정지 등록·해제<ExternalLink size={15}/></a><a className="pmb-red-flags-official" href="https://www.bccard.com/app/card/BcnewsViewActn.do?newsurl=%2Fcard%2Fhtml%2Fetc%2Fnotice%2F1203858_21460.jsp" target="_blank" rel="noreferrer">BC카드 · 해외원화결제(DCC) 차단 안내<ExternalLink size={15}/></a><p>설정 명칭과 적용 범위는 이용 카드사의 안내를 확인하세요.</p></details></>}
      {active === 'baggage' && <><p className="pmb-red-flags-baggage-note">{trip.baggageType === 'cabin-only' ? '기내수하물만 이용하는 여행입니다. 액체류의 용기·포장과 배터리 휴대 조건을 확인하세요.' : '위탁수하물이 포함된 여행입니다.'} {batteryCarryLabels.description} {batteryCarryLabels.conditions}</p><p>{allowanceLabel(allowance)}{allowance ? ' \u00b7 \uc0ac\uc6a9\uc790 \uc9c1\uc811 \uc785\ub825' : ' \u00b7 MY BAG \ud56d\uacf5 \uc218\ud558\ubb3c \uc548\ub0b4\uc5d0\uc11c \uae30\ub85d\ud560 \uc218 \uc788\uc5b4\uc694.'}</p><BaggageGuide/></>}
      <fieldset className="pmb-red-flags-checks"><legend>직접 확인한 항목을 표시해 주세요.</legend>{group.items.map(item => <label key={item.id}><input type="checkbox" checked={checkedIds.includes(item.id)} onChange={() => onToggle(item.id)} data-red-flag-id={item.id}/><span>{item.label}</span><small>{checkedIds.includes(item.id) ? '확인 완료' : '확인 전'}</small></label>)}</fieldset>
    </section>
  </div></ServiceModal>;
}
