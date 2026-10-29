// AnCard keeps browsing state in memory only. No accounts, analytics or saved choices.
import {createCardVisual, identityType, rightsClearedAsset} from './card-visual.js';
import {MAX_COMPARE,createComparisonWorkbench} from './comparison-workbench.js';
const catalogEl=document.querySelector('#card-results');
const checks=[...document.querySelectorAll('[data-facet]')];
const quicks=[...document.querySelectorAll('[data-quick]')];
const identityQuicks=[...document.querySelectorAll('[data-identity-quick]')];
const compared=new Set();
let identitySelection='';
let queueLimit=12;
let artEnabled=false;
let showIllustrations=true;
let visibleLimit=24;
let cards = [];
let catalogError = false;
let lastFocused = null;
let modalOpen = null;
const $ = selector => document.querySelector(selector);
const txt = value => String(value ?? '');
const node = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = txt(text);
  return el;
};


const rewardModels={flat:'Flat rewards',tiered:'Tiered category rewards',rotating:'Activated rotating categories',selectable:'Cardholder-selected categories',automatic_top_category:'Automatic top spending category',points:'Points rewards',miles:'Travel miles',none:'No purchase rewards listed'};
function earnText(rule){
 const amount=typeof rule?.rate==='number'?(rule.unit==='percent'?rule.rate+'%':rule.rate+'X'):'Rate pending review';
 const cap=typeof rule?.capAmountUsd==='number'?' | Eligible spend cap: $'+rule.capAmountUsd.toLocaleString()+(rule.capPeriod?' per '+rule.capPeriod.toLowerCase():''):'';
 return amount+cap+(rule.condition?' | '+rule.condition:'');
}
function benefitText(benefit){
 const amount=typeof benefit?.amountUsd==='number'?'Up to $'+benefit.amountUsd.toLocaleString():'Amount not quantified';
 const frequency=typeof benefit?.frequencyMonths==='number'&&benefit.frequencyMonths>0?' | every '+(benefit.frequencyMonths%12===0?benefit.frequencyMonths/12+' years':benefit.frequencyMonths+' months'):'';
 return amount+frequency+(benefit.condition?' | '+benefit.condition:'');
}
function updateQcProgress(progress){
 const total=Number(progress?.total)||0;
 const approved=Math.max(0,Math.min(total,Number(progress?.approved)||0));
 const percent=total?Math.round(100*approved/total):0;
 const ring=$('#qc-ring');
 ring.style.setProperty('--qc-progress',percent+'%');
 ring.setAttribute('aria-label',approved+' of '+total+' research cards human reviewed, '+percent+' percent');
 $('#qc-percent').textContent=percent+'%';
 $('#qc-count').textContent=approved+' of '+total+' cards reviewed';
}

const labels = {cash_back:'Cash back',points:'Points',miles:'Miles',groceries:'Groceries',travel:'Travel',dining:'Dining',online:'Online',gas:'Gas & transit',lifestyle:'Lifestyle',airline:'Airline card'};

function activeFilters() {
  const picked = {rewards:[],categories:[],features:[]};
  checks.filter(x=>x.checked).forEach(x=>picked[x.dataset.facet].push(x.value));
  return picked;
}
function matches(card, active) {
  return Object.entries(active).every(([facet, selected])=>selected.length===0 || selected.some(v=>{
    if(facet==='features') return v==='no_annual_fee' ? card.annualFeeUsd === 0 : card.features.includes(v);
    return card[facet].includes(v);
  }));
}
function sortCards(list) {
  const col = new Intl.Collator('en',{sensitivity:'base'});
  const mode=$('#sort-by').value;
  return [...list].sort((a,b)=>mode==='fee' ? ((a.annualFeeUsd??Infinity)-(b.annualFeeUsd??Infinity) || col.compare(a.name,b.name)) : (col.compare(mode==='issuer'?a.issuer:a.name,mode==='issuer'?b.issuer:b.name) || col.compare(a.name,b.name)));
}

function button(textValue,className,attribute,value) {
  const btn=node('button',className,textValue);
  btn.type='button';btn.dataset[attribute]=value;
  return btn;
}

