import { launchQaBrowser } from './qaBrowser.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const dir = 'docs/verification/home-compact';
mkdirSync(dir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = launchQaBrowser({ port: 9274, profile: 'home-compact' });
let ws;
try {
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch('http://127.0.0.1:9274/json')).json(); break; } catch { await sleep(100); } }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id) { pending.get(m.id)?.(m.result); pending.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const js = async expression => (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await cdp('Page.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const results = [];
  for (const width of [1440, 1024, 820, 768, 680, 430, 390, 375, 360, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    for (let i = 0; i < 100; i++) { if (await js(`!!document.querySelector('.project-card')`)) break; await sleep(60); }
    await sleep(200);
    const result = await js(`(() => { const cards=[...document.querySelectorAll('.chapters .project-card')];return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.chapters .project-grid')).gridTemplateColumns,cards:cards.map(e=>{const r=e.getBoundingClientRect();return {height:r.height,top:r.top,href:e.getAttribute('href'),description:getComputedStyle(e.querySelector('.card-description-mobile')).display,issues:[...e.querySelectorAll('*')].filter(x=>x.checkVisibility()&&(x.getBoundingClientRect().right>r.right+1||x.getBoundingClientRect().left<r.left-1||x.scrollWidth>x.clientWidth+2&&getComputedStyle(x).display==='block')).map(x=>x.className)}})}})()`);
    assert.equal(result.overflow, false);
    assert.ok(result.cards.every(c => c.issues.length === 0));
    assert.equal(result.cards[0].height, result.cards[1].height);
    assert.equal(result.cards[0].top === result.cards[1].top, width >= 375);
    assert.deepEqual(result.cards.map(c => c.href), ['/planning', '/implementation']);
    await js(`document.querySelector('.chapters').scrollIntoView({behavior:'instant'})`);
    const shot = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${dir}/${width}.png`, Buffer.from(shot.data, 'base64'));
    results.push(result);
  }
  writeFileSync(`${dir}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
  await cdp('Browser.close');
} finally { ws?.close(); browser.kill(); }
