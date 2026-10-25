// Compare newly fetched official tables against static application values, without mutation.
import {readFileSync,writeFileSync} from 'node:fs';
import {loadTs} from '../tests/helpers/load-ts.mjs';
const dir='docs/verification/country-data-audit';
const inventory=JSON.parse(readFileSync(dir+'/inventory.json'));
const http=JSON.parse(readFileSync(dir+'/http-results.json')).results;
const {climateArchive}=await loadTs('src/service/data/climate.generated.ts');
const comparisons=[];
const body=id=>{const s=inventory.sources.find(s=>s.id===id),r=http.find(r=>r.url===s.url.split('#')[0]);if(!r||r.httpStatus!==200||r.blockedMarker)throw Error('Unavailable '+id);const bytes=readFileSync(r.bodyPath);return new TextDecoder(/charset\s*=\s*["']?(shift_jis|shift-jis)/i.test(bytes.subarray(0,3000).toString())?'shift_jis':'utf-8').decode(bytes);};
const clean=s=>s.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();
for(const source of inventory.sources.filter(s=>/^jma-(tokyo|osaka|fukuoka|sapporo)-\d{4}$/.test(s.id))){
 try{const html=body(source.id),[,city,year]=source.id.match(/^jma-(.+)-(\d{4})$/),rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(r=>[...r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>clean(c[1]))).filter(c=>c.length>=10&&/^\d{1,2}$/.test(c[0]));let checked=0;const differences=[];
 if(rows.length!==12||!html.includes('日平均')||!html.includes('日最高')||!html.includes('日最低'))throw Error('Unexpected table definition');
 for(const r of rows){const stored=climateArchive.observations.find(o=>o.cityId===city&&o.year===+year&&o.month===+r[0]);for(const [key,index] of Object.entries({meanTemperatureC:7,meanDailyMaximumC:8,meanDailyMinimumC:9,precipitationMm:3})){checked++;if(!/^-?\d+(\.\d+)?$/.test(r[index])||Number(r[index])!==stored.metrics[key].value)differences.push({month:+r[0],key,live:r[index],stored:stored.metrics[key].value});}}
 comparisons.push({id:source.id,checked,differences,status:differences.length?'difference':'matched'});
 }catch(e){comparisons.push({id:source.id,status:'unverified',reason:String(e)});}
}
for(const [id,city] of [['vn-jma-danang','danang'],['vn-jma-nhatrang','nhatrang'],['vn-jma-phuquoc','phuquoc'],['th-jma-48455','bangkok'],['th-jma-48327','chiangmai'],['th-jma-48565','phuket']]){
 try{const html=body(id),rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(r=>{const m=r[1].match(/<th\b[^>]*>\s*(\d{1,2})\s*<\/th>/i),td=[...r[1].matchAll(/<td\b[^>]*>\s*([\d.]+)\s*<\/(?:td|th)>/gi)].map(x=>+x[1]);return m&&td.length===2?[{month:+m[1],values:td}]:[];});if(rows.length!==12)throw Error('Incomplete monthly table');const differences=[];for(const r of rows)for(const [i,key]of ['meanTemperatureC','precipitationMm'].entries()){const stored=inventory.cities.find(c=>c.id===city).months[r.month-1].metrics[key].value;if(r.values[i]!==stored)differences.push({month:r.month,key,live:r.values[i],stored});}comparisons.push({id,checked:24,differences,status:differences.length?'difference':'matched',periodDeclaredInMethod:'1991–2020 (see JMA outline)'});
 }catch(e){comparisons.push({id,status:'unverified',reason:String(e)});}
}
for(const [code,key]of Object.entries({tx:'meanTemperatureC',meantxmax:'meanDailyMaximumC',meantxmin:'meanDailyMinimumC',precp:'precipitationMm',rh:'relativeHumidityPct',precpday:'precipitationDays'})){
 const id='cwa-normal-'+code;try{const html=body(id),differences=[];let checked=0;for(const [city,name]of [['taipei','臺北'],['kaohsiung','高雄']]){const row=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].find(m=>m[1].includes('>'+name+'</th>'))?.[1];if(!row||!row.includes('headers="period">1991~2020</td>'))throw Error('Station/period mismatch');for(let i=0;i<12;i++){const raw=row.match(new RegExp('headers="m'+i+'">([^<]+)</td>'))?.[1];if(!raw||!Number.isFinite(+raw))throw Error('Missing monthly value');{checked++;const month=inventory.cities.find(c=>c.id===city).months[i];const stored=(month.metrics[key]??month.additionalMetrics[key]).value;if(+raw!==stored)differences.push({city,month:i+1,key,live:+raw,stored});}}}comparisons.push({id,checked,differences,status:differences.length?'difference':'matched'});}catch(e){comparisons.push({id,status:'unverified',reason:String(e)});}
}
// PDF rows read directly on the audit date: TMD pp.11/57/89, NWS p.1, NOAA p.1.
// These are audit references only; application data and its verification dates stay unchanged.
const pdfRows=[
 ['th-tmd-48455','bangkok',[32.7,33.7,34.7,35.7,35.1,34.1,33.5,33.3,33.2,33,33.1,32.3],[23.4,24.8,26.4,27.2,26.9,26.4,26.1,25.9,25.4,25.2,24.7,23.2]],
 ['th-tmd-48327','chiangmai',[30,32.9,35.4,36.7,34.7,33.2,32.1,31.6,32,31.7,30.8,29.2],[15.7,16.8,20.1,23.4,24.2,24.5,24.3,24,23.7,22.6,19.9,16.9]],
 ['th-tmd-48565','phuket',[32.1,33.2,33.6,33.5,32.4,31.8,31.5,31.3,30.9,31,31.4,31.3],[22.9,23.1,23.7,24.2,24.6,24.6,24.6,24.7,24.1,23.7,23.5,23.1]],
 ['nws-central-park-normal','new-york',[39.5,42.2,49.9,61.8,71.4,79.7,84.9,83.3,76.2,64.5,54,44.3],[27.9,29.5,35.8,45.5,55,64.4,70.1,68.9,62.3,51.4,42,33.8],[33.7,35.9,42.8,53.7,63.2,72,77.5,76.1,69.2,57.9,48,39.1]],
 ['noaa-lax-normal','los-angeles',[66.3,65.6,66.1,68.1,69.5,72,75.1,76.7,76.5,74.4,70.9,66.1],[49.4,50.1,52.2,54.2,57.6,60.9,64,64.8,63.7,59.8,53.7,49.1],[57.9,57.9,59.1,61.1,63.6,66.4,69.6,70.7,70.1,67.1,62.3,57.6]],
];
for(const [id,city,high,low,mean]of pdfRows){const differences=[];let checked=0;for(const [key,values]of Object.entries({meanDailyMaximumC:high,meanDailyMinimumC:low,...(mean?{meanTemperatureC:mean}:{})}))for(let i=0;i<12;i++){const live=city==='new-york'||city==='los-angeles'?Math.round((values[i]-32)*5/9*10)/10:values[i],stored=inventory.cities.find(c=>c.id===city).months[i].metrics[key].value;checked++;if(live!==stored)differences.push({month:i+1,key,live,stored});}comparisons.push({id,method:'Manual PDF table transcription; station and 1991–2020 period checked',checked,differences,status:differences.length?'difference':'matched'});}
try{const html=body('vn-kma-hanoi'),rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>clean(c[1]))).filter(c=>c.length===4&&/^\d+월$/.test(c[0]));if(rows.length!==12||!/1991\s*~\s*2020/.test(html))throw Error('Period/table mismatch');const differences=[];for(let i=0;i<12;i++)for(const [j,key]of ['meanDailyMinimumC','meanDailyMaximumC','precipitationMm'].entries()){const stored=inventory.cities.find(c=>c.id==='hanoi').months[i].metrics[key].value;if(+rows[i][j+1]!==stored)differences.push({month:i+1,key,live:rows[i][j+1],stored});}comparisons.push({id:'vn-kma-hanoi',checked:36,differences,status:differences.length?'difference':'matched'});}catch(e){comparisons.push({id:'vn-kma-hanoi',status:'unverified',reason:String(e)});}
writeFileSync(dir+'/content-comparison.json',JSON.stringify({checkedOn:'2026-10-25',comparisons},null,2)+'\n');
console.log(JSON.stringify({tables:comparisons.length,matched:comparisons.filter(c=>c.status==='matched').length,checkedCells:comparisons.reduce((n,c)=>n+(c.checked??0),0),problems:comparisons.filter(c=>c.status!=='matched')},null,2));
