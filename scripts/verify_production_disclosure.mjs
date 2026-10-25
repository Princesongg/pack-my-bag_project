import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/production-disclosure';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9262, profile: 'production-disclosure-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9262/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  await cdp('Storage.clearDataForOrigin',{origin:'https://pack-my-bagproject.vercel.app',storageTypes:'local_storage'});
  const results=[],phase=process.env.DISCLOSURE_PHASE??'after';
  const fill=async(selector,value)=>{await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);};
  const measure=async(width,state)=>{const r=await js(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top+scrollY,height:r.height}};return {pageHeight:document.documentElement.scrollHeight,setup:rect(document.querySelector('#trip-setup')),dates:rect(document.querySelector('.pmb-setup-date-grid')),submit:rect(document.querySelector('.pmb-setup-submit')),overflow:document.documentElement.scrollWidth>innerWidth+1,countryCardsVisible:[...document.querySelectorAll('#pmb-all-countries button')].filter(e=>e.checkVisibility()).length,cityCardsVisible:[...document.querySelectorAll('#pmb-setup-city-results button')].filter(e=>e.checkVisibility()).length,summaryVisible:[...document.querySelectorAll('.pmb-setup-selection-summary')].filter(e=>e.checkVisibility()).length};})()`);assert.equal(r.overflow,false);results.push({width,state,...r});await cdp('Runtime.evaluate',{expression:'scrollTo(0,0)'});const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});writeFileSync(`${output}/${phase}-${width}-${state}.png`,Buffer.from(shot.data,'base64'));return r;};
  for(const width of [1440,1280,1024,768,430,390,375,360,640,481,480]){
    await cdp('Storage.clearDataForOrigin',{origin:'https://pack-my-bagproject.vercel.app',storageTypes:'local_storage'});
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'https://pack-my-bagproject.vercel.app/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    const empty=await measure(width,'empty');await click('#pmb-all-countries button','일본');await click('#pmb-setup-city-results button','도쿄');
    const selected=await measure(width,'selected');
    if(phase==='after'){
      if(width===390){for(const viewport of [1440,390]){await cdp('Emulation.setDeviceMetricsOverride',{width:viewport,height:844,deviceScaleFactor:1,mobile:viewport<768});await sleep(60);assert.equal(await js(`document.querySelector('#pmb-all-countries [aria-pressed=true]').textContent.includes('일본')`),true);assert.equal(await js(`document.querySelector('#pmb-setup-city-results [aria-pressed=true]').textContent.includes('도쿄')`),true);assert.equal(await js(`document.querySelector('#pmb-all-countries button').checkVisibility()`),viewport>640);}}
      assert.equal(selected.countryCardsVisible,width<=640?0:6);assert.equal(selected.summaryVisible,width<=640?2:0);
      if(width<=640){assert.ok(selected.setup.height<empty.setup.height);await js(`document.querySelector('[data-change-country]').click()`);await sleep(60);assert.equal(await js(`document.querySelector('#pmb-all-countries [aria-pressed=true]').textContent.includes('일본')`),true);assert.equal(await js(`document.activeElement.id`),'pmb-country-search');await fill('#pmb-country-search','미국');await click('#pmb-all-countries button','미국');assert.equal(await js(`document.querySelectorAll('#pmb-setup-city-results [aria-pressed=true]').length`),0);await click('#pmb-setup-city-results button','뉴욕');await js(`document.querySelector('[data-change-city]').click()`);await sleep(60);assert.equal(await js(`document.querySelector('#pmb-setup-city-results [aria-pressed=true]').textContent.includes('뉴욕')`),true);await fill('#pmb-setup-city-search','Los');await click('#pmb-setup-city-results button','로스앤젤레스');}
      assert.ok(await js(`[...document.querySelectorAll('.pmb-setup-selection-summary button,.pmb-setup-chips label>span')].filter(e=>e.checkVisibility()).every(e=>e.getBoundingClientRect().height>=43.99)`));
      await fill('input[name=departureDate]','2027-12-17');await fill('input[name=returnDate]','2027-12-20');await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click();document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(60);assert.ok(await js(`document.querySelector('.pmb-setup-duration').textContent.includes('3박 4일')`));await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);await js(`document.querySelector('.pmb-bag-edit-trip').click()`);await wait(`!!document.querySelector('#trip-setup')`);assert.equal(await js(`document.querySelector('input[name=departureDate]').value`),'2027-12-17');await measure(width,'restored');
      if(width<=640){await js(`document.querySelector('[data-change-country]').click()`);await sleep(60);await js(`document.querySelector('[data-change-country]').click()`);await sleep(60);assert.ok(await js(`document.querySelector('.pmb-setup-city-picker .pmb-setup-selection-summary').textContent.includes('로스앤젤레스')`));assert.equal(await js(`document.querySelector('input[name=returnDate]').value`),'2027-12-20');}
      const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('input[name=departureDate]')`);assert.equal(await js(`document.querySelector('input[name=departureDate]').value`),'2027-12-17');assert.equal(await js(`document.querySelector('#pmb-all-countries [aria-pressed=true]')!==null`),true);
    }
    console.log('PASS',phase,width);
  }
  assert.deepEqual(errors,[]);writeFileSync(`${output}/${phase}.json`,JSON.stringify({results,errors},null,2));await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
