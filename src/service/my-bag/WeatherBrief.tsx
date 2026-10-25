import type { CSSProperties } from 'react';
import type { Trip } from '../trip/trip';
import { formatClimateValue } from '../travel-info/guideModel';
import { getWeatherBrief, getWeatherSegments } from './weatherBriefModel';

export default function WeatherBrief({ trip }: { trip: Trip }) {
  const segments = getWeatherSegments(trip);
  return <span className="pmb-weather-brief">
    {segments.map(segment => {
      const brief = getWeatherBrief(segment.climate, trip.travelPurpose);
      const provenance = segment.climate.provenance;
      const note = provenance && 'displayNote' in provenance ? provenance.displayNote : undefined;
      return <span className="pmb-weather-month" key={`${segment.year}-${segment.month}`} data-weather-city={segment.climate.cityId} data-weather-month={segment.month}>
        <span className="pmb-trip-brief-temperature">
          <span className="pmb-trip-brief-temperature-label">{segments.length > 1 ? `${segment.year}년 ` : ''}{segment.month}월 평균기온{brief.calculatedMean && ' (계산 참고)'}</span>
          <strong className={brief.mean === null ? 'pmb-trip-brief-temperature-missing' : 'pmb-trip-brief-temperature-value'} data-weather-mean>{brief.mean === null ? '자료 확인 필요' : formatClimateValue(brief.mean, '°C')}</strong>
        </span>
        {brief.range && <span className="pmb-weather-range" data-weather-range>
          <span className="pmb-weather-range-labels"><span>월평균 최저<strong data-weather-low>{formatClimateValue(brief.range.low, '°C')}</strong></span><span>월평균 최고<strong data-weather-high>{formatClimateValue(brief.range.high, '°C')}</strong></span></span>
          <span className="pmb-weather-range-track" aria-hidden="true"><span className="pmb-weather-range-mean" style={{ '--mean-position': `${brief.range.meanPosition}%` } as CSSProperties}><span>평균</span></span></span>
          {segment.climate.recommendedMetrics?.meanDailyMaximumC.basis === 'all-years-of-record' && <small>전체 가용 관측기간 · 항목별 표본 연수 차이 있음</small>}
        </span>}
        {note && <small className="pmb-weather-evidence">{note}</small>}
        {brief.clothing.length > 0 ? <span className="pmb-weather-clothing"><span className="pmb-weather-clothing-label">추천 옷차림 · 검토용</span><span className="pmb-weather-tags">{brief.clothing.map(item => <span key={item.checklistItemId} data-weather-item={item.checklistItemId}>{item.name}</span>)}</span></span> : <span className="pmb-weather-empty">{brief.mean === null ? '검증된 기후자료가 없습니다. 자세히 보기에서 공식 출처를 확인해 주세요.' : '옷차림은 상세 안내와 출발 전 예보를 확인해 주세요.'}</span>}
      </span>;
    })}
    <small className="pmb-weather-disclaimer">과거 월별 기후 참고 · 실제 여행일 예보 아님</small>
  </span>;
}
