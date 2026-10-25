// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/tw-electricity';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9227, profile: 'tw-electricity-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9227/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  for(const width of [1440,390]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    for(const [country,city,id,expected] of [
      ['대만','타이베이','taipei','110V · 60Hz'],['대만','가오슝','kaohsiung','110V · 60Hz'],
      ['일본','오사카','osaka','100V · Type A'],['미국','뉴욕','new-york','110–120V · 60Hz · 2핀 또는 3핀'],
      ['호주','시드니','sydney','220–240V · 50Hz · 역 V자 평핀 호주형'],
    ]) {
      await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
      await click('#pmb-all-countries button',country);await click('#pmb-setup-city-results button',city);
      for(const [name,value] of [['departureDate','2099-11-10'],['returnDate','2099-11-15']]) {
        await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);
      }
      await js(`document.querySelector('input[name="travelPurpose"][value="sightseeing"]').click()`);await sleep(60);
      await js(`document.querySelector('input[name="baggageType"][value="checked"]').click()`);await sleep(60);
      await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
      const main=await js(`document.querySelector('[data-topic="electricity"] .pmb-trip-brief-summary').innerText`);
      assert.equal(main,expected);
      const geometry=await js(`(()=>{const g=document.querySelector('.pmb-trip-brief-grid');return {heights:[...g.children].map(e=>e.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth};})()`);
      assert.equal(geometry.overflow,false);if(width===1440)assert.ok(geometry.heights.every(h=>Math.abs(h-geometry.heights[0])<1));
      if(country==='대만') {
        assert.equal(await js(`document.querySelector('[data-topic="electricity"] .pmb-trip-brief-card-note').innerText`),'Type A / B · 변환 어댑터 준비');
        await js(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'center'})`);await sleep(100);
        if(id==='taipei') {const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/taipei-card-${width}.png`,Buffer.from(shot.data,'base64'));}
      }
      await js(`document.querySelector('.pmb-trip-brief-card[data-topic="electricity"]').click()`);await wait(`!!document.querySelector('dialog[open] #pmb-guide-electricity')`);
      const text=await js(`document.querySelector('#pmb-guide-electricity').textContent`);
      if(country==='대만') {
        for(const term of ['110V · 60Hz','Type A / Type B','변환 어댑터','INPUT 100–240V','60Hz','220V 전용','변압기','일부 건물','전압 표시','전압·주파수'])assert.ok(text.includes(term),term);
        assert.ok(!text.includes('일본'));assert.ok(!text.includes('자료는 아직 준비 중'));
        await js(`document.querySelectorAll('#pmb-guide-electricity details').forEach(e=>e.open=true)`);
        const links=await js(`[...document.querySelectorAll('#pmb-guide-electricity .pmb-guide-sources a')].map(e=>e.href)`);
        assert.equal(links.length,2);assert.ok(links.every(h=>/taiwantour\.or\.kr|travel\.tycg\.gov\.tw/.test(h)));
        assert.match(await js(`document.querySelector('#pmb-guide-electricity .pmb-guide-sources').innerText`),/2026-10-25/);
        if(id==='taipei'){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/taipei-modal-${width}.png`,Buffer.from(shot.data,'base64'));}
      } else if(country==='일본') {assert.match(text,/100V/);assert.match(text,/50 \/ 60Hz/);} else assert.ok(text.includes(expected));
      assert.equal(await js(`(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;})()`),false);
      await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
      if(country==='대만') {
        await js(`(()=>{const e=document.querySelector('li[data-item-id="essential:passport"] input');if(!e.checked)e.click();})()`);await sleep(100);
        const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});
        await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);
        assert.equal(await js(`document.querySelector('[data-topic="electricity"] .pmb-trip-brief-summary').innerText`),expected);
        assert.equal(await js(`document.querySelector('li[data-item-id="essential:passport"] input').checked`),true);
        await js(`document.querySelector('[data-topic="baggage"]').click()`);await wait(`!!document.querySelector('#pmb-baggage-trigger-electronics')`);
        await js(`document.querySelector('#pmb-baggage-trigger-electronics').click()`);await wait(`!!document.querySelector('.pmb-electronics-guidance')`);
        assert.match(await js(`document.querySelector('.pmb-electronics-guidance').innerText`),/기내 휴대 권장/);
        assert.equal(await js(`document.querySelectorAll('[data-battery-kind]').length`),3);
        await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
      }
      results.push({width,country,city:id,main,geometry,passed:true});console.log('PASS',width,id);
    }
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);
  writeFileSync(`${output}/ui-results.json`,JSON.stringify({results,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
