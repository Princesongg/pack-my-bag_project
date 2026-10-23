import { CloudRain, Footprints, Layers, Shirt, Snowflake, ThermometerSun, Wind, type LucideIcon } from 'lucide-react';
import { getTripClimate } from '../data/climate';
import { travelNotices } from '../data/notices';
import { clothingPolicy } from '../data/clothing';
import { getClothingPreview, formatClimateValue, formatClimateBasis, getWeatherPoints } from './guideModel';
import SourceLinks from './SourceLinks';
import { MobileMore, useCompactGuide } from './MobileCompact';
import { getInternationalProfile, internationalCityZones } from '../data/international';

type Segment = ReturnType<typeof getTripClimate>[number];
const clothingIcons: Record<string, LucideIcon> = {
  't-shirt': Shirt, 'light-long-sleeve': Shirt, shirt: Shirt, cardigan: Layers, knit: Layers,
  'light-jacket': Wind, 'winter-coat': Snowflake, 'cold-weather-accessories': Snowflake,
  'rain-protection': CloudRain, 'walking-shoes': Footprints,
};
const metricLabels = [
  ['meanTemperatureC', '월평균 기온', '°C'], ['meanDailyMaximumC', '평균 최고기온', '°C'],
  ['meanDailyMinimumC', '평균 최저기온', '°C'], ['precipitationMm', '월강수량 평균', 'mm'],
] as const;

