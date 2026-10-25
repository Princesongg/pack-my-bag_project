import { verified, type Source } from './types';
import { dayNumber } from '../trip/trip';
import { currencyDetails } from './currencies';

export const internationalSources: Source[] = [
  { id:'noaa-normals', organization:'미국 NOAA NCEI', title:'U.S. Climate Normals', url:'https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals', period:{startYear:1991,endYear:2020}, status:'verified', lastVerified:'2026-10-23', notes:'자료 안내만 확인. 도시별 관측소·수치·품질은 미수집.' },
  { id:'bom-climate', organization:'호주 기상청 BOM', title:'Climate Data Online', url:'https://www.bom.gov.au/climate/data/', period:null, status:'verified', lastVerified:'2026-10-23', notes:'조회 경로만 확인. 도시별 관측소·기간·수치는 미수집.' },
  { id:'us-energy', organization:'미국 에너지부', title:'Electricity 101', url:'https://www.energy.gov/oe/electricity-101', period:null, status:'verified', lastVerified:'2026-10-25', notes:'110–120V·60Hz, 미국 2핀·3핀 및 접지 핀 역할을 실제 재확인.' },
  { id:'au-electricity', organization:'호주정부관광청', title:'Key Facts About Australia · Electrical plugs', url:'https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html', period:null, status:'verified', lastVerified:'2026-10-25', notes:'What kind of electrical plugs are used in Australia? 항목에서 역 V자 2핀·중앙 세 번째 핀·220–240V·AC 50Hz 재확인. 요청한 한국어 페이지에서는 이 항목을 찾지 못해 같은 기관 영문 페이지 사용.' },
  { id:'us-currency', organization:'미국 통화교육프로그램', title:'U.S. Currency', url:'https://www.uscurrency.gov/', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'us-time', organization:'미국 NIST', title:'Local Time FAQs', url:'https://www.nist.gov/pml/time-and-frequency-division/local-time-faqs', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'us-vwp', organization:'미국 국무부', title:'Visa Waiver Program · ESTA', url:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-facts', organization:'호주 관광청', title:'Key Facts About Australia', url:'https://www.australia.com/en/facts-and-planning/about-australia/key-facts-about-australia.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-time', organization:'호주 관광청', title:'Australian Time Zones', url:'https://www.australia.com/en/facts-and-planning/about-australia/time-zones.html', period:null, status:'verified', lastVerified:'2026-10-23' },
  { id:'au-visa', organization:'호주 정부 대사관', title:'Visa FAQs · ETA', url:'https://usa.embassy.gov.au/visa-faqs', period:null, status:'verified', lastVerified:'2026-10-23' },
];
export const internationalProfiles = {
  US: {
    climate: verified('뉴욕 Central Park·로스앤젤레스 LAX의 1991–2020 월별 기온 평년값을 지원합니다.', ['nws-central-park-normal', 'noaa-lax-normal'], '2016–2025 관측 평균 및 강수·강설·습도·바람 데이터는 이번 연결 범위에 포함하지 않습니다.'),
    electricity: { ...verified('110–120V · 60Hz · 2핀 또는 3핀', ['us-energy']), lastVerified: '2026-10-25' },
    plugDetail: '미국 에너지부의 2핀·3핀 안내를 사용합니다. 세부 플러그 규격과 숙소 콘센트는 직접 확인하세요.',
    currency: verified(`${currencyDetails.US.name} · ${currencyDetails.US.code}`, ['us-currency']),
    entry: verified('ESTA는 비자면제프로그램(VWP) 자격을 충족하는 여행자의 관광·상용 방문 등에 적용됩니다. 국적·방문 목적·여권·여행 이력 등에 따라 비자가 필요할 수 있으며, 승인도 입국을 보장하지 않습니다.', ['us-vwp']),
    entryUrl:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html',
    entryLabel:'미국 국무부 · VWP / ESTA 자격 확인',
  },
  AU: {
    climate: verified('시드니 공항·멜버른 Olympic Park의 전체 가용 관측기간 최고·최저기온·강수량 통계를 지원합니다.', ['bom-066037-all-years', 'bom-086338-all-years'], '평균기온은 최고·최저의 계산 참고값입니다. 고정 30년 평년값이나 2016–2025 관측 평균이 아닙니다.'),
    electricity: { ...verified('220–240V · 50Hz · 역 V자 평핀 호주형', ['au-electricity']), lastVerified: '2026-10-25' },
    plugDetail: '호주 관광청 안내: 역 V자 두 평핀과 일부 플러그의 중앙 세 번째 핀. 가져갈 기기의 플러그 형태와 접지 조건을 확인하세요.',
    currency: verified(`${currencyDetails.AU.name} · ${currencyDetails.AU.code}`, ['au-facts']),
    entry: verified('ETA(subclass 601)는 자격이 있는 여권 소지자의 관광·사업 방문 등에 적용됩니다. 국적·목적·자격에 따라 다른 비자가 필요할 수 있습니다. 실제 근로 가능 여부나 입국을 보장하지 않습니다.', ['au-visa']),
    entryUrl:'https://usa.embassy.gov.au/visa-faqs', entryLabel:'호주 정부 · 비자 / ETA 공식 안내',
  },
};
export function getInternationalProfile(countryId: string) { return countryId === 'US' || countryId === 'AU' ? internationalProfiles[countryId] : null; }
export const internationalCityZones: Record<string,{ ianaId:string; sourceIds:string[] }> = {
  'tokyo':{ianaId:'Asia/Tokyo',sourceIds:[]},
  'osaka':{ianaId:'Asia/Tokyo',sourceIds:[]},
  'fukuoka':{ianaId:'Asia/Tokyo',sourceIds:[]},
  'sapporo':{ianaId:'Asia/Tokyo',sourceIds:[]},
  'danang':{ianaId:'Asia/Ho_Chi_Minh',sourceIds:[]},
  'hanoi':{ianaId:'Asia/Ho_Chi_Minh',sourceIds:[]},
  'nhatrang':{ianaId:'Asia/Ho_Chi_Minh',sourceIds:[]},
  'phuquoc':{ianaId:'Asia/Ho_Chi_Minh',sourceIds:[]},
  'bangkok':{ianaId:'Asia/Bangkok',sourceIds:[]},
  'phuket':{ianaId:'Asia/Bangkok',sourceIds:[]},
  'chiangmai':{ianaId:'Asia/Bangkok',sourceIds:[]},
  'taipei':{ianaId:'Asia/Taipei',sourceIds:[]},
  'kaohsiung':{ianaId:'Asia/Taipei',sourceIds:[]},
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
