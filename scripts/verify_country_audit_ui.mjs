import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/country-data-audit';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9248, profile: 'country-data-audit-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9248/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;const pending=new Map(),errors=[],requests=[];
  ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('CDP timeout '+method)),10000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});ws.send(JSON.stringify({id:n,method,params}));});
  const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let n=0;n<100;n++){if(await js(expression))return;await sleep(60);}throw Error('Timeout '+expression);};
  const click=async(selector,text)=>{await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!e)throw Error('Missing '+${JSON.stringify(text)});e.click();})()`);await sleep(60);};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await cdp('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5173',storageTypes:'local_storage'});
  const {destinations}=await loadTs('src/service/destination/destinations.ts');
  const {getElectricityGuide}=await loadTs('src/service/data/electricityGuide.ts');
  const {getClimateMonth}=await loadTs('src/service/data/climate.ts');
  const {getCountryCurrency}=await loadTs('src/service/data/currencies.ts');
  const {sources}=await loadTs('src/service/data/sources.ts');
  const results=[];let clockTest=existsSync(output+'/clock-result.json')?JSON.parse(readFileSync(output+'/clock-result.json')):null;
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);};
  const geometry=async()=>{const g=await js(`(()=>{const d=document.querySelector('dialog[open]');return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,modalOverflow:d?d.scrollWidth>d.clientWidth+1:false,metrics:[...document.querySelectorAll('[data-climate-metric]')].map(e=>({width:e.clientWidth,scroll:e.scrollWidth}))};})()`);assert.equal(g.pageOverflow,false);assert.equal(g.modalOverflow,false);assert.ok(g.metrics.every(m=>m.scroll<=m.width+1));return g;};
  for(const width of [1440,390])for(const country of destinations)for(const city of country.cities){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero .pmb-cta')`);await js(`document.querySelector('.pmb-hero .pmb-cta').click()`);await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',country.name);await click('#pmb-setup-city-results button',city.name);
    for(const [name,value]of [['departureDate','2027-12-29'],['returnDate','2028-01-03']]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(40);}
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(40);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(40);await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
    const guide=getElectricityGuide(country.id),currency=getCountryCurrency(country.id);
    assert.equal(await js(`document.querySelector('[data-topic=electricity] .pmb-trip-brief-summary').innerText`),guide.main);
    assert.ok(await js(`document.querySelector('.pmb-bag-trip').textContent.includes(${JSON.stringify(currency.code)})`));
    const clock=await js(`document.querySelector('.pmb-destination-clock').textContent`);assert.ok(clock.includes(city.name));assert.ok(clock.includes('현재 시각'));
    if(!clockTest){const before=await js(`document.querySelector('.pmb-destination-clock-time').textContent`);const deadline=await js(`60000-Date.now()%60000+700`);console.log('Checking real minute clock update in',deadline,'ms');await sleep(deadline);const after=await js(`document.querySelector('.pmb-destination-clock-time').textContent`);assert.notEqual(before,after);clockTest={before,after,elapsedMs:deadline,realWallClock:true};writeFileSync(output+'/clock-result.json',JSON.stringify(clockTest,null,2));}
    const means=await js(`[...document.querySelectorAll('.pmb-trip-brief-temperature-value')].map(e=>e.textContent)`);assert.equal(means.length,2);for(const [index,month]of [12,1].entries())assert.equal(Number.parseFloat(means[index]),Number(getClimateMonth(city.id,month).recommendedMetrics.meanTemperatureC.value.toFixed(1)));
    const itemIds=await js(`[...document.querySelectorAll('[data-item-id]')].map(e=>e.dataset.itemId)`);assert.equal(itemIds.length,new Set(itemIds).size);
    for(const p of guide.preparation.filter(p=>p.id)){assert.equal(await js(`document.querySelectorAll('[data-item-id="${p.id}"]').length`),1);}
    await js(`document.querySelector('[data-topic=weather]').click()`);await wait(`!!document.querySelector('[data-climate-metric]')`);const metricResults=[];
    for(const [index,month]of [12,1].entries()){
      if(index){await js(`document.querySelectorAll('.pmb-guide-months button')[1].click()`);await sleep(60);}
      assert.ok(await js(`document.querySelector('#pmb-weather-month').textContent.includes('${index?2028:2027}년 ${month}월')`));
      const displayed=await js(`[...document.querySelectorAll('[data-climate-metric]')].map(e=>({key:e.dataset.climateMetric,value:Number.parseFloat(e.querySelector('.pmb-climate-number').textContent)}))`),expected=getClimateMonth(city.id,month).recommendedMetrics;
      assert.equal(displayed.length,Object.values(expected).filter(m=>Number.isFinite(m.value)).length);for(const m of displayed)assert.equal(m.value,Number(expected[m.key].value.toFixed(1)));
      if(['nhatrang','phuquoc'].includes(city.id)){assert.equal(displayed.length,2);assert.ok(await js(`!!document.querySelector('.pmb-climate-missing')`));}
      await js(`document.querySelectorAll('dialog details').forEach(e=>e.open=true)`);metricResults.push({month,displayed,geometry:await geometry()});
    }
    if(width===390&&['nhatrang','phuquoc'].includes(city.id)){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${city.id}-weather-${width}.png`,Buffer.from(shot.data,'base64'));}
    await close();await js(`document.querySelector('[data-topic=electricity]').click()`);await wait(`!!document.querySelector('#pmb-guide-electricity')`);await js(`document.querySelectorAll('dialog details').forEach(e=>e.open=true)`);
    const kinds=await js(`[...document.querySelectorAll('dialog [data-plug-kind]')].map(e=>e.dataset.plugKind)`);assert.deepEqual(kinds,guide.visualKinds);
    const urls=await js(`[...document.querySelectorAll('#pmb-guide-electricity>.pmb-guide-sources a')].map(a=>a.href)`);assert.deepEqual(new Set(urls),new Set(guide.sourceIds.map(id=>sources.find(s=>s.id===id).url)));if(country.id!=='JP')assert.ok(urls.every(u=>!u.includes('japan.travel')));await geometry();await close();
    await js(`document.querySelector('[data-topic=baggage]').click()`);await wait(`!!document.querySelector('#pmb-baggage-trigger-electronics')`);await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('.pmb-electronics-guidance')`);
    const badges=await js(`[...document.querySelectorAll('.pmb-status-badge')].filter(e=>['기내만 가능','위탁 금지'].includes(e.textContent)).map(e=>({label:e.textContent,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderColor}))`);assert.ok(badges.some(b=>b.label==='위탁 금지'));for(const label of ['기내만 가능','위탁 금지']){const group=badges.filter(b=>b.label===label);assert.ok(group.length>1);assert.ok(group.every(b=>JSON.stringify(b)===JSON.stringify(group[0])));}await geometry();await close();
    await js(`document.querySelector('[data-item-id="essential:passport"] button').click()`);await wait(`!!document.querySelector('dialog[open]')`);assert.ok(await js(`document.querySelector('dialog').textContent.includes('PASSPORT')`));await geometry();await close();
    await js(`(()=>{const e=document.querySelector('[data-item-id="electronic:charger"] input');if(!e.checked)e.click();})()`);await sleep(80);const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelector('[data-item-id="electronic:charger"] input').checked`),true);
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/travel-info?from=my-bag'});await wait(`!!document.querySelector('#pmb-guide-essentials')`);if(width<768){const summaries=await js(`[...document.querySelectorAll('.pmb-mobile-info-row>summary')].map(e=>e.textContent)`);assert.ok(summaries[0].includes(guide.main));assert.ok(summaries[1].includes(currency.code));await js(`document.querySelectorAll('.pmb-mobile-info-row')[1].open=true`);}
    const text=await js(`document.querySelector('#pmb-guide-essentials').textContent`);assert.ok(text.includes(currency.code));assert.ok(text.includes(guide.main));await geometry();
    if(city.id===country.cities[0].id){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-travel-info-${width}.png`,Buffer.from(shot.data,'base64'));}
    results.push({width,country:country.id,city:city.id,main:guide.main,currency:currency.code,kinds,clock,metricResults,badges,passed:true});console.log('PASS',width,country.id,city.id);
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);writeFileSync(output+'/ui-results.json',JSON.stringify({results,clockTest,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
