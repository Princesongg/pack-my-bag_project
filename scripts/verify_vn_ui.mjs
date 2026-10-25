// Run against a local Vite server: node scripts/verify_tw_ui.mjs
// Uses installed Chrome + built-in CDP/WebSocket; no paid services or dependencies.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'docs/verification/vn';
mkdirSync(output, { recursive: true });
const chrome = launchQaBrowser({ port: 9230, profile: 'vn-ui-browser' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let targets;
  for(let i=0;i<80;i++) { try { targets=await (await fetch('http://127.0.0.1:9230/json')).json(); if(targets.some(t=>t.type==='page')) break; } catch {} await sleep(100); }
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
  for(const width of [1440,390]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    for(const test of [
      {city:'하노이',id:'hanoi',start:'2027-01-10',end:'2027-01-15',mean:'17.3°C',high:'20.0°C',low:'14.6°C',rain:'28.0mm',derived:true},
      {city:'다낭',id:'danang',start:'2027-11-10',end:'2027-11-15',mean:'24.9°C',high:'27.7°C',low:'22.5°C',rain:'471.2mm',wet:true},
      {city:'나트랑',id:'nhatrang',start:'2027-11-10',end:'2027-11-15',mean:'26.2°C',rain:'431.9mm',wet:true,missing:true},
      {city:'푸꾸옥',id:'phuquoc',start:'2027-09-10',end:'2027-09-15',mean:'27.6°C',rain:'542.3mm',wet:true,missing:true},
      {city:'다낭',id:'danang',start:'2026-12-29',end:'2027-01-03',mean:'22.4°C',high:'25.3°C',low:'20.5°C',rain:'210.2mm',cross:true},
      {city:'오사카',id:'osaka',country:'일본',start:'2026-11-10',end:'2026-11-15',mean:'14.2°C'},
    ]) {
      await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
      await clickText('#pmb-all-countries button',test.country??'베트남');await clickText('#pmb-setup-city-results button',test.city);
      await setDate('departureDate',test.start);await setDate('returnDate',test.end);
      await evaluate(`document.querySelector('input[name="travelPurpose"][value="sightseeing"]').click()`);await sleep(60);
      await evaluate(`document.querySelector('input[name="baggageType"][value="checked"]').click()`);await sleep(60);
      await evaluate(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief-temperature-value')`);
      const card=await evaluate(`(()=>{const g=document.querySelector('.pmb-trip-brief-grid'),c=g.querySelector('[data-topic=weather]');return {text:c.innerText,values:[...c.querySelectorAll('.pmb-trip-brief-temperature-value')].map(e=>e.innerText),font:getComputedStyle(c.querySelector('.pmb-trip-brief-temperature-value')).fontSize,heights:[...g.children].map(e=>e.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};})()`);
      assert.equal(card.values[0],test.mean);assert.equal(card.font,width===1440?'34px':'30px');assert.equal(card.overflow,false);
      if(width===1440)assert.ok(card.heights.every(h=>Math.abs(h-card.heights[0])<1));
      if(test.derived)assert.match(card.text,/계산 참고/);
      if(test.wet)assert.match(card.text,/우산/);
      await evaluate(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'center'})`);await sleep(80);
      if(!test.cross){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${test.id}-card-${width}.png`,Buffer.from(shot.data,'base64'));}
      await evaluate(`document.querySelector('[data-topic="weather"]').click()`);await wait(`!!document.querySelector('dialog[open] #pmb-weather-panel')`);
      await evaluate(`document.querySelectorAll('dialog details').forEach(e=>e.open=true)`);
      const modal=await evaluate(`document.querySelector('dialog').innerText`);
      for(const value of [test.mean,test.high,test.low,test.rain].filter(Boolean))assert.ok(modal.includes(value),value);
      assert.equal(await evaluate(`(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;})()`),false);
      if(!test.country){assert.match(modal,/1991–2020/);assert.match(modal,/2026-10-25/);assert.ok(!modal.includes('JNTO'));assert.match(modal,/PACK MY BAG/);}
      if(test.derived){assert.match(modal,/算術|산술평균/);assert.match(modal,/공식 직접 월평균/);assert.ok(!modal.includes('BOM'));}
      if(test.missing)assert.match(modal,/공식 정보 확인 필요/);
      const ids=await evaluate(`[...document.querySelectorAll('dialog [data-checklist-item-id]')].map(e=>e.dataset.checklistItemId)`);
      if(test.derived)assert.ok(ids.includes('clothing:light-jacket'));
      if(test.wet)assert.ok(ids.includes('clothing:rain-protection'));
      if(test.missing)assert.ok(ids.includes('clothing:t-shirt'));
      if(test.cross){await clickText('dialog .pmb-guide-months button','2027년 1월');await wait(`document.querySelector('dialog').innerText.includes('21.7°C')`);assert.deepEqual(card.values,['22.4°C','21.7°C']);}
      if(!test.cross){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/${test.id}-modal-${width}.png`,Buffer.from(shot.data,'base64'));}
      await evaluate(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
      const checklist=await evaluate(`[...document.querySelectorAll('li[data-item-id]')].map(e=>e.dataset.itemId)`);assert.equal(new Set(checklist).size,checklist.length);
      for(const id of ids)assert.ok(checklist.includes(id),id);
      if(test.id==='nhatrang'){
        await evaluate(`(()=>{const e=document.querySelector('[data-item-id="clothing:rain-protection"] input');if(!e.checked)e.click();})()`);await sleep(100);
        const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);
        assert.equal(await evaluate(`document.querySelector('[data-item-id="clothing:rain-protection"] input').checked`),true);
        assert.equal(await evaluate(`document.querySelector('.pmb-trip-brief-temperature-value').innerText`),test.mean);
      }
      report.push({width,city:test.id,start:test.start,end:test.end,values:card.values,font:card.font,heights:card.heights,clothingIds:ids,passed:true});console.log('PASS',width,test.id,test.start);
    }
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({report,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();chrome.kill();}
