// Read-only application audit. Writes evidence/report inputs, never changes travel data.
import {loadTs} from '../tests/helpers/load-ts.mjs';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const out='docs/verification/country-data-audit';mkdirSync(out,{recursive:true});
const {destinations}=await loadTs('src/service/destination/destinations.ts');
const {getClimateMonth}=await loadTs('src/service/data/climate.ts');
const {sources}=await loadTs('src/service/data/sources.ts');
const {getElectricityGuide}=await loadTs('src/service/data/electricityGuide.ts');
const {getCountryCurrency}=await loadTs('src/service/data/currencies.ts');
const {internationalCityZones,getTripTimeOffsets,getInternationalProfile}=await loadTs('src/service/data/international.ts');
const {getPassportRule}=await loadTs('src/service/data/passportRules.ts');
const {getClothingPreview}=await loadTs('src/service/travel-info/guideModel.ts');
const {entryGuides}=await loadTs('src/service/data/entryGuides.ts');
const {baggageRules}=await loadTs('src/service/data/baggageRules.ts');
const {climateArchive}=await loadTs('src/service/data/climate.generated.ts');
const {japanStations}=await loadTs('src/service/data/cities.ts');
const keys=['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC','precipitationMm'];
const cities=destinations.flatMap(country=>country.cities.map(city=>{
 const months=Array.from({length:12},(_,i)=>{const c=getClimateMonth(city.id,i+1);return {month:i+1,status:c.status,stationId:c.stationId??null,provenance:c.provenance??null,metrics:c.recommendedMetrics??null,additionalMetrics:c.additionalMetrics??null,warnings:c.warnings,clothes:{tourism:getClothingPreview(c,'sightseeing'),resort:getClothingPreview(c,'relaxation')}};});
 return {countryId:country.id,country:country.name,...city,months,missing:Object.fromEntries(keys.map(key=>[key,months.filter(m=>!m.metrics?.[key]||m.metrics[key].value===null||!Number.isFinite(m.metrics[key].value)).map(m=>m.month)])),bases:Object.fromEntries(keys.map(key=>[key,[...new Set(months.map(m=>{const v=m.metrics?.[key];return v?`${v.basis}: ${v.period.startYear}–${v.period.endYear}`:'none';}))]])),zone:internationalCityZones[city.id],timeSamples:{winter:getTripTimeOffsets(city.id,'2027-01-10','2027-01-11'),summer:getTripTimeOffsets(city.id,'2027-07-10','2027-07-11')},electricity:getElectricityGuide(country.id),currency:getCountryCurrency(country.id),passport:getPassportRule(country.id),entry:entryGuides[country.id]??getInternationalProfile(country.id)?.entry??null};
}));
const uniqueUrls=[...new Set(sources.map(s=>s.url.split('#')[0]))];
const usedIds=new Set(cities.flatMap(c=>[...c.months.flatMap(m=>Object.values(m.metrics??{}).flatMap(v=>v.sourceIds)),...c.electricity.sourceIds,...c.passport.sourceIds,...(c.passport.relatedSourceIds??[]),...(c.entry?.sourceIds??[])]));
function collectSourceIds(value){if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(['sourceIds','relatedSourceIds'].includes(key)&&Array.isArray(item))item.forEach(id=>usedIds.add(id));else collectSourceIds(item);}}
collectSourceIds([cities,baggageRules,entryGuides,await loadTs('src/service/data/currencies.ts'),await loadTs('src/service/data/international.ts')]);
const sourceAudit=sources.map(s=>{let snapshot=null;if(s.snapshotPath){try{const path=existsSync(s.snapshotPath)?s.snapshotPath:'src/service/data/'+s.snapshotPath;const raw=readFileSync(path),b=path.endsWith('.gz')?gunzipSync(raw):raw;snapshot={exists:true,path,bytes:b.length,hashMatches:s.sha256?createHash('sha256').update(b).digest('hex')===s.sha256:null};}catch{snapshot={exists:false};}}return {...s,usedInActiveModels:usedIds.has(s.id),snapshot};});
const jpInputQuality=Object.fromEntries(Object.entries(japanStations).map(([city,s])=>[city,{stationId:s.stationId,years:[2016,2025],metrics:Object.fromEntries(keys.map(key=>[key,{normal:climateArchive.observations.filter(r=>r.cityId===city&&r.metrics[key].quality==='normal').length,other:climateArchive.observations.filter(r=>r.cityId===city&&r.metrics[key].quality!=='normal').length}]))}]));
const result={checkedOn:'2026-10-25',countries:destinations,cities,sources:sourceAudit,uniqueUrls,jpInputQuality,baggageRules,missingSourceIds:[...usedIds].filter(id=>!sources.some(s=>s.id===id)),duplicateSourceIds:sources.map(s=>s.id).filter((id,i,a)=>a.indexOf(id)!==i),summary:{cities:cities.length,cityMonths:cities.length*12,availableCells:cities.reduce((n,c)=>n+c.months.reduce((n,m)=>n+keys.filter(k=>Number.isFinite(m.metrics?.[k]?.value)).length,0),0),missingCells:cities.reduce((n,c)=>n+Object.values(c.missing).reduce((n,a)=>n+a.length,0),0)}};
writeFileSync(out+'/inventory.json',JSON.stringify(result,null,2)+'\n');writeFileSync(out+'/source-urls.json',JSON.stringify(uniqueUrls,null,2)+'\n');
console.log(JSON.stringify(result.summary));console.log('sources',sources.length,'unique URLs',uniqueUrls.length,'bad IDs',result.missingSourceIds,'duplicate IDs',result.duplicateSourceIds);for(const c of cities)console.log(c.countryId,c.id,JSON.stringify(c.missing),JSON.stringify(c.bases.meanTemperatureC));
