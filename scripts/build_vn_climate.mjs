// Offline parser. Source snapshots are collected manually from free official pages.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='src/service/data/raw/vn/',period={startYear:1991,endYear:2020},checkedOn='2026-10-25';
const sourceSpecs=[
 ['vn-kma-hanoi','대한민국 기상청 / WMO','Hanoi · 평균 일최고·일최저 및 월강수량','https://www.weather.go.kr/w/weather/worldwide.do?cityCode=308&continentCode=C01&countryCode=170','kma-hanoi.html'],
 ['vn-wmo-hanoi','WMO WWIS','Hanoi · 기후 통계 대조','https://worldweather.wmo.int/en/city.html?cityId=308','wmo-hanoi.json'],
 ['vn-wmo-danang','WMO WWIS','Da Nang · 평균 일최고·일최저','https://worldweather.wmo.int/en/city.html?cityId=656','wmo-danang.json'],
 ['vn-jma-danang','JMA Tokyo Climate Center','Da Nang 48855 · 월평균 기온·강수량','https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=48855','jma-48855.html'],
 ['vn-jma-nhatrang','JMA Tokyo Climate Center','Nha Trang 48877 · 월평균 기온·강수량','https://ds.data.jma.go.jp/gmd/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?e=7&k=0&m=9&n=48877&r=1&s=1&y=2026','jma-48877.html'],
 ['vn-jma-phuquoc','JMA Tokyo Climate Center','Phu Quoc 48917 · 월평균 기온·강수량','https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=48917','jma-48917.html'],
 ['vn-jma-normal-method','JMA Tokyo Climate Center','ClimatView · 1991–2020 평년값 설명','https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html','jma-outline.html'],
];
const sources=sourceSpecs.map(([id,organization,title,url,file])=>({id,organization,title,url,period,status:'verified',lastVerified:checkedOn,snapshotPath:root+file,sha256:createHash('sha256').update(readFileSync(root+file)).digest('hex')}));
const keys=['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC','precipitationMm'];
function wmo(file,name){const c=JSON.parse(readFileSync(root+file,'utf8')).city;if(c.cityName!==name||c.climate.datab!==1991||c.climate.datae!==2020||c.climate.climateMonth.length!==12)throw Error('WMO identity/period mismatch');return c.climate.climateMonth;}
function jma(file){const html=readFileSync(root+file,'utf8');const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(m=>{const th=m[1].match(/<th\b[^>]*>\s*(\d{1,2})\s*<\/th>/i);const td=[...m[1].matchAll(/<td\b[^>]*>\s*([\d.]+)\s*<\/(?:td|th)>/gi)].map(x=>Number(x[1]));return th&&td.length===2?[{month:Number(th[1]),meanTemperatureC:td[0],precipitationMm:td[1]}]:[];});if(rows.length!==12||rows.some((r,i)=>r.month!==i+1))throw Error('JMA incomplete');return rows;}
const stations={};
function station(cityId,stationId,stationName,organization,stationNotes,metricSourceIds,monthly,extra={}){stations[cityId]={countryId:'VN',cityId,stationId,stationName,organization,referencePeriod:period,verificationStatus:'verified',stationNotes,metricSourceIds,monthly,...extra};}
const hanoi=wmo('wmo-hanoi.json','Hanoi'),danang=wmo('wmo-danang.json','Da Nang');
const kma=readFileSync(root+'kma-hanoi.html','utf8');if(!/1991\s*~\s*2020/.test(kma))throw Error('KMA period missing');
const kmaRows=[...kma.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(m=>{const cells=[...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>c[1].replace(/<[^>]+>/g,'').trim());return cells.length===4&&/^\d+월$/.test(cells[0])?[cells]:[];});if(kmaRows.length!==12)throw Error('KMA incomplete');
const monthly=hanoi.map((r,i)=>{if(kmaRows[i].slice(1).some((v,j)=>Number(v)!==Number([r.minTemp,r.maxTemp,r.rainfall][j])))throw Error('KMA/WMO disagreement');const high=Number(r.maxTemp),low=Number(r.minTemp);return {month:r.month,meanTemperatureC:Math.round((Math.round(high*10)+Math.round(low*10))/2)/10,meanDailyMaximumC:high,meanDailyMinimumC:low,precipitationMm:Number(r.rainfall)};});
station('hanoi','WWIS-308','Hanoi (WWIS 도시 지점 308)','대한민국 기상청 / WMO WWIS','기상청·WMO는 Hanoi 도시 지점으로 제공하며 이 자료에서 WMO 관측소 번호는 확인되지 않았습니다. 동일 관측소의 공식 직접 월평균값을 확인하지 못해 계산 참고값을 사용합니다.',Object.fromEntries(keys.map(k=>[k,['vn-kma-hanoi','vn-wmo-hanoi']])),monthly,{meanBasis:'derived-normal-high-low-midpoint',method:'기상청/WMO의 같은 도시·같은 1991–2020 기간 평균 일최고·일최저를 (최고+최저)÷2로 계산하여 소수 첫째 자리 반올림했습니다. 공식 직접 월평균 관측값이 아닙니다.'});
for(const [city,id,name] of [['danang','48855','DA NANG'],['nhatrang','48877','NHA TRANG'],['phuquoc','48917','PHU QUOC']]){
 const records=jma('jma-'+id+'.html').map((r,i)=>({...r,meanDailyMaximumC:city==='danang'?Number(danang[i].maxTemp):null,meanDailyMinimumC:city==='danang'?Number(danang[i].minTemp):null}));
 const source='vn-jma-'+city;
 station(city,id,name,'JMA Tokyo Climate Center'+(city==='danang'?' / WMO WWIS':''),city==='danang'?'월평균·강수량은 JMA 48855, 평균 최고·최저는 WMO Da Nang 도시 지점 656입니다. 게시 좌표가 서로 달라 동일 관측지의 동질성은 확인하지 않았습니다. 각 항목을 별도 출처로 표시하며 수치를 맞추거나 평균내지 않았습니다.':'같은 관측소·1991–2020 기간으로 확인된 평균 일최고·일최저 자료가 없어 null로 유지합니다. 다른 도시나 특정 연도 자료를 대입하지 않았습니다.',{meanTemperatureC:[source,'vn-jma-normal-method'],precipitationMm:[source,'vn-jma-normal-method'],meanDailyMaximumC:city==='danang'?['vn-wmo-danang']:[],meanDailyMinimumC:city==='danang'?['vn-wmo-danang']:[]},records,{method:'JMA의 공식 월평균 기온과 월강수량 평년값을 직접 사용합니다. 최고·최저가 있으면 WMO의 평균 일최고·일최저이며 절대 극값이 아닙니다.'});
}
writeFileSync('src/service/data/vnClimate.generated.ts','// Generated offline from preserved official sources by scripts/build_vn_climate.mjs.\nexport const vnStations = '+JSON.stringify(stations,null,2)+' as const;\nexport const vnClimateSources = '+JSON.stringify(sources,null,2)+' as const;\n');
writeFileSync(root+'collection-manifest.json',JSON.stringify(sources,null,2)+'\n');
