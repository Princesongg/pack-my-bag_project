import { pending, verified, type Source } from './types';
import { dayNumber } from '../trip/trip';

export const internationalSources: Source[] = [
  { id:'noaa-normals', organization:'미국 NOAA NCEI', title:'U.S. Climate Normals', url:'https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals', period:{startYear:1991,endYear:2020}, status:'verified', lastVerified:'2026-10-23', notes:'자료 안내만 확인. 도시별 관측소·수치·품질은 미수집.' },
  { id:'bom-climate', organization:'호주 기상청 BOM', title:'Climate Data Online', url:'https://www.bom.gov.au/climate/data/', period:null, status:'verified', lastVerified:'2026-10-23', notes:'조회 경로만 확인. 도시별 관측소·기간·수치는 미수집.' },
  { id:'us-energy', organization:'미국 에너지부', title:'Electricity 101', url:'https://www.energy.gov/oe/electricity-101', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'us-currency', organization:'미국 통화교육프로그램', title:'U.S. Currency', url:'https://www.uscurrency.gov/', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'us-time', organization:'미국 NIST', title:'Local Time FAQs', url:'https://www.nist.gov/pml/time-and-frequency-division/local-time-faqs', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'us-vwp', organization:'미국 국무부', title:'Visa Waiver Program · ESTA', url:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-facts', organization:'호주 관광청', title:'Key Facts About Australia', url:'https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-time', organization:'호주 관광청', title:'Australian Time Zones', url:'https://www.australia.com/en/facts-and-planning/about-australia/time-zones.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-visa', organization:'호주 정부 대사관', title:'Visa FAQs · ETA', url:'https://usa.embassy.gov.au/visa-faqs', period:null, status:'verified', lastVerified:'2026-10-23' },
];
export const internationalProfiles = {
  US: {
    climate: pending<number[]>('뉴욕·로스앤젤레스의 2016–2025 관측 평균 및 1991–2020 평년값 수치는 아직 수집·검증하지 않았습니다.', ['noaa-normals']),
    electricity: verified('110–120V · 60Hz · 2핀 또는 3핀', ['us-energy']),
    plugDetail: '미국 에너지부의 2핀·3핀 안내를 사용합니다. 세부 플러그 규격과 숙소 콘센트는 직접 확인하세요.',
    currency: verified('미국 달러 · USD', ['us-currency']),
    entry: verified('ESTA는 비자면제프로그램(VWP) 자격을 충족하는 여행자의 관광·상용 방문 등에 적용됩니다. 국적·방문 목적·여권·여행 이력 등에 따라 비자가 필요할 수 있으며, 승인도 입국을 보장하지 않습니다.', ['us-vwp']),
    entryUrl:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html',
    entryLabel:'미국 국무부 · VWP / ESTA 자격 확인',
  },
  AU: {
    climate: pending<number[]>('시드니·멜버른의 2016–2025 관측 평균 및 공식 평년값 수치는 아직 수집·검증하지 않았습니다.', ['bom-climate']),
    electricity: verified('220–240V · 50Hz · 역 V자 평핀 호주형', ['au-facts']),
    plugDetail: '호주 관광청 안내: 역 V자 두 평핀과 일부 플러그의 중앙 세 번째 핀. 가져갈 기기의 플러그 형태와 접지 조건을 확인하세요.',
    currency: verified('호주 달러 · AUD', ['au-facts']),
    entry: verified('ETA(subclass 601)는 자격이 있는 여권 소지자의 관광·사업 방문 등에 적용됩니다. 국적·목적·자격에 따라 다른 비자가 필요할 수 있습니다. 실제 근로 가능 여부나 입국을 보장하지 않습니다.', ['au-visa']),
    entryUrl:'https://usa.embassy.gov.au/visa-faqs', entryLabel:'호주 정부 · 비자 / ETA 공식 안내',
  },
};
export function getInternationalProfile(countryId: string) { return countryId === 'US' || countryId === 'AU' ? internationalProfiles[countryId] : null; }
export const internationalCityZones: Record<string,{ ianaId:string; sourceIds:string[] }> = {
  'new-york':{ianaId:'America/New_York',sourceIds:['us-time']},
  'los-angeles':{ianaId:'America/Los_Angeles',sourceIds:['us-time']},
  sydney:{ianaId:'Australia/Sydney',sourceIds:['au-time']},
  melbourne:{ianaId:'Australia/Melbourne',sourceIds:['au-time']},
};
export function getTripTimeOffsets(cityId:string, departure:string, returning:string) {
  const zone = internationalCityZones[cityId], start = dayNumber(departure), end = dayNumber(returning);
  if (!zone || start === null || end === null || end < start) return null;
  const format = new Intl.DateTimeFormat('en-GB',{timeZone:zone.ianaId,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const offsets = new Set<number>();
  for (let day=start;day<=end;day++) {
    // Sample at UTC noon per calendar day; not a flight-arrival time conversion.
    const parts=format.formatToParts(new Date(day*86400000+12*3600000));
    let difference=Number(parts.find(p=>p.type==='hour')!.value)*60+Number(parts.find(p=>p.type==='minute')!.value)-720;
    if (difference < -720) difference+=1440;
    offsets.add(difference);
  }
  return {...zone,utcOffsetMinutes:[...offsets].sort((a,b)=>a-b),differenceFromKoreaMinutes:[...offsets].map(offset=>offset-540).sort((a,b)=>a-b),method:'브라우저 IANA 시간대 데이터 · 여행 날짜별 UTC 정오 표본. 서머타임 전환일의 항공편 시각 계산이 아닙니다. 미래 규정 변경 시 재확인이 필요합니다.'};
}
