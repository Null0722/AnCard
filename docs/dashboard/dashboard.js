import {createCardVisual,identityType,rightsClearedAsset} from '../assets/card-visual.js';
'use strict';
const byId = id => document.getElementById(id);
const form=byId('filters'), results=byId('products'), count=byId('count');
const selected=new Set();
const flipped=new Set();
let visibleLimit=24;
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
 const reward=fd.get('reward'),spending=fd.get('spending'),type=fd.get('cardtype'),limit=Number(fd.get('annual'));
 const issuer=fd.get('issuer'),identity=fd.get('identity'),review=fd.get('review');
 const query=String(fd.get('search')||'').trim().toLocaleLowerCase();
 return cards.filter(c=>
   (!issuer||c.issuer===issuer)&&(!identity||identityType(c)===identity)
   &&(!review||(review==='approved'?c.humanVerified===true:c.humanVerified!==true))
   &&(!reward||c.rewards?.includes(reward))
   &&(!spending||c.categories?.includes(spending))
   &&(!type||c.features?.includes(type)||identityType(c)===type)
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
function setFlip(article,onBack){
 const id=article.dataset.cardId;const front=article.querySelector('.flip-front'),back=article.querySelector('.flip-back');
 if(onBack)flipped.add(id);else flipped.delete(id);
 article.classList.toggle('is-flipped',onBack);
 front.inert=onBack;back.inert=!onBack;
 front.setAttribute('aria-hidden',String(onBack));
 back.setAttribute('aria-hidden',String(!onBack));
 article.querySelector(onBack?'[data-back]':'[data-front]')?.focus({preventScroll:true});
}
function render(){
 const range=Number(byId('annual').value);
 byId('annual-output').textContent=range===1000?'Any / unknown':'$'+range.toLocaleString();
 const sort=byId('sort').value;
 const col=new Intl.Collator('en',{sensitivity:'base'});
 const matches=filtered().sort((a,b)=>sort==='fee'?((a.annualFeeUsd??Infinity)-(b.annualFeeUsd??Infinity)||col.compare(a.name,b.name)):col.compare(String(a[sort]||''),String(b[sort]||''))||col.compare(a.name,b.name));
 count.textContent=matches.length+' of '+cards.length+' card identities | '+matches.filter(c=>c.humanVerified).length+' QC reviewed';
 results.replaceChildren();
 if(!matches.length)results.append(text('p','No matches. Reward-category filters require human-reviewed values; try issuer or card type, or clear the filters.','status'));
 for(const c of matches.slice(0,visibleLimit)){
   const article=text('article','');
   article.className='product dashboard-product premium-card';
   article.dataset.cardId=c.id;
   article.classList.toggle('is-flipped',flipped.has(c.id));
   const frame=text('div','');frame.className='flip-frame';const inner=text('div','');inner.className='flip-inner';
   const front=text('section','');front.className='flip-face flip-front';
   const back=text('section','');back.className='flip-face flip-back';
   front.inert=flipped.has(c.id);back.inert=!flipped.has(c.id);
   front.setAttribute('aria-hidden',String(flipped.has(c.id)));
   back.setAttribute('aria-hidden',String(!flipped.has(c.id)));
   const top=text('div','');top.className='flip-top';
   top.append(text('span',c.issuer,'issuer-eyebrow'),text('span',c.humanVerified?'QC reviewed':'Pending QC','review-pill'));
   front.append(top,createCardVisual(c,artEnabled));
   const title=text('div','');title.className='flip-summary';
   title.append(text('h3',c.name),text('p',c.humanVerified?c.summary:'Financial details are pending human review.'));
   front.append(title);
   const bar=text('div','');bar.className='flip-toolbar';
   const flipBtn=text('button','Flip for details','flip-action');flipBtn.type='button';flipBtn.dataset.back=c.id;
   const label=text('label',' Compare','dash-compare-check');
   const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(c.id);cb.disabled=!cb.checked&&selected.size>=3;
   cb.setAttribute('aria-label','Compare '+c.name);
   cb.addEventListener('change',()=>{if(cb.checked)selected.add(c.id);else selected.delete(c.id);render();});
   label.prepend(cb);bar.append(flipBtn,label);front.append(bar);
   back.append(text('div','AT A GLANCE','flip-back-eyebrow'),text('h3',c.name,'flip-back-title'));
   const facts=text('div','');facts.className='flip-back-details';
   for(const [name,value] of [
     ['Issuer',c.issuer],
     ['Human review',c.humanVerified?'Human-checked snapshot':'Pending'],
     ['Annual fee',c.humanVerified?viewFee(c):'Pending human review'],
     ['Earn rates',c.humanVerified&&c.earnRules?.length?c.earnRules.map(x=>x.label+': '+earnText(x)).join('; '):'Not yet approved'],
     ['Welcome bonus',c.humanVerified&&c.welcomeOffer?
       (c.welcomeOffer.kind==='up_to'?'Up to ':'')+(c.welcomeOffer.unit==='usd'?'$':'')+c.welcomeOffer.amount.toLocaleString()+(c.welcomeOffer.unit==='usd'?'':' '+c.welcomeOffer.unit):'Not yet approved or documented']
   ]){
     const line=text('div','');line.className='flip-fact';
     line.append(text('span',name,'flip-fact-label'),text('span',value,'flip-fact-value'));facts.append(line);
   }
   back.append(facts);
   const actions=text('div','');actions.className='flip-back-actions';
   const returnBtn=text('button','Return to front','flip-return');returnBtn.type='button';returnBtn.dataset.front=c.id;
   const source=text('a','Read official issuer source','source-link');source.href=c.issuerSource;source.target='_blank';
   source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';
   actions.append(returnBtn,source);back.append(actions);
   inner.append(front,back);frame.append(inner);article.append(frame);
   results.append(article);
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
results.addEventListener('click',event=>{
 const article=event.target.closest('.dashboard-product');
 if(!article)return;
 if(event.target.closest('[data-back]')){setFlip(article,true);return;}
 if(event.target.closest('[data-front]')){setFlip(article,false);return;}
 if(!event.target.closest('button,a,input,label,select'))setFlip(article,!article.classList.contains('is-flipped'));
});
fetch('../data/cards.json',{cache:'no-store'}).then(resp=>{if(!resp.ok)throw new Error('Catalog could not load');return resp.json();}).then(data=>{
 cards=Array.isArray(data.cards)?data.cards.filter(c=>c && ['published','pending_review'].includes(c.status) && c.fictional===false):[];
 updateQc(data.reviewProgress);
 const issuer=byId('issuer');
 for(const name of [...new Set(cards.map(c=>c.issuer))].sort((a,b)=>a.localeCompare(b))){
   const opt=document.createElement('option');opt.value=name;opt.textContent=name;issuer.append(opt);
 }
 const available=cards.filter(rightsClearedAsset).length;
 byId('show-art').disabled=available===0;
 byId('art-status').textContent=available?'Original illustrations load locally; '+available+' authorized issuer images available only after opt-in.':'All card imagery is original and rendered locally. Official card art remains paused until usage rights are documented. No bank-image requests.';
 render();
}).catch(()=>{count.textContent='The card catalog is unavailable.';results.append(text('p','Try reloading this page or check the generated data file.','status'));});
