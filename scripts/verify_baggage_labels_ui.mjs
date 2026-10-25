import {loadTs} from '../tests/helpers/load-ts.mjs';
// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/baggage-labels';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9241, profile: 'baggage-labels-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9241/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const stylesByVariant={};
  const checkStyles=async selector=>{
    const badges=await js(`[...document.querySelectorAll(${JSON.stringify(selector)})].map(e=>{const s=getComputedStyle(e);return {variant:e.dataset.variant,background:s.backgroundColor,color:s.color,border:s.borderTopColor,borderStyle:s.borderTopStyle,borderWidth:s.borderTopWidth};})`);
    assert.equal(badges.length,2,selector);
    for(const {variant,...style} of badges){
      assert.ok(['carry-on','checked-banned'].includes(variant));
      assert.equal(style.borderStyle,'solid');assert.equal(style.borderWidth,'1px');
      if(stylesByVariant[variant])assert.deepEqual(style,stylesByVariant[variant],selector+' '+variant);else stylesByVariant[variant]=style;
    }
  };

  for(const width of [1440,390]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',destinations[0].name);await click('#pmb-setup-city-results button',destinations[0].cities[0].name);
    for(const [name,value] of [['departureDate','2027-12-17'],['returnDate','2027-12-20']]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(50);}
    await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(50);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(50);
    await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
    const {batteryCarryLabels:labels}=await loadTs('src/service/data/baggageLabels.ts');
    const summary=await js(`document.querySelector('[data-topic=baggage]').textContent`);assert.ok(summary.includes(labels.cabin));assert.ok(summary.includes(labels.checked));
    await checkStyles('[data-topic=baggage] .pmb-status-badge');
    await js(`document.querySelector('[data-topic=baggage]').click()`);await wait(`!!document.querySelector('#pmb-baggage-trigger-power-banks')`);
    await js(`document.querySelector('#pmb-baggage-trigger-power-banks').click()`);await wait(`!!document.querySelector('.pmb-baggage-status')`);
    await checkStyles('#pmb-baggage-trigger-power-banks .pmb-status-badge');
    await checkStyles('.pmb-baggage-status .pmb-status-badge');
    assert.deepEqual(await js(`[...document.querySelectorAll('.pmb-baggage-status span')].map(e=>e.textContent)`),[labels.cabin,labels.checked]);
    assert.ok((await js(`document.querySelector('.pmb-baggage-panel-content').textContent`)).includes(labels.description));
    await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('[data-battery-kind="power-banks-spares"]')`);
    assert.deepEqual(await js(`[...document.querySelectorAll('[data-battery-kind="power-banks-spares"] .pmb-electronics-badges span')].map(e=>e.textContent)`),[labels.cabin,labels.checked]);
    await checkStyles('[data-battery-kind="power-banks-spares"] .pmb-status-badge');
    for(let n=0;n<8;n++){
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      assert.equal(await js(`document.querySelector('dialog[open]').contains(document.activeElement)`),true);
    }
    assert.equal(await js(`(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;})()`),false);
    await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    assert.equal(await js(`document.activeElement.dataset.topic`),'baggage');
    await js(`document.querySelector('.pmb-red-flags-action button').click()`);await wait(`!!document.querySelector('.pmb-red-flags-tabs')`);
    await js(`document.querySelectorAll('.pmb-red-flags-tabs button')[2].click()`);await wait(`!!document.querySelector('.pmb-red-flags-baggage-note')`);
    assert.ok((await js(`document.querySelector('.pmb-red-flags-baggage-note').textContent`)).includes(labels.description));
    await js(`document.querySelector('#pmb-baggage-trigger-power-banks').click()`);await wait(`!!document.querySelector('.pmb-baggage-status')`);
    assert.deepEqual(await js(`[...document.querySelectorAll('.pmb-baggage-status span')].map(e=>e.textContent)`),[labels.cabin,labels.checked]);
    await checkStyles('.pmb-baggage-status .pmb-status-badge');
    const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/shared-badges-${width}.png`,Buffer.from(shot.data,'base64'));
    console.log('PASS',width,'brief / battery detail / electronics / red flags');
  }
  assert.deepEqual(errors,[]);writeFileSync(`${output}/badge-colors.json`,JSON.stringify(stylesByVariant,null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
