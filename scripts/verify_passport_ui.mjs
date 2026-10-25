import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/passport';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9239, profile: 'passport-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9239/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const results=[];
  const expiryValue='2027-04-25';
  const fillExpiry=async value=>{await js(`(()=>{const e=document.querySelector('.pmb-passport-date input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);};
  const status=()=>js(`document.querySelector('[data-passport-status]').dataset.passportStatus`);
  const open=async()=>{await js(`document.querySelector('.pmb-red-flags-action button').click()`);await wait(`!!document.querySelector('.pmb-passport-check')`);};
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);};
  for(const width of [1440,390,320])for(const country of destinations){
    const city=country.cities[0],six=['VN','TH','TW'].includes(country.id);
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',country.name);await click('#pmb-setup-city-results button',city.name);
    for(const [name,value] of [['departureDate','2026-12-17'],['returnDate','2026-12-20']]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);}
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(50);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(50);
    await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-red-flags-action')`);
    await open();assert.equal(await status(),'review');
    await fillExpiry(expiryValue);assert.equal(await status(),'review');
    await js(`document.querySelector('.pmb-passport-scope input').click()`);await sleep(50);
    await js(`(()=>{const e=document.querySelector('.pmb-passport-date select');e.value='direct';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);
    assert.equal(await status(),six?'failed':'met');
    const result=await js(`document.querySelector('[data-passport-status]').textContent`);
    assert.ok(result.includes(six?'2027-06-17':'2026-12-20'));assert.ok(result.includes(six?'갱신':'입국 허가를 보장하지 않아요'));
    if(six)assert.equal(await js(`getComputedStyle(document.querySelector('[data-passport-status]')).color`),'rgb(152, 47, 39)');
    const sourceLinks=await js(`[...document.querySelectorAll('.pmb-passport-check .pmb-guide-sources a')].map(e=>e.href)`);assert.ok(sourceLinks.length>0);
    assert.ok(await js(`document.querySelector('.pmb-passport-check').textContent.includes('2026-10-25')`));
    const geometry=await js(`(()=>{const d=document.querySelector('dialog'),p=document.querySelector('.pmb-passport-check');return {dialogOverflow:d.scrollWidth>d.clientWidth+1,panelOverflow:p.scrollWidth>p.clientWidth+1};})()`);assert.equal(geometry.dialogOverflow,false);assert.equal(geometry.panelOverflow,false);
    const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-${width}.png`,Buffer.from(shot.data,'base64'));
    await fillExpiry('2027-06-17');assert.equal(await status(),'met');
    await js(`(()=>{const e=document.querySelector('.pmb-passport-date select');e.value='unknown';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);assert.equal(await status(),'review');
    await fillExpiry(expiryValue);
    // Tab changes unmount passport inputs while preserving acknowledged checklist IDs.
    await js(`(()=>{const e=document.querySelector('[data-red-flag-id="passport:expiry"]');if(!e.checked)e.click();})()`);await sleep(50);
    await click('.pmb-red-flags-tabs button','해외 결제 준비');assert.equal(await js(`!!document.querySelector('.pmb-passport-check')`),false);assert.ok(await js(`!!document.querySelector('[data-red-flag-id="payment:block"]')`));
    await click('.pmb-red-flags-tabs button','항공 반입');assert.ok(await js(`!!document.querySelector('[data-red-flag-id="baggage:power-bank"]')`));
    await click('.pmb-red-flags-tabs button','여권 준비');assert.equal(await js(`document.querySelector('.pmb-passport-date input').value`),'');
    assert.equal(await js(`document.querySelector('[data-red-flag-id="passport:expiry"]').checked`),true);
    await fillExpiry(expiryValue);await close();await open();assert.equal(await js(`document.querySelector('.pmb-passport-date input').value`),'');
    assert.equal(await js(`JSON.stringify({...localStorage}).includes('${expiryValue}')`),false);assert.equal(await js(`JSON.stringify({...sessionStorage}).includes('${expiryValue}')`),false);
    await fillExpiry(expiryValue);
    const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-red-flags-action')`);await open();assert.equal(await js(`document.querySelector('.pmb-passport-date input').value`),'');assert.equal(await js(`document.querySelector('[data-red-flag-id="passport:expiry"]').checked`),true);await close();
    results.push({country:country.id,width,expiry:expiryValue,status:six?'failed':'met',sourceLinks,geometry,privacyPassed:true});console.log('PASS',width,country.id);
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({results,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
