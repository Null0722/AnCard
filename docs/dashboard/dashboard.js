import {createCardVisual,identityType,rightsClearedAsset} from '../assets/card-visual.js';
'use strict';
const byId = id => document.getElementById(id);
const form=byId('filters'), results=byId('products'), count=byId('count');
const selected=new Set();

let visibleLimit=24;
let cards=[];
let artEnabled=false;
let showIllustrations=true;
byId('show-art').addEventListener('change',event=>{
  showIllustrations=event.target.checked;
  const official=byId('show-official-art');
  official.disabled=!showIllustrations||!cards.some(rightsClearedAsset);
  if(!showIllustrations){official.checked=false;artEnabled=false;}
  render();
});
byId('show-official-art').addEventListener('change',event=>{artEnabled=event.target.checked;render();});
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
 const reward=fd.get('reward'),spending=fd.get('spending'),limit=Number(fd.get('annual'));
 const issuer=fd.get('issuer'),identity=fd.get('identity'),review=fd.get('review');
 const query=String(fd.get('search')||'').trim().toLocaleLowerCase();
 return cards.filter(c=>
   (!issuer||c.issuer===issuer)&&(!identity||identityType(c)===identity)
   &&(!review||(review==='approved'?c.humanVerified===true:c.humanVerified!==true))
   &&(!reward||c.rewards?.includes(reward))
   &&(!spending||c.categories?.includes(spending))
   &&(!query||[c.name,c.issuer,c.airlineProgram].filter(Boolean).some(v=>v.toLocaleLowerCase().includes(query)))
   &&((Number.isFinite(c.annualFeeUsd)&&c.annualFeeUsd<=limit)||(c.annualFeeUsd===null&&limit===1000))
 );
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
   const bonus=c.welcomeOffer;
   block.append(text('p','Welcome offer: '+(bonus?(bonus.kind==='up_to'?'As high as ':'')+(bonus.unit==='usd'?'$':'')+bonus.amount.toLocaleString()+(bonus.unit==='usd'?'':' '+bonus.unit)+' after $'+bonus.minimumSpendUsd.toLocaleString()+' in '+bonus.monthsToEarn+' months':'Not documented')));
   block.append(text('p','Targeted / invite-only: '+(c.targetedOffers?.description||'Not documented for this card')));
   block.append(text('p','Starting limit: '+(Number.isFinite(c.approvalGuidance?.startingLimitMinUsd)?'$'+c.approvalGuidance.startingLimitMinUsd:'Set after individual underwriting')));
   block.append(text('p','Issuer credit label: '+(c.approvalGuidance?.issuerCreditLevel||'No numerical approval threshold supported')));
   block.append(text('p','Redemption examples: '+(c.redemptionDetail?.examples?.length?c.redemptionDetail.examples.map(x=>x.method+': '+x.centsPerPoint+' cents/point').join('; '):'No fixed verified value')));
   block.append(text('p','Intro purchase APR: '+(Number.isFinite(c.pricingDetail?.introPurchaseAprPct)?c.pricingDetail.introPurchaseAprPct+'% for '+c.pricingDetail.introPurchaseMonths+' months':'Not verified')));

   block.append(text('p','Watch out: '+c.watchOut));
   grid.append(block);
 }
}

