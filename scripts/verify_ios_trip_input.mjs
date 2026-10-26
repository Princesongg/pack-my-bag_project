// Optional QA-only install: npm install --prefix node_modules/.cache/ios-browser-tools playwright
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('node_modules/.cache/ios-browser-tools/browsers');
const {webkit,chromium}=await import('../node_modules/.cache/ios-browser-tools/node_modules/playwright/index.mjs');
const phase=process.env.QA_PHASE??'after', origin=process.env.QA_ORIGIN??'http://127.0.0.1:5173';
const output=`docs/verification/ios-trip-input/${phase}`;fs.mkdirSync(output,{recursive:true});
const results=[],errors=[],network=[];
for(const engine of ['webkit','chrome']){
  const browser=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}));
  try{for(const width of [1440,1280,1024,820,768,430,390,375,360,320]){
    const context=await browser.newContext({viewport:{width,height:900},isMobile:width<=430,hasTouch:width<=430,locale:'ko-KR',reducedMotion:'reduce'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,error:String(e)}));page.on('console',m=>{if(m.type()==='error')errors.push({engine,width,error:m.text()});});page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ABORTED'))network.push({engine,width,url:r.url(),error:r.failure()});});
    await page.goto(origin+'/implementation/workspace');await page.locator('#trip-setup').waitFor();
    const measure=()=>page.evaluate(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const inputs=[...document.querySelectorAll('.pmb-setup-date-grid input')];
      return {viewport:document.querySelector('meta[name=viewport]').content,overflow:document.documentElement.scrollWidth>innerWidth+1,header:{...rect(document.querySelector('.pmb-header')),position:getComputedStyle(document.querySelector('.pmb-header')).position},nav:[...document.querySelectorAll('.pmb-nav a')].map(e=>({...rect(e),text:e.textContent})),dates:inputs.map(e=>({...rect(e),font:getComputedStyle(e).fontSize,padding:getComputedStyle(e).padding,type:e.type,value:e.value,label:rect(e.closest('label').querySelector('span')),wrapper:rect(e.closest('label')),appearance:getComputedStyle(e).appearance})),feedback:rect(document.querySelector('.pmb-setup-date-feedback')),dateGrid:rect(document.querySelector('.pmb-setup-date-grid')),purpose:rect(document.querySelector('.pmb-setup-style-grid')),panel:rect(document.querySelector('#trip-setup')),formHeight:document.querySelector('#trip-setup form').getBoundingClientRect().height,visualViewport:visualViewport?{scale:visualViewport.scale,height:visualViewport.height,offsetTop:visualViewport.offsetTop}:null};
    });
    const empty=await measure();await page.screenshot({path:`${output}/${engine}-${width}-empty.png`,fullPage:true});
    await page.locator('#pmb-all-countries button').filter({hasText:'일본'}).click();await page.locator('#pmb-setup-city-results button').filter({hasText:'오사카'}).click();
    await page.locator('[name=departureDate]').fill('2026-11-09');await page.locator('[name=returnDate]').fill('2026-11-17');
    await page.locator('[name=returnDate]').blur();assert.match(await page.locator('.pmb-setup-duration').textContent(),/8박 9일/);
    const selected=await measure();await page.locator('.pmb-setup-date-grid').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/${engine}-${width}-dates.png`});
    await page.locator('.pmb-setup-chips label').filter({has:page.locator('input[name=travelPurpose][value=sightseeing]')}).click();
    await page.locator('.pmb-setup-chips label').filter({has:page.locator('input[name=baggageType][value=checked]')}).click();
    const submit=page.locator('.pmb-setup-submit button');await submit.scrollIntoViewIfNeeded();
    const hit=await submit.evaluate(e=>{const r=e.getBoundingClientRect(),target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===target||e.contains(target);});assert.equal(hit,true);
    if(phase==='after'){
      for(const g of [empty,selected]){
        assert.equal(g.overflow,false);assert.equal(g.header.position,'static');assert.ok(Math.abs(g.dates[0].height-g.dates[1].height)<1);
        for(const d of g.dates){assert.ok(d.height>=44&&d.height<=60);assert.ok(d.left>=g.panel.left&&d.right<=g.panel.right+1);assert.ok(d.top>=d.label.bottom-1);assert.ok(d.bottom<=d.wrapper.bottom+1);if(width<=640)assert.ok(parseFloat(d.font)>=16);}
        assert.ok(g.feedback.top>=g.dateGrid.bottom-1);assert.ok(g.purpose.top>=g.feedback.bottom-1);
        if(width<=430)assert.ok(g.dates[1].label.top>=g.dates[0].bottom-1);
      }
      const beforeFile=`docs/verification/ios-trip-input/before/results.json`;
      if(width>=768&&fs.existsSync(beforeFile)&&origin.startsWith('http://127.')){const b=JSON.parse(fs.readFileSync(beforeFile)).results.find(r=>r.engine===engine&&r.width===width);if(b)for(let i=0;i<2;i++){assert.ok(Math.abs(empty.dates[i].height-b.empty.dates[i].height)<1);assert.ok(Math.abs(empty.dates[i].width-b.empty.dates[i].width)<1);}}
    }
    await page.locator('.pmb-setup-submit button').click();await page.locator('.pmb-trip-brief').waitFor();await page.reload();await page.locator('.pmb-trip-brief').waitFor();
    results.push({engine,width,empty,selected,makeBagAndRestore:true,status:'PASS in tested desktop engine'});fs.writeFileSync(output+'/results.json',JSON.stringify({origin,phase,results,errors,network,actualIOS:'NOT TESTED'},null,2));
    await context.close();console.log('PASS',phase,engine,width);
  }}finally{await browser.close();}
}
if(phase==='after'){assert.deepEqual(errors,[]);assert.deepEqual(network,[]);}
