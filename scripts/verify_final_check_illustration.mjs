import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadTs } from '../tests/helpers/load-ts.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('node_modules/.cache/ios-browser-tools/browsers');
const { webkit,chromium }=await import('../node_modules/.cache/ios-browser-tools/node_modules/playwright/index.mjs');
const {tripKey}=await loadTs('src/service/trip/trip.ts');
const output='docs/verification/final-check-illustration';fs.mkdirSync(output,{recursive:true});
const results=[],errors=[];
for(const engine of ['chrome','webkit']){
  const browser=await(engine==='chrome'?chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}):webkit.launch());
  try{for(const width of [1920,1440,1280,1024,820,768,430,390,375,360,320]){
    const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await p.goto('http://127.0.0.1:5173/implementation');await p.evaluate(({key,trip})=>localStorage.setItem(key,JSON.stringify(trip)),{key:tripKey,trip:{countryId:'JP',cityId:'osaka',departureDate:'2026-11-09',returnDate:'2026-11-17',travelPurpose:'sightseeing',baggageType:'checked'}});
    await p.goto('http://127.0.0.1:5173/implementation/workspace?view=bag');await p.locator('.pmb-final-cta').waitFor();
    const measure=()=>p.locator('.pmb-final-cta').evaluate(e=>{const r=e.getBoundingClientRect(),button=e.querySelector('#pmb-last-minute-entry'),art=e.querySelector('.pmb-final-cta-art'),b=button.getBoundingClientRect(),a=art.getBoundingClientRect();return {height:r.height,sectionWidth:r.width,buttonWidth:b.width,artVisible:getComputedStyle(art).display!=='none',overlap:a.width>0&&b.right>a.left,overflow:document.documentElement.scrollWidth>innerWidth+1,copy:e.querySelector('div').textContent,button:button.textContent,ariaHidden:art.getAttribute('aria-hidden')};});
    const current=await measure();
    // Recreate the previous one-column layout without changing any content.
    const old=await p.addStyleTag({content:'.pmb-final-cta{grid-template-columns:minmax(0,1fr)!important}.pmb-final-cta-art{display:none!important}'});const previous=await measure();await old.evaluate(e=>e.remove());
    assert.equal(current.copy,previous.copy);assert.equal(current.button,previous.button);assert.equal(current.overflow,false);assert.equal(current.overlap,false);assert.equal(current.ariaHidden,'true');assert.equal(current.artVisible,width>768);assert.ok(current.height<=previous.height+1,'section must not grow');assert.ok(Math.abs(current.buttonWidth-previous.buttonWidth)<1,'CTA width unchanged');
    await p.locator('.pmb-final-cta').scrollIntoViewIfNeeded();await p.locator('.pmb-final-cta').screenshot({path:`${output}/${engine}-${width}.png`});
    await p.locator('#pmb-last-minute-entry').click();await p.locator('.pmb-final-confirm').waitFor();await p.locator('.pmb-final-confirm button').filter({hasText:'마지막 점검으로 이동'}).click();await p.locator('.pmb-last-call').waitFor();
    results.push({engine,width,...current,previousHeight:previous.height,ctaFlow:'PASS'});await c.close();console.log('PASS illustration',engine,width);
  }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(output+'/results.json',JSON.stringify({results,errors,actualMobileDevice:'NOT TESTED'},null,2));
