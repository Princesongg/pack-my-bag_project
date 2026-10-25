import { destinations } from '../destination/destinations';
import { pending, verified, type JapanCityId } from './types';

export const cities = destinations.flatMap(country => country.cities.map(city => ({
  cityId: city.id, countryId: country.id, name: city.name, english: city.english,
  climateStatus: ['JP', 'US', 'AU', 'TW', 'VN'].includes(country.id) ? 'partially-verified' as const : 'needs-research' as const,
})));

export const japanStations: Record<JapanCityId, {
  stationId: string; precNo: string; japaneseName: string;
  continuityReview: 'needs-research'; notes: string[];
}> = {
  tokyo: { stationId: '47662', precNo: '44', japaneseName: '東京', continuityReview: 'needs-research', notes: ['2014-12-02 관측지 변경은 공식 확인됨(수집 기간 이전).', '1991–2020 평년값과 관측 평균은 동질성 보정 여부가 다를 수 있으므로 차이를 기후변화량으로 해석하지 않는다.'] },
  osaka: { stationId: '47772', precNo: '62', japaneseName: '大阪', continuityReview: 'needs-research', notes: ['2016–2025 기간 전체의 이전·관측 환경·통계 단절 이력 추가 조사 필요.'] },
  fukuoka: { stationId: '47807', precNo: '82', japaneseName: '福岡', continuityReview: 'needs-research', notes: ['2016–2025 기간 전체의 이전·관측 환경·통계 단절 이력 추가 조사 필요.'] },
  sapporo: { stationId: '47412', precNo: '14', japaneseName: '札幌', continuityReview: 'needs-research', notes: ['2016–2025 기간 전체의 이전·관측 환경·통계 단절 이력 추가 조사 필요.'] },
};

export const seasonalFeatures = {
  tokyo: pending<string[]>('월별 정성적 계절 특징의 공식 지역 자료 추가 조사 필요.'),
  osaka: pending<string[]>('월별 정성적 계절 특징의 공식 지역 자료 추가 조사 필요.'),
  fukuoka: pending<string[]>('월별 정성적 계절 특징의 공식 지역 자료 추가 조사 필요.'),
  sapporo: verified(['겨울은 춥고 눈이 많은 특징이 있다.'], ['sapporo-season'], '정성적 겨울 특징만 사용하며 특정 여행 날짜의 강설을 예측하지 않는다.'),
};
