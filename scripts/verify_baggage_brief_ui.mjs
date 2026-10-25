import { launchQaBrowser } from './qaBrowser.mjs';
import { loadTs } from '../tests/helpers/load-ts.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:5173', output = 'docs/verification/baggage-brief';
fs.mkdirSync(output, { recursive:true });
const { destinations } = await loadTs('src/service/destination/destinations.ts');
const { tripKey } = await loadTs('src/service/trip/trip.ts');
const { baggageRules } = await loadTs('src/service/data/baggageRules.ts');
const { electronicsGuidance } = await loadTs('src/service/data/electronicsGuidance.ts');
const { bagStorageKey } = await loadTs('src/service/my-bag/bag.ts');
const { allowanceLabel } = await loadTs('src/service/my-bag/baggageAllowance.ts');
const browser = launchQaBrowser({ port:9283, profile:'baggage-brief-ui' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
const errors=[], consoleErrors=[], failedRequests=[], results=[], layouts=[];
try {
  let targets;
  for(let i=0;i<80;i++){try{targets=await(await fetch('http://127.0.0.1:9283/json')).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0; const pending=new Map();
  ws.addEventListener('message', event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(JSON.stringify(m.error))):p?.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value??a.description));if(m.method==='Network.loadingFailed'&&!m.params.canceled)failedRequests.push(m.params);});
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('CDP timeout '+method)),15000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});ws.send(JSON.stringify({id:n,method,params}));});
  const js=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  const wait=async expression=>{for(let n=0;n<150;n++){if(await js(expression))return;await sleep(40);}throw Error('Timeout '+expression);};
  const shot=async name=>{const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${output}/${name}.png`,Buffer.from(r.data,'base64'));};
  const setWidth=width=>cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=640});
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await setWidth(1440); await cdp('Page.navigate',{url:origin+'/implementation'}); await wait(`!!document.querySelector('.pmb-hero')`);
  const tripFor=(countryId,cityId,month)=>({countryId,cityId,departureDate:`2027-${String(month).padStart(2,'0')}-10`,returnDate:`2027-${String(month).padStart(2,'0')}-15`,travelPurpose:'sightseeing',baggageType:'checked'});
  const openTrip=async trip=>{
    await js(`localStorage.setItem(${JSON.stringify(tripKey)},${JSON.stringify(JSON.stringify(trip))})`);
    await cdp('Page.navigate',{url:origin+'/implementation/workspace?view=bag'});
    await wait(`!!document.querySelector('[data-weather-city="${trip.cityId}"][data-weather-month="${Number(trip.departureDate.slice(5,7))}"]')`);
  };
  const power=baggageRules.find(r=>r.id==='power-banks'),liquids=baggageRules.find(r=>r.id==='liquids-gels');
  const comparison=()=>js(`[...document.querySelectorAll('dialog .pmb-baggage-comparison-tile')].map(e=>e.textContent)`);
  const close=async()=>{await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);};
  for(const width of [1920,1440,1280,1024,820,768,641,430,390,375,360]){
    await setWidth(width); const trip=tripFor('JP','osaka',11);
    await js(`localStorage.removeItem(${JSON.stringify(bagStorageKey(trip))})`);await openTrip(trip);
    await js(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'start'})`);await sleep(100);
    assert.equal(await js(`document.querySelector('.pmb-baggage-power .pmb-status-summary').textContent`),power.summary.value.split(' · ').join(''));
    assert.ok(await js(`document.querySelector('.pmb-baggage-power>strong').textContent.includes('보조배터리')`));
    assert.equal(await js(`document.querySelectorAll('[data-topic=baggage] .pmb-status-badge').length`),2);
    assert.equal(await js(`!!document.querySelector('[data-topic=baggage] .pmb-trip-brief-allowance')`),false);
    assert.ok(await js(`document.querySelector('.pmb-baggage-footer-info').textContent.includes(${JSON.stringify(liquids.summary.value.replace('지퍼백','투명 지퍼백'))})`));
    const g=await js(`(()=>{const c=document.querySelector('[data-topic=baggage]'),comp=c.querySelector('.pmb-baggage-comparison');const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width}};return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,cardOverflow:c.scrollWidth>c.clientWidth+1,cards:[...document.querySelectorAll('.pmb-trip-brief-card')].map(e=>({...rect(e),footer:rect(e.querySelector('.pmb-trip-brief-more')).bottom,padding:getComputedStyle(e).padding})),comparisonVisible:comp.checkVisibility(),comparisonWidth:comp.getBoundingClientRect().width,columns:getComputedStyle(comp.querySelector('.pmb-baggage-comparison-grid')).gridTemplateColumns,tiles:[...comp.querySelectorAll('.pmb-baggage-comparison-tile')].map(e=>({...rect(e),overflow:e.scrollWidth>e.clientWidth+1})),cardText:c.textContent};})()`);
    assert.equal(g.overflow,false);assert.equal(g.cardOverflow,false);
    for(const a of g.cards)for(const b of g.cards.filter(b=>width>640&&Math.abs(a.top-b.top)<1)){assert.ok(Math.abs(a.height-b.height)<1);assert.ok(Math.abs(a.footer-b.footer)<1);assert.equal(a.padding,b.padding);}
    if(width>640){assert.equal(g.comparisonVisible,true);assert.equal(g.columns.split(' ').length,g.comparisonWidth<=250?1:2);if(g.comparisonWidth>250)assert.ok(Math.abs(g.tiles[0].height-g.tiles[1].height)<1);assert.ok(g.tiles.every(t=>!t.overflow));}
    else{assert.equal(g.comparisonVisible,false);assert.ok(g.cards[2].height<280);}
    await shot(`cards-${width}`);
    // The tile itself is part of the existing card button, with no nested controls.
    await js(`document.querySelector('[data-topic=baggage] .pmb-baggage-comparison-tile').click()`);await wait(`!!document.querySelector('#pmb-guide-baggage')`);
    const mini=await comparison();assert.equal(mini.length,2);assert.ok(mini[0].includes(electronicsGuidance.cards[1].title));assert.ok(mini[1].includes('항공권·운임별'));
    assert.equal(await js(`document.querySelector('dialog .pmb-baggage-comparison').checkVisibility()`),true);
    await js(`document.querySelector('#pmb-baggage-trigger-power-banks').click()`);await wait(`!!document.querySelector('#pmb-baggage-detail-panel:not([hidden])')`);
    const text=await js(`document.querySelector('#pmb-baggage-detail-panel').textContent`);
    for(const line of power.details.value)assert.ok(text.includes(line));
    assert.ok(await js(`document.querySelectorAll('#pmb-baggage-detail-panel .pmb-baggage-official-links a').length>0`));
    assert.equal(await js(`document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1`),false);
    await shot(`modal-${width}`);await js(`document.querySelector('#pmb-baggage-trigger-liquids-gels').click()`);await sleep(100);
    const liquidText=await js(`document.querySelector('#pmb-baggage-detail-panel').textContent`);for(const line of liquids.details.value)assert.ok(liquidText.includes(line));
    await js(`document.querySelectorAll('.pmb-baggage-tabs button')[1].click()`);await wait(`!!document.querySelector('.pmb-allowance')`);
    assert.ok(await js(`document.querySelector('.pmb-allowance').textContent.includes('항공사·노선·운임·좌석 등급')`));
    await close();layouts.push({...g,status:'PASS'});console.log('PASS baggage width',width);
  }
  // Existing user-recorded allowance must still save, reload, display and delete.
  await setWidth(390);const trip={...tripFor('AU','sydney',12),baggageType:'cabin-only'};await openTrip(trip);
  await js(`document.querySelector('[data-topic=baggage]').click()`);await wait(`!!document.querySelector('.pmb-baggage-tabs')`);await js(`document.querySelectorAll('.pmb-baggage-tabs button')[1].click()`);
  assert.ok(await js(`document.querySelector('.pmb-allowance-note').textContent.includes('기내수하물만')`));
  const fill=async(name,value)=>{await js(`(()=>{const e=document.querySelector('[name=${name}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(40);};
  await fill('allowanceAirline','QA Airline');await fill('allowancePieces','1');await fill('allowanceKg','23');await js(`document.querySelector('[name=allowanceConfirmed]').click();document.querySelector('.pmb-allowance form').requestSubmit()`);await sleep(100);await close();
  const expected=allowanceLabel({source:'user-confirmed-ticket',confirmed:true,airline:'QA Airline',system:'pieces',pieces:1,kgPerPiece:23});
  assert.ok(await js(`document.querySelector('[data-topic=baggage] .pmb-trip-brief-allowance').textContent.includes(${JSON.stringify(expected)})`));
  await openTrip(trip);assert.ok(await js(`document.querySelector('[data-topic=baggage] .pmb-trip-brief-allowance').textContent.includes('QA Airline')`));
  await js(`document.querySelector('[data-topic=baggage]').click()`);await wait(`!!document.querySelector('.pmb-baggage-tabs')`);await js(`document.querySelectorAll('.pmb-baggage-tabs button')[1].click()`);await js(`document.querySelector('.pmb-allowance-delete').click()`);await close();assert.equal(await js(`!!document.querySelector('[data-topic=baggage] .pmb-trip-brief-allowance')`),false);
  results.push({scenario:'cabin-only does not imply free allowance; save/reload/delete user record',status:'PASS'});
  // Every supported country retains the same existing general rules, with no invented allowance.
  for(const country of destinations){await openTrip(tripFor(country.id,country.cities[0].id,11));assert.ok(await js(`document.querySelector('.pmb-baggage-power').textContent.includes('한국 출발 기준')`));results.push({countryId:country.id,status:'PASS'});}
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedRequests,[]);
  fs.writeFileSync(output+'/browser.json',JSON.stringify({checkedAt:new Date().toISOString(),origin,results,layouts,errors,consoleErrors,failedRequests},null,2));await cdp('Browser.close');
}catch(error){fs.writeFileSync(output+'/failure.json',JSON.stringify({error:String(error.stack),results,layouts,errors,consoleErrors,failedRequests},null,2));throw error;}
finally{ws?.close();browser.kill();}
