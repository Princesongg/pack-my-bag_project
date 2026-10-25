import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/e2e-qa-clock';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9255, profile: 'e2e-qa-clock-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9255/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const {tripKey}=await loadTs('src/service/trip/trip.ts');
  const {getCurrentCityTime}=await loadTs('src/service/data/currentTime.ts');
  const trip={countryId:'US',cityId:'new-york',departureDate:'2027-12-17',returnDate:'2027-12-20',travelPurpose:'sightseeing',baggageType:'checked'};
  await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero')`);await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace?view=bag'});await wait(`!!document.querySelector('.pmb-destination-clock-time')`);
  const before=await js(`({time:document.querySelector('.pmb-destination-clock-time').textContent,now:new Date().toISOString(),difference:document.querySelector('.pmb-destination-clock').textContent})`);
  assert.equal(before.time,getCurrentCityTime('new-york',new Date(before.now)).time);
  const delay=await js(`60000-Date.now()%60000+700`);console.log('Waiting for real clock minute boundary',delay);let remaining=delay;while(remaining>0){await sleep(Math.min(remaining,20000));remaining-=Math.min(remaining,20000);}
  const after=await js(`({time:document.querySelector('.pmb-destination-clock-time').textContent,now:new Date().toISOString()})`);assert.notEqual(before.time,after.time);assert.equal(after.time,getCurrentCityTime('new-york',new Date(after.now)).time);
  writeFileSync(output+'/result.json',JSON.stringify({passed:true,before,after,waitedMs:delay,errors},null,2));assert.deepEqual(errors,[]);console.log('PASS real minute clock update');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
