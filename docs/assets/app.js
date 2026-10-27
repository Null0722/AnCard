// AnCard: no cookies, localStorage, sessionStorage, tracking, or network submissions.
// The only app data request is the read-only, same-origin published catalog JSON.
const catalogEl = document.querySelector('#card-results');
const checks = [...document.querySelectorAll('[data-facet]')];
const quicks = [...document.querySelectorAll('[data-quick]')];
const compared = new Set();
let artEnabled = false; // In-memory only: default off after every navigation or reload.
function createCardArt(card) {
  const visual=node('div','card-art tone-'+card.tone);
  const asset=card.imageFront;
  if(artEnabled && asset && asset.url) {
    const image=node('img');image.alt=asset.alt||('Front of '+card.name);
    image.referrerPolicy='no-referrer';image.loading='lazy';image.decoding='async';
    image.addEventListener('error',()=>{visual.classList.remove('loaded-art');visual.replaceChildren(node('span','',card.issuer.slice(0,2).toUpperCase()));});
    // src is assigned only after a real user turns on the opt-in checkbox.
    image.src=asset.url;visual.replaceChildren(image);visual.classList.add('loaded-art');
  }else{
    visual.append(node('span','',card.issuer.split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase()));
    visual.title=asset?'Official card image disabled for privacy':'Official card art not available';
  }
  return visual;
}

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
function makeCard(card) {
  const article=node('article','card-row');
  article.append(createCardArt(card));
  const info=node('div','card-info');info.append(node('h4','',card.name),node('div','card-meta',`${card.issuer} · ${card.status==='pending_review'?'Pending human review':(card.status==='demo'?'Fictional example':'Human QC approved')}`),node('p','card-desc',card.summary));
  const tags=node('div','card-tags');[...card.rewards,...card.categories,...card.features.filter(v=>v==='airline')].slice(0,3).forEach(t=>tags.append(node('span','',labels[t]??t)));info.append(tags);article.append(info);
  const terms=node('div','card-term');terms.append(node('strong','',card.primaryLabel),node('span','',card.feeSummary));article.append(terms);
  const actions=node('div','card-actions');const detail=node('button','link-button','Decode terms: offers and limits ↗');detail.type='button';detail.dataset.detail=card.id;const compare=node('button','compare-button',compared.has(card.id)?'✓ Added':'＋ Compare');compare.type='button';compare.dataset.compare=card.id;compare.setAttribute('aria-pressed',String(compared.has(card.id)));
  const verified=node('span','card-verification',card.humanVerified?'Human QC approved':'Pending human review');actions.append(detail,compare,verified);article.append(actions);return article;
}
function render() {
  const query=$('#card-search').value.trim().toLocaleLowerCase();
  const approvedOnly=$('#reviewed-only').checked;
  const filtered=sortCards(cards.filter(c=>matches(c,activeFilters())
    && (!approvedOnly||c.humanVerified===true)
    && (!query||[c.name,c.issuer,c.airlineProgram].filter(Boolean).some(value=>value.toLocaleLowerCase().includes(query)))));
  const count=$('#result-count');count.textContent=catalogError?'Catalog unavailable':`${filtered.length} cards · ${filtered.filter(c=>c.humanVerified).length} human-reviewed · ${$('#sort-by').selectedOptions[0].textContent}`;
  catalogEl.replaceChildren();
  if(catalogError || !filtered.length){const empty=node('div','empty-card');empty.append(node('h4','',catalogError?'We could not load the catalog.':'No cards match those filters.'),node('p','',catalogError?'Try reloading the page. No preferences were transmitted.':'Try removing a filter to explore more cards. We do not select alternatives for you.'));catalogEl.append(empty);}
  else filtered.forEach(card=>catalogEl.append(makeCard(card)));
  quicks.forEach(button=>{const input=checks.find(c=>c.value===button.dataset.quick);button.setAttribute('aria-pressed',String(Boolean(input?.checked)));});
  $('#compare-bar').hidden=compared.size===0;
  $('#compare-label').textContent=`${compared.size} of 3 cards selected for factual comparison`;
}
function showModal(backdrop, focusTarget){lastFocused=document.activeElement;modalOpen=backdrop;backdrop.hidden=false;document.body.classList.add('lock-scroll');focusTarget.focus();}
function closeModal(){if(!modalOpen || modalOpen.id==='trust-backdrop')return;modalOpen.hidden=true;modalOpen=null;document.body.classList.remove('lock-scroll');lastFocused?.focus();}
function detailField(container,title,body){const a=node('article');a.append(node('h3','',title),node('p','',body));container.append(a);}

