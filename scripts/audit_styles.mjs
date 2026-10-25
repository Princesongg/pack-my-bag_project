import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
const phase=process.argv[2]??'after';
const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else files.push(p);}}walk('src');
const css=files.filter(p=>p.endsWith('.css')),counts={colors:{},fonts:{},spacing:{},radii:{},breakpoints:{}};
for(const path of css){const root=postcss.parse(readFileSync(path,'utf8'));root.walkDecls(d=>{const group=d.prop==='font-size'?'fonts':d.prop==='border-radius'?'radii':/^(gap|padding|margin)/.test(d.prop)?'spacing':null;if(group)counts[group][d.value]=(counts[group][d.value]??0)+1;for(const hex of d.value.match(/#[a-f\d]{3,8}\b/gi)??[])counts.colors[hex.toLowerCase()]=(counts.colors[hex.toLowerCase()]??0)+1;});root.walkAtRules('media',r=>counts.breakpoints[r.params]=(counts.breakpoints[r.params]??0)+1);}
const dataHashes=Object.fromEntries(files.filter(p=>p.includes(join('service','data'))).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
mkdirSync('docs/verification/design-system',{recursive:true});writeFileSync(`docs/verification/design-system/style-audit-${phase}.json`,JSON.stringify({files:css,counts,dataHashes},null,2)+'\n');
console.log(phase,css.length,'CSS files;',Object.keys(counts.colors).length,'literal colors;',Object.keys(counts.fonts).length,'font values');