const lessons={
 rewards:['Reward categories','Merchant codes, spending caps and activation rules can limit the advertised multiplier. Points and miles do not have a guaranteed cash value (see Decoder 08: Cents per point).','Look for: exclusions, caps and redemption restrictions.'],
 offer:['Welcome bonuses','Bonuses usually require eligible spending by a deadline. Prior accounts and targeted offers may affect eligibility.','Look for: spending requirements, account history and expiration.']
};
function makeFact(label,value,lesson){
 const row=node('div','card-fact');
 const heading=node('div','card-fact-heading');
 heading.append(node('span','card-fact-label',label));
 if(lesson){
   const tip=node('details','term-tip'),summary=node('summary','term-tip-toggle','?');
   summary.setAttribute('aria-label','Explain '+lessons[lesson][0].toLowerCase());
   const content=node('div','term-tip-copy');
   content.append(node('strong','',lessons[lesson][0]),node('p','',lessons[lesson][1]),node('p','',lessons[lesson][2]));
   const link=node('a','','Read the full Decoder');link.href='#decoder';content.append(link);
   tip.append(summary,content);heading.append(tip);
 }
 row.append(heading,node('p','card-fact-value',value));
 return row;
}
function issuerLink(card){
 const link=node('a','source-link issuer-link','Official issuer source');
 link.href=card.issuerSource;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
 return link;
}
function makeCard(card){
 const reviewed=card.humanVerified===true;
 const article=node('article','card-row premium-card card-at-glance');
 article.dataset.cardId=card.id;article.dataset.identityType=identityType(card);
 article.classList.toggle('awaiting-review',!reviewed);
 const header=node('header','card-overview-header');
 const heading=node('div','card-heading');
 heading.append(node('span','issuer-eyebrow',card.issuer),node('h4','',card.name),node('span','review-pill',reviewed?'Human QC reviewed':'In human QC queue'));
 header.append(heading);
 if(showIllustrations){
   const thumbnail=node('div','card-art-thumb');
   thumbnail.append(createCardVisual(card,artEnabled));header.append(thumbnail);
 }
 article.append(header);
 if(reviewed){
   const facts=node('div','card-preview-facts');
   facts.append(makeFact('Annual fee',card.feeSummary||'Not verified'));
   facts.append(makeFact('Reward overview',card.primaryLabel||'Not documented','rewards'));
   facts.append(makeFact('Welcome offer',card.welcomeOffer?offerDescription(card.welcomeOffer):'Not documented in the reviewed snapshot','offer'));
   article.append(facts);
 }else{
   article.append(node('p','card-queue-note','Research identity only. Fees, rates and bonuses remain hidden until human source review.'));
 }
 const actions=node('div','card-overview-actions');
 if(reviewed)actions.append(button('Decode full terms','flip-read','detail',card.id));
 const compare=button(compared.has(card.id)?'✓ Added to compare':'+ Compare','compare-button','compare',card.id);
 compare.setAttribute('aria-pressed',String(compared.has(card.id)));
 if(compared.size>=MAX_COMPARE&&!compared.has(card.id)){
  compare.disabled=true;compare.title='Remove a selected card before adding another; maximum four cards.';
 }
 actions.append(compare,issuerLink(card));article.append(actions);
 return article;
}
function makeQueueCard(card){
 const article=node('article','queue-card');
 article.append(node('span','queue-issuer',card.issuer),node('h4','',card.name),node('p','','Awaiting human review; financial terms not yet published.'),issuerLink(card));
 return article;
}
function activeIdentity() {
 return identitySelection;
}
function activeFiltersCount() {
 return checks.filter(c=>c.checked).length
   +Boolean($('#card-search').value.trim())+Boolean($('#issuer-filter').value)
   +Boolean(identitySelection)+Boolean($('#review-status').value!=='approved');
}

