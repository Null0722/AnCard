'use strict';
const byId = id => document.getElementById(id);
const form=byId('filters'), results=byId('products'), count=byId('count');
const selected=new Set();
let cards=[];
let artEnabled=false;
byId('show-art').addEventListener('change',event=>{artEnabled=event.target.checked;render();});
const text=(tag,value,className)=>{const el=document.createElement(tag); el.textContent=String(value); if(className)el.className=className; return el;};
const viewFee=c=>!c.humanVerified?'Annual fee: pending human review':c.annualFeeUsd===null || !Number.isFinite(c.annualFeeUsd) ? 'Annual fee: not verified' : 'Annual fee: $'+c.annualFeeUsd;

const rewardModels={flat:'Flat rewards',tiered:'Tiered categories',rotating:'Rotating categories',selectable:'Selected categories',automatic_top_category:'Automatic top category',points:'Points',miles:'Miles',none:'No purchase rewards listed'};
const earnText=r=>(typeof r.rate==='number'?(r.unit==='percent'?r.rate+'%':r.rate+'X'):'Rate not verified')+(typeof r.capAmountUsd==='number'?' on up to $'+r.capAmountUsd.toLocaleString()+' eligible spend'+(r.capPeriod?' per '+r.capPeriod:''):'')+(r.condition?' | '+r.condition:'');
const benefitText=p=>(typeof p.amountUsd==='number'?'Up to $'+p.amountUsd.toLocaleString():'Amount not quantified')+(typeof p.frequencyMonths==='number'?' every '+p.frequencyMonths+' months':'')+(p.condition?' | '+p.condition:'');
function updateQc(progress){
 const total=Number(progress?.total)||0,approved=Math.max(0,Math.min(total,Number(progress?.approved)||0)),pct=total?Math.round(100*approved/total):0;
 byId('qc-ring').style.setProperty('--qc-progress',pct+'%');
 byId('qc-ring').setAttribute('aria-label',approved+' of '+total+' research cards human reviewed, '+pct+' percent');
 byId('qc-percent').textContent=pct+'%';byId('qc-count').textContent=approved+' of '+total+' cards reviewed';
}

