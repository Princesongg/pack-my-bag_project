import fs from 'node:fs';
import {createHash} from 'node:crypto';
const origin='https://pack-my-bagproject.vercel.app',output='docs/verification/production';fs.mkdirSync(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const results=[];
for(const path of ['/','/planning','/implementation','/implementation/workspace','/implementation/workspace?view=bag','/implementation/travel-info']){
  const r=await fetch(origin+path);const html=await r.text();results.push({path,status:r.status,url:r.url,https:r.url.startsWith('https://'),hsts:r.headers.get('strict-transport-security'),title:html.match(/<title>(.*?)<\/title>/s)?.[1],assets:[...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(m=>m[1])});
}
const assets=[];for(const path of new Set(results.flatMap(r=>r.assets))){const r=await fetch(origin+path),b=Buffer.from(await r.arrayBuffer()),local='dist'+path;assets.push({path,status:r.status,bytes:b.length,sha256:hash(b),localExists:fs.existsSync(local),matchesLocal:fs.existsSync(local)&&hash(fs.readFileSync(local))===hash(b)});}
const observed=[];for(const file of ['docs/verification/production-latest/journeys/journeys.json'])if(fs.existsSync(file)){const d=JSON.parse(fs.readFileSync(file));observed.push(...d.responses.filter(r=>r.url.startsWith(origin)&&/\.(?:js|css|svg|woff2?)(?:\?|$)/.test(r.url)).map(r=>r.url));}
const resources=[];for(const url of new Set(observed)){const r=await fetch(url),b=Buffer.from(await r.arrayBuffer()),text=b.toString('utf8');resources.push({url,status:r.status,bytes:b.length,contentType:r.headers.get('content-type'),knownSecretPattern:/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|sk-(?:proj-)?[A-Za-z0-9_-]{32,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}/.test(text)});}
fs.writeFileSync(output+'/http.json',JSON.stringify({checkedOn:new Date().toISOString(),origin,routes:results,assets,resources},null,2));console.log(JSON.stringify({routes:results.map(r=>({path:r.path,status:r.status})),assets,observedResources:resources.length,secretPatternFindings:resources.filter(r=>r.knownSecretPattern).length},null,2));
