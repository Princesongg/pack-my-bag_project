import fs from 'node:fs';
const url='https://raw.githubusercontent.com/Princesongg/pack-my-bag_project/31c4ef8c0ae01c3d98a5365ad9347ce3701c5013/src/service/my-bag/MyBag.css';
const r=await fetch(url);const css=await r.text();if(!r.ok)throw Error('Historical CSS HTTP '+r.status);
fs.mkdirSync('docs/verification/checklist-restore',{recursive:true});fs.writeFileSync('docs/verification/checklist-restore/original-commit.css',css);
console.log(JSON.stringify({url,status:r.status,rules:css.split('}').filter(s=>/pmb-bag-categories|pmb-bag-category-other/.test(s)).map(s=>s+'}')},null,2));