function offerDescription(offer){
 if(!offer)return 'No current card-specific welcome offer has been confirmed in this record.';
 const amount=(offer.unit==='usd'?'$':'')+Number(offer.amount).toLocaleString()+(offer.unit==='usd'?'':' '+offer.unit);
 return (offer.kind==='up_to'?'As high as ':'')+amount+' after $'+Number(offer.minimumSpendUsd).toLocaleString()+' eligible spending in '+offer.monthsToEarn+' months. '+(offer.description||'Confirm current issuer rules.');
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

function showComparison() {
 const chosen=cards.filter(c=>compared.has(c.id));if(!chosen.length)return;
 $('#detail-title').textContent='Compare your selections';
 $('#detail-subtitle').textContent='Neutral side-by-side facts, without rankings or card recommendations.';
 const body=$('#detail-body');body.replaceChildren();
 const table=node('table','comparison-table');const thead=node('thead');const head=node('tr');head.append(node('th','','Attribute'));
 chosen.forEach(c=>head.append(node('th','',c.name)));thead.append(head);table.append(thead);
 const unknown='Pending human review';
 const earns=c=>!c.humanVerified?unknown:Array.isArray(c.earnRules)&&c.earnRules.length?c.earnRules.map(r=>r.label+': '+earnText(r)).join('; '):'Not separately quantified';
 const perks=c=>!c.humanVerified?unknown:Array.isArray(c.benefits)&&c.benefits.length?c.benefits.map(p=>p.name+': '+benefitText(p)).join('; '):'No quantified benefits in this record';
 const rows=[
  ['Human QC',c=>c.humanVerified?'Human reviewed':'Pending review'],
  ['Annual fee',c=>!c.humanVerified?unknown:c.annualFeeUsd===null?'Not verified':c.annualFeeUsd===0?'$0':'$'+c.annualFeeUsd],
  ['Monthly fee',c=>!c.humanVerified?unknown:typeof c.monthlyFeeUsd==='number'?'$'+c.monthlyFeeUsd+' per month':'Not verified'],
  ['Reward model',c=>!c.humanVerified?unknown:rewardModels[c.rewardStructure]||'Not classified'],
  ['Earn categories and caps',earns],
  ['Travel credits and protections',perks],
  ['Card overview',c=>!c.humanVerified?unknown:c.bio||c.summary],
  ['Important restrictions',c=>c.humanVerified?c.watchOut:unknown]
 ];
 const tbody=node('tbody');for(const [name,fn] of rows){const tr=node('tr');tr.append(node('th','',name));chosen.forEach(c=>tr.append(node('td','',fn(c))));tbody.append(tr);}
 table.append(tbody);
 const scroll=node('div','compare-scroller');scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Scroll horizontally to compare selected cards');scroll.setAttribute('tabindex','0');scroll.append(table);
 body.append(scroll,node('p','dialog-note','Benefits and earn rates appear only after human review. Monetary amounts are conditional and not guaranteed. Confirm the issuer agreement.'));
 showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}

checks.forEach(c=>c.addEventListener('change',render));
quicks.forEach(button=>button.addEventListener('click',()=>{const input=checks.find(c=>c.value===button.dataset.quick);if(input){input.checked=!input.checked;render();}$('#catalog').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
$('#clear-filters').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);$('#card-search').value='';$('#reviewed-only').checked=false;render();});
$('#sort-by').addEventListener('change',render);
$('#card-search').addEventListener('input',render);
$('#reviewed-only').addEventListener('change',render);
$('#show-art').addEventListener('change',event=>{artEnabled=event.target.checked;render();});
$('#toggle-filters').addEventListener('click',()=>{const open=$('#filter-panel').classList.toggle('is-open');$('#toggle-filters').setAttribute('aria-expanded',String(open));});
catalogEl.addEventListener('click',event=>{const detail=event.target.closest('[data-detail]');if(detail){const card=cards.find(c=>c.id===detail.dataset.detail);if(card)showDetails(card);return;}const toggle=event.target.closest('[data-compare]');if(toggle){const id=toggle.dataset.compare;if(compared.has(id))compared.delete(id);else if(compared.size<3)compared.add(id);else{showComparison();return;}render();}});
$('#clear-compare').addEventListener('click',()=>{compared.clear();render();});
$('#show-compare').addEventListener('click',showComparison);
document.querySelectorAll('#details-backdrop [data-close]').forEach(button=>button.addEventListener('click',closeModal));
$('#details-backdrop').addEventListener('click',e=>{if(e.target===$('#details-backdrop'))closeModal();});
document.addEventListener('keydown',e=>{if(!modalOpen)return;if(e.key==='Escape' && modalOpen.id!=='trust-backdrop'){e.preventDefault();closeModal();}if(e.key==='Tab'){const focusable=[...modalOpen.querySelectorAll('a[href],button:not([disabled]),input,select')].filter(el=>el.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}});
$('#enter-site').addEventListener('click',()=>{$('#trust-backdrop').hidden=true;modalOpen=null;document.body.classList.remove('lock-scroll');$('#main').focus?.();$('#catalog-title').setAttribute('tabindex','-1');$('#catalog-title').focus();});
// Always acknowledge anew on reload. No persistence of the acknowledgment or selections.
showModal($('#trust-backdrop'),$('#enter-site'));
async function loadCatalog(){try{const response=await fetch('./data/cards.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data.cards))throw new Error('Invalid catalog');cards=data.cards.filter(card=>card.status==='pending_review'||card.status==='published');updateQcProgress(data.reviewProgress);}catch(error){catalogError=true;console.error('Catalog load failed:',error);}render();}
loadCatalog();
