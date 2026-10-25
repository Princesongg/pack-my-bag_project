import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/responsive-edge';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9261, profile: 'responsive-edge-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9261/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const {tripKey}=await loadTs('src/service/trip/trip.ts');
  const results=[];
  const measure=async(name,width,height)=>{await sleep(70);const g=await js(`(()=>{const d=document.querySelector('dialog[open]'),scope=d??document,rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,modalOverflow:d?d.scrollWidth>d.clientWidth+1:false,modal:d?rect(d):null,close:d?rect(d.querySelector('.pmb-brief-modal-header button')):null,bodyLocked:document.body.style.position==='fixed',controls:[...scope.querySelectorAll('button,input:not([type=radio]):not([type=checkbox]),select')].filter(e=>e.checkVisibility()&&getComputedStyle(e).visibility!=='hidden').map(e=>({text:e.textContent?.slice(0,45),...rect(e)}))};})()`);results.push({name,width,height,...g});writeFileSync(output+'/results.json',JSON.stringify({results,errors},null,2));const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${name}-${width}-${height}.png`,Buffer.from(shot.data,'base64'));return g;};
  for(const [width,height]of [[1920,1080],[820,600],[768,400],[430,600],[390,600],[375,600],[360,600],[844,390],[640,360]]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=844});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero .pmb-cta')`);await measure('start',width,height);
    const trip={countryId:'US',cityId:'los-angeles',departureDate:'2027-12-17',returnDate:'2027-12-20',travelPurpose:'sightseeing',baggageType:'checked'};
    await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace?view=bag'});await wait(`!!document.querySelector('.pmb-entry-banner')`);
    await js(`(()=>{const e=document.querySelector('.pmb-bag-name input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'긴 이름의 개인 전자기기 충전기와 케이블 ExtremelyLongUnbrokenPersonalEquipmentName1234567890');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);await js(`document.querySelector('.pmb-bag-add').requestSubmit()`);await sleep(50);await js(`document.querySelector('[data-item-id^="custom:"]')?.scrollIntoView({block:'center'})`);await measure('long-item',width,height);
    for(const topic of ['weather','electricity','baggage','entry','passport']){
      const selector=topic==='entry'?'.pmb-entry-banner':topic==='passport'?'.pmb-red-flags-action button':`[data-topic="${topic}"]`;
      await js(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).click()`);await wait(`!!document.querySelector('dialog[open]')`);const before=await measure(topic,width,height);assert.equal(before.bodyLocked,true);
      await js(`document.querySelectorAll('dialog details').forEach(e=>e.open=true);document.querySelector('dialog').scrollTop=document.querySelector('dialog').scrollHeight`);const end=await measure(topic+'-bottom',width,height);
      assert.equal(end.modalOverflow,false);assert.ok(end.modal.left>=-1&&end.modal.right<=width+1&&end.modal.top>=-1&&end.modal.bottom<=height+1);assert.ok(end.close.top>=-1&&end.close.bottom<=height+1);
      await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);assert.equal(await js(`document.body.style.position`),'');assert.equal(await js(`document.activeElement.matches(${JSON.stringify(selector)})`),true);
    }
    for(const r of results.filter(r=>r.width===width&&r.height===height)){assert.ok(r.controls.every(c=>c.left>=-1&&c.right<=width+1),'controls outside viewport '+r.name+' '+width);}console.log('PASS edge',width,height);
  }
  const sweep=[];
  for(let width=1920;width>=360;width-=20){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:600,deviceScaleFactor:1,mobile:width<=768});
    const geometry=await js(`new Promise(resolve=>requestAnimationFrame(()=>{const cards=[...document.querySelectorAll('.pmb-trip-brief-card')].map(e=>e.getBoundingClientRect());resolve({pageOverflow:document.documentElement.scrollWidth>innerWidth+1,overlap:cards.some((a,i)=>cards.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)),country:document.querySelector('.pmb-bag-trip').textContent.includes('로스앤젤레스')});}))`);
    assert.equal(geometry.pageOverflow,false);assert.equal(geometry.overlap,false);assert.equal(geometry.country,true);sweep.push({width,...geometry});
  }
  assert.deepEqual(errors,[]);assert.ok(results.every(r=>!r.pageOverflow&&!r.modalOverflow));writeFileSync(output+'/results.json',JSON.stringify({results,sweep,errors},null,2));console.log('PASS responsive edges and',sweep.length,'resize steps');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
