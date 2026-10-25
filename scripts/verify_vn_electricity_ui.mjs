// Local browser checks; requires Vite on 127.0.0.1:5173 and installed Chrome.
import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const output='docs/verification/vn-electricity';mkdirSync(output,{recursive:true});
const browser = launchQaBrowser({ port: 9231, profile: 'vn-electricity-ui-browser' });
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try {
  let targets;for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9231/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  for(const width of [1440,390,320]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});
    for(const [city,id,mean] of [['하노이','hanoi','22.8°C'],['다낭','danang','24.9°C'],['나트랑','nhatrang','26.2°C'],['푸꾸옥','phuquoc','27.8°C']]){
      await cdp('Page.navigate',{url:'http://127.0.0.1:5173/implementation/workspace'});await wait(`!!document.querySelector('#trip-setup')`);
      await click('#pmb-all-countries button','베트남');await click('#pmb-setup-city-results button',city);
      for(const [name,value] of [['departureDate','2027-11-10'],['returnDate','2027-11-15']]){await js(`(()=>{const e=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);}
      await js(`document.querySelector('input[name=travelPurpose][value=sightseeing]').click()`);await sleep(60);await js(`document.querySelector('input[name=baggageType][value=checked]').click()`);await sleep(60);
      await js(`document.querySelector('#trip-setup form').requestSubmit()`);await wait(`!!document.querySelector('.pmb-trip-brief')`);
      assert.equal(await js(`document.querySelector('[data-topic=electricity] .pmb-trip-brief-summary').innerText`),'220V · 50Hz');
      assert.equal(await js(`document.querySelector('.pmb-trip-brief-temperature-value').innerText`),mean);
      assert.deepEqual(await js(`[...document.querySelectorAll('[data-topic=electricity] .pmb-plug-mini>span>span:first-of-type')].map(e=>e.innerText)`),['TYPE C','TYPE A']);
      const card=await js(`document.querySelector('[data-topic=electricity]').innerText`);for(const term of ['Type C / A','둥근 2핀','납작한 2핀','숙소에 따라'])assert.ok(card.includes(term),term);
      const geometry=await js(`(()=>{const e=document.querySelector('[data-topic=electricity]'),r=e.getBoundingClientRect(),g=e.querySelector('.pmb-plug-mini').getBoundingClientRect();return {center:Math.abs((r.left+r.right-g.left-g.right)/2),overflow:document.documentElement.scrollWidth>innerWidth,heights:[...document.querySelector('.pmb-trip-brief-grid').children].map(e=>e.getBoundingClientRect().height),widths:[...e.querySelectorAll('.pmb-plug-mini svg')].map(e=>e.getBoundingClientRect().width)};})()`);
      assert.ok(geometry.center<1);assert.equal(geometry.overflow,false);assert.ok(geometry.widths.every(w=>w>=(width>768?100:80)));if(width>768)assert.ok(geometry.heights.every(h=>Math.abs(h-geometry.heights[0])<1));
      const adapter='[data-item-id="electronic:travel-adapter"]';assert.equal(await js(`document.querySelectorAll('${adapter}').length`),1);assert.match(await js(`document.querySelector('${adapter}').innerText`),/준비 권장/);
      await js(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'center'})`);await sleep(80);if(id==='danang'){const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/card-${width}.png`,Buffer.from(shot.data,'base64'));}
      await js(`document.querySelector('[data-topic=electricity]').click()`);await wait(`!!document.querySelector('.pmb-electricity-packing')`);
      const text=await js(`document.querySelector('#pmb-guide-electricity').textContent`);for(const term of ['INPUT 100–240V, 50/60Hz','220V·60Hz 전용','제조사 확인','허용 전력','Type F','Type D','접지가 유지되는','챙길 준비물','필수 준비물은 아닙니다'])assert.ok(text.includes(term),term);assert.ok(!text.includes('JNTO'));
      assert.deepEqual(await js(`[...document.querySelectorAll('dialog [data-plug-kind]')].map(e=>e.dataset.plugKind)`),['C','A']);
      await js(`document.querySelectorAll('#pmb-guide-electricity details').forEach(e=>e.open=true)`);
      assert.equal(await js(`document.querySelectorAll('#pmb-guide-electricity .pmb-guide-sources a').length`),3);
      assert.equal(await js(`(()=>{const d=document.querySelector('dialog');return d.scrollWidth>d.clientWidth+1;})()`),false);
      if(id==='danang'){await js(`document.querySelector('.pmb-electricity-packing').scrollIntoView({block:'center'})`);const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(`${output}/packing-${width}.png`,Buffer.from(shot.data,'base64'));}
      await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
      await js(`(()=>{const e=document.querySelector('${adapter} input');if(!e.checked)e.click();})()`);await sleep(100);
      const loaded=new Promise(resolve=>{const listener=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',listener);resolve();}};ws.addEventListener('message',listener);});await cdp('Page.reload');await loaded;await wait(`!!document.querySelector('.pmb-trip-brief')`);assert.equal(await js(`document.querySelector('${adapter} input').checked`),true);
      if(id==='danang'){
        await js(`document.querySelector('${adapter} input').click()`);assert.equal(await js(`document.querySelector('${adapter} input').checked`),false);
        await js(`document.querySelector('.pmb-pack-less-entry-actions button').click()`);
        for(const [name,value] of [['accommodationAmenities','unknown'],['laundryPlan','no'],['shoppingPlan','no']]){await js(`document.querySelector('input[name="pack-less-${name}"][value="${value}"]').click()`);await sleep(60);}
        await click('#pmb-pack-less-editor button','답변으로 제안 보기');await js(`document.querySelectorAll('#pmb-pack-less-editor details').forEach(e=>e.open=true)`);
        await js(`(()=>{const e=document.querySelector('[data-suggestion-id="electronic:travel-adapter"] select');e.value='exclude';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(60);await click('#pmb-pack-less-editor button','MY BAG에 적용하기');
        assert.equal(await js(`!!document.querySelector('${adapter}')`),false);assert.match(await js(`document.querySelector('.pmb-bag-excluded').textContent`),/여행용 변환 어댑터/);
        await js(`document.querySelector('.pmb-bag-excluded button').click()`);await wait(`!!document.querySelector('${adapter}')`);
      }
      results.push({width,city:id,geometry,adapter:true,passed:true});console.log('PASS',width,id);
    }
  }
  assert.deepEqual(errors,[]);const externalRequests=[...new Set(requests.filter(u=>!u.startsWith('http://127.0.0.1:5173/')&&!u.startsWith('data:')))];assert.deepEqual(externalRequests,[]);writeFileSync(`${output}/ui-results.json`,JSON.stringify({results,errors,externalRequests},null,2)+'\n');await cdp('Browser.close');
}finally{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(150);}ws?.close();browser.kill();}
