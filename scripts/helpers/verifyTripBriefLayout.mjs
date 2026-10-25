import { launchQaBrowser } from '../qaBrowser.mjs';
import { loadTs } from '../../tests/helpers/load-ts.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
export async function verifyTripBriefLayout({ name, port, profile, shrinkDesktop = false, scalePlugs = false }) {
const origin = 'http://127.0.0.1:5173', output = `docs/verification/${name}/${process.env.QA_PHASE??'after'}`;
fs.mkdirSync(output, { recursive:true });
const { tripKey } = await loadTs('src/service/trip/trip.ts');
const { baggageRules } = await loadTs('src/service/data/baggageRules.ts');
const browser = launchQaBrowser({ port, profile });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
const errors=[], consoleErrors=[], failedRequests=[], layouts=[];
try {
  let targets;
  for(let i=0;i<80;i++){try{targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break;}catch{}await sleep(100);}
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
  for(const width of [1920,1440,1280,1024,820,768,430,390,360]){
    await setWidth(width);
    for(const [countryId,cityId]of [['JP','osaka'],['US','new-york']]){
      const trip=tripFor(countryId,cityId,11);await openTrip(trip);await js(`document.querySelector('.pmb-trip-brief').scrollIntoView({block:'start'})`);await sleep(100);
      const g=await js(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};const cards=[...document.querySelectorAll('.pmb-trip-brief-card')];return {overflow:document.documentElement.scrollWidth>innerWidth+1,cards:cards.map(e=>({topic:e.dataset.topic,...rect(e),footer:rect(e.querySelector('.pmb-trip-brief-more')).bottom,overflow:e.scrollWidth>e.clientWidth+1,text:e.textContent})),plugs:[...document.querySelectorAll('.pmb-plug-mini svg')].map(e=>({...rect(e),viewBox:e.getAttribute('viewBox')})),plugLabels:[...document.querySelectorAll('.pmb-plug-mini>span>span:last-child')].map(e=>e.textContent),comparisonVisible:document.querySelector('[data-topic=baggage] .pmb-baggage-comparison').checkVisibility(),rangeVisible:!!document.querySelector('[data-weather-range]')?.checkVisibility(),weatherMean:document.querySelector('[data-weather-mean]').textContent};})()`);
      assert.equal(g.overflow,false);assert.ok(g.cards.every(c=>!c.overflow));
      if(width>640)for(const a of g.cards)for(const b of g.cards.filter(b=>Math.abs(b.top-a.top)<1)){assert.ok(Math.abs(a.height-b.height)<1);assert.ok(Math.abs(a.footer-b.footer)<1);}
      if(width<=640){assert.equal(g.comparisonVisible,false);assert.equal(g.rangeVisible,false);}
      if(countryId==='US')assert.deepEqual(g.plugLabels,['TYPE A','TYPE B']);
      if(process.env.QA_PHASE!=='before'){
        const before=JSON.parse(fs.readFileSync(`docs/verification/${name}/before/results.json`)).layouts.find(r=>r.width===width&&r.cityId===cityId);
        if(shrinkDesktop){if(width>=1024)assert.ok(g.cards.every((c,i)=>c.height<before.cards[i].height),'desktop cards must shrink');}
        else assert.ok(g.cards.every((c,i)=>c.height<=before.cards[i].height+1),'cards must not grow at any width');
        if(width<=640)assert.ok(g.cards.every((c,i)=>c.height<=before.cards[i].height+1),'mobile must not grow');
        if(scalePlugs){if(width>640)for(let i=0;i<g.plugs.length;i++)assert.ok(g.plugs[i].height<=before.plugs[i].height*0.85+1&&g.plugs[i].height>=before.plugs[i].height*0.79-1,'15?20% smaller plug');}
        else assert.deepEqual(g.plugs.map(p=>p.height),before.plugs.map(p=>p.height));
        assert.equal(g.weatherMean,before.weatherMean);assert.deepEqual(g.plugLabels,before.plugLabels);
      }
      await shot(`${cityId}-${width}`);
      for(const topic of ['weather','electricity','baggage']){
        await js(`document.querySelector('[data-topic=${topic}]').click()`);await wait(`!!document.querySelector('dialog[open]')`);
        if(topic==='baggage'){
          await js(`document.querySelector('#pmb-baggage-trigger-power-banks').click()`);await wait(`!!document.querySelector('#pmb-baggage-detail-panel:not([hidden])')`);
          const power=baggageRules.find(r=>r.id==='power-banks'),text=await js(`document.querySelector('#pmb-baggage-detail-panel').textContent`);for(const line of power.details.value)assert.ok(text.includes(line));
          await js(`document.querySelector('#pmb-baggage-trigger-liquids-gels').click()`);await sleep(50);const liquid=baggageRules.find(r=>r.id==='liquids-gels'),t=await js(`document.querySelector('#pmb-baggage-detail-panel').textContent`);for(const line of liquid.details.value)assert.ok(t.includes(line));
        }
        assert.equal(await js(`document.querySelector('dialog').scrollWidth>document.querySelector('dialog').clientWidth+1`),false);
        await js(`document.querySelector('dialog .pmb-brief-modal-header button').click()`);await wait(`!document.querySelector('dialog[open]')`);
      }
      layouts.push({width,countryId,cityId,...g,status:'PASS'});fs.writeFileSync(output+'/results.json',JSON.stringify({layouts,errors,consoleErrors,failedRequests},null,2));
    }
    console.log('PASS density',process.env.QA_PHASE??'after',width);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedRequests,[]);await cdp('Browser.close');
}finally{ws?.close();browser.kill();}

}
