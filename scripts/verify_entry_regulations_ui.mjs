import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/entry-regulations';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9251, profile: 'entry-regulations-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9251/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const {getEntryPreparation}=await loadTs('src/service/data/entryPreparation.ts');
  const {bagStorageKey}=await loadTs('src/service/my-bag/bag.ts');
  const {getClimateMonth}=await loadTs('src/service/data/climate.ts');
  const results=[];
  const tripFor=(countryId,cityId)=>({countryId,cityId,departureDate:'2027-01-10',returnDate:'2027-01-15',travelPurpose:'sightseeing',baggageType:'checked'});
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);};
  const reload=async()=>{const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-entry-banner')`);};
  const geometry=async()=>{const g=await js(`(()=>{const d=document.querySelector('dialog[open]'),b=document.querySelector('.pmb-entry-banner');return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,modalOverflow:d?d.scrollWidth>d.clientWidth+1:false,bannerOverflow:b.scrollWidth>b.clientWidth+1,bannerHeight:b.getBoundingClientRect().height};})()`);assert.equal(g.pageOverflow,false);assert.equal(g.modalOverflow,false);assert.equal(g.bannerOverflow,false);return g;};
  for(const width of [1440,390,320])for(const country of destinations)for(const city of country.cities.filter(city=>['tokyo','danang','bangkok','taipei','new-york','los-angeles','sydney','melbourne'].includes(city.id))){
    const trip=tripFor(country.id,city.id),guide=getEntryPreparation(trip),key=bagStorageKey(trip);
    // A separate automation profile is used; clearing it does not touch the user's browser.
    await cdp('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5173',storageTypes:'local_storage'});
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero .pmb-cta')`);await js(`document.querySelector('.pmb-hero .pmb-cta').click()`);await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',country.name);await click('#pmb-setup-city-results button',city.name);
    for(const [name,value]of [['departureDate',trip.departureDate],['returnDate',trip.returnDate]]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(40);}
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(40);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(40);await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-entry-banner')`);
    const expectedStatus=guide.needsReview?'추가 확인 필요':'확인 필요';assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),expectedStatus);
    const text=await js(`document.querySelector('.pmb-entry-banner').textContent`);assert.ok(text.includes(guide.title));assert.ok(text.includes(guide.body));
    assert.equal(await js(`document.querySelectorAll('.pmb-trip-brief-grid>.pmb-trip-brief-card').length`),3);
    assert.equal(await js(`(()=>{const s=document.querySelector('.pmb-bag-trip'),b=document.querySelector('.pmb-entry-banner'),g=document.querySelector('.pmb-trip-brief');return !!(s.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(b.compareDocumentPosition(g)&Node.DOCUMENT_POSITION_FOLLOWING);})()`),true);
    const mainGeometry=await geometry();
    if(city.id===country.cities[0].id||country.id==='US'||country.id==='AU'){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-${city.id}-banner-${width}.png`,Buffer.from(shot.data,'base64'));}
    // Existing checklist state must survive entry status changes and reload.
    await js(`document.querySelector('[data-item-id="electronic:charger"] input').click()`);await sleep(50);
    await js(`document.querySelector('.pmb-entry-banner').click()`);await wait(`!!document.querySelector('dialog[data-topic=entry]')`);
    const detail=await js(`document.querySelector('dialog').textContent`);assert.ok(detail.includes('정부의 비자·전자여행허가 승인이나 입국 허가를 뜻하지 않아요.'));assert.ok(detail.includes(guide.passportRequirement));
    assert.equal(await js(`document.querySelectorAll('dialog input:not([type=checkbox])').length`),0);
    const urls=await js(`[...document.querySelectorAll('.pmb-entry-official a')].map(a=>a.href)`);assert.deepEqual(urls,guide.links.map(l=>l.url));
    if(country.id==='US'){assert.ok(detail.includes('비자가 아니라'));assert.ok(detail.includes('유효한 미국 비자'));assert.ok(urls.includes('https://esta.cbp.dhs.gov/'));}
    if(country.id==='AU'){assert.ok(detail.includes('비자(subclass 601)'));assert.ok(detail.includes('Australian ETA App'));assert.ok(!detail.includes('미국 입국 준비'));}
    if(['VN','TH','TW'].includes(country.id))assert.ok(!text.includes('비자 필요'));
    const conditions=await js(`document.querySelector('.pmb-entry-requirements').textContent`);assert.ok(conditions.includes(guide.requirements.visa));assert.ok(conditions.includes(guide.requirements.stay));assert.ok(conditions.includes(guide.requirements.arrival));
    if(country.id==='TW'){assert.ok(conditions.includes('7일'));assert.ok(conditions.includes('2026-07-15'));}
    if(country.id==='TH'){assert.ok(conditions.includes('입국일 포함3일'));assert.ok(conditions.includes('체류일수를 확정하지'));}
    if(country.id==='VN'){assert.ok(conditions.includes('선택적 시범'));}
    await js(`document.querySelector('[data-entry-confirmation]').click()`);await sleep(60);assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),guide.needsReview?'추가 확인 필요':'확인 필요');
    await js(`document.querySelector('[data-entry-procedure]').click()`);await sleep(60);assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),guide.needsReview?'추가 확인 필요':'직접 확인함');
    await js(`document.querySelector('[data-entry-passport-packed]').click()`);await sleep(60);await geometry();
    if(['US','AU','TH'].includes(country.id)){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-${city.id}-detail-${width}.png`,Buffer.from(shot.data,'base64'));}
    await close();assert.equal(await js(`document.activeElement.classList.contains('pmb-entry-banner')`),true);assert.equal(await js(`document.querySelector('[data-item-id="essential:passport"] input').checked`),true);assert.equal(await js(`document.querySelector('[data-item-id="electronic:charger"] input').checked`),true);
    for(const kind of ['authorization','procedure'])assert.equal(await js(`document.querySelector('[data-item-id="essential:entry-${kind}"] input').checked`),true);
    assert.ok(!(await js(`document.querySelector('[data-item-id="essential:entry-authorization"]').textContent`)).includes('옷차림 참고'));
    assert.equal(await js(`document.querySelectorAll('[data-item-id="essential:passport"]').length`),1);
    await reload();assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),guide.needsReview?'추가 확인 필요':'직접 확인함');assert.equal(await js(`document.querySelector('[data-item-id="essential:passport"] input').checked`),true);
    const saved=await js(`JSON.parse(localStorage.getItem(${JSON.stringify(key)}))`);assert.equal(saved.entryPreparationConfirmed,true);assert.ok(saved.checkedIds.includes('electronic:charger'));assert.ok(!JSON.stringify(saved).includes('visaNumber'));
    await js(`document.querySelector('.pmb-entry-banner').click()`);await wait(`!!document.querySelector('[data-entry-confirmation]')`);assert.equal(await js(`document.querySelector('[data-entry-confirmation]').checked`),true);
    await click('.pmb-entry-passport button','여권 유효기간 점검');await wait(`!!document.querySelector('.pmb-passport-check')`);assert.equal(await js(`document.querySelectorAll('dialog[open]').length`),1);assert.equal(await js(`document.querySelector('.pmb-passport-date input').value`),'');
    for(const kind of ['authorization','procedure'])assert.equal(await js(`document.querySelector('[data-red-flag-id="passport:entry-${kind}"]').checked`),true);
    await js(`document.querySelector('[data-red-flag-id="passport:entry-authorization"]').click()`);await sleep(60);await close();assert.equal(await js(`document.activeElement.classList.contains('pmb-entry-banner')`),true);
    assert.equal(await js(`document.querySelector('[data-item-id="essential:entry-authorization"] input').checked`),false);assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),expectedStatus);
    await js(`document.querySelector('[data-item-id="essential:entry-authorization"] input').click()`);await sleep(60);
    await js(`document.querySelector('.pmb-entry-banner').click()`);await wait(`!!document.querySelector('[data-entry-confirmation]')`);assert.equal(await js(`document.querySelector('[data-entry-confirmation]').checked`),true);await close();
    // Keep the three original card/detail connections in the same flow.
    await js(`document.querySelector('[data-topic=weather]').click()`);await wait(`!!document.querySelector('[data-climate-metric=meanTemperatureC]')`);const mean=await js(`parseFloat(document.querySelector('[data-climate-metric=meanTemperatureC] .pmb-climate-number').textContent)`);assert.equal(mean,+getClimateMonth(city.id,1).recommendedMetrics.meanTemperatureC.value.toFixed(1));await close();
    await js(`document.querySelector('[data-topic=electricity]').click()`);await wait(`!!document.querySelector('#pmb-guide-electricity')`);assert.ok(await js(`document.querySelector('#pmb-guide-electricity').textContent.includes(${JSON.stringify(getElectricityGuide(country.id).main)})`));await close();
    // A new date creates another bag scope; returning restores the previous personal record.
    await js(`document.querySelector('.pmb-bag-edit-trip').click()`);await wait(`!!document.querySelector('#trip-setup')`);
    await js(`(()=>{const e=document.querySelector('input[name=returnDate]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'2027-01-16');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-entry-banner')`);assert.equal(await js(`document.querySelector('.pmb-entry-banner .pmb-status-badge').textContent`),expectedStatus);await js(`document.querySelector('.pmb-entry-banner').click()`);await wait(`!!document.querySelector('[data-entry-confirmation]')`);assert.equal(await js(`document.querySelector('[data-entry-confirmation]').checked`),false);await close();
    results.push({country:country.id,city:city.id,width,title:guide.title,initialStatus:expectedStatus,confirmedStatus:guide.needsReview?'추가 확인 필요':'직접 확인함',urls,mainGeometry,passed:true});console.log('PASS',width,country.id,city.id);
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);writeFileSync(output+'/ui-results.json',JSON.stringify({checkedOn:'2026-10-25',results,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