export default function WeatherGuide({ segment, cityName, travelPurpose }: { segment: Segment; cityName: string; travelPurpose: string }) {
  const climate = segment.climate;
  const provenance = climate.provenance;
  const preview = getClothingPreview(climate, travelPurpose);
  const points = getWeatherPoints(climate, travelPurpose);
  const mobile = useCompactGuide();
  const zone = internationalCityZones[climate.cityId];
  const research = getInternationalProfile(zone?.ianaId.startsWith('America/') ? 'US' : zone ? 'AU' : '');
  const chip = (item: typeof preview[number]) => <details className="pmb-mobile-clothing-chip" key={item.ruleId} data-checklist-item-id={item.checklistItemId}><summary>{item.name}</summary><div><p>{item.reason}</p><ul>{item.reviewNotes.map(note => <li key={note}>{note}</li>)}</ul></div></details>;
  return <article className="pmb-guide-weather" id="pmb-weather-panel" aria-labelledby="pmb-weather-month">
    <div className="pmb-guide-weather-heading"><div><span className="pmb-guide-eyebrow">PAST CLIMATE / {cityName.toUpperCase()}</span><h3 id="pmb-weather-month">{segment.year}년 {segment.month}월의 여행 준비{provenance?.season && ` · ${provenance.season}`}</h3><p>이 달에 포함된 여행 일정 {segment.daysCovered}일 · 과거 월별 기후 참고</p></div><span className="pmb-guide-weather-icon"><ThermometerSun size={38} strokeWidth={1.4}/></span></div>
    {!climate.recommendedMetrics ? <div className="pmb-guide-empty"><h4>공식 정보 확인 필요</h4><p>선택한 도시의 검증된 월별 기후자료가 아직 없습니다. 다른 도시의 기온으로 대신 안내하지 않습니다.</p><p>옷차림 제안은 공식 기후자료를 확보한 뒤 제공할 예정이에요.</p>{research && <><p>{research.climate.notes}</p><p>아래는 공식 자료 조회 경로입니다. 자료 안내를 확인한 날짜이며 도시별 수치의 검증 완료일이 아닙니다. 2016–2025 평균이나 다른 기간의 평년값으로 대체 표시하지 않습니다.</p><SourceLinks ids={research.climate.sourceIds}/></>}</div> : <>
      <div className="pmb-guide-metrics">{metricLabels.slice(0, 3).map(([key, label, unit]) => {
        const metric = climate.recommendedMetrics![key];
        return <div key={key} className={key === 'meanTemperatureC' ? 'pmb-guide-temperature' : ''}><span>{key === 'meanTemperatureC' && metric.basis === 'derived-high-low-midpoint' ? '평균기온 (계산 참고)' : label}</span><strong>{formatClimateValue(metric.value, unit)}</strong><small>{metric.value === null ? '공식 정보 확인 필요' : formatClimateBasis(metric)}</small></div>;
      })}</div>
      {climate.recommendedMetrics.precipitationMm.value !== null && <div className="pmb-guide-metrics pmb-guide-rainfall">{metricLabels.slice(3).map(([key, label, unit]) => {
        const metric = climate.recommendedMetrics![key];
        return <div key={key} className={key === 'meanTemperatureC' ? 'pmb-guide-temperature' : ''}><span>{key === 'meanTemperatureC' && metric.basis === 'derived-high-low-midpoint' ? '평균기온 (계산 참고)' : label}</span><strong>{formatClimateValue(metric.value, unit)}</strong><small>{metric.value === null ? '공식 정보 확인 필요' : formatClimateBasis(metric)}</small></div>;
      })}</div>}
      <MobileMore title="기온·강수량 해석 안내"><p className="pmb-guide-note">평균 최고·최저는 일최고·일최저 기온의 월평균이에요. 월강수량은 여행일의 예상 강수량이나 비 올 확률이 아닙니다.</p></MobileMore>
      {points && <div className="pmb-guide-season"><h4>이달의 날씨 포인트</h4>{mobile && <p>{points.observations[0]}</p>}<MobileMore title="날씨 포인트 자세히 보기"><p>{points.observations.join(' ')}</p>{points.suggestions.length > 0 && <p className="pmb-guide-weather-tip"><strong>PACK MY BAG · 준비 제안</strong><br/>{points.suggestions.join(' ')} 옷차림은 공식 관측값이 아닌 서비스 제안이며, 개인차와 실제 예보를 함께 확인하세요.</p>}</MobileMore></div>}
      <MobileMore title="공식 출처·통계 기준·확인일">{provenance ? <div className="pmb-guide-climate-evidence"><p>{provenance.organization} · {provenance.stationName}<br/>{provenance.label}</p><p>마지막 자료 확인: {provenance.lastVerified}</p><SourceLinks ids={[...new Set(Object.values(climate.recommendedMetrics).flatMap(metric => metric.sourceIds))]}/><details className="pmb-guide-method"><summary>자료 기준과 계산 방법 확인</summary><p>{provenance.method}</p>{climate.warnings?.map(warning => <p key={warning}>{warning}</p>)}</details></div> : <div className="pmb-guide-climate-evidence"><p>마지막 자료 확인: {Object.values(climate.recommendedMetrics)[0].lastVerified} · 일본 기상청 관측자료를 이용한 PACK MY BAG 계산</p><SourceLinks ids={[...new Set(Object.values(climate.recommendedMetrics).flatMap(metric => metric.sourceIds))]}/><details className="pmb-guide-method"><summary>자료 기준과 계산 방법 확인</summary><p>2016–2025년의 같은 달 관측값 10개를 동일한 가중치로 평균했습니다. 정상값 10개가 없으면 계산하지 않으며, 대체한 항목에는 1991–2020년 공식 평년값 기준을 따로 표시합니다.</p>{climate.warnings?.map(warning => <p key={warning}>{warning}</p>)}</details>
      {climate.officialNormal && <details className="pmb-guide-normal"><summary>참고 자료 · 1991–2020년 공식 평년값</summary><dl>{metricLabels.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{formatClimateValue(climate.officialNormal!.metrics[key].value, unit)}</dd></div>)}</dl><p>일본 기상청 공식 30년 평년값입니다. 최근 10년 평균과 같은 기준으로 혼합하거나 그 차이를 기후변화량으로 해석하지 않습니다.</p><SourceLinks ids={[climate.officialNormal.sourceId]}/></details>}
      <p className="pmb-guide-review">공식 정보 확인 필요 · 관측소 이전·관측 환경·통계 단절의 전체 이력은 검토 중입니다.</p></div>}</MobileMore>
      <section className="pmb-guide-clothing" aria-labelledby="pmb-clothing-title"><div className="pmb-guide-clothing-heading"><h4 id="pmb-clothing-title">이런 옷차림을 검토해 보세요</h4><span>PACK MY BAG · 검토용 제안</span></div><p>{clothingPolicy.disclaimer}</p>
        {preview.length ? mobile ? <><div className="pmb-mobile-clothing-chips">{preview.slice(0, 4).map(chip)}</div>{preview.length > 4 && <MobileMore title={`전체 보기 · ${preview.length}개`}><div className="pmb-mobile-clothing-chips">{preview.slice(4).map(chip)}</div></MobileMore>}<p className="pmb-mobile-chip-hint">태그를 눌러 추천 이유와 상세 조건을 확인하세요.</p></> : <div className="pmb-guide-outfits">{preview.map(item => { const Icon = clothingIcons[item.id] ?? Shirt; return <article key={item.ruleId} className="pmb-guide-outfit" data-checklist-item-id={item.checklistItemId}><div><Icon size={22} strokeWidth={1.6}/><h5>{item.name}</h5></div><span className="pmb-guide-outfit-status">{item.priority === 'recommended' ? '권장 후보' : '선택 후보'}</span><p>{item.reason}</p><details><summary>함께 확인할 조건</summary><ul>{item.reviewNotes.map(note => <li key={note}>{note}</li>)}</ul></details></article>; })}</div> : <p className="pmb-guide-note">확인된 동일 기준의 기후 조건으로 표시할 옷차림 후보가 없습니다. 자료 기준과 출발 전 기상예보, 개인 활동 조건을 확인해 주세요.</p>}
        <MobileMore title="옷차림 제안 이용 안내"><p className="pmb-guide-review">초안 규칙에 맞는 후보만 표시합니다. 공식 기관의 권장 복장이 아니며, 계절 정보·최신 예보·개인차 확인 전 확정 추천하지 않습니다. MY BAG에는 같은 물품 ID로 연결됩니다.</p></MobileMore>
      </section>
    </>}
    <MobileMore title="과거 기후자료 이용 안내"><p className="pmb-guide-weather-disclaimer">{travelNotices.climate}</p></MobileMore>
  </article>;
}
