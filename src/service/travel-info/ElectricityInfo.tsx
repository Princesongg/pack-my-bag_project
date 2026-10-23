import { Plug } from 'lucide-react';
import { electricity, plugTypes } from '../data/electricity';
import SourceLinks from './SourceLinks';
const plugImage = new URL('../data/assets/plugs/type-a.svg', import.meta.url).href;
export default function ElectricityInfo({ countryId }: { countryId: string }) {
  const jp = countryId === 'JP';
  const electric = electricity.JP;
  return <article id="pmb-guide-electricity" className="pmb-guide-info-card"><span className="pmb-guide-card-icon"><Plug size={25}/></span><h3>PLUGS & ELECTRICITY</h3><h4>충전 준비도 잊지 마세요</h4>{jp ? <><div className="pmb-guide-plug"><img src={plugImage} width="62" height="62" alt="Type A 콘센트 형태: 평행한 두 개의 납작한 핀"/><div><strong>{electric.voltageV.value?.join(' / ')}V · {plugTypes.A.label}</strong><span>{electric.frequencyHz.value?.join(' / ')}Hz</span></div></div><p>{electric.regionalFrequency.value}</p><p>{electric.adapter.text}</p><details><summary>어댑터와 변압기 구분하기</summary><p>{electric.deviceCaution.text}</p><p>도식은 형태를 구분하기 위한 그림이며 치수·인증을 나타내지 않습니다. 시설별 콘센트는 직접 확인해 주세요.</p></details><SourceLinks ids={[...electric.voltageV.sourceIds, ...electric.frequencyHz.sourceIds, ...electric.plugTypeIds.sourceIds, ...electric.adapter.basedOn]}/></> : <p className="pmb-guide-pending">선택한 국가의 검증된 전압·플러그 자료는 아직 준비 중입니다.</p>}</article>;
}
