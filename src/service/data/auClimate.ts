import { climateMetricKeys, pending, type Source } from './types';

const verifiedOn = '2026-10-23';
export function southernSeason(month: number) {
  return month === 12 || month <= 2 ? '여름' : month <= 5 ? '가을' : month <= 8 ? '겨울' : '봄';
}

export function getAUClimateMonth(cityId: string, month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('month must be 1..12');
  if (cityId !== 'sydney' && cityId !== 'melbourne') return null;
  const station = auStations[cityId];
  const [high, low, rain] = station.monthly[month - 1];
  // Integer tenths avoid binary rounding at values such as 21.65°C.
  const mean = Math.round((Math.round(high * 10) + Math.round(low * 10)) / 2) / 10;
  const values = [mean, high, low, rain];
  const recommendedMetrics = Object.fromEntries(climateMetricKeys.map((key, index) => [key, {
    value: values[index], basis: index === 0 ? 'derived-high-low-midpoint' as const : 'all-years-of-record' as const,
    period: index === 3 ? station.rainfallPeriod : station.temperaturePeriod,
    label: index === 0 ? '최고·최저 평균으로 계산한 참고값' : '전체 가용 관측기간 통계',
    sourceIds: [station.sourceId], lastVerified: verifiedOn,
    availableYears: index === 0 ? null : index === 1 ? station.availableYears.maximum : index === 2 ? station.availableYears.minimum : station.availableYears.rainfall,
  }]));
  return {
    status: 'partially-verified' as const, cityId, month, stationId: station.stationId,
    recent: null, officialNormal: null,
    recommendedMetrics: recommendedMetrics as Record<typeof climateMetricKeys[number], typeof recommendedMetrics[string]>,
    provenance: { organization: 'BOM', stationName: station.stationName, period: station.temperaturePeriod,
      label: '전체 가용 관측기간 통계', lastVerified: verifiedOn, season: southernSeason(month),
      method: `평균기온은 (평균 최고 + 평균 최저) ÷ 2를 소수 첫째 자리로 반올림한 참고값이며 BOM이 직접 발표한 월평균 기온이 아닙니다. 관측소 ${station.stationId}, 개설 ${station.commenced}년. 기온 항목 ${station.temperaturePeriod.startYear}–${station.temperaturePeriod.endYear}, 최고 ${station.availableYears.maximum}년·최저 ${station.availableYears.minimum}년의 가용 자료; 강수량 ${station.rainfallPeriod.startYear}–${station.rainfallPeriod.endYear}, ${station.availableYears.rainfall}년의 가용 자료를 사용한 원문 통계입니다. 항목·월별 결측과 표본 기간은 다를 수 있습니다.` },
    seasonalFeatures: pending<string[]>('남반구 계절은 달력 안내이며 월별 강설·습도·바람·자외선 관측값은 추가하지 않았습니다.'),
    warnings: ['고정 30년 평년값이나 2016–2025 평균이 아닌 All years of record 통계입니다.', '기온과 강수량의 사용 가능한 기간·연수는 다르며 개별 관측소 값이 도시 전체나 여행 당일의 날씨를 대표하지 않습니다.'],
  };
}

// Official BOM all-years rows: [mean maximum Celsius, mean minimum Celsius, mean rainfall mm].
export const auStations = {
  "sydney": {
    "stationId": "066037",
    "stationName": "Sydney Airport AMO",
    "commenced": 1929,
    "sourceId": "bom-066037-all-years",
    "url": "https://www.bom.gov.au/climate/averages/tables/cw_066037_All.shtml",
    "snapshotPath": "src/service/data/raw/au/066037.html",
    "sha256": "d717dacc86ba2913f8d521904bd0f4886736752060512853e2c48bdb22f49955",
    "temperaturePeriod": {
      "startYear": 1939,
      "endYear": 2026
    },
    "rainfallPeriod": {
      "startYear": 1929,
      "endYear": 2026
    },
    "availableYears": {
      "maximum": 88,
      "minimum": 87,
      "rainfall": 93
    },
    "monthly": [
      [
        26.8,
        19.0,
        95.0
      ],
      [
        26.6,
        19.2,
        117.2
      ],
      [
        25.5,
        17.7,
        122.9
      ],
      [
        23.1,
        14.4,
        107.1
      ],
      [
        20.2,
        11.2,
        98.5
      ],
      [
        17.7,
        8.8,
        123.6
      ],
      [
        17.2,
        7.5,
        72.3
      ],
      [
        18.5,
        8.4,
        77.3
      ],
      [
        20.8,
        10.7,
        60.3
      ],
      [
        22.8,
        13.5,
        70.8
      ],
      [
        24.3,
        15.6,
        80.7
      ],
      [
        26.0,
        17.7,
        72.5
      ]
    ]
  },
  "melbourne": {
    "stationId": "086338",
    "stationName": "Melbourne Olympic Park",
    "commenced": 2013,
    "sourceId": "bom-086338-all-years",
    "url": "https://www.bom.gov.au/climate/averages/tables/cw_086338_All.shtml",
    "snapshotPath": "src/service/data/raw/au/086338.html",
    "sha256": "0a0f875886ba4dc430940bea71a1873ec4c0e16c1d570ec32a0b39dfea93ecc2",
    "temperaturePeriod": {
      "startYear": 2013,
      "endYear": 2026
    },
    "rainfallPeriod": {
      "startYear": 2013,
      "endYear": 2026
    },
    "availableYears": {
      "maximum": 13,
      "minimum": 13,
      "rainfall": 11
    },
    "monthly": [
      [
        26.8,
        16.5,
        53.3
      ],
      [
        25.9,
        16.0,
        26.3
      ],
      [
        24.3,
        14.8,
        36.4
      ],
      [
        20.9,
        12.2,
        63.0
      ],
      [
        17.6,
        9.8,
        46.5
      ],
      [
        14.9,
        7.8,
        42.1
      ],
      [
        14.5,
        7.6,
        41.0
      ],
      [
        15.6,
        8.1,
        47.0
      ],
      [
        18.1,
        9.6,
        41.0
      ],
      [
        20.5,
        10.9,
        64.2
      ],
      [
        22.2,
        12.7,
        64.4
      ],
      [
        24.7,
        14.4,
        50.2
      ]
    ]
  }
} as const;

export const auClimateSources: Source[] = Object.values(auStations).map(station => ({
  id: station.sourceId, organization: 'BOM', title: `${station.stationName} / ${station.stationId} / All years of record`,
  url: station.url, period: null, status: 'verified', lastVerified: verifiedOn,
  snapshotPath: station.snapshotPath, sha256: station.sha256,
  notes: `Temperature ${station.temperaturePeriod.startYear}-${station.temperaturePeriod.endYear}; rainfall ${station.rainfallPeriod.startYear}-${station.rainfallPeriod.endYear}. Available years differ by statistic.`,
}));