function factLine(label,value,link){
 const row=text('div','','card-fact');
 const heading=text('div','','card-fact-heading');
 heading.append(text('span',label,'card-fact-label'));
 if(link){const anchor=text('a','?','term-tip-toggle');anchor.href='../#decoder';anchor.title='Read the plain-English Decoder about '+label.toLowerCase();anchor.setAttribute('aria-label','Learn about '+label.toLowerCase());heading.append(anchor);}
 row.append(heading,text('p',value,'card-fact-value'));
 return row;
}
function render(){
 const range=Number(byId('annual').value);
 byId('annual-output').textContent=range===1000?'Any / unknown':'$'+range.toLocaleString();
 const sort=byId('sort').value;
 const col=new Intl.Collator('en',{sensitivity:'base'});
 const matches=filtered().sort((a,b)=>sort==='fee'?((a.annualFeeUsd??Infinity)-(b.annualFeeUsd??Infinity)||col.compare(a.name,b.name)):col.compare(String(a[sort]||''),String(b[sort]||''))||col.compare(a.name,b.name));
 count.textContent=matches.length+' matching | '+cards.filter(c=>c.humanVerified).length+' human-reviewed of '+cards.length+' total';
 results.replaceChildren();
 if(!matches.length)results.append(text('p','No reviewed cards match. Try another filter or choose QC queue in Editorial status to explore unreviewed identities.','status'));

 for(const c of matches.slice(0,visibleLimit)){
   const article=text('article','','product dashboard-product premium-card card-at-glance');
   article.dataset.cardId=c.id;article.dataset.identityType=identityType(c);
   article.classList.toggle('awaiting-review',!c.humanVerified);
   const header=text('header','','card-overview-header');
   const heading=text('div','','card-heading');
   heading.append(text('span',c.issuer,'issuer-eyebrow'),text('h3',c.name),text('span',c.humanVerified?'Human QC reviewed':'In human QC queue','review-pill'));
   header.append(heading);
   if(showIllustrations){
     const art=text('div','','card-art-thumb');
     art.append(createCardVisual(c,artEnabled));header.append(art);
   }
   article.append(header);
   if(c.humanVerified){
     const facts=text('div','','card-preview-facts');
     facts.append(factLine('Annual fee',viewFee(c)));
     facts.append(factLine('Reward overview',c.primaryLabel||'Not documented',true));
     const bonus=c.welcomeOffer;
     const offer=bonus?(bonus.kind==='up_to'?'Up to ':'')+(bonus.unit==='usd'?'$':'')+bonus.amount.toLocaleString()+(bonus.unit==='usd'?'':' '+bonus.unit)+' after $'+bonus.minimumSpendUsd.toLocaleString()+' eligible spending in '+bonus.monthsToEarn+' months':'Not documented in the reviewed snapshot';
     facts.append(factLine('Welcome offer',offer,true));
     article.append(facts);
   }else article.append(text('p','Research identity only; financial facts are awaiting human review.','card-queue-note'));
   const bar=text('div','','card-overview-actions');
   const label=text('label',' Compare','dash-compare-check');
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(c.id);cb.disabled=!cb.checked&&selected.size>=3;
   cb.setAttribute('aria-label','Compare '+c.name);
   cb.addEventListener('change',()=>{
     if(cb.checked)selected.add(c.id);else selected.delete(c.id);
     render();
     const next=[...results.querySelectorAll('.dashboard-product')].find(item=>item.dataset.cardId===c.id);
     next?.querySelector('.dash-compare-check input')?.focus({preventScroll:true});
   });
   label.prepend(cb);bar.append(label);
   const source=text('a','Official issuer source','source-link issuer-link');
   source.href=c.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';
   bar.append(source);article.append(bar);results.append(article);
 }
 byId('load-more').hidden=matches.length<=visibleLimit;
 byId('load-more').textContent='Show more cards ('+Math.max(0,matches.length-visibleLimit)+' remaining)';
 renderComparison();
}
byId('enter').addEventListener('click',()=>byId('gate').close());
byId('gate').addEventListener('cancel',event=>event.preventDefault());
if(typeof byId('gate').showModal==='function') byId('gate').showModal();
form.addEventListener('input',()=>{visibleLimit=24;render();});
form.addEventListener('reset',()=>{visibleLimit=24;queueMicrotask(render);});
byId('sort').addEventListener('change',()=>{visibleLimit=24;render();});
byId('load-more').addEventListener('click',()=>{visibleLimit+=24;render();byId('load-more').focus({preventScroll:true});});
byId('clear-compare').addEventListener('click',()=>{selected.clear();render();});
// The dashboard renders its facts directly; no flip, expansion, or mirrored text.
fetch('../data/cards.json',{cache:'no-store'}).then(resp=>{if(!resp.ok)throw new Error('Catalog could not load');return resp.json();}).then(data=>{
 cards=Array.isArray(data.cards)?data.cards.filter(c=>c && ['published','pending_review'].includes(c.status) && c.fictional===false):[];
 updateQc(data.reviewProgress);
 const issuer=byId('issuer');
 for(const name of [...new Set(cards.map(c=>c.issuer))].sort((a,b)=>a.localeCompare(b))){
   const opt=document.createElement('option');opt.value=name;opt.textContent=name;issuer.append(opt);
 }
 const available=cards.filter(rightsClearedAsset).length;
 byId('official-art-option').hidden=available===0;
 byId('show-official-art').disabled=available===0||!showIllustrations;
 byId('art-status').textContent=available
   ?'AnCard illustrations render locally. '+available+' authorized issuer assets can be enabled separately with consent.'
   :'AnCard illustrations render locally. No issuer images can load without authorization and consent.';
 render();
}).catch(()=>{count.textContent='The card catalog is unavailable.';results.append(text('p','Try reloading this page or check the generated data file.','status'));});
