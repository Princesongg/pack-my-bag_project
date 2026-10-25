import type { getClimateMonth } from '../data/climate';
import { getSource } from '../data/sources';
import { formatClimateBasis } from './guideModel';
import { getVisibleClimateMetrics } from './climateMetricsModel';

export default function ClimateMetrics({ climate }: { climate: ReturnType<typeof getClimateMonth> }) {
  const available = getVisibleClimateMetrics(climate);
  const temperatures = available.filter(item => item.key !== 'precipitationMm');
  const complete = temperatures.length === 3;
  const missingHigh = !available.some(item => item.key === 'meanDailyMaximumC');
  const missingLow = !available.some(item => item.key === 'meanDailyMinimumC');
  const card = ({ key, label, unit, metric }: typeof available[number]) => <div key={key} data-climate-metric={key} className={key === 'meanTemperatureC' ? 'pmb-guide-temperature' : ''}>
    <span>{key === 'meanTemperatureC' && metric.basis.startsWith('derived-') ? '평균기온 (계산 참고)' : label}</span>
    <strong className="pmb-climate-number"><span>{metric.value!.toFixed(1)}</span><small>{unit}</small></strong>
    <small>{formatClimateBasis(metric)}</small>
    {'countryId' in climate && ['VN', 'TH'].includes(climate.countryId) && <small>{metric.basis === 'derived-normal-high-low-midpoint' ? 'PACK MY BAG 계산 · ' : ''}{'evidenceNote' in metric && metric.evidenceNote ? metric.evidenceNote : getSource(metric.sourceIds[0])?.organization}</small>}
  </div>;
  if (!available.length) return <p className="pmb-climate-missing">확인된 월별 기후 자료가 아직 없어요. 출발 전 현지 예보를 확인해 주세요.</p>;
  return <>
    {complete ? <><div className="pmb-guide-metrics">{temperatures.map(card)}</div>{available.some(item => item.key === 'precipitationMm') && <div className="pmb-guide-metrics pmb-guide-rainfall">{available.filter(item => item.key === 'precipitationMm').map(card)}</div>}</> : <div className={`pmb-guide-metrics pmb-climate-available${available.length === 1 ? ' pmb-climate-single' : ''}`}>{available.map(card)}</div>}
    {(missingHigh || missingLow) && <p className="pmb-climate-missing">{missingHigh && missingLow ? '평균 최고·최저기온의 공식 평년값은 추가 확인이 필요해요.' : `평균 ${missingHigh ? '최고' : '최저'}기온의 공식 평년값은 추가 확인이 필요해요.`}</p>}
  </>;
}
