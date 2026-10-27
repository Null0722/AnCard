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
  const actions=node('div','card-actions');const detail=node('button','link-button','Decode terms ↗');detail.type='button';detail.dataset.detail=card.id;const compare=node('button','compare-button',compared.has(card.id)?'✓ Added':'＋ Compare');compare.type='button';compare.dataset.compare=card.id;compare.setAttribute('aria-pressed',String(compared.has(card.id)));
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
function showDetails(card) {
  $('#detail-title').textContent=card.name;$('#detail-subtitle').textContent=`${card.issuer} · ${card.status==='pending_review'?'Human review pending':'Human QC approved'}`;
  const body=$('#detail-body');body.replaceChildren();const grid=node('div','detail-fields');
  detailField(grid,'In plain English',card.plainEnglish);detailField(grid,'What to watch for',card.watchOut);detailField(grid,'Annual fee',card.annualFeeUsd === null?'Not provided':card.annualFeeUsd===0?'No annual fee':`$${card.annualFeeUsd} per year`);detailField(grid,'Important limits',card.limitations);
  if(card.humanVerified){
    detailField(grid,'Card overview',card.bio||card.summary);
    detailField(grid,'Rewards model',rewardModels[card.rewardStructure]||'Earning structure not yet classified');
    if(typeof card.monthlyFeeUsd==='number')detailField(grid,'Monthly membership fee','$'+card.monthlyFeeUsd+' each month, separate from the annual fee');
    if(Array.isArray(card.earnRules)&&card.earnRules.length)for(const rule of card.earnRules)detailField(grid,'Earn: '+rule.label,earnText(rule));
    else detailField(grid,'Detailed earning rates','Not separately quantified in the approved record');
    if(Array.isArray(card.benefits)&&card.benefits.length)for(const benefit of card.benefits)detailField(grid,'Benefit: '+benefit.name,benefitText(benefit));
    else detailField(grid,'Travel and additional benefits','No quantified perks in the approved record. This does not mean the card has no perks.');
    detailField(grid,'Source last checked on',card.verifiedAt);detailField(grid,'Verification scope',card.verificationLevel==='selected-issuer-page-facts'?'Selected product facts, not complete terms':'See methodology');const source=node('a','source-link','Open official issuer source ↗');source.href=card.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';grid.append(source);
    if(Array.isArray(card.additionalSources))for(const item of card.additionalSources){if(!item||typeof item.url!=='string'||!item.url.startsWith('https://'))continue;const secondary=node('a','source-link',item.label||'Additional source ↗');secondary.href=item.url;secondary.target='_blank';secondary.rel='noopener noreferrer';secondary.referrerPolicy='no-referrer';grid.append(secondary);}
  }else {detailField(grid,'Review status','This card has not passed human QC. Fees, rewards, APRs, bonuses and benefits are hidden until reviewed.');const source=node('a','source-link','Check official issuer source ↗');source.href=card.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';grid.append(source);}
  body.append(grid,node('p','dialog-note','Educational information only. The issuer agreement controls actual fees, eligibility, rates, and rewards. Some terms in this source snapshot are not verified; review official disclosures.'));
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
