import type { ClimateMetric } from './types';

export const clothingItems = [
  { id: 't-shirt', name: '반팔', checklistItemId: 'clothing:t-shirt' },
  { id: 'light-long-sleeve', name: '얇은 긴팔', checklistItemId: 'clothing:light-long-sleeve' },
  { id: 'shirt', name: '셔츠', checklistItemId: 'clothing:shirt' },
  { id: 'cardigan', name: '가디건', checklistItemId: 'clothing:cardigan' },
  { id: 'knit', name: '니트', checklistItemId: 'clothing:knit' },
  { id: 'light-jacket', name: '얇은 외투', checklistItemId: 'clothing:light-jacket' },
  { id: 'winter-coat', name: '겨울 외투', checklistItemId: 'clothing:winter-coat' },
  { id: 'cold-weather-accessories', name: '방한용품', checklistItemId: 'clothing:cold-weather-accessories' },
  { id: 'rain-protection', name: '우산 및 우비', checklistItemId: 'clothing:rain-protection' },
  { id: 'walking-shoes', name: '편한 운동화', checklistItemId: 'clothing:walking-shoes' },
  { id: 'swimwear', name: '수영복', checklistItemId: 'clothing:swimwear' },
] as const;

type ClothingId = typeof clothingItems[number]['id'];
type ClimateCondition = { metric: ClimateMetric | 'dailyTemperatureRangeC'; comparison: 'gte' | 'lt' | 'lte'; value: number };
interface ClothingRule {
  id: string; itemId: ClothingId; priority: 'recommended' | 'optional'; reason: string;
  allClimateConditions: ClimateCondition[];
  seasonalReview: string[];
  purposeIds?: string[];
  missingTemperatureFallback?: boolean;
  cityIds?: string[];
}

export const clothingPolicy = {
  author: 'PACK MY BAG', kind: 'service-recommendation', status: 'draft', enabled: false,
  // These are editable product heuristics, NOT official medical/safety thresholds.
  thresholdProvenance: 'service-authored-heuristic-not-official-guidance',
  requiredInputs: ['meanDailyMaximumC', 'meanDailyMinimumC', 'precipitationMm', 'seasonalFeatures', 'travelPurpose'],
  rulesForMissingInputs: '기후값 또는 계절 특징이 확인되지 않으면 자동 추천을 확정하지 않는다. null을 0으로 바꾸지 않는다.',
  crossMonthPolicy: '방문하는 각 달을 별도로 검토하고 중복 물품 ID를 합친다. 서로 다른 기간의 통계는 평균내어 혼합하지 않는다.',
  disclaimer: '공식 기후자료를 바탕으로 PACK MY BAG이 제안하는 일반적 옷차림이다. 개인차·실내 냉난방·고도·바람·활동량 및 출발 전 예보를 함께 확인한다.',
} as const;

