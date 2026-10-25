// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/electronics';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9226, profile: 'electronics-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9226/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  const results=[];let baseline;
  for(const [width,country,city,baggage] of [[1440,'일본','오사카','checked'],[390,'대만','타이베이','cabin-only'],[320,'일본','오사카','checked']]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
    await click('#pmb-all-countries button',country);await click('#pmb-setup-city-results button',city);
    for(const [name,value] of [['departureDate','2099-11-10'],['returnDate','2099-11-15']]) {
      await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);
    }
    await js(`document.querySelector('input[name="travelPurpose"][value="sightseeing"]').click()`);await sleep(60);
    await js(`document.querySelector('input[name="baggageType"][value="${baggage}"]').click()`);await sleep(60);
    await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
    await js(`document.querySelector('.pmb-trip-brief-card[data-topic="baggage"]').click()`);await wait(`!!document.querySelector('dialog[open] #pmb-baggage-trigger-electronics')`);
    await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('.pmb-electronics-guidance')`);
    assert.equal(await js(`document.querySelector('#pmb-baggage-detail-panel h3').textContent`),'전자기기 · 항공 반입 안내');
    const cards=await js(`[...document.querySelectorAll('[data-battery-kind]')].map(e=>({id:e.dataset.batteryKind,text:e.innerText}))`);
    assert.deepEqual(cards.map(c=>c.id),['installed-devices','power-banks-spares','special-devices']);
    assert.match(cards[0].text,/기내 휴대 권장/);assert.match(cards[1].text,/기내만 가능/);assert.match(cards[1].text,/위탁 금지/);assert.match(cards[2].text,/별도 규정 확인/);
    assert.equal(await js(`document.querySelector('.pmb-electronics-additional').open`),false);
    const mainText=cards.map(c=>c.text).join(' ');if(baseline)assert.equal(mainText,baseline);else baseline=mainText;
    const sourceInfo=await js(`[...document.querySelectorAll('.pmb-electronics-sources li')].map(e=>e.innerText)`);
    assert.equal(sourceInfo.length,3);assert.ok(sourceInfo.every(s=>s.includes('2026-10-25')));
    const geometry=await js(`(()=>{const e=document.querySelector('dialog');return {pageOverflow:document.documentElement.scrollWidth>innerWidth,modalOverflow:e.scrollWidth>e.clientWidth+1,cardsOverflow:[...document.querySelectorAll('[data-battery-kind]')].some(e=>e.scrollWidth>e.clientWidth+1)};})()`);
    assert.deepEqual(geometry,{pageOverflow:false,modalOverflow:false,cardsOverflow:false});
    await js(`(()=>{const d=document.querySelector('dialog'),p=document.querySelector('#pmb-baggage-detail-panel');d.scrollTop+=p.getBoundingClientRect().top-d.getBoundingClientRect().top-80;})()`);await sleep(100);
    const screenshot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/electronics-${width}.png`,Buffer.from(screenshot.data,'base64'));
    await js(`document.querySelector('.pmb-electronics-additional summary').click()`);
    assert.equal(await js(`document.querySelector('.pmb-electronics-additional').open`),true);
    const expanded=await js(`document.querySelector('.pmb-electronics-additional').innerText`);
    assert.match(expanded,/100Wh 超過|100Wh 초과~160Wh/);assert.match(expanded,/IATA 2026/);assert.match(expanded,/2026-04-20/);assert.match(expanded,/승인만 받으면 항상 허용된다는 뜻은 아닙니다/);
    await js(`document.querySelector('#pmb-baggage-detail-panel header button').click()`);
    assert.equal(await js(`document.activeElement.id`),'pmb-baggage-trigger-electronics');
    await js(`document.querySelector('#pmb-baggage-trigger-power-banks').click()`);
    assert.doesNotMatch(await js(`document.querySelector('#pmb-baggage-trigger-power-banks').innerText`),/각 160Wh 이하/);
    await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    await js(`document.querySelector('.pmb-red-flags-action button').click()`);await wait(`!!document.querySelector('.pmb-red-flags-tabs')`);
    await click('.pmb-red-flags-tabs button','항공 반입 준비');await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('.pmb-electronics-guidance')`);
    assert.deepEqual(await js(`[...document.querySelectorAll('[data-battery-kind]')].map(e=>e.dataset.batteryKind)`),cards.map(c=>c.id));
    await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
    await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace?view=last-minute'});await wait(`!!document.querySelector('.pmb-last-call')`);
    assert.match(await js(`document.querySelector('.pmb-last-call').innerText`),/LAST MINUTE BAG/);
    results.push({width,country,city,baggage,cards:cards.map(c=>c.id),sourceInfo,geometry,sharedRedFlags:true,lastMinute:true,passed:true});console.log('PASS',width,country,baggage);
  }
  assert.deepEqual(errors,[]);
  const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({results,errors,externalRequests},null,2)+'\n');
  await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
