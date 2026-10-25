// One-time, idempotent migration of existing UI CSS. Does not touch TS/data or illustration geometry.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import postcss from 'postcss';
const files=[];function walk(d){for(const e of readdirSync(d,{withFileTypes:true})){const p=join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.css'))files.push(p);}}walk('src');
const palettes={
  '--pmb-color-primary':['#245be0','#2f6599','#2460d4','#30699e'],
  '--pmb-color-primary-hover':['#194bc4'], '--pmb-color-primary-active':['#1743ad'],
  '--pmb-color-background':['#fcfaf4','#faf8f2'],
  '--pmb-color-surface':['#fffdf7','#fffefa','#fffdf5','#fffdf4','#fcfdff'],
  '--pmb-color-surface-blue':['#edf3fc','#e9f1fc','#edf4fc','#edf2ff','#f0f5fc','#eaf1f5'],
  '--pmb-color-surface-yellow':['#f7efd4','#faf1d8','#f6edcf','#f8f1d9','#fff4ce','#fff6d9','#f7edc9'],
  '--pmb-color-text-primary':['#202d42','#203b60','#243b50'],
  '--pmb-color-text-secondary':['#65738a','#6a707a','#65768f','#62728b','#677387','#6b7583','#677790','#637085','#6c7684','#536b8b','#526580'],
  '--pmb-color-border-default':['#d9e2ee','#e2e0d7','#e3e2da','#e6e2d9','#e3e1da','#e2e5e9'],
  '--pmb-color-border-accent':['#cbd9ee','#cbd7e8','#bdcfe6','#cfdded','#d4dfef','#ccd5e0','#d5e0ed'],
  '--pmb-color-focus':['#c06b3e','#da9a60'],
  '--pmb-state-warning-border':['#e8dba9','#ede1b9'],
  '--pmb-state-warning-text':['#69512a','#71643e'],
  '--pmb-state-error-bg':['#fff0ec'], '--pmb-state-error-text':['#982f27','#9b3b30'], '--pmb-state-error-border':['#d45c4e'],
};
const colors=Object.fromEntries(Object.entries(palettes).flatMap(([token,values])=>values.map(v=>[v,token])));
const decorative=/pmb-(art|case|sticker|wheel|orbit|boarding|tag|passport(?!-(date|rule|result|check|scope))|ready|title-spark)|hero-art|suitcase|art-|flight-arc|small-stamp|decoration-|coming-icon/;
let changed=0;
for(const file of files){if(/tokens\.css|ui\.css|StatusBadge\.css/.test(file))continue;const original=readFileSync(file,'utf8'),root=postcss.parse(original);
  root.walkAtRules('media',r=>r.params=r.params.replace(/max-width:\s*760px/g,'max-width:768px'));
  root.walkRules(rule=>{
    if(decorative.test(rule.selector))return;
    rule.walkDecls(d=>{
      if(d.prop.startsWith('--'))return;
      d.value=d.value.replace(/#[a-f\d]{3,8}\b/gi,v=>colors[v.toLowerCase()]?`var(${colors[v.toLowerCase()]})`:v);
      if(/^(padding|margin)(-(top|right|bottom|left|inline|block)(-start|-end)?)?$|^(row-|column-)?gap$/.test(d.prop))d.value=d.value.replace(/(?<![-\w.])\d+(?:\.\d+)?px\b/g,v=>{const n=parseFloat(v);return n>0&&n<=64?`var(--pmb-space-${Math.max(1,Math.round(n/4))})`:v;});
      if(d.prop==='border-radius')d.value=d.value.replace(/\b(8|9|10|11|12|13|14|15|16|18|20)px\b/g,(_,n)=>`var(--pmb-radius-${+n<=11?'small':+n<=13?'card':+n<=16?'panel':'modal'})`);
      if(d.prop==='font-family'&&/Arial Black/.test(d.value))d.value='var(--pmb-font-display)';
      if(d.prop==='font-size'&&/^\d+px$/.test(d.value)){
        const n=parseInt(d.value),body=/\bp\b|\bli\b|label|input|select|button|summary|legend|note|help|hint|reason|disclaimer|tip|feedback/.test(rule.selector);
        const token=n<=13?(body?'small':'caption'):n===14?'small':n===15||n===16?'body':n===18?'card-title':n===24?'section-title':null;
        if(token)d.value=`var(--pmb-font-${token})`;
      }
      if(d.prop==='min-height'&&['44px','48px'].includes(d.value))d.value=d.value==='44px'?'var(--pmb-touch-target)':'var(--pmb-control-height)';
    });
  });const output=root.toString();if(output!==original){writeFileSync(file,output);changed++;}
}
console.log('Tokenized',changed,'existing CSS files');
