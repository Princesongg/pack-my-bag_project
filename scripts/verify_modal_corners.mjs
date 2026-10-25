import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/modal-corners';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9267, profile: 'modal-corners-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9267/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const phase=process.env.CORNERS_PHASE??'after',results=[];
  const trip={countryId:'US',cityId:'new-york',departureDate:'2027-12-17',returnDate:'2027-12-20',travelPurpose:'sightseeing',baggageType:'checked'};
  for(const [width,height]of [[1440,900],[1024,768],[768,600],[430,700],[390,600],[375,600],[360,600],[640,360]]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=768});await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation'});await wait(`!!document.querySelector('.pmb-hero')`);await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace?view=bag'});await wait(`!!document.querySelector('.pmb-trip-brief')`);
    for(const [topic,selector]of [['weather','[data-topic=weather]'],['electricity','[data-topic=electricity]'],['baggage','[data-topic=baggage]'],['entry','.pmb-entry-banner'],['passport','.pmb-red-flags-action button'],['confirm','#pmb-last-minute-entry']]){
      await js(`document.querySelector(${JSON.stringify(selector)}).click()`);await wait(`!!document.querySelector('dialog[open]')`);await js(`document.querySelectorAll('dialog details').forEach(e=>e.open=true);document.querySelector('dialog').scrollTop=document.querySelector('dialog').scrollHeight`);await sleep(80);
      const g=await js(`(()=>{const d=document.querySelector('dialog'),s=getComputedStyle(d),r=d.getBoundingClientRect(),c=d.querySelector('.pmb-brief-modal-header button').getBoundingClientRect();return {corners:[s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomRightRadius,s.borderBottomLeftRadius],token:getComputedStyle(document.documentElement).getPropertyValue('--pmb-radius-modal').trim(),top:r.top,bottom:r.bottom,left:r.left,right:r.right,scrollHeight:d.scrollHeight,clientHeight:d.clientHeight,overflow:d.scrollWidth>d.clientWidth+1,closeTop:c.top,closeBottom:c.bottom};})()`);results.push({width,height,topic,...g});
      if(phase==='after'){assert.equal(new Set(g.corners).size,1);assert.ok(parseFloat(g.corners[0])>0);assert.ok(g.top>=0&&g.bottom<=height+1&&g.left>=0&&g.right<=width+1);assert.equal(g.overflow,false);assert.ok(g.closeTop>=0&&g.closeBottom<=height+1);}
      const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${phase}-${topic}-${width}.png`,Buffer.from(shot.data,'base64'));
      if(topic==='confirm'){await click('.pmb-final-confirm button','준비물 더 확인하기');await wait(`!document.querySelector('dialog[open]')`);assert.ok(await js(`!!document.querySelector('.pmb-trip-brief')`));await js(`document.querySelector('#pmb-last-minute-entry').click()`);await wait(`!!document.querySelector('dialog[open]')`);await click('.pmb-final-confirm button','마지막 점검으로 이동');await wait(`!!document.querySelector('.pmb-last-call')`);}else{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);}
    }
    console.log('PASS',phase,width,height);
  }
  assert.deepEqual(errors,[]);writeFileSync(`${output}/${phase}.json`,JSON.stringify({results,errors},null,2));await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
