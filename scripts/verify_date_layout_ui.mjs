import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/date-layout';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9252, profile: 'date-layout-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9252/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const results=[];
  for(const width of [1440,768,390,320]){
    await cdp('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5173',storageTypes:'local_storage'});
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button','일본');await click('#pmb-setup-city-results button','도쿄');
    await js(`document.querySelector('.pmb-setup-date-grid').scrollIntoView({block:'center'})`);
    const snap=async name=>{const g=await js(`(()=>{const grid=document.querySelector('.pmb-setup-date-grid'),base=grid.getBoundingClientRect();return {fields:[...grid.querySelectorAll('input')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top-base.top,left:r.left-base.left,height:r.height,width:r.width,overflow:e.scrollWidth>e.clientWidth+1};}),columns:getComputedStyle(grid).gridTemplateColumns,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,errors:[...document.querySelectorAll('.pmb-setup-date-errors p')].map(e=>e.textContent),duration:document.querySelector('.pmb-setup-duration').textContent};})()`);assert.equal(g.pageOverflow,false);assert.ok(g.fields.every(f=>f.height===54));if(width>480)assert.equal(g.fields[0].top,g.fields[1].top);else assert.ok(g.fields[1].top>g.fields[0].top);if(results.some(r=>r.width===width)){const first=results.find(r=>r.width===width);assert.deepEqual(g.fields.map(f=>[f.top,f.height]),first.fields.map(f=>[f.top,f.height]));}results.push({width,name,...g});return g;};
    const fill=async(name,value,blur=true)=>{await js(`(()=>{const e=document.querySelector('input[name="${name}"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);if(blur){await js(`document.querySelector('input[name="${name}"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`);await sleep(50);}};
    let g=await snap('empty');assert.ok(g.errors.every(e=>!e));
    await fill('departureDate','2027-02-10');g=await snap('departure-only');assert.ok(g.errors.every(e=>!e));assert.equal(await js(`document.querySelector('input[name=returnDate]').min`),'2027-02-10');
    await fill('returnDate','2027-02-15');g=await snap('valid');assert.ok(g.duration.includes('5박 6일'));assert.ok(g.errors.every(e=>!e));
    await fill('returnDate','2027-02-09',false);g=await snap('editing-invalid');assert.ok(g.errors.every(e=>!e));await js(`document.querySelector('input[name=returnDate]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`);await sleep(50);g=await snap('invalid-blurred');assert.ok(g.errors[1].includes('같거나 늦'));
    const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/invalid-${width}.png`,Buffer.from(shot.data,'base64'));
    await fill('returnDate','2027-02-15');g=await snap('corrected');assert.ok(g.errors.every(e=>!e));
    await fill('departureDate','');await fill('returnDate','');await js(`document.querySelector('#trip-setup form').requestSubmit()`);await sleep(80);g=await snap('submitted-empty');assert.ok(g.errors.every(e=>e.includes('선택')));
    await fill('departureDate','2027-02-10');await fill('returnDate','2027-02-15');g=await snap('corrected-after-submit');assert.ok(g.errors.every(e=>!e));
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(40);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(40);await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.ok(await js(`document.querySelector('.pmb-bag-trip').textContent.includes('5박 6일')`));console.log('PASS',width);
  }
  assert.deepEqual(errors,[]);writeFileSync(output+'/ui-results.json',JSON.stringify({results,errors},null,2));await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
