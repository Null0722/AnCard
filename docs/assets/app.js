// AnCard: no cookies, localStorage, sessionStorage, tracking, or network submissions.
// The only app data request is the read-only, same-origin published catalog JSON.
const catalogEl = document.querySelector('#card-results');
const checks = [...document.querySelectorAll('[data-facet]')];
const quicks = [...document.querySelectorAll('[data-quick]')];
const compared = new Set();
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

const labels = {cash_back:'Cash back',points:'Points',miles:'Miles',groceries:'Groceries',travel:'Travel',dining:'Dining',online:'Online',gas:'Gas & transit',lifestyle:'Lifestyle'};

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
  const art=node('div',`card-art tone-${card.tone}`);art.setAttribute('aria-hidden','true');article.append(art);
  const info=node('div','card-info');info.append(node('h4','',card.name),node('div','card-meta',`${card.issuer} · ${card.status==='demo'?'Fictional example':'Verified listing'}`),node('p','card-desc',card.summary));
  const tags=node('div','card-tags');[...card.rewards,...card.categories].slice(0,3).forEach(t=>tags.append(node('span','',labels[t]??t)));info.append(tags);article.append(info);
  const terms=node('div','card-term');terms.append(node('strong','',card.primaryLabel),node('span','',card.feeSummary));article.append(terms);
  const actions=node('div','card-actions');const detail=node('button','link-button','Decode terms ↗');detail.type='button';detail.dataset.detail=card.id;const compare=node('button','compare-button',compared.has(card.id)?'✓ Added':'＋ Compare');compare.type='button';compare.dataset.compare=card.id;compare.setAttribute('aria-pressed',String(compared.has(card.id)));
  const verified=node('span','card-verification',card.status==='demo'?'Demo only · No issuer offer':`Verified ${card.verifiedAt}`);actions.append(detail,compare,verified);article.append(actions);return article;
}
function render() {
  const filtered=sortCards(cards.filter(c=>matches(c,activeFilters())));
  const count=$('#result-count');count.textContent=catalogError?'Catalog unavailable':`${filtered.length} example card${filtered.length===1?'':'s'} · ${$('#sort-by').selectedOptions[0].textContent}`;
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
  $('#detail-title').textContent=card.name;$('#detail-subtitle').textContent=`${card.issuer} · ${card.status==='demo'?'Fictional demonstration':'Published listing'}`;
  const body=$('#detail-body');body.replaceChildren();const grid=node('div','detail-fields');
  detailField(grid,'In plain English',card.plainEnglish);detailField(grid,'What to watch for',card.watchOut);detailField(grid,'Annual fee',card.annualFeeUsd === null?'Not provided':card.annualFeeUsd===0?'No annual fee':`$${card.annualFeeUsd} per year`);detailField(grid,'Important limits',card.limitations);
  if(card.status==='published'){detailField(grid,'Issuer source',card.issuerSource);detailField(grid,'Verified on',card.verifiedAt);}else {detailField(grid,'Source status','Fictional example. No actual issuer terms or APRs are represented.');}
  body.append(grid,node('p','dialog-note','Educational information only. The issuer agreement controls actual fees, eligibility, rates, and rewards. Preview entries are not financial offers.'));
  showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}
function showComparison() {
  const chosen=cards.filter(c=>compared.has(c.id));if(!chosen.length)return;
  $('#detail-title').textContent='Compare your selections';$('#detail-subtitle').textContent='Neutral side-by-side information — no rankings, scores, or winning card.';
  const body=$('#detail-body');body.replaceChildren();const table=node('table','comparison-table');const thead=node('thead');const head=node('tr');head.append(node('th','','Attribute'));
  chosen.forEach(c=>head.append(node('th','',c.name)));thead.append(head);table.append(thead);
  const tbody=node('tbody');[['Rewards',c=>c.rewards.map(v=>labels[v]).join(', ')||'None listed'],['Categories',c=>c.categories.map(v=>labels[v]).join(', ')||'None listed'],['Annual fee',c=>c.annualFeeUsd===null?'Unspecified':c.annualFeeUsd===0?'$0':`$${c.annualFeeUsd}`],['Important limit',c=>c.limitations],['Verification',c=>c.status==='demo'?'Fictional example':`Verified ${c.verifiedAt}`]].forEach(([title,value])=>{const tr=node('tr');tr.append(node('th','',title));chosen.forEach(c=>tr.append(node('td','',value(c))));tbody.append(tr);});table.append(tbody);body.append(table,node('p','dialog-note','Every comparison value comes directly from the published card records. These demo cards are fictional and not actual offers.'));
  showModal($('#details-backdrop'),$('#details-backdrop [data-close]'));
}

checks.forEach(c=>c.addEventListener('change',render));
quicks.forEach(button=>button.addEventListener('click',()=>{const input=checks.find(c=>c.value===button.dataset.quick);if(input){input.checked=!input.checked;render();}$('#catalog').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));
$('#clear-filters').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);render();});
$('#sort-by').addEventListener('change',render);
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
async function loadCatalog(){try{const response=await fetch('./data/cards.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data.cards))throw new Error('Invalid catalog');cards=data.cards.filter(card=>card.status==='demo'||card.status==='published');}catch(error){catalogError=true;console.error('Catalog load failed:',error);}render();}
loadCatalog();
