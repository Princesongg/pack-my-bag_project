import { useRef, useState } from 'react';
import { ArrowUpRight, ClipboardCheck } from 'lucide-react';
import type { Trip } from '../trip/trip';
import { getVisaRequirement } from '../data/visaRequirements';
import StatusBadge from '../travel-info/StatusBadge';
import SourceLinks from '../travel-info/SourceLinks';
import ServiceModal from './ServiceModal';
import './EntryPreparationBanner.css';

type Props={trip:Trip;confirmed:boolean;onConfirm:(value:boolean)=>void};
export default function EntryPreparationBanner({trip,confirmed,onConfirm}:Props){
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const visaRequirement=getVisaRequirement(trip);
  if(!visaRequirement||visaRequirement.type==='none')return null;
  const status=visaRequirement.needsReview?'추가 확인 필요':confirmed?'직접 확인함':'확인 필요';
  return <>
    <button ref={trigger} type="button" className="pmb-entry-banner" data-visa-type={visaRequirement.type} aria-haspopup="dialog" onClick={()=>setOpen(true)}>
      <ClipboardCheck size={24} aria-hidden="true"/>
      <span className="pmb-entry-banner-copy"><span className="pmb-entry-banner-heading"><strong>VISA / ENTRY PERMISSION</strong><StatusBadge label={visaRequirement.label} variant="info"/></span><span>{visaRequirement.summary}</span></span>
      <span className="pmb-entry-banner-action">비자·입국 승인 자세히 보기 <ArrowUpRight size={17} aria-hidden="true"/></span>
    </button>
    {open&&<ServiceModal topic="entry" title="VISA / ENTRY PERMISSION" returnFocus={trigger.current} onClose={()=>setOpen(false)}>
      <div className="pmb-service pmb-entry-detail pmb-brief-modal-content">
        <section className="pmb-entry-key-points" aria-label="비자·전자여행허가 안내"><StatusBadge label={visaRequirement.label} variant="info"/><p><strong>{visaRequirement.summary}</strong></p><ul>{visaRequirement.points.map(point=><li key={point}>{point}</li>)}</ul></section>
        <nav className="pmb-entry-official" aria-label="공식 비자·여행허가 링크">{visaRequirement.officialLinks.map(link=><a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ArrowUpRight size={17}/></a>)}</nav>
        {visaRequirement.needsReview&&<p className="pmb-entry-review">방문 목적·체류기간이 단기 관광 기본 안내에 맞는지 공식 사이트에서 별도로 확인해 주세요.</p>}
        <section className="pmb-entry-confirmation" aria-label="내 비자·여행허가 확인"><StatusBadge label={status}/><label><input type="checkbox" data-entry-confirmation checked={confirmed} onChange={event=>onConfirm(event.target.checked)}/>내 여행의 비자·전자여행허가 조건을 직접 확인했어요.</label><p>개인의 확인 기록이며 정부 승인이나 입국 허가를 뜻하지 않아요.</p></section>
        <p className="pmb-entry-scope">입국 조건은 체류 목적·국적·여권 종류에 따라 달라질 수 있어 공식 안내를 확인해 주세요.</p>
        <SourceLinks ids={visaRequirement.sourceIds}/>
      </div>
    </ServiceModal>}
  </>;
}
