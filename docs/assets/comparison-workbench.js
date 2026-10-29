// Shared, browser-memory-only factual comparison workbench.
// No scores, rankings, external data calls, tracking or stored selections.
export const MAX_COMPARE=4;
const UNKNOWN='Not documented in the reviewed snapshot';
const PENDING='Card facts pending human QC';
const dollar=n=>typeof n==='number'?'$'+n.toLocaleString('en-US'):'Not verified';
const clean=s=>String(s??'');
const node=(tag,className,value)=>{
 const item=document.createElement(tag);
 if(className)item.className=className;
 if(value!==undefined)item.textContent=clean(value);
 return item;
};
const safeLink=(url,title)=>{
 if(typeof url!=='string'||!/^https:\/\/[^\s]+$/i.test(url))return node('span','workbench-muted','No verified source');
 const link=node('a','workbench-link',title);
 link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';
 return link;
};
export function formatOffer(card){
 if(!card?.humanVerified)return {status:'Pending card QC',headline:PENDING,spend:PENDING,timing:PENDING,eligibility:PENDING,source:null,observedAt:null};
 const approved=card.signUpBenefit;
 if(approved){
  if(approved.kind==='not_available')return {status:'No new-application offer verified',headline:approved.headline,spend:'Not applicable',timing:'Not applicable',eligibility:approved.offerDetails||UNKNOWN,source:approved.source,observedAt:approved.observedAt};
  const milestones=Array.isArray(approved.milestones)?approved.milestones:[];
  return {
   status:'Separately human-reviewed offer',
   headline:approved.headline||UNKNOWN,
   spend:milestones.length?milestones.map((step,i)=>(approved.kind==='channel_variation'?'Channel option ':'Milestone ')+(i+1)+': '+dollar(step.minimumSpendUsd)+' eligible purchases').join('; '):approved.instantBenefit?.spendRequired===false?'No minimum purchase spending required':'See official offer',
   timing:milestones.length?milestones.map((step,i)=>(approved.kind==='channel_variation'?'Channel option ':'Milestone ')+(i+1)+': '+(step.windowDays?step.windowDays+' days':step.monthsToEarn+' months')).join('; '):approved.instantBenefit?.trigger||'See terms',
   eligibility:approved.offerDetails||UNKNOWN,
   source:approved.source||null,
   observedAt:approved.observedAt||null
  };
 }
 const offer=card.welcomeOffer;
 if(offer){
  const amount=(offer.unit==='usd'?'$':'')+Number(offer.amount).toLocaleString('en-US')+(offer.unit==='usd'?'':' '+offer.unit);
  return {status:'Dated issuer-source snapshot; availability varies',
   headline:(offer.kind==='up_to'?'As high as ':'')+amount,
   spend:dollar(offer.minimumSpendUsd)+' eligible purchases',
   timing:offer.monthsToEarn+' months from account opening',
   eligibility:offer.description||'Personalized, channel-specific and past-cardholder restrictions may apply. Not guaranteed.',
   source:offer.source||null,observedAt:offer.observedAt||null
  };
 }
 return {status:'Sign-up offer not independently documented',headline:'Not verified, not a zero-dollar offer',spend:UNKNOWN,timing:UNKNOWN,eligibility:'Do not assume an offer exists or is available. Check the current issuer source.',source:null,observedAt:null};
}
const earnRule=r=>{
 const rate=Number.isFinite(r.rate)?r.rate+(r.unit==='percent'?'%':'X'):'Rate not verified';
 const cap=Number.isFinite(r.capAmountUsd)?'; spending cap '+dollar(r.capAmountUsd)+(r.capPeriod?' / '+r.capPeriod:''):'';
 return (r.label||'Eligible purchases')+': '+rate+cap+(r.condition?'; '+r.condition:'');
};
const benefits=c=>c.humanVerified?(c.benefits?.length?c.benefits.map(b=>b.name+(Number.isFinite(b.amountUsd)?' (up to '+dollar(b.amountUsd)+')':'')+(b.condition?'; '+b.condition:'')).join('; '):'No quantified extras recorded; does not mean none'):PENDING;
const rewards=c=>c.humanVerified?(c.earnRules?.length?c.earnRules.map(earnRule).join('; '):'Earning rules not separately documented'):PENDING;
const redemption=c=>c.humanVerified?(c.redemptionDetail?.examples?.length?c.redemptionDetail.examples.map(x=>x.method+': '+x.centsPerPoint+' cents/point').join('; '):'Redemption value not verified; points are not equivalent to dollars'):PENDING;
const fee=c=>!c.humanVerified?PENDING:c.annualFeeUsd===null?UNKNOWN:dollar(c.annualFeeUsd)+' / year';
const month=c=>!c.humanVerified?PENDING:Number.isFinite(c.monthlyFeeUsd)?dollar(c.monthlyFeeUsd)+' / month':'Not documented or not applicable';
const apr=c=>!c.humanVerified?PENDING:Number.isFinite(c.pricingDetail?.introPurchaseAprPct)?c.pricingDetail.introPurchaseAprPct+'% for '+c.pricingDetail.introPurchaseMonths+' months, then regular terms apply':'Not independently verified; consult issuer agreement';
function workbenchRows(){
 return [
  {id:'overview',title:'Card facts',rows:[
   ['Human QC status',c=>c.humanVerified?'Human-reviewed card facts':'Pending human QC'],
   ['Card snapshot date',c=>c.humanVerified?c.verifiedAt||UNKNOWN:PENDING],
   ['Annual fee',fee],
   ['Reward summary',c=>c.humanVerified?c.primaryLabel||UNKNOWN:PENDING]
  ]},
  {id:'signup',title:'Sign-up benefits',rows:[
   ['Offer status',c=>formatOffer(c).status],
   ['Sign-up bonus',c=>formatOffer(c).headline],
   ['Minimum spending',c=>formatOffer(c).spend],
   ['Time to qualify',c=>formatOffer(c).timing],
   ['Eligibility and exclusions',c=>formatOffer(c).eligibility],
   ['Offer observed',c=>formatOffer(c).observedAt||UNKNOWN],
   ['Issuer offer evidence',c=>formatOffer(c).source?{url:formatOffer(c).source,label:'Issuer offer source'}:UNKNOWN]
  ]},
  {id:'rewards',title:'Earning and redemption',rows:[
   ['Earning rules and caps',rewards],
   ['Redemption detail',redemption],
   ['Documented credits and benefits',benefits]
  ]},
  {id:'terms',title:'Costs and restrictions',rows:[
   ['Monthly fee',month],
   ['Intro purchase APR',apr],
   ['Key restrictions',c=>c.humanVerified?c.watchOut||UNKNOWN:PENDING],
   ['Issuer reference',c=>({url:c.issuerSource,label:'Official card source'})]
  ]}
 ];
}
export function createComparisonWorkbench(selectedCards,{onRemove}={}){
 const cards=selectedCards.slice(0,MAX_COMPARE);
 const root=node('section','comparison-workbench');
 root.setAttribute('aria-label','Neutral side-by-side card terms');
 root.append(node('p','workbench-note','Compare facts, not recommendations. Unknown does not mean zero. Sign-up offers vary by issuer channel, approval and prior card history.'));
 const filters=node('div','workbench-filters');
 filters.setAttribute('role','group');
 filters.setAttribute('aria-label','Filter compared terms');
 const groups=workbenchRows();
 const targets=new Map();
 let active='all';
 const buttonById=new Map();
 function changeGroup(next){
  active=next;
  for(const [id,body] of targets)body.hidden=next!=='all'&&next!==id;
  for(const [id,button] of buttonById)button.setAttribute('aria-pressed',String(id===active));
 }
 for(const [id,title] of [['all','All terms'],...groups.map(g=>[g.id,g.title])]){
  const b=node('button','workbench-filter',title);b.type='button';
  b.setAttribute('aria-pressed',String(id===active));
  b.addEventListener('click',()=>changeGroup(id));
  buttonById.set(id,b);filters.append(b);
 }
 root.append(filters);
 const scroll=node('div','workbench-scroll');
 scroll.setAttribute('role','region');scroll.setAttribute('tabindex','0');
 scroll.setAttribute('aria-label','Scroll horizontally to compare up to four credit cards');
 const table=node('table','workbench-table');
 table.style.minWidth=Math.max(670,205+210*cards.length)+'px';
 const head=node('thead');const heading=node('tr');
 const key=node('th','workbench-term-heading','Comparison term');key.scope='col';heading.append(key);
 for(const c of cards){
  const th=node('th','workbench-card-heading');th.scope='col';
  th.append(node('strong','',c.name),node('span','workbench-issuer',c.issuer));
  if(typeof onRemove==='function'){
   const remove=node('button','workbench-remove','Remove');
   remove.type='button';remove.setAttribute('aria-label','Remove '+c.name+' from comparison');
   remove.addEventListener('click',()=>onRemove(c.id));th.append(remove);
  }
  heading.append(th);
 }
 head.append(heading);table.append(head);
 for(const section of groups){
  const tbody=node('tbody','workbench-section');
  tbody.dataset.section=section.id;
  const hr=node('tr','workbench-section-heading'),col=node('th','',section.title);
  col.scope='colgroup';col.colSpan=cards.length+1;hr.append(col);tbody.append(hr);
  for(const [label,getValue] of section.rows){
   const tr=node('tr'),labelCell=node('th','workbench-row-label',label);
   labelCell.scope='row';tr.append(labelCell);
   for(const c of cards){
    const value=getValue(c),cell=node('td');
    if(value&&typeof value==='object'&&value.url)cell.append(safeLink(value.url,value.label||'Source'));
    else cell.textContent=clean(value);
    tr.append(cell);
   }
   tbody.append(tr);
  }
  table.append(tbody);targets.set(section.id,tbody);
 }
 scroll.append(table);root.append(scroll);
 root.append(node('p','workbench-footer','No affiliate ranking, predicted approval score, implied cash value for miles, or fabricated missing terms. Financial terms remain subject to the current issuer agreement.'));
 return root;
}
