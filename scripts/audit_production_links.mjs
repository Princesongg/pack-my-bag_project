import fs from 'node:fs';
import {loadTs} from '../tests/helpers/load-ts.mjs';
const output='docs/verification/production',origin='https://pack-my-bagproject.vercel.app';fs.mkdirSync(output,{recursive:true});
const {sources}=await loadTs('src/service/data/sources.ts');
const rendered=[];for(const file of (process.env.QA_LINK_FILES?.split(';')??['docs/verification/production-ui/current/ui-results.json','docs/verification/production-countries/current/ui-results.json']))if(fs.existsSync(file)){const d=JSON.parse(fs.readFileSync(file));for(const r of d.results)rendered.push(...(r.links??[]));}
const urls=[...new Set([...sources.map(s=>s.url),...rendered.map(l=>l.url)].filter(u=>/^https?:/.test(u)&&!u.startsWith(origin)))];
const results=[];let index=0;
await Promise.all(Array.from({length:6},async()=>{while(index<urls.length){const url=urls[index++],started=Date.now();let result;try{const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'PACK-MY-BAG-Link-QA/1.0'}});await r.body?.cancel();result={url,status:r.status,finalUrl:r.url,elapsedMs:Date.now()-started};}catch(e){result={url,status:null,error:String(e.message),elapsedMs:Date.now()-started};}results.push({...result,scope:rendered.some(l=>l.url===url)?'rendered-production':'local-source-catalog',sourceIds:sources.filter(s=>s.url===url).map(s=>s.id)});fs.writeFileSync(output+'/links.json',JSON.stringify({results,renderedLinkSecurity:rendered.filter(l=>l.target==='_blank'&&!/noopener|noreferrer/.test(l.rel))},null,2));}}));
console.log(JSON.stringify({count:results.length,success:results.filter(r=>r.status>=200&&r.status<400).length,errors:results.filter(r=>r.status===null||r.status>=400).length}));
