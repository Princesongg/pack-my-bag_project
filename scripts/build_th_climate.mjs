// Offline only. Reads preserved JMA HTML and a manually verified TMD PDF transcription.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='src/service/data/raw/th/',period={startYear:1991,endYear:2020},checkedOn='2026-10-25';
const pdf='https://ubonmet.tmd.go.th/files/MetInfo/climate_normal.pdf';
const extract=JSON.parse(readFileSync(root+'tmd-temperature-extract.json','utf8'));
if(JSON.stringify(extract.period)!==JSON.stringify(period))throw Error('TMD period mismatch');
if(!/1991\s*-\s*2020/.test(readFileSync(root+'jma-outline.html','utf8')))throw Error('JMA normal period not confirmed');
const digest=file=>createHash('sha256').update(readFileSync(root+file)).digest('hex');
const specs=[['th-jma-normal-method','JMA Tokyo Climate Center','1991–2020 평년값 정의','https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html','jma-outline.html']];
const stations={};
for(const [cityId,id,name,coordinates,elevation] of [
  ['bangkok','48455','방콕 도심 관측소 (BANGKOK METROPOLIS)','13.73°N 100.56°E',3],
  ['chiangmai','48327','치앙마이 관측소 (CHIANG MAI)','18.77°N 98.97°E',313],
  ['phuket','48565','푸껫공항 관측소 (PHUKET AIRPORT)','8.15°N 98.31°E',6],
]){
  const html=readFileSync(root+`jma-${id}.html`,'utf8'),tmd=extract.stations[id];
  if(!html.includes(tmd.name)||!readFileSync(root+'jma-stations.html','utf8').includes(`stn=${id}`)||tmd.high.length!==12||tmd.low.length!==12)throw Error('Station identity/incomplete data: '+id);
  const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(m=>{
    const th=m[1].match(/<th\b[^>]*>\s*(\d{1,2})\s*<\/th>/i);
    const td=[...m[1].matchAll(/<td\b[^>]*>\s*([\d.]+)\s*<\/(?:td|th)>/gi)].map(x=>Number(x[1]));
    return th&&td.length===2?[{month:Number(th[1]),meanTemperatureC:td[0],precipitationMm:td[1]}]:[];
  });
  if(rows.length!==12||rows.some((r,i)=>r.month!==i+1))throw Error('JMA incomplete: '+id);
  const jmaUrl=id==='48455'?`https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/NrmMonth_e.php?stn=${id}`:`https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/graph_mkhtml_nrm.php?e=6&k=0&m=9&n=${id}&r=1&s=1&y=2026`;
  specs.push([`th-jma-${id}`,'JMA Tokyo Climate Center',`${tmd.name} ${id} · 월평균 기온·강수량`,jmaUrl,`jma-${id}.html`]);
  specs.push([`th-tmd-${id}`,'태국 기상청 TMD',`${tmd.name} ${id} · 평균 일최고·일최저 · 인쇄 ${tmd.printedPage}쪽`,`${pdf}#page=${tmd.pdfPage}`,'tmd-1991-2020.pdf']);
  stations[cityId]={countryId:'TH',cityId,stationId:id,stationName:name,organization:'JMA Tokyo Climate Center / 태국 기상청 TMD',referencePeriod:period,verificationStatus:'verified',
    ...(cityId==='phuket'?{displayNote:'푸껫공항 관측소 기준'}:{}),
    stationNotes:`WMO 관측소 번호 ${id}와 1991–2020 기간을 대조했습니다. JMA: ${coordinates}, ${elevation}m / TMD: ${tmd.coordinates}, ${tmd.elevationM}m. 게시 위치·고도에 차이가 있으며 관측소 이전과 통계 동질성의 전체 이력은 추가 확인이 필요합니다.${cityId==='phuket'?' 푸껫 시내 관측소 48564가 아닌 푸껫공항 48565 자료로, 해변·숙소의 실제 기후와 다를 수 있습니다.':''}`,
    method:'평균기온·강수량은 JMA의 직접 평년값, 평균 최고·최저는 같은 WMO 번호의 TMD Temperature Mean max./Mean min. 평년값입니다. 출처별 평균기온·강수량 수치가 다를 수 있어 각각 선택한 원문을 그대로 유지합니다. 두 자료를 평균내거나 최고·최저에서 평균기온을 역산하지 않았습니다.',
    metricSourceIds:{meanTemperatureC:[`th-jma-${id}`,'th-jma-normal-method'],precipitationMm:[`th-jma-${id}`,'th-jma-normal-method'],meanDailyMaximumC:[`th-tmd-${id}`],meanDailyMinimumC:[`th-tmd-${id}`]},
    monthly:rows.map((row,i)=>({...row,meanDailyMaximumC:tmd.high[i],meanDailyMinimumC:tmd.low[i]})),
  };
}
const sources=specs.map(([id,organization,title,url,file])=>({id,organization,title,url,period,status:'verified',lastVerified:checkedOn,snapshotPath:root+file,sha256:digest(file)}));
const manifest={verifiedOn:checkedOn,period,sources,transcription:{file:root+'tmd-temperature-extract.json',sha256:digest('tmd-temperature-extract.json'),method:'Manual transcription of Mean max./Mean min., checked against official PDF pages 11, 57, 89; original PDF preserved.'},research:[{url:'https://www.tmd.go.th/en/ClimateChart',file:root+'tmd-chart.html',sha256:digest('tmd-chart.html')},{url:'https://www.data.jma.go.jp/tcc/tcc/products/climate/normal/parts/StationList_e.php?ccode=22100',file:root+'jma-stations.html',sha256:digest('jma-stations.html')}]};
writeFileSync('src/service/data/thClimate.generated.ts','// Generated offline by scripts/build_th_climate.mjs. No runtime requests.\nexport const thStations = '+JSON.stringify(stations,null,2)+' as const;\nexport const thClimateSources = '+JSON.stringify(sources,null,2)+' as const;\n');
writeFileSync(root+'collection-manifest.json',JSON.stringify(manifest,null,2)+'\n');