function matchesBase(c){
 const q=$('#card-search').value.trim().toLowerCase(),issuer=$('#issuer-filter').value;
 return (!issuer||c.issuer===issuer)&&(!identitySelection||identityType(c)===identitySelection)
  &&(!q||[c.name,c.issuer,c.airlineProgram].filter(Boolean).some(v=>v.toLowerCase().includes(q)));
}
function updateFacetCounts(){
 const active=activeFilters();
 for(const checkbox of checks){
   const remaining={...active,[checkbox.dataset.facet]:[]};
   const one={rewards:[],categories:[],features:[]};one[checkbox.dataset.facet]=[checkbox.value];
   const count=cards.filter(c=>c.humanVerified&&matchesBase(c)&&matches(c,remaining)&&matches(c,one)).length;
   const label=checkbox.closest('label');
   let mark=label.querySelector('.facet-count');
   if(!mark){mark=node('span','facet-count');label.append(mark);}
   mark.textContent=count+' verified';
   checkbox.disabled=count===0&&!checkbox.checked;
   label.classList.toggle('facet-unavailable',count===0);
   label.title=count===0?'No approved card currently matches; pending rates are unknown.':count+' reviewed card'+(count===1?'':'s')+' match';
 }
 for(const preset of quicks){
   const option=checks.find(c=>c.value===preset.dataset.quick);
   preset.disabled=Boolean(option?.disabled);
   preset.title=preset.disabled?'No reviewed card currently matches this preset.':'';
 }
}
function renderQueue(){
 const panel=$('#qc-queue');
 const pending=sortCards(cards.filter(c=>!c.humanVerified&&matchesBase(c)));
 const total=cards.filter(c=>!c.humanVerified).length;
 panel.hidden=$('#review-status').value!=='approved';
 $('#qc-queue-summary').textContent='In the QC queue ('+(pending.length===total?total+' upcoming cards':pending.length+' of '+total+' matching')+')';
 const area=$('#qc-queue-cards');area.replaceChildren();
 const more=$('#qc-queue-more');
 if(!panel.open||panel.hidden){more.hidden=true;return;}
 if(!pending.length)area.append(node('p','queue-empty','No upcoming cards match this issuer, name or type.'));
 else pending.slice(0,queueLimit).forEach(c=>area.append(makeQueueCard(c)));
 more.hidden=pending.length<=queueLimit;
 more.textContent='Show more in queue ('+Math.max(0,pending.length-queueLimit)+' remaining)';
}
function render(){
 const review=$('#review-status').value;
 const filtered=sortCards(cards.filter(c=>matchesBase(c)&&matches(c,activeFilters())
   &&(review==='approved'?c.humanVerified===true:review==='pending'?c.humanVerified!==true:true)));
 const visible=filtered.slice(0,visibleLimit),reviewedTotal=cards.filter(c=>c.humanVerified).length;
 $('#result-count').textContent=catalogError?'Catalog unavailable':filtered.length+' matching | '+reviewedTotal+' human-reviewed of '+cards.length+' total';
 catalogEl.replaceChildren();
 if(catalogError||!filtered.length){
   const empty=node('div','empty-card');
   empty.append(node('h4','',catalogError?'The catalog did not load.':'No reviewed cards match these filters.'));
   empty.append(node('p','',catalogError?'Try reloading. No preferences were sent.':'Try another filter, or browse upcoming identities in the QC queue. Unknown rates are never zero.'));
   catalogEl.append(empty);
 }else{const fragment=document.createDocumentFragment();visible.forEach(c=>fragment.append(makeCard(c)));catalogEl.append(fragment);}
 $('#load-more').hidden=filtered.length<=visible.length;
 $('#load-more').textContent='Show more cards ('+Math.max(0,filtered.length-visible.length)+' remaining)';
 $('#active-filter-count').textContent=activeFiltersCount()+' active';
 $('#compare-bar').hidden=compared.size===0;
 $('#compare-label').textContent=compared.size===1?'1 selected; add at least one more':compared.size+' of '+MAX_COMPARE+' cards selected for factual comparison';
 $('#show-compare').disabled=compared.size<2;
 $('#show-compare').textContent=compared.size>=2?'Compare '+compared.size+' cards':'Select another card';
 identityQuicks.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.identityQuick===identitySelection)));
 quicks.forEach(b=>{const input=checks.find(c=>c.value===b.dataset.quick);b.setAttribute('aria-pressed',String(Boolean(input?.checked)));});
 updateFacetCounts();renderQueue();
}
function showModal(backdrop, focusTarget){lastFocused=document.activeElement;modalOpen=backdrop;backdrop.hidden=false;document.body.classList.add('lock-scroll');focusTarget.focus();}
function closeModal(){if(!modalOpen || modalOpen.id==='trust-backdrop')return;modalOpen.hidden=true;modalOpen=null;document.body.classList.remove('lock-scroll');lastFocused?.focus();}
function detailField(container,title,body){const a=node('article');a.append(node('h3','',title),node('p','',body));container.append(a);}

