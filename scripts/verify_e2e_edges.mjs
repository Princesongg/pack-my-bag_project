import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/e2e-qa-edges';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9254, profile: 'e2e-qa-edges-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9254/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const trip={countryId:'US',cityId:'new-york',departureDate:'2027-12-17',returnDate:'2027-12-20',travelPurpose:'sightseeing',baggageType:'checked',tripDays:4,tripNights:3};const key=bagStorageKey(trip);
  const reload=async()=>{const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`document.readyState==='complete'`);};
  await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero')`);
  await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))});localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify({version:1,checkedIds:['essential:passport','custom:old-visa'],customItems:[{id:'custom:old-visa',name:'ESTA 확인',categoryId:'essentials',custom:true}],entryPreparationConfirmed:true}))})`);
  await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace?view=bag'});await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelectorAll('[data-item-id="essential:entry-authorization"]').length`),0);assert.equal(await js(`document.querySelector('[data-item-id="custom:old-visa"] input').checked`),true);checks.push('legacy custom alias restored');
  await js(`document.querySelector('[data-item-id="custom:old-visa"] button').click()`);await sleep(70);
  const replacement=await js(`!!document.querySelector('[data-item-id="essential:entry-authorization"]')`);
  checks.push({name:'delete custom visa restores shared authorization immediately',passed:replacement});
  writeFileSync(output+'/results.json',JSON.stringify({checks,errors},null,2));assert.equal(replacement,true,'Deleting the reused custom entry item leaves the shared authorization checklist missing until reload');
  assert.equal(await js(`document.querySelector('[data-item-id="essential:entry-authorization"] input').checked`),true);assert.equal(await js(`document.querySelector('[data-item-id="essential:passport"] input').checked`),true);
  // A second entry label should reuse the existing row, not duplicate it until reload.
  await js(`(()=>{const e=document.querySelector('.pmb-bag-name input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'ESTA 확인');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await sleep(50);await js(`document.querySelector('.pmb-bag-add').requestSubmit()`);await sleep(60);
  assert.equal(await js(`document.querySelectorAll('[data-item-id^="custom:"]').length`),0);checks.push('adding alias reuses existing entry row');
  // Return to a separate country, then original: preserve the original personal list.
  const other={...trip,countryId:'JP',cityId:'tokyo'};await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(other))})`);await reload();await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelector('[data-item-id="essential:passport"] input').checked`),false);await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);await reload();await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelector('[data-item-id="essential:passport"] input').checked`),true);checks.push('trip isolation and return restore');
  // Corrupt storage must fail safely into setup; no invented saved trip.
  await js(`localStorage.setItem(${JSON.stringify(tripKey)},'{invalid')`);await reload();await wait(`!!document.querySelector('#trip-setup')`);assert.equal(await js(`document.querySelector('input[name=departureDate]').value`),'');checks.push('corrupt trip recovery');
  writeFileSync(output+'/results.json',JSON.stringify({checks,errors},null,2));assert.deepEqual(errors,[]);console.log('PASS edge cases');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