// Declarative drafts only; no recommendation UI or automatic checklist generation.
export const clothingRules: ClothingRule[] = [
  { id: 'phuket-resort-swimwear', itemId: 'swimwear', priority: 'optional', cityIds: ['phuket'], purposeIds: ['relaxation'], reason: '푸껫 휴양 일정에 수영장·해변을 이용한다면 수영복을 고려하세요.', allClimateConditions: [{ metric: 'meanTemperatureC', comparison: 'gte', value: 25 }], seasonalReview: ['수영 여부와 숙소 시설을 확인한 뒤 결정', '강수·파도·해변 안전은 현지 예보와 안내를 별도로 확인'] },
  { id: 'warm-mean-review', itemId: 't-shirt', priority: 'optional', missingTemperatureFallback: true, reason: '평균 최고·최저가 미확인인 경우 확인된 월평균 25°C 이상을 참고해 가벼운 상의를 검토한다. 낮·밤 기온이나 실제 예보를 대신하지 않는다.', allClimateConditions: [{ metric: 'meanTemperatureC', comparison: 'gte', value: 25 }], seasonalReview: ['최고·최저는 미확인 상태이며 월평균만 사용한 서비스 검토 제안', '실제 예보·냉방·활동 조건 확인'] },
  { id: 'warm-day', itemId: 't-shirt', priority: 'optional', reason: '낮 기온이 높을 때 가벼운 상의를 고려한다.', allClimateConditions: [{ metric: 'meanDailyMaximumC', comparison: 'gte', value: 25 }, { metric: 'meanDailyMinimumC', comparison: 'gte', value: 18 }], seasonalReview: ['강수·습도·바람과 실내 냉방 확인'] },
  { id: 'cool-morning', itemId: 'light-long-sleeve', priority: 'recommended', reason: '아침·저녁의 낮은 평균 최저기온에 대응한다.', allClimateConditions: [{ metric: 'meanDailyMinimumC', comparison: 'lt', value: 18 }], seasonalReview: ['추운 계절에는 이 항목만으로 방한이 충분하지 않음'] },
  { id: 'layering', itemId: 'cardigan', priority: 'recommended', reason: '평균 최고·최저 기온 차이를 고려해 벗고 입을 수 있는 겹옷을 제안한다.', allClimateConditions: [{ metric: 'dailyTemperatureRangeC', comparison: 'gte', value: 8 }, { metric: 'meanDailyMinimumC', comparison: 'lt', value: 18 }], seasonalReview: ['여행 중 실제 일교차 예측값이 아닌 월평균 기온 차이', '바람·고도·냉난방 검토'] },
  { id: 'cool-day', itemId: 'knit', priority: 'optional', reason: '평균 낮 기온도 낮은 달에는 보온용 중간 옷을 고려한다.', allClimateConditions: [{ metric: 'meanDailyMaximumC', comparison: 'lt', value: 15 }, { metric: 'meanDailyMinimumC', comparison: 'lt', value: 10 }], seasonalReview: ['야외 활동 시간과 바람 확인'] },
  { id: 'light-outer-layer', itemId: 'light-jacket', priority: 'optional', reason: '선선한 아침·저녁과 일교차에 대응하는 외투를 고려한다.', allClimateConditions: [{ metric: 'meanDailyMinimumC', comparison: 'lt', value: 15 }, { metric: 'meanDailyMaximumC', comparison: 'gte', value: 15 }], seasonalReview: ['강수·바람·실내 환경 확인'] },
  { id: 'cold-season', itemId: 'winter-coat', priority: 'recommended', reason: '평균 최저기온과 최고기온을 함께 보고 보온 외투를 고려한다.', allClimateConditions: [{ metric: 'meanDailyMinimumC', comparison: 'lte', value: 5 }, { metric: 'meanDailyMaximumC', comparison: 'lt', value: 15 }], seasonalReview: ['공식 지역별 겨울·강설 특징과 최신 예보 확인'] },
  { id: 'winter-accessories', itemId: 'cold-weather-accessories', priority: 'optional', reason: '추운 날씨의 야외 활동에서 추가 방한용품을 고려한다.', allClimateConditions: [{ metric: 'meanDailyMinimumC', comparison: 'lte', value: 0 }, { metric: 'meanDailyMaximumC', comparison: 'lt', value: 10 }], seasonalReview: ['강설·결빙·바람 및 야외 체류시간 확인'] },
  { id: 'wet-month-review', itemId: 'rain-protection', priority: 'optional', reason: '월강수량을 참고해 비 대비 용품 필요성을 검토한다.', allClimateConditions: [{ metric: 'precipitationMm', comparison: 'gte', value: 100 }], seasonalReview: ['월강수량은 강설의 수량도 포함할 수 있음. 우천 확률로 해석하지 않음', '눈·바람과 실제 여행 날짜 예보를 확인한 후 판단'] },
  { id: 'business-shirt', itemId: 'shirt', priority: 'optional', reason: '출장 일정의 복장 요구와 기후에 맞춰 셔츠를 고려한다.', allClimateConditions: [], purposeIds: ['business'], seasonalReview: ['냉난방·이동 및 겹옷 확인'] },
  { id: 'walking', itemId: 'walking-shoes', priority: 'recommended', reason: '도보 이동과 야외 활동에 편한 신발을 고려한다.', allClimateConditions: [], purposeIds: ['sightseeing', 'adventure'], seasonalReview: ['강수·강설·결빙 시 신발의 방수·접지 특성 별도 확인'] },
];
