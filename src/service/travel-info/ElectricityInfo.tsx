import { Plug } from 'lucide-react';
import { getElectricityGuide, vietnamUsageCopy, thailandUsageCopy } from '../data/electricityGuide';
import PlugVisuals from './PlugVisuals';
import SourceLinks from './SourceLinks';
import StatusBadge from './StatusBadge';
import './ElectricityInfo.css';

export default function ElectricityInfo({ countryId }: { countryId: string }) {
  const guide = getElectricityGuide(countryId);
  if (!guide?.verified) return <article id="pmb-guide-electricity" className="pmb-guide-info-card"><h3>전압 · 플러그</h3><p>공식 출처 확인 필요 · 제품 사양과 숙소 콘센트를 확인해 주세요.</p></article>;
  const adapter = guide.preparation.find(item => item.id === 'electronic:travel-adapter')!;
  const vietnam = countryId === 'VN';
  const usage = vietnam ? vietnamUsageCopy : countryId === 'TH' ? thailandUsageCopy : null;
  return <article id="pmb-guide-electricity" className="pmb-guide-info-card pmb-electricity-usage">
    <span className="pmb-guide-card-icon"><Plug size={25}/></span><h3>PLUGS & ELECTRICITY · {guide.name}</h3>
    <strong className="pmb-electricity-main">{guide.main}</strong>
    {!usage && <p className="pmb-electricity-takeaway">어댑터 <strong>{adapter.status}</strong> · {adapter.reason}</p>}
    <section data-electricity-section="use" className={usage ? 'pmb-electricity-compatibility' : undefined}><h4>{usage ? usage.title : '① 한국 제품을 사용할 수 있나요?'}</h4>
      {usage ? <><p><strong>{usage.lead}</strong></p><p>{usage.explanation}</p><details><summary>충전기 입력 사양 확인하기</summary><p>{guide.compatibility}</p><p>{guide.comparison}</p>{vietnam && <p>{guide.cautions[1]}</p>}</details></> : <><p>{guide.comparison}</p><p>{guide.compatibility}</p></>}
    </section>
    {usage && <aside className="pmb-electricity-dryer"><h4>{usage.dryerTitle}</h4><StatusBadge className="pmb-preparation-status" label="제품 사양 확인 필요"/><p>{usage.dryerSummary}</p><details><summary>허용 전력·제조사·숙소 비품 확인</summary><p>{usage.dryerPower}</p><p>{usage.dryerCheck}</p></details></aside>}
    <section data-electricity-section="shape"><h4>② 현지 콘센트는 어떻게 생겼나요?</h4><p>{guide.shapes}</p>
      {guide.verified ? <><PlugVisuals countryId={countryId} compact/><details><summary>콘센트·플러그 큰 그림과 추가 형태</summary><PlugVisuals countryId={countryId}/>{guide.details.map(text => <p key={text}>{text}</p>)}</details></> : <p>공식 출처 확인 필요 · 확인되지 않은 그림은 표시하지 않아요.</p>}
    </section>
    <section data-electricity-section="packing" className="pmb-electricity-packing"><h4>{vietnam ? '베트남 여행, 이것만 확인하세요!' : countryId === 'TH' ? '태국 여행, 이것만 챙겨보세요!' : '③ 무엇을 챙겨야 하나요? · 챙길 준비물'}</h4>
      <ul className="pmb-preparation-list">{guide.preparation.map(item => <li key={item.name} data-preparation-id={item.id}>
        <strong>{item.name}</strong><StatusBadge className="pmb-preparation-status" label={item.status}/><p>{item.notes ? item.notes.map(note => <span className="pmb-preparation-note" key={note}>{note}</span>) : item.reason}</p>
      </li>)}</ul>
    </section>
    <section data-electricity-section="caution"><h4>④ 주의할 점은 무엇인가요?</h4><p>{guide.cautions[0]}</p><details><summary>{usage ? '접지 연결과 플러그 맞음새 확인' : '접지·고전력 제품과 사용 조건 확인'}</summary>{guide.cautions.slice(vietnam ? 2 : 1).filter((_, index) => countryId !== 'TH' || index !== 1).map(text => <p key={text}>{text}</p>)}</details></section>
    <SourceLinks ids={guide.sourceIds}/>
    <details className="pmb-electricity-comparison-source"><summary>한국 비교 기준 · 220V / 60Hz</summary><SourceLinks ids={['kr-electricity-comparison']}/></details>
  </article>;
}
