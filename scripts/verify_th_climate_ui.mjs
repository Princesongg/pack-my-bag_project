// Run against a local Vite server: node scripts/verify_tw_ui.mjs
// Uses installed Chrome + built-in CDP/WebSocket; no paid services or dependencies.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'docs/verification/th-climate';
mkdirSync(output, { recursive: true });
const chrome = launchQaBrowser({ port: 9240, profile: 'th-climate-browser' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let targets;
  for(let i=0;i<80;i++) { try { targets=await (await fetch('http://127.0.0.1:9240/json')).json(); if(targets.some(t=>t.type==='page')) break; } catch {} await sleep(100); }
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  let id=0;
  const pending=new Map(), errors=[], requests=[];
  ws.addEventListener('message',e=>{
    const msg=JSON.parse(e.data);
    if(msg.id) { const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p?.reject(Error(JSON.stringify(msg.error))):p?.resolve(msg.result); }
    if(msg.method==='Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description??''));
    if(msg.method==='Network.requestWillBeSent') requests.push(msg.params.request.url);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout: '+method));},10000);pending.set(n,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(60);}throw Error('Timeout: '+expression+' '+JSON.stringify({errors,page:await evaluate('document.body.innerText.slice(0,2000)')}));};
  const clickText=async(selector,text)=>{await evaluate(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.textContent.includes(${JSON.stringify(text)}));if(!el)throw Error('Missing button');el.click();})()`);await sleep(60);};
  const setDate=async(name,value)=>{await evaluate(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await cdp('Storage.clearDataForOrigin',{origin:'http://127.0.0.1:5173',storageTypes:'local_storage'});
  const report=[];
  const scenarios=[
    {city:'방콕',id:'bangkok',month:'04',mean:'30.8°C',rain:'92.7mm',high:'35.7°C',low:'27.2°C',clothes:['clothing:t-shirt'],dry:true},
    {city:'방콕',id:'bangkok',month:'09',mean:'28.7°C',rain:'343.6mm',clothes:['clothing:t-shirt','clothing:rain-protection'],wet:true},
    {city:'치앙마이',id:'chiangmai',month:'12',mean:'22.5°C',rain:'10.0mm',high:'29.2°C',low:'16.9°C',clothes:['clothing:light-long-sleeve','clothing:cardigan'],dry:true},
    {city:'푸껫',id:'phuket',month:'09',mean:'27.7°C',rain:'393.9mm',high:'30.9°C',low:'24.1°C',purpose:'relaxation',clothes:['clothing:t-shirt','clothing:rain-protection','clothing:swimwear'],wet:true},
    {city:'푸껫',id:'phuket',month:'09',mean:'27.7°C',rain:'393.9mm',clothes:['clothing:rain-protection','clothing:walking-shoes'],wet:true},
    {city:'치앙마이',id:'chiangmai',month:'12',start:'2027-12-29',end:'2028-01-03',mean:'22.5°C',rain:'10.0mm',clothes:['clothing:cardigan'],cross:true},
    {city:'나트랑',id:'nhatrang',month:'12',country:'베트남',start:'2026-12-10',end:'2026-12-15',mean:'25.1°C',rain:'228.4mm',clothes:['clothing:t-shirt','clothing:rain-protection'],partial:true,wet:true},
  ];
  for(const width of [1440,390,320])for(const test of scenarios){
    const start=test.start??`2027-${test.month}-10`,end=test.end??`2027-${test.month}-15`;
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await clickText('#pmb-all-countries button',test.country??'태국');await clickText('#pmb-setup-city-results button',test.city);
    await setDate('departureDate',start);await setDate('returnDate',end);
    await evaluate(`document.querySelector('input[name="travelPurpose"][value="${test.purpose??'sightseeing'}"]').click()`);await sleep(60);
    await evaluate(`document.querySelector('input[name="baggageType"][value="checked"]').click()`);await sleep(60);
    await evaluate(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief-temperature-value')`);
    const card=await evaluate(`(()=>{const g=document.querySelector('.pmb-trip-brief-grid'),c=g.querySelector('[data-topic=weather]');return {text:c.innerText,values:[...c.querySelectorAll('.pmb-trip-brief-temperature-value')].map(e=>e.innerText),heights:[...g.children].map(e=>e.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};})()`);
    assert.equal(card.values[0],test.mean);assert.equal(card.overflow,false);if(width>768)assert.ok(card.heights.every(h=>Math.abs(h-card.heights[0])<1));
    if(test.id==='phuket')assert.match(card.text,/푸껫공항 관측소 기준/);
    if(test.wet)assert.match(card.text,/우산/);if(test.dry)assert.ok(!card.text.includes('우산'));
    await evaluate(`document.querySelector('[data-topic="weather"]').click()`);await wait(`!!document.querySelector('dialog[open] #pmb-weather-panel')`);
    const modal=await evaluate(`document.querySelector('dialog').textContent.replace(/\\s+/g,'')`);
    for(const value of [test.mean,test.rain,test.high,test.low].filter(Boolean))assert.ok(modal.includes(value),value);
    assert.match(modal,/1991–2020/);assert.match(modal,/2026-10-25/);assert.ok(!modal.includes('JNTO'));
    if(!test.country){assert.match(modal,/태국기상청TMD/);assert.ok(!modal.includes('대만중앙기상서'));}
    if(test.id==='phuket')assert.match(modal,/푸껫공항/);
    const ids=await evaluate(`[...document.querySelectorAll('dialog [data-checklist-item-id]')].map(e=>e.dataset.checklistItemId)`);
    for(const id of test.clothes)assert.ok(ids.includes(id),id);if(test.id==='phuket'&&!test.purpose)assert.ok(!ids.includes('clothing:swimwear'));
    const layout=await evaluate(`(()=>{const d=document.querySelector('dialog'),cards=[...d.querySelectorAll('[data-climate-metric]')];return {count:cards.length,overflow:d.scrollWidth>d.clientWidth+1||cards.some(e=>e.scrollWidth>e.clientWidth+1),partial:!!d.querySelector('.pmb-climate-available')};})()`);assert.equal(layout.overflow,false);assert.equal(layout.count,test.partial?2:4);assert.equal(layout.partial,!!test.partial);
    const label=`${test.id}-${test.month}-${test.purpose??'sightseeing'}${test.cross?'-cross':''}-${width}`;
    const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${label}.png`,Buffer.from(shot.data,'base64'));
    await evaluate(`document.querySelectorAll('dialog details').forEach(e=>e.open=true)`);
    const sourceLinks=await evaluate(`[...document.querySelectorAll('dialog .pmb-guide-sources a')].map(e=>e.href)`);assert.ok(sourceLinks.some(u=>u.includes('jma.go.jp')));if(!test.country)assert.ok(sourceLinks.some(u=>u.includes('tmd.go.th')));
    if(test.cross){await clickText('dialog .pmb-guide-months button','2028년 1월');await wait(`document.querySelector('dialog').textContent.includes('22.3°C')`);assert.deepEqual(card.values,['22.5°C','22.3°C']);}
    await evaluate(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    const checklist=await evaluate(`[...document.querySelectorAll('li[data-item-id]')].map(e=>e.dataset.itemId)`);assert.equal(new Set(checklist).size,checklist.length);for(const id of ids)assert.ok(checklist.includes(id),id);
    const checkedId=test.wet?'clothing:rain-protection':test.clothes[0];
    await evaluate(`(()=>{const e=document.querySelector('[data-item-id="${checkedId}"] input');if(!e.checked)e.click();})()`);await sleep(80);
    if(!test.country){const note=await evaluate(`document.querySelector('[data-item-id="${checkedId}"]').innerText`);assert.ok(!note.includes('옷차림 참고'));}
    const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);
    assert.equal(await evaluate(`document.querySelector('[data-item-id="${checkedId}"] input').checked`),true);
    assert.equal(await evaluate(`document.querySelector('.pmb-trip-brief-temperature-value').innerText`),test.mean);
    report.push({width,city:test.id,start,end,purpose:test.purpose??'sightseeing',card,layout,ids,sourceLinks,passed:true});console.log('PASS',width,label);
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({report,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();chrome.kill();}
