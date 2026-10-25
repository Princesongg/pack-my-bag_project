// Development-time public URL check. No runtime API integration or application data mutation.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const dir='docs/verification/country-data-audit',cache='node_modules/.cache/country-data-audit';mkdirSync(cache,{recursive:true});
const urls=JSON.parse(readFileSync(dir+'/source-urls.json','utf8')),results=[];
let cursor=0;
async function worker(){while(cursor<urls.length){const i=cursor++,url=urls[i],bodyPath=resolve(cache,`source-${i}.body`);const result=await new Promise(resolve=>{const child=spawn('curl.exe',['-sSL','--max-time','25','--connect-timeout','10','-o',bodyPath,'-w','%{http_code}\t%{content_type}\t%{url_effective}',url],{windowsHide:true});let output='',error='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error+=b);child.on('error',e=>resolve({exitCode:-1,output,error:String(e)}));child.on('close',exitCode=>resolve({exitCode,output,error}));});
 const [code,mime,finalUrl]=result.output.split('\t');let bytes=0,title='',blockedMarker=false;try{bytes=statSync(bodyPath).size;if((mime??'').includes('html')){const html=readFileSync(bodyPath,'utf8');title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'').replace(/\s+/g,' ').slice(0,220);blockedMarker=/access denied|request rejected|just a moment|verify you are human|captcha/i.test(title)||/The requested URL was rejected/.test(html.slice(0,2000));}}catch{}
 results.push({index:i,url,httpStatus:Number(code)||0,mime: mime??'',finalUrl:finalUrl??'',bytes,title,blockedMarker,exitCode:result.exitCode,error:result.error.slice(0,240),bodyPath:bodyPath.replaceAll('\\','/')});if(results.length%20===0)console.log('Checked',results.length,'/',urls.length);
 }}
await Promise.all(Array.from({length:6},worker));results.sort((a,b)=>a.index-b.index);writeFileSync(dir+'/http-results.json',JSON.stringify({checkedOn:'2026-10-25',method:'GET with redirects; HTTP success alone is not content verification',results},null,2)+'\n');
console.log('DONE',results.length,'2xx',results.filter(r=>r.httpStatus>=200&&r.httpStatus<300&&!r.blockedMarker).length,'not verified',results.filter(r=>r.httpStatus<200||r.httpStatus>=300||r.blockedMarker).length);
