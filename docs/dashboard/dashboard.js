'use strict';
const byId = id => document.getElementById(id);
const form=byId('filters'), results=byId('products'), count=byId('count');
const selected=new Set();
let cards=[];
const text=(tag,value,className)=>{const el=document.createElement(tag); el.textContent=String(value); if(className)el.className=className; return el;};
const viewFee=c=> c.annualFeeUsd===null || !Number.isFinite(c.annualFeeUsd) ? 'Annual fee: not verified' : 'Annual fee: $'+c.annualFeeUsd;
const pretty=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,ch=>ch.toUpperCase());
function filtered(){
 const fd=new FormData(form);
 const reward=fd.get('reward'), spending=fd.get('spending'), type=fd.get('cardtype'), limit=Number(fd.get('annual'));
 return cards.filter(c=>(!reward||c.rewards?.includes(reward))&&(!spending||c.categories?.includes(spending))&&(!type||c.features?.includes(type))&&(Number.isFinite(c.annualFeeUsd)&&c.annualFeeUsd<=limit || c.annualFeeUsd===null && limit===1000));
}
function renderComparison(){
 const ids=cards.filter(c=>selected.has(c.id));const pane=byId('compare'),grid=byId('compare-grid');
 pane.hidden=ids.length===0; grid.replaceChildren();
 for(const c of ids){
   const block=text('article',''); block.append(text('h3',c.name),text('p',c.issuer),text('p',viewFee(c)));
   block.append(text('p','Rewards: '+(c.rewards||[]).map(pretty).join(', ')));
   block.append(text('p','Watch out: '+c.watchOut));
   grid.append(block);
 }
}
function render(){
 byId('annual-output').textContent='$'+Number(byId('annual').value).toLocaleString();
 const sort=byId('sort').value;
 const matches=filtered().sort((a,b)=>sort==='fee'?(a.annualFeeUsd??Infinity)-(b.annualFeeUsd??Infinity)||a.name.localeCompare(b.name):String(a[sort]||'').localeCompare(String(b[sort]||'')));
 count.textContent=matches.length+' of '+cards.length+' fictional example cards match your filters.';
 results.replaceChildren();
 if(!matches.length) results.append(text('p','No cards match those selections. Clear filters to explore again.','status'));
 for(const c of matches){
  const article=text('article',''); article.className='product';
  article.append(text('h3',c.name),text('p',c.issuer,'institution'),text('p',c.summary));
  const tags=document.createElement('div');tags.className='tags';
  for(const t of [...(c.rewards||[]),...(c.categories||[]),...(c.features||[])]) tags.append(text('span',pretty(t),'tag'));
  article.append(tags,text('p',viewFee(c)),text('p','Fine print: '+c.watchOut));
  const footer=document.createElement('div');footer.className='product-footer';
  const label=document.createElement('label');
  const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=selected.has(c.id);
  checkbox.setAttribute('aria-label','Compare '+c.name);
  checkbox.disabled=!checkbox.checked&&selected.size>=3;
  checkbox.addEventListener('change',()=>{if(checkbox.checked)selected.add(c.id);else selected.delete(c.id);render();});
  label.append(checkbox,document.createTextNode(' Compare'));
  footer.append(label,text('span','Fictional demo • no verified issuer terms','data-note'));
  article.append(footer); results.append(article);
 }
 renderComparison();
}
byId('enter').addEventListener('click',()=>byId('gate').close());
byId('gate').addEventListener('cancel',event=>event.preventDefault());
if(typeof byId('gate').showModal==='function') byId('gate').showModal();
form.addEventListener('input',render);
form.addEventListener('change',render);
form.addEventListener('reset',()=>{selected.clear();queueMicrotask(render);});
byId('sort').addEventListener('change',render);
byId('clear-compare').addEventListener('click',()=>{selected.clear();render();});
fetch('../data/cards.json',{cache:'no-store'}).then(resp=>{if(!resp.ok)throw new Error('Catalog could not load');return resp.json();}).then(data=>{
 cards=Array.isArray(data.cards)?data.cards.filter(c=>c && c.fictional===true):[];
 render();
}).catch(()=>{count.textContent='The demo catalog is unavailable.';results.append(text('p','Try reloading this page or check the generated data file.','status'));});
