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
  const filtered=sortCards(cards.filter(c=>matches(c,activeFilters())));
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
  if(card.humanVerified){detailField(grid,'Source last checked on',card.verifiedAt);detailField(grid,'Verification scope',card.verificationLevel==='selected-issuer-page-facts'?'Selected product facts, not complete terms':'See methodology');const source=node('a','source-link','Open official issuer source ↗');source.href=card.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';grid.append(source);
    if(Array.isArray(card.additionalSources))for(const item of card.additionalSources){if(!item||typeof item.url!=='string'||!item.url.startsWith('https://'))continue;const secondary=node('a','source-link',item.label||'Additional source ↗');secondary.href=item.url;secondary.target='_blank';secondary.rel='noopener noreferrer';secondary.referrerPolicy='no-referrer';grid.append(secondary);}
  }else {detailField(grid,'Review status','This card has not passed human QC. Fees, rewards, APRs, bonuses and benefits are hidden until reviewed.');const source=node('a','source-link','Check official issuer source ↗');source.href=card.issuerSource;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';grid.append(source);}
  body.append(grid,node('p','dialog-note','Educational information only. The issuer agreement controls actual fees, eligibility, rates, and rewards. Some terms in this source snapshot are not verified; review official disclosures.'));
  showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}
function showComparison() {
  const chosen=cards.filter(c=>compared.has(c.id));if(!chosen.length)return;
  $('#detail-title').textContent='Compare your selections';$('#detail-subtitle').textContent='Neutral side-by-side information — no rankings, scores, or winning card.';
  const body=$('#detail-body');body.replaceChildren();const table=node('table','comparison-table');const thead=node('thead');const head=node('tr');head.append(node('th','','Attribute'));
  chosen.forEach(c=>head.append(node('th','',c.name)));thead.append(head);table.append(thead);
  const tbody=node('tbody');[['Rewards',c=>c.humanVerified?c.rewards.map(v=>labels[v]).join(', ')||'Not specified':'Pending review'],['Categories',c=>c.humanVerified?c.categories.map(v=>labels[v]).join(', ')||'Not specified':'Pending review'],['Annual fee',c=>!c.humanVerified?'Pending review':c.annualFeeUsd===null?'Unspecified':c.annualFeeUsd===0?'$0':`$${c.annualFeeUsd}`],['Important limit',c=>c.limitations],['Verification',c=>c.humanVerified?'Human QC approved':'Pending review']].forEach(([title,value])=>{const tr=node('tr');tr.append(node('th','',title));chosen.forEach(c=>tr.append(node('td','',value(c))));tbody.append(tr);});table.append(tbody);body.append(table,node('p','dialog-note','Every comparison value comes directly from the published card records. Check the current issuer agreement; this source snapshot does not cover every term.'));
  showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}

checks.forEach(c=>c.addEventListener('change',render));
quicks.forEach(button=>button.addEventListener('click',()=>{const input=checks.find(c=>c.value===button.dataset.quick);if(input){input.checked=!input.checked;render();}$('#catalog').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
$('#clear-filters').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);render();});
$('#sort-by').addEventListener('change',render);
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
async function loadCatalog(){try{const response=await fetch('./data/cards.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data.cards))throw new Error('Invalid catalog');cards=data.cards.filter(card=>card.status==='pending_review'||card.status==='published');}catch(error){catalogError=true;console.error('Catalog load failed:',error);}render();}
loadCatalog();
