import { launchQaBrowser } from './qaBrowser.mjs';
import { loadTs } from '../tests/helpers/load-ts.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5173', output = 'docs/verification/weather-brief';
fs.mkdirSync(output, { recursive:true });
const { destinations } = await loadTs('src/service/destination/destinations.ts');
const { tripKey } = await loadTs('src/service/trip/trip.ts');
const { getWeatherSegments, getWeatherBrief } = await loadTs('src/service/my-bag/weatherBriefModel.ts');
const browser = launchQaBrowser({ port:9281, profile:'weather-brief-ui' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
const errors=[], consoleErrors=[], failedRequests=[], results=[], layouts=[];
try {
  let targets;
  for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9281/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0; const pending=new Map();
  ws.addEventListener('message', event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value??a.description));if(m.method==='Network.loadingFailed'&&!m.params.canceled)failedRequests.push(m.params);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('CDP timeout '+method)),15000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});ws.send(JSON.stringify({id:n,method,params}));});
  const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let n=0;n<150;n++){if(await js(expression))return;await sleep(40);}throw Error('Timeout '+expression);};
  const shot=async name=>{const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${output}/${name}.png`,Buffer.from(r.data,'base64'));};
  const setWidth=width=>cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=640});
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setWidth(1440); await cdp('Page.navigate',{url:origin+'/implementation'}); await wait(`!!document.querySelector('.pmb-hero')`);
  const tripFor=(countryId,cityId,month)=>({countryId,cityId,departureDate:`2027-${String(month).padStart(2,'0')}-10`,returnDate:`2027-${String(month).padStart(2,'0')}-15`,travelPurpose:'sightseeing',baggageType:'checked'});
  const openTrip=async trip=>{
    await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);
    await cdp('Page.navigate',{url:origin+'/implementation/workspace?view=bag'});
    await wait(`!!document.querySelector('[data-weather-city="${trip.cityId}"][data-weather-month="${Number(trip.departureDate.slice(5,7))}"]')`);
  };
  const verifyCard=async trip=>{
    const expected=getWeatherSegments(trip).map(s=>({city:s.climate.cityId,month:String(s.month),brief:getWeatherBrief(s.climate,trip.travelPurpose)}));
    const actual=await js(`[...document.querySelectorAll('.pmb-weather-month')].map(e=>({city:e.dataset.weatherCity,month:e.dataset.weatherMonth,mean:e.querySelector('[data-weather-mean]').textContent,low:e.querySelector('[data-weather-low]')?.textContent,high:e.querySelector('[data-weather-high]')?.textContent,position:e.querySelector('.pmb-weather-range-mean')?.style.getPropertyValue('--mean-position'),tags:[...e.querySelectorAll('[data-weather-item]')].map(e=>({id:e.dataset.weatherItem,name:e.textContent})),rangeVisible:!!e.querySelector('[data-weather-range]')?.checkVisibility()}))`);
    assert.equal(actual.length,expected.length);
    for(let i=0;i<expected.length;i++){
      const a=actual[i],e=expected[i],b=e.brief;assert.equal(a.city,e.city);assert.equal(a.month,e.month);assert.equal(a.mean,b.mean===null?'자료 확인 필요':`${b.mean.toFixed(1)}°C`);assert.equal(a.low,b.range?`${b.range.low.toFixed(1)}°C`:undefined);assert.equal(a.high,b.range?`${b.range.high.toFixed(1)}°C`:undefined);assert.deepEqual(a.tags,b.clothing.map(i=>({id:i.checklistItemId,name:i.name})));if(b.range)assert.ok(Math.abs(parseFloat(a.position)-b.range.meanPosition)<0.001);
    }
    return actual;
  };
  const verifyModal=async trip=>{
    await js(`document.querySelector('[data-topic=weather]').click()`);await wait(`!!document.querySelector('#pmb-weather-panel')`);
    const segments=getWeatherSegments(trip);
    for(let i=0;i<segments.length;i++){
      if(i){await js(`document.querySelectorAll('.pmb-guide-months button')[${i}].click()`);await sleep(30);}
      const s=segments[i];
      assert.ok(await js(`document.querySelector('#pmb-weather-month').textContent.includes('${s.year}년 ${s.month}월')`));
      const metrics=await js(`Object.fromEntries([...document.querySelectorAll('[data-climate-metric]')].map(e=>[e.dataset.climateMetric,parseFloat(e.querySelector('.pmb-climate-number').textContent)]))`);
      for(const key of ['meanTemperatureC','meanDailyMaximumC','meanDailyMinimumC','precipitationMm']){
        const m=s.climate.recommendedMetrics?.[key];if(m&&m.value!==null&&Number.isFinite(m.value)&&m.basis!=='needs-research')assert.equal(metrics[key],Number(m.value.toFixed(1)));else assert.equal(metrics[key],undefined);
      }
      const links=await js(`[...document.querySelectorAll('#pmb-weather-panel .pmb-guide-sources a')].map(a=>a.href)`);assert.ok(links.length>0);
      assert.equal(await js(`document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1`),false);
    }
    await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
  };
  if(!process.env.QA_SKIP_MATRIX) for(const country of destinations){for(const city of country.cities)for(let month=1;month<=12;month++){
    const trip=tripFor(country.id,city.id,month);await openTrip(trip);await verifyCard(trip);await verifyModal(trip);results.push({countryId:country.id,cityId:city.id,month,status:'PASS'});
  }console.log('PASS all browser months',country.id);}
  for(const width of [1920,1440,1280,1024,820,768,430,390,375,360]){
    await setWidth(width);
    for(const [name,trip] of [['osaka',tripFor('JP','osaka',11)],['missing-high-low',tripFor('VN','nhatrang',11)],['cross-year',{...tripFor('AU','sydney',12),departureDate:'2027-12-30',returnDate:'2028-01-03'}]]){
      await openTrip(trip); const actual=await verifyCard(trip);
      await js(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'start'})`);await sleep(80);
      const g=await js(`(()=>{const c=document.querySelector('[data-topic=weather]'),r=c.getBoundingClientRect();return {cards:[...document.querySelectorAll('.pmb-trip-brief-card')].map(e=>{const r=e.getBoundingClientRect(),f=e.querySelector('.pmb-trip-brief-more').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,footerBottom:f.bottom,padding:getComputedStyle(e).padding}}),overflow:document.documentElement.scrollWidth>innerWidth+1,cardHeight:r.height,cardWidth:r.width,cardOverflow:c.scrollWidth>c.clientWidth+1,columns:getComputedStyle(document.querySelector('.pmb-trip-brief-grid')).gridTemplateColumns,visibleTags:[...c.querySelectorAll('[data-weather-item]')].filter(e=>e.checkVisibility()).length,tagOverflow:[...c.querySelectorAll('.pmb-weather-tags')].some(e=>e.scrollWidth>e.clientWidth+1),otherCards:[...document.querySelectorAll('[data-topic=electricity],[data-topic=baggage]')].map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))};})()`);
      assert.equal(g.overflow,false);assert.equal(g.cardOverflow,false);assert.equal(g.tagOverflow,false);if(width<=640){assert.ok(actual.every(a=>!a.rangeVisible));if(name==='osaka')assert.ok(g.cardHeight<180);}else if(name==='osaka')assert.ok(actual[0].rangeVisible);
      if(width>=1280)assert.equal(g.columns.split(' ').length,3);
      if(width>640)for(const card of g.cards)for(const other of g.cards.filter(other=>Math.abs(other.top-card.top)<1)){assert.ok(Math.abs(card.height-other.height)<1,'equal row heights');assert.ok(Math.abs(card.footerBottom-other.footerBottom)<1,'aligned footers');assert.equal(card.padding,other.padding);}
      await shot(`${name}-${width}`);await verifyModal(trip);layouts.push({width,name,status:'PASS',...g});
    }
    console.log('PASS layout',width);
  }
  // Use the real edit flow in the same React session, rather than only reload fixtures.
  await setWidth(1440); await openTrip(tripFor('JP','osaka',11));
  const edit=async(cityName,month)=>{
    await js(`document.querySelector('.pmb-bag-edit-trip').click()`);await wait(`!!document.querySelector('#trip-setup')`);
    await js(`(()=>{const b=[...document.querySelectorAll('#pmb-setup-city-results button')].find(e=>e.textContent.includes(${JSON.stringify(cityName)}));if(!b)throw Error('city not found');b.click()})()`);
    for(const [field,day] of [['departureDate','10'],['returnDate','15']]){await js(`(()=>{const e=document.querySelector('[name=${field}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'2027-${String(month).padStart(2,'0')}-${day}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(30);}
    await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-weather-month')`);
  };
  for(const [cityName,cityId,month]of [['도쿄','tokyo',11],['도쿄','tokyo',1],['오사카','osaka',11]]){await edit(cityName,month);const trip=tripFor('JP',cityId,month);await verifyCard(trip);await verifyModal(trip);results.push({scenario:'live-edit',cityId,month,status:'PASS'});}
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedRequests,[]);
  fs.writeFileSync(output+(process.env.QA_SKIP_MATRIX?'/browser-visual.json':'/browser.json'),JSON.stringify({checkedAt:new Date().toISOString(),origin,results,layouts,errors,consoleErrors,failedRequests},null,2));
  await cdp('Browser.close');
}catch(error){fs.writeFileSync(output+'/browser-failure.json',JSON.stringify({error:String(error.stack),results,layouts,errors,consoleErrors,failedRequests},null,2));throw error;}
finally{ws?.close();browser.kill();}
