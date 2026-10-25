import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const origin=process.env.QA_ORIGIN??'http://127.0.0.1:5173';
const output=process.env.QA_OUTPUT??'docs/verification/visa-separation';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9256, profile: 'visa-separation-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9256/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  await cdp('Storage.clearDataForOrigin',{origin,storageTypes:'local_storage'});
  const {destinations}=await loadTs('src/service/destination/destinations.ts');
  const {tripKey}=await loadTs('src/service/trip/trip.ts');
  const {getVisaRequirement}=await loadTs('src/service/data/visaRequirements.ts');
  const results=[];
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);};
  for(const width of [1440,390,320])for(const country of destinations){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:origin+'/implementation'});await wait(`!!document.querySelector('.pmb-hero')`);
    const trip={countryId:country.id,cityId:country.cities[0].id,departureDate:'2027-01-10',returnDate:'2027-01-15',travelPurpose:'sightseeing',baggageType:'checked'};
    await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);await cdp('Page.navigate',{url:origin+'/implementation/workspace?view=bag'});await wait(`!!document.querySelector('.pmb-trip-brief')`);
    const visible=['US','AU'].includes(country.id);assert.equal(await js(`!!document.querySelector('.pmb-entry-banner')`),visible);assert.equal(await js(`document.querySelectorAll('.pmb-trip-brief-card').length`),3);
    if(visible){const guide=getVisaRequirement(trip);await js(`document.querySelector('.pmb-entry-banner').click()`);await wait(`!!document.querySelector('dialog[open]')`);const text=await js(`document.querySelector('dialog').textContent`);assert.ok(text.includes('VISA / ENTRY PERMISSION'));assert.ok(text.includes(guide.label));assert.ok(text.includes(guide.summary));for(const point of guide.points)assert.ok(text.includes(point));assert.doesNotMatch(text,/유효기간|만료일|여권을 챙겼|입국신고|TWAC|TDAC|IPC|경유 조건/);assert.equal(await js(`document.querySelectorAll('dialog input[type=date],dialog select,.pmb-entry-passport,[data-entry-passport-packed],[data-entry-procedure]').length`),0);assert.deepEqual(await js(`[...document.querySelectorAll('.pmb-entry-official a')].map(a=>a.href)`),guide.officialLinks.map(l=>l.url));
      await js(`(()=>{const e=document.querySelector('[data-entry-confirmation]');if(!e.checked)e.click();})()`);await sleep(50);assert.ok(await js(`document.querySelector('.pmb-entry-confirmation').textContent.includes('직접 확인함')`));assert.equal(await js(`document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1`),false);const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-${width}.png`,Buffer.from(shot.data,'base64'));await close();assert.equal(await js(`document.activeElement.classList.contains('pmb-entry-banner')`),true);assert.equal(await js(`document.querySelector('[data-item-id="essential:entry-authorization"] input').checked`),true);
    }
    await js(`document.querySelector('.pmb-red-flags-action button').click()`);await wait(`!!document.querySelector('.pmb-passport-check')`);assert.equal(await js(`document.querySelectorAll('.pmb-passport-date input[type=date]').length`),1);assert.equal(await js(`document.querySelectorAll('.pmb-passport-date select').length`),1);const rf=await js(`document.querySelector('dialog').textContent`);assert.ok(rf.includes('여권 유효기간'));assert.ok(!rf.includes('비자·입국신고도 확인하세요'));assert.equal(await js(`document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1`),false);await close();assert.equal(await js(`document.documentElement.scrollWidth>innerWidth+1`),false);
    results.push({country:country.id,width,visaVisible:visible,passportInRedFlags:true,passed:true});console.log('PASS',width,country.id);
  }
  assert.deepEqual(errors,[]);writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
