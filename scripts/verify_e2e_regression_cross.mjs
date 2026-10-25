import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/e2e-regression-cross';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9258, profile: 'e2e-regression-cross-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9258/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  if(!process.env.QA_RESTORE_ONLY)await cdp('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5173',storageTypes:'local_storage'});
  const {bagStorageKey}=await loadTs('src/service/my-bag/bag.ts');
  const {tripKey}=await loadTs('src/service/trip/trip.ts');

  const checks=[];
  const fill=async(sel,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);};
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await sleep(60);};
  await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
  for(const width of [1440,390]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    for(const [country,city,month,expected]of [['일본','도쿄','12','met'],['미국','뉴욕','12','met'],['호주','시드니','12','met'],['베트남','다낭','12','failed'],['태국','방콕','12','failed'],['대만','타이베이','12','failed'],['베트남','다낭','11','met']]){
      if(await js(`!!document.querySelector('.pmb-bag-edit-trip')`)){await js(`document.querySelector('.pmb-bag-edit-trip').click()`);await wait(`!!document.querySelector('#trip-setup')`);}
      await click('#pmb-all-countries button',country);await click('#pmb-setup-city-results button',city);
      await fill('input[name=departureDate]','2026-'+month+'-17');await fill('input[name=returnDate]','2026-'+month+'-20');
      await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
      const summary=await js(`document.querySelector('.pmb-bag-trip').textContent`);assert.ok(summary.includes(country)&&summary.includes(city)&&summary.includes('2026-'+month+'-17'));
      assert.equal(await js(`!!document.querySelector('.pmb-entry-banner')`),['미국','호주'].includes(country));
      await js(`document.querySelector('.pmb-red-flags-action button').click()`);await wait(`!!document.querySelector('.pmb-passport-check')`);assert.equal(await js(`document.querySelector('.pmb-passport-date input').value`),'');
      await fill('.pmb-passport-date input','2027-05-25');await js(`document.querySelector('.pmb-passport-scope input').click()`);await fill('.pmb-passport-date select','direct');assert.equal(await js(`document.querySelector('[data-passport-status]').dataset.passportStatus`),expected);
      await close();assert.equal(await js(`JSON.stringify({...localStorage,...sessionStorage}).includes('2027-05-25')`),false);
      checks.push({width,country,city,departure:'2026-'+month+'-17',passport:expected,passed:true});console.log('PASS cross',width,country,month,expected);
    }
  }
  assert.deepEqual(errors,[]);writeFileSync(output+'/results.json',JSON.stringify({checks,errors},null,2));await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