function offerDescription(offer){
 if(!offer)return 'No independently documented sign-up offer in this snapshot. This is not a zero-dollar bonus.';
 const amount=(offer.unit==='usd'?'$':'')+Number(offer.amount).toLocaleString()+(offer.unit==='usd'?'':' '+offer.unit);
 return (offer.kind==='up_to'?'As high as ':'')+amount+' after $'+Number(offer.minimumSpendUsd).toLocaleString()+
  ' eligible spending in '+offer.monthsToEarn+' months. '+(offer.description||'Check the current issuer terms.')+
  ' Source observed '+(offer.observedAt||'date not recorded')+'. Not guaranteed.';
}
function decodeSection(parent,title,context,rows,expanded){
 const panel=node('details','decode-section');panel.open=expanded;
 panel.append(node('summary','decode-summary',title));
 const content=node('div','decode-section-body');
 if(context)content.append(node('p','decode-intro',context));
 for(const [name,value] of rows){const item=node('div','decode-line');item.append(node('h4','',name),node('p','',value));content.append(item);}
 panel.append(content);parent.append(panel);
}
const approvalContext='Credit score alone does not determine approval. Issuers consider your credit history, income or available assets, current obligations, and their underwriting standards.';
const limitContext='Starting limits are generally set after application. There is no reliable card-specific typical opening limit without issuer evidence.';
function showDetails(card){
 $('#details-backdrop .detail-dialog').classList.remove('is-workbench');
 const ok=card.humanVerified===true;
 const pending='Issuer-specific amount is pending human review.';
 $('#detail-title').textContent=card.name;
 $('#detail-subtitle').textContent=card.issuer+' | '+(ok?'Human QC approved':'Human review pending');
 const body=$('#detail-body');body.replaceChildren();
 body.append(node('p','dialog-lede',ok?'This card has a dated issuer-source snapshot. Always confirm current terms.':'Specific bonus amounts, fees and benefits stay hidden until reviewed. You can still learn what each term means below.'));
 const g=ok?card.approvalGuidance:null,price=ok?card.pricingDetail:null,red=ok?card.redemptionDetail:null,offer=ok?card.welcomeOffer:null;
 const bonus=ok?offerDescription(offer):pending;
 const rewardRules=ok?(card.earnRules?.length?card.earnRules.map(x=>x.label+': '+earnText(x)).join(' | '):'No quantified earning rates in this record.'):pending;
 const points=ok?(red?.examples?.length?red.examples.map(x=>x.method+': '+x.centsPerPoint+' cents per point. '+x.notes).join(' | '):'No issuer-confirmed redemption value in this record.'):pending;
 const benefits=ok?(card.benefits?.length?card.benefits.map(x=>x.name+': '+benefitText(x)).join(' | '):'No quantified benefits documented. This does not mean the card has none.'):pending;
 const introApr=ok&&Number.isFinite(price?.introPurchaseAprPct)&&Number.isFinite(price?.introPurchaseMonths)?price.introPurchaseAprPct+'% for '+price.introPurchaseMonths+' months, then subject to issuer terms.':pending;
 decodeSection(body,'Card overview','What the product is, without a recommendation.',[
  ['Plain-English summary',ok?card.bio||card.plainEnglish:'The card is in the AnCard research directory. Benefits and fees await human review.'],
  ['Review state',ok?'Human-approved issuer-source snapshot':'Pending human approval']
 ],true);
 decodeSection(body,'Welcome and targeted bonuses','Public offers, personalized offers and invitation-only products are distinct.',[
  ['Public welcome offer',bonus],
  ['Spending target and deadline',ok&&offer?'$'+offer.minimumSpendUsd.toLocaleString()+' in '+offer.monthsToEarn+' months of qualifying purchases.':pending],
  ['Targeted or personalized offer',ok?card.targetedOffers?.description||'Not documented for this card.':pending],
  ['Invitation-only offer',ok?card.inviteOnlyOffer?.description||'No documented offer; an invitation does not guarantee approval.':pending],
  ['Fine print to check','Previous-cardholder restrictions, offer channel, eligible purchases, application timing, enrollment and expiration.']
 ],true);
 decodeSection(body,'Borrowing costs and financing','Interest and recurring costs can exceed the value of earned rewards.',[
  ['Annual fee',ok?(card.annualFeeUsd===null?'Not verified':card.annualFeeUsd===0?'$0':'$'+card.annualFeeUsd+' per year'):pending],
  ['Monthly membership charge',ok&&Number.isFinite(card.monthlyFeeUsd)?'$'+card.monthlyFeeUsd+' per month.':'Not verified or not applicable.'],
  ['Introductory purchase APR',introApr],
  ['Other pricing',ok?price?.notes||'See issuer agreement for current APRs, foreign fees, penalty rates and transfer fees.':pending],
  ['Grace period','Look for when purchase interest starts and whether paying the statement balance in full avoids it.']
 ],false);
 decodeSection(body,'Earning, redemption, and point value','An earning multiplier is not a guaranteed cash-back percentage.',[
  ['Earning structure',ok?rewardModels[card.rewardStructure]||'Not classified':pending],
  ['Multipliers, categories and caps',rewardRules],
  ['Cents per point examples',points],
  ['Terms that change value','Check category activation, merchant coding, eligible booking channels, redemption options, transfer rates and point expiry.']
 ],false);
 decodeSection(body,'Credit score, income and starting limit','No score range or limit shown here predicts the outcome of an application.',[
  ['Issuer credit-level description',ok?g?.issuerCreditLevel||'No consistent issuer label confirmed.':pending],
  ['Typical approval score','No trustworthy issuer-published card-specific distribution; a hard numerical threshold would be misleading.'],
  ['Opening credit limit',ok&&Number.isFinite(g?.startingLimitMinUsd)?'Issuer-disclosed minimum of $'+g.startingLimitMinUsd.toLocaleString()+', individual limit still varies.':limitContext],
  ['No preset spending limit',ok&&g?.noPresetSpendingLimit===true?'Issuer says no preset spending limit. This is not unlimited spending.':'Not established for this card.'],
  ['Why income and obligations matter',ok?g?.notes||approvalContext:approvalContext],
  ['Prequalification and inquiries','An invitation or prequalification is not guaranteed approval. An actual application may involve a hard inquiry.']
 ],true);
 decodeSection(body,'Travel benefits and protections','A benefit only works when you meet the enrollment, purchase and claims conditions.',[
  ['Documented credits and protections',benefits],
  ['Global Entry and TSA PreCheck','A credit may cover a qualifying application fee only once per stated multi-year period, not as annual cash.'],
  ['Insurance and other coverage','Look for rental coverage primary versus secondary, covered events, exclusions, reimbursement ceilings and claim deadlines.'],
  ['Important exclusions',ok?card.watchOut:pending]
 ],false);
 const source=node('a','source-link','Read the official issuer source');
 source.href=card.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';body.append(source);
 if(ok&&Array.isArray(card.additionalSources))for(const item of card.additionalSources){if(!item?.url?.startsWith('https://'))continue;const link=node('a','source-link',item.label||'Additional official document');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';body.append(link);}
 body.append(node('p','dialog-note','Educational information only. Current issuer agreements determine interest, fees, benefits and eligibility.'));
 showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}

function showComparison(){
 const chosen=cards.filter(c=>compared.has(c.id));
 if(chosen.length<2)return;
 const backdrop=$('#details-backdrop'),body=$('#detail-body');
 backdrop.querySelector('.detail-dialog').classList.add('is-workbench');
 $('#detail-title').textContent='Your comparison workbench';
 $('#detail-subtitle').textContent=chosen.length+' cards selected. Switch between offers, rewards and costs without a recommendation score.';
 function paint(){
  body.replaceChildren();
  const current=cards.filter(c=>compared.has(c.id));
  if(current.length<2){
   body.append(node('p','dialog-lede','Select at least two cards to keep comparing.'));
   const close=button('Return to card library','small-primary','close','');
   close.addEventListener('click',closeModal);
   body.append(close);return;
  }
  body.append(createComparisonWorkbench(current,{onRemove(id){
   compared.delete(id);render();paint();
   const next=body.querySelector('.workbench-remove');
   (next||backdrop.querySelector('[data-close]'))?.focus({preventScroll:true});
  }}));
 }
 paint();
 showModal(backdrop,backdrop.querySelector('[data-close]'));
}

function updateFilter() {visibleLimit=24;queueLimit=12;render();}
checks.forEach(c=>c.addEventListener('change',updateFilter));
quicks.forEach(button=>button.addEventListener('click',()=>{
 const input=checks.find(c=>c.value===button.dataset.quick);
 if(input){input.checked=!input.checked;updateFilter();}
 $('#catalog').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}));
identityQuicks.forEach(button=>button.addEventListener('click',()=>{
 const value=button.dataset.identityQuick;
 identitySelection=identitySelection===value?'':value;
 updateFilter();
}));
$('#clear-filters').addEventListener('click',()=>{
 checks.forEach(c=>c.checked=false);
 for(const id of ['card-search','issuer-filter'])$('#'+id).value='';
 identitySelection='';$('#review-status').value='approved';
 updateFilter();
});
for(const id of ['card-search','issuer-filter','review-status']){
 $('#'+id).addEventListener(id==='card-search'?'input':'change',updateFilter);
}
$('#sort-by').addEventListener('change',updateFilter);
$('#load-more').addEventListener('click',()=>{
 visibleLimit+=24;render();
 $('#load-more').focus({preventScroll:true});
});
$('#show-art').addEventListener('change',event=>{
  showIllustrations=event.target.checked;
  const licensedOption=$('#show-official-art');
  licensedOption.disabled=!showIllustrations||!cards.some(rightsClearedAsset);
  if(!showIllustrations){licensedOption.checked=false;artEnabled=false;}
  render();
});
$('#show-official-art').addEventListener('change',event=>{artEnabled=event.target.checked;render();});
$('#toggle-filters').addEventListener('click',()=>{
 const open=$('#filter-panel').classList.toggle('is-open');
 $('#toggle-filters').setAttribute('aria-expanded',String(open));
});
catalogEl.addEventListener('click',event=>{
 const target=event.target;
 const article=target.closest('.card-row');
 if(!article)return;
 const detail=target.closest('[data-detail]');
 if(detail){const card=cards.find(c=>c.id===detail.dataset.detail);if(card)showDetails(card);return;}
 const compare=target.closest('[data-compare]');
 if(compare){const id=compare.dataset.compare;if(compared.has(id))compared.delete(id);else if(compared.size<MAX_COMPARE)compared.add(id);else return;
 render();
 const next=[...catalogEl.querySelectorAll('[data-card-id]')].find(el=>el.dataset.cardId===id);
 next?.querySelector('[data-compare]')?.focus({preventScroll:true});
 return;}

});
$('#clear-compare').addEventListener('click',()=>{compared.clear();render();});
$('#show-compare').addEventListener('click',showComparison);
$('#qc-queue').addEventListener('toggle',renderQueue);
$('#qc-queue-more').addEventListener('click',()=>{queueLimit+=12;renderQueue();$('#qc-queue-more').focus({preventScroll:true});});
document.querySelectorAll('#details-backdrop [data-close]').forEach(button=>button.addEventListener('click',closeModal));
$('#details-backdrop').addEventListener('click',e=>{if(e.target===$('#details-backdrop'))closeModal();});
document.addEventListener('keydown',e=>{if(!modalOpen)return;if(e.key==='Escape' && modalOpen.id!=='trust-backdrop'){e.preventDefault();closeModal();}if(e.key==='Tab'){const focusable=[...modalOpen.querySelectorAll('a[href],button:not([disabled]),input,select')].filter(el=>el.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}});
$('#enter-site').addEventListener('click',()=>{$('#trust-backdrop').hidden=true;modalOpen=null;document.body.classList.remove('lock-scroll');$('#main').focus?.();$('#catalog-title').setAttribute('tabindex','-1');$('#catalog-title').focus();});
// Always acknowledge anew on reload. No persistence of the acknowledgment or selections.
showModal($('#trust-backdrop'),$('#enter-site'));
async function loadCatalog(){
 try{
   const response=await fetch('./data/cards.json',{cache:'no-store'});
   if(!response.ok)throw new Error('Catalog HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data.cards))throw new Error('Invalid catalog response');
   cards=data.cards.filter(c=>c.status==='published'||c.status==='pending_review');
   const select=$('#issuer-filter');
   for(const issuer of [...new Set(cards.map(c=>c.issuer))].sort((a,b)=>a.localeCompare(b))){
     const option=node('option','',issuer);option.value=issuer;select.append(option);
   }
   const licensed=cards.filter(rightsClearedAsset).length;
   $('#official-art-option').hidden=licensed===0;
   $('#show-official-art').disabled=licensed===0||!showIllustrations;
   $('#art-status').textContent=licensed===0
     ?'Locally generated AnCard illustrations. No bank-image requests or issuer image licenses are being implied.'
     :'Locally generated AnCard illustrations. '+licensed+' authorized issuer assets can be enabled separately with consent.';
   updateQcProgress(data.reviewProgress);
 }catch(error){catalogError=true;console.error('Catalog unavailable',error);}
 render();
}
loadCatalog();
