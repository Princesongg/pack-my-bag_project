import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {loadTs} from '../tests/helpers/load-ts.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('node_modules/.cache/ios-browser-tools/browsers');
const {chromium,webkit}=await import('../node_modules/.cache/ios-browser-tools/node_modules/playwright/index.mjs');
const {tripKey}=await loadTs('src/service/trip/trip.ts');const {destinations}=await loadTs('src/service/destination/destinations.ts');
const output='docs/verification/last-call-ticket';fs.mkdirSync(output,{recursive:true});const results=[],errors=[];
for(const engine of ['chrome','webkit']){
  const browser=await(engine==='chrome'?chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}):webkit.launch());
  try{for(const width of [1920,1440,1280,1024,820,768,430,390,375,360,320]){
    const c=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.goto('http://127.0.0.1:5173/implementation');
    for(const [countryId,cityId,date]of [['JP','osaka','2026-11-09'],['US','los-angeles','2027-01-10']]){
      const trip={countryId,cityId,departureDate:date,returnDate:date.slice(0,8)+(countryId==='JP'?'17':'18'),travelPurpose:'sightseeing',baggageType:'checked'};
      await p.evaluate(({key,trip})=>localStorage.setItem(key,JSON.stringify(trip)),{key:tripKey,trip});await p.goto('http://127.0.0.1:5173/implementation/workspace?view=last-minute');await p.locator('.pmb-last-call-ticket').waitFor();
      const country=destinations.find(c=>c.id===countryId),city=country.cities.find(c=>c.id===cityId);
      assert.equal(await p.locator('.pmb-last-call-destination h2').textContent(),city.english.toUpperCase());assert.equal(await p.locator('.pmb-last-call-destination p').textContent(),`${countryId} · ${country.name} · ${city.name}`);
      assert.equal(await p.locator('.pmb-travel-pass-stub dd').nth(0).textContent(),date.replaceAll('-','.'));assert.match(await p.locator('.pmb-travel-pass-stub dd').nth(1).textContent(),/8박 9일/);
      const g=await p.locator('.pmb-last-call-ticket').evaluate(e=>{const d=e.querySelector('dl'),r=e.getBoundingClientRect(),s=getComputedStyle(d),before=getComputedStyle(d,'::before'),after=getComputedStyle(d,'::after');return {height:r.height,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth+1,internalOverflow:e.scrollWidth>e.clientWidth+1,stubBorderLeft:s.borderLeftStyle,stubBorderTop:s.borderTopStyle,notches:{before:{top:before.top,left:before.left,bottom:before.bottom},after:{top:after.top,left:after.left,right:after.right,bottom:after.bottom}},barcodeHidden:e.querySelector('.pmb-travel-pass-barcode').getAttribute('aria-hidden'),text:e.textContent};});
      assert.equal(g.overflow,false);assert.equal(g.internalOverflow,false);assert.equal(g.barcodeHidden,'true');assert.ok(g.text.includes('실제 항공권이 아닙니다'));assert.equal(width<=768?g.stubBorderTop:g.stubBorderLeft,'dashed');if(width<=768)assert.equal(g.notches.before.top,g.notches.after.top);else assert.equal(g.notches.before.left,g.notches.after.left);
      // Measure the previous ticket's markup/styles in the same browser context.
      const html=await p.locator('.pmb-last-call-ticket').innerHTML();
      const style=await p.addStyleTag({content:fs.readFileSync('node_modules/.cache/last-call-ticket-before/LastMinuteScreen.css','utf8')+'.pmb-last-call-ticket dt,.pmb-last-call-ticket dd{line-height:inherit}'});
      await p.locator('.pmb-last-call-ticket').evaluate((e,x)=>{e.innerHTML=`<div class="pmb-last-call-destination"><span>YOUR TRIP</span><h2>${x.city}</h2><p>${x.country}</p></div><dl><div><dt>출발일</dt><dd>${x.date}</dd></div><div><dt>여행 기간</dt><dd>8박 9일</dd></div></dl>`;},{city:city.english.toUpperCase(),country:country.name+' · '+city.name,date:date.replaceAll('-','.')});
      const previousHeight=await p.locator('.pmb-last-call-ticket').evaluate(e=>e.getBoundingClientRect().height);
      await style.evaluate(e=>e.remove());await p.locator('.pmb-last-call-ticket').evaluate((e,html)=>e.innerHTML=html,html);
      console.log('height',width,cityId,previousHeight,g.height);assert.ok(g.height<previousHeight+45,'ticket must remain compact');await p.locator('.pmb-last-call-ticket').screenshot({path:`${output}/${engine}-${width}-${cityId}.png`});
      if(cityId==='osaka'&&[1440,390].includes(width)){
        const inputs=p.locator('input[data-last-minute-id]'),count=await inputs.count();assert.ok(count>0);
        for(let i=0;i<count;i++)await inputs.nth(i).check();await p.locator('.is-complete .pmb-final-message').waitFor();assert.match(await p.locator('.pmb-final-message').textContent(),/ALL SET/);
        await p.reload();await p.locator('.is-complete').waitFor();assert.equal(await p.locator('.is-flying').count(),0);
      }
      results.push({engine,viewportWidth:width,cityId,...g,previousHeight});
    }
    await c.close();console.log('PASS ticket',engine,width);
  }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors,actualIOS:'NOT TESTED'},null,2));
