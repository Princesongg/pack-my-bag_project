import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Luggage } from 'lucide-react';
import ServiceModal from './ServiceModal';
import FinalCheckIllustration from './FinalCheckIllustration';
import './FinalCheckCTA.css';

export default function FinalCheckCTA({ total, complete, onContinue }: { total: number; complete: number; onContinue: (scroll: number) => void }) {
  const remaining = total - complete;
  const [confirming, setConfirming] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const scroll = useRef(0);
  const continueAfterClose = useRef(false);
  useEffect(() => {
    if (!confirming && continueAfterClose.current) {
      continueAfterClose.current = false;
      onContinue(scroll.current);
    }
  }, [confirming, onContinue]);
  return <section className="pmb-final-cta" aria-labelledby="pmb-final-cta-title">
    <div><span className="pmb-final-cta-eyebrow">READY FOR THE FINAL CHECK?</span><h2 id="pmb-final-cta-title">짐은 모두 챙기셨나요?</h2><p>이제 출발 직전에 필요한 물건만 마지막으로 확인해요.</p><p className="pmb-final-cta-status" role="status">{remaining > 0 ? `아직 준비하지 않은 물품이 ${remaining}개 있어요.` : total > 0 ? `활성 준비물 ${total}개를 모두 확인했어요.` : '마지막 점검으로 이동할 수 있어요.'}</p></div>
    <button id="pmb-last-minute-entry" ref={trigger} className="pmb-final-cta-button" type="button" aria-haspopup={remaining > 0 ? 'dialog' : undefined} onClick={() => {
      scroll.current = window.scrollY;
      if (remaining > 0) setConfirming(true); else onContinue(scroll.current);
    }}><Luggage size={21} aria-hidden="true"/><span>짐싸기 완료! 마지막 점검하기</span><ArrowRight size={21} aria-hidden="true"/></button>
    {confirming && <ServiceModal title="마지막 점검으로 이동할까요?" topic="final-check-confirm" returnFocus={trigger.current} onClose={() => setConfirming(false)}><div className="pmb-final-confirm"><p>아직 확인하지 않은 준비물이 있어요.<br/>그래도 마지막 점검으로 이동할까요?</p><div><button type="button" onClick={() => setConfirming(false)}>준비물 더 확인하기</button><button type="button" onClick={() => { continueAfterClose.current = true; setConfirming(false); }}>마지막 점검으로 이동 <ArrowRight size={17}/></button></div></div></ServiceModal>}
    <FinalCheckIllustration/>
  </section>;
}