const pretty=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,ch=>ch.toUpperCase());
function filtered(){
 const fd=new FormData(form);
 const reward=fd.get('reward'), spending=fd.get('spending'), type=fd.get('cardtype'), limit=Number(fd.get('annual'));
 const query=String(fd.get('search')||'').trim().toLocaleLowerCase(),approvedOnly=fd.has('reviewed-only');
 return cards.filter(c=>(!reward||c.rewards?.includes(reward))&&(!spending||c.categories?.includes(spending))&&(!type||c.features?.includes(type))
 && (!approvedOnly||c.humanVerified===true)
 && (!query||[c.name,c.issuer,c.airlineProgram].filter(Boolean).some(value=>value.toLocaleLowerCase().includes(query)))
 && (Number.isFinite(c.annualFeeUsd)&&c.annualFeeUsd<=limit || c.annualFeeUsd===null && limit===1000));
}
function renderComparison(){
 const ids=cards.filter(c=>selected.has(c.id));const pane=byId('compare'),grid=byId('compare-grid');
 pane.hidden=ids.length===0; grid.replaceChildren();
 for(const c of ids){
   const block=text('article',''); block.append(text('h3',c.name),text('p',c.issuer),text('p',viewFee(c)));
   block.append(text('p','Rewards: '+(c.rewards||[]).map(pretty).join(', ')));
   if(!c.humanVerified){block.append(text('p','Benefits and rates pending human QC'));grid.append(block);continue;}
   block.append(text('p','Rewards model: '+(rewardModels[c.rewardStructure]||'Not classified')));
   block.append(text('p','Earn rules: '+(c.earnRules?.length?c.earnRules.map(r=>r.label+': '+earnText(r)).join('; '):'Not separately quantified')));
   block.append(text('p','Travel credits / perks: '+(c.benefits?.length?c.benefits.map(p=>p.name+': '+benefitText(p)).join('; '):'No quantified benefits in this record')));
   if(typeof c.monthlyFeeUsd==='number')block.append(text('p','Monthly membership fee: $'+c.monthlyFeeUsd));
   block.append(text('p','Watch out: '+c.watchOut));
   grid.append(block);
 }
}
function render(){
 byId('annual-output').textContent=Number(byId('annual').value)===1000?'Any / unknown':'$'+Number(byId('annual').value).toLocaleString();
 const sort=byId('sort').value;
 const matches=filtered().sort((a,b)=>sort==='fee'?(a.annualFeeUsd??Infinity)-(b.annualFeeUsd??Infinity)||a.name.localeCompare(b.name):String(a[sort]||'').localeCompare(String(b[sort]||'')));
 count.textContent=matches.length+' of '+cards.length+' cards match; '+cards.filter(c=>c.humanVerified).length+' passed human QC.';
 results.replaceChildren();
 if(!matches.length) results.append(text('p','No cards match those selections. Clear filters to explore again.','status'));
 for(const c of matches){
  const article=text('article',''); article.className='product';
  const art=document.createElement('div');art.className='dash-card-art';
  if(artEnabled&&c.imageFront?.url){const img=document.createElement('img');img.alt=c.imageFront.alt||('Front of '+c.name);img.referrerPolicy='no-referrer';img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{art.replaceChildren(text('strong',c.issuer.slice(0,2).toUpperCase()));});img.src=c.imageFront.url;art.append(img);}
  else{art.append(text('strong',c.issuer.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()));}
  article.append(art,text('h3',c.name),text('p',c.issuer,'institution'),text('p',c.summary));
  const tags=document.createElement('div');tags.className='tags';
  for(const t of [...(c.rewards||[]),...(c.categories||[]),...(c.features||[])]) tags.append(text('span',pretty(t),'tag'));
  article.append(tags,text('p',viewFee(c)),text('p','Important: '+c.watchOut));
  const footer=document.createElement('div');footer.className='product-footer';
  const label=document.createElement('label');
  const checkbox=document.createElement('input'); checkbox.type='checkbox'; checkbox.checked=selected.has(c.id);
  checkbox.setAttribute('aria-label','Compare '+c.name);
  checkbox.disabled=!checkbox.checked&&selected.size>=3;
  checkbox.addEventListener('change',()=>{if(checkbox.checked)selected.add(c.id);else selected.delete(c.id);render();});
  label.append(checkbox,document.createTextNode(' Compare'));
  const source=document.createElement('a');source.href=c.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';source.textContent='Official source ↗';source.className='data-note';
  footer.append(label,source,text('span',c.humanVerified?'Human QC approved':'Pending human review','data-note'));
  article.append(footer); results.append(article);
 }
 renderComparison();
}
byId('enter').addEventListener('click',()=>byId('gate').close());
byId('gate').addEventListener('cancel',event=>event.preventDefault());
if(typeof byId('gate').showModal==='function') byId('gate').showModal();
form.addEventListener('input',render);
form.addEventListener('change',render);
form.addEventListener('reset',()=>{queueMicrotask(render);});
byId('sort').addEventListener('change',render);
byId('clear-compare').addEventListener('click',()=>{selected.clear();render();});
fetch('../data/cards.json',{cache:'no-store'}).then(resp=>{if(!resp.ok)throw new Error('Catalog could not load');return resp.json();}).then(data=>{
 cards=Array.isArray(data.cards)?data.cards.filter(c=>c && ['published','pending_review'].includes(c.status) && c.fictional===false):[];updateQc(data.reviewProgress);
 render();
}).catch(()=>{count.textContent='The card catalog is unavailable.';results.append(text('p','Try reloading this page or check the generated data file.','status'));});
