// Run against a local Vite server: node scripts/verify_tw_ui.mjs
// Uses installed Chrome + built-in CDP/WebSocket; no paid services or dependencies.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'docs/verification/tw';
mkdirSync(output, { recursive: true });
const chrome = launchQaBrowser({ port: 9225, profile: 'tw-ui-browser' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let targets;
  for(let i=0;i<80;i++) { try { targets=await (await fetch('http://127.0.0.1:9225/json')).json(); if(targets.some(t=>t.type==='page')) break; } catch {} await sleep(100); }
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
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
    for(const test of [
      {city:'타이베이',id:'taipei',month:1,mean:'16.4°C',high:'19.4°C',low:'14.2°C'},
      {city:'타이베이',id:'taipei',month:7,mean:'29.9°C',high:'34.8°C',low:'26.6°C'},
      {city:'타이베이',id:'taipei',month:11,mean:'21.9°C',high:'24.8°C',low:'19.7°C'},
      {city:'가오슝',id:'kaohsiung',month:1,mean:'19.7°C',high:'24.2°C',low:'16.2°C'},
      {city:'가오슝',id:'kaohsiung',month:7,mean:'29.4°C',high:'32.7°C',low:'26.7°C'},
      {city:'타이베이',id:'taipei',month:12,mean:'18.2°C',high:'21.0°C',low:'16.0°C',cross:true},
      {city:'오사카',id:'osaka',country:'일본',month:11,mean:'14.2°C'},
    ]) {
      await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});
      await wait(`!!document.querySelector('#trip-setup')`);
      await clickText('#pmb-all-countries button',test.country??'대만');
      await clickText('#pmb-setup-city-results button',test.city);
      const mm=String(test.month).padStart(2,'0');
      await setDate('departureDate',`2099-${mm}-${test.cross?'29':'10'}`);
      await setDate('returnDate',test.cross?'2100-01-03':`2099-${mm}-15`);
      await evaluate(`document.querySelector('input[name="travelPurpose"][value="sightseeing"]').click()`);await sleep(50);
      await evaluate(`document.querySelector('input[name="baggageType"][value="checked"]').click()`);await sleep(50);
      await evaluate(`document.querySelector('#trip-setup form').requestSubmit()`);
      await wait(`!!document.querySelector('.pmb-trip-brief-temperature-value')`);
      const card=await evaluate(`(()=>{const g=document.querySelector('.pmb-trip-brief-grid'),card=g.querySelector('[data-topic="weather"]');return {text:card.innerText,values:[...card.querySelectorAll('.pmb-trip-brief-temperature-value')].map(e=>e.innerText),font:getComputedStyle(card.querySelector('strong.pmb-trip-brief-temperature-value')).fontSize,heights:[...g.children].map(e=>e.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth,body:document.body.innerText};})()`);
      assert.equal(card.values[0],test.mean);
      assert.equal(card.font,width===1440?'34px':'30px');assert.equal(card.overflow,false);
      if(width===1440) assert.ok(card.heights.every(h=>Math.abs(h-card.heights[0])<1));
      if(!test.country) assert.match(card.body,/TWD/);
      await evaluate(`document.querySelector('.pmb-trip-brief-card[data-topic="weather"]').click()`);
      await wait(`!!document.querySelector('dialog[open] #pmb-weather-panel')`);
      if(width===390) await evaluate(`document.querySelectorAll('dialog details').forEach(e=>e.open=true)`);
      const modal=await evaluate(`document.querySelector('dialog').innerText`);
      assert.equal(await evaluate(`(()=>{const e=document.querySelector('dialog');return e.scrollWidth>e.clientWidth+1;})()`),false,'Modal horizontal overflow');
      for(const value of [test.mean,test.high,test.low].filter(Boolean)) assert.ok(modal.includes(value),value+' missing in modal');
      if(!test.country) {assert.match(modal,/1991–2020/);assert.match(modal,/CWA/);assert.match(modal,/공식 기후자료를 바탕으로 PACK MY BAG/);}
      assert.match(modal,/실제 여행 날짜의 날씨와 다를 수 있습니다/);
      if(test.cross) {
        await clickText('dialog .pmb-guide-months button','2100년 1월');
        await wait(`document.querySelector('dialog').innerText.includes('16.4°C')`);
        assert.deepEqual(card.values,['18.2°C','16.4°C']);
      }
      const clothingIds=await evaluate(`[...document.querySelectorAll('dialog [data-checklist-item-id]')].map(e=>e.dataset.checklistItemId)`);
      assert.equal(new Set(clothingIds).size,clothingIds.length);
      await evaluate(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);
      await wait(`!document.querySelector('dialog[open]')`);
      const checklist=await evaluate(`[...document.querySelectorAll('input[type="checkbox"]')].map(e=>({id:e.closest('[data-item-id]')?.dataset.itemId??'',text:e.closest('label')?.textContent??e.parentElement.textContent}))`);
      for(const itemId of clothingIds) assert.ok(checklist.some(item=>item.id.includes(itemId)),`Missing checklist: ${itemId}`);
      if(test.id==='taipei' && test.month===11) {
        await evaluate(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'center'})`);await sleep(100);
        const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/taipei-nov-${width}.png`,Buffer.from(shot.data,'base64'));
        await evaluate(`document.querySelector('.pmb-trip-brief-card[data-topic="weather"]').click()`);await wait(`!!document.querySelector('dialog[open]')`);
        const detail=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/taipei-nov-modal-${width}.png`,Buffer.from(detail.data,'base64'));
        await evaluate(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
        await evaluate(`(()=>{const e=document.querySelector('input[type="checkbox"]');if(!e.checked)e.click();})()`);await sleep(100);
        const checkedId=await evaluate(`document.querySelector('input[type="checkbox"]').closest('[data-item-id]').dataset.itemId`);
        const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});
        await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);
        assert.equal(await evaluate(`document.querySelector('[data-item-id="${checkedId}"] input').checked`),true);
      }
      report.push({width,city:test.id,month:test.month,cross:!!test.cross,values:card.values,font:card.font,heights:card.heights,overflow:card.overflow,clothingIds,passed:true});
      console.log('PASS',width,test.id,test.month);
    }
  }
  assert.deepEqual(errors,[]);
  const external=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({report,errors,externalRequests:external},null,2)+'\n');
  console.log('Completed',report.length,'flows; external requests:',external);
  await cdp('Browser.close');
} finally { if(ws?.readyState===WebSocket.OPEN) { ws.send(JSON.stringify({id:999999,method:'Browser.close'})); await sleep(150); } ws?.close();chrome.kill(); }
