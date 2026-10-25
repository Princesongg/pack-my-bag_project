import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/electricity-common';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9232, profile: 'electricity-common-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9232/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const results=[];
  for(const width of [1440,390])for(const country of destinations)for(const city of country.cities){
    const guide=getElectricityGuide(country.id);
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',country.name);await click('#pmb-setup-city-results button',city.name);
    for(const [name,value] of [['departureDate','2027-11-10'],['returnDate','2027-11-15']]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(40);}
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(40);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(40);
    await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
    assert.equal(await js(`document.querySelector('[data-topic=electricity] .pmb-trip-brief-summary').innerText`),guide.main);
    const geometry=await js(`(()=>{const g=document.querySelector('.pmb-trip-brief-grid');return {heights:[...g.children].map(e=>e.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};})()`);assert.equal(geometry.overflow,false);if(width>768)assert.ok(geometry.heights.every(h=>Math.abs(h-geometry.heights[0])<1));
    for(const prep of guide.preparation.filter(p=>p.id)){
      assert.equal(await js(`document.querySelectorAll('[data-item-id="${prep.id}"]').length`),1);
      const text=await js(`document.querySelector('[data-item-id="${prep.id}"]').innerText`);assert.ok(text.includes(prep.name));assert.ok(text.includes(prep.status));assert.ok(text.includes(prep.reason));
    }
    await js(`document.querySelector('[data-topic=electricity]').click()`);await wait(`!!document.querySelector('[data-electricity-section=packing]')`);
    assert.deepEqual(await js(`[...document.querySelectorAll('[data-electricity-section]')].map(e=>e.dataset.electricitySection)`),['use','shape','packing','caution']);
    const text=await js(`document.querySelector('#pmb-guide-electricity').textContent`);assert.ok(text.includes(guide.main));assert.ok(text.includes(guide.comparison));assert.ok(text.includes(guide.compatibility));if(country.id!=='JP')assert.ok(!text.includes('JNTO'));
    for(const prep of guide.preparation) {const item=await js(`(()=>{const e=[...document.querySelectorAll('.pmb-preparation-list li')].find(e=>e.textContent.includes(${JSON.stringify(prep.name)}));return e?.textContent;})()`);assert.ok(item.includes(prep.actionLabel??prep.status));for(const note of prep.notes??[prep.reason])assert.ok(item.includes(note));}
    const svg=await js(`[...document.querySelectorAll('#pmb-guide-electricity .pmb-plug-mini svg')].map(e=>({title:e.querySelector('title').textContent,width:e.getBoundingClientRect().width}))`);assert.ok(svg.length>0);assert.ok(svg.every(s=>s.width>=(width>768?100:80)));
    const sourceText=await js(`document.querySelector('#pmb-guide-electricity>.pmb-guide-sources').textContent`);if(country.id!=='JP')assert.ok(!sourceText.includes('JNTO'));
    const links=await js(`[...document.querySelectorAll('#pmb-guide-electricity>.pmb-guide-sources a')].map(e=>e.href)`);if(country.id!=='JP')assert.ok(links.every(u=>!u.includes('japan.travel')));
    assert.equal(await js(`(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;})()`),false);
    if(city.id===country.cities[0].id){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${country.id}-${width}.png`,Buffer.from(shot.data,'base64'));}
    await js(`document.querySelectorAll('#pmb-guide-electricity details').forEach(e=>e.open=true)`);
    const kinds=await js(`[...document.querySelectorAll('dialog [data-plug-kind]')].map(e=>e.dataset.plugKind)`);assert.deepEqual(kinds,guide.visualKinds);
    await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    const adapter='[data-item-id="electronic:travel-adapter"] input';await js(`(()=>{const e=document.querySelector('${adapter}');if(!e.checked)e.click();})()`);await sleep(80);
    const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelector('${adapter}').checked`),true);
    if(city.id===country.cities[0].id){
      await js(`document.querySelector('.pmb-pack-less-entry-actions button').click()`);for(const [name,value] of [['accommodationAmenities','unknown'],['laundryPlan','no'],['shoppingPlan','no']]){await js(`document.querySelector('input[name="pack-less-${name}"][value="${value}"]').click()`);await sleep(40);}
      await click('#pmb-pack-less-editor button','답변으로 제안 보기');await js(`document.querySelectorAll('#pmb-pack-less-editor details').forEach(e=>e.open=true)`);
      await js(`(()=>{const e=document.querySelector('[data-suggestion-id="electronic:travel-adapter"] select');e.value='exclude';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(40);await click('#pmb-pack-less-editor button','MY BAG에 적용하기');assert.equal(await js(`!!document.querySelector('${adapter}')`),false);
      await js(`document.querySelector('.pmb-bag-excluded button').click()`);await wait(`!!document.querySelector('${adapter}')`);assert.equal(await js(`document.querySelector('${adapter}').checked`),true);
      await js(`document.querySelector('[data-topic=baggage]').click()`);await wait(`!!document.querySelector('#pmb-baggage-trigger-electronics')`);await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('.pmb-electronics-guidance')`);assert.equal(await js(`document.querySelectorAll('[data-battery-kind]').length`),3);
      await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    }
    results.push({width,country:country.id,city:city.id,main:guide.main,kinds,status:guide.preparation[1].status,geometry,passed:true});console.log('PASS',width,country.id,city.id);
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);writeFileSync(`${output}/ui-results.json`,JSON.stringify({results,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
