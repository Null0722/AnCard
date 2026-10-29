#!/usr/bin/env node
// Dependency-free catalog compiler: one JSON record per card; a single public JSON payload.
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {candidateFrom} from './review-fields.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const source=resolve(root,'catalog/cards');
const target=resolve(root,'docs/data/cards.json');
const reviewPath=resolve(root,'catalog/HUMAN-QC.json');
const offerReviewPath=resolve(root,'catalog/OFFER-QC.json');
const args=new Set(process.argv.slice(2));
const demoTones=new Set(['sand','blue','berry','green','slate']);
const rewards=new Set(['cash_back','points','miles']);
const categories=new Set(['groceries','dining','travel','online','gas','lifestyle']);
const features=new Set(['secured','student','airline']);
const requiredText=['id','name','issuer','summary','primaryLabel','feeSummary','plainEnglish','watchOut','limitations'];
const fail=(filename,message)=>{throw new Error(`${filename}: ${message}`)};
function validate(c,filename){
  if(!c || typeof c!=='object' || Array.isArray(c))fail(filename,'must be an object');
  for(const k of requiredText)if(typeof c[k]!=='string'||!c[k].trim())fail(filename,`missing text field ${k}`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id))fail(filename,'id must be kebab-case');
  if(filename!==`${c.id}.json`)fail(filename,'file name must match card id');
  if(!['demo','draft','review','published','archived'].includes(c.status))fail(filename,'unknown status');
  if(!demoTones.has(c.tone))fail(filename,'unknown tone');
  for(const [key,allowed] of [['rewards',rewards],['categories',categories],['features',features]]) {
    if(!Array.isArray(c[key])||new Set(c[key]).size!==c[key].length||!c[key].every(v=>allowed.has(v)))fail(filename,`invalid ${key}`);
  }
  if(c.annualFeeUsd!==null&&(!Number.isInteger(c.annualFeeUsd)||c.annualFeeUsd<0))fail(filename,'annualFeeUsd must be a non-negative whole number or null');
  if(c.monthlyFeeUsd!==undefined&&c.monthlyFeeUsd!==null&&(!Number.isFinite(c.monthlyFeeUsd)||c.monthlyFeeUsd<0))fail(filename,'monthlyFeeUsd must be non-negative or null');
  if(c.earnRules!==undefined&&!Array.isArray(c.earnRules))fail(filename,'earnRules must be a list');
  if(c.benefits!==undefined&&!Array.isArray(c.benefits))fail(filename,'benefits must be a list');
  if(c.welcomeOffer!==undefined&&c.welcomeOffer!==null){
    const offer=c.welcomeOffer;
    if(!['fixed','up_to'].includes(offer.kind)||!Number.isFinite(offer.amount)||offer.amount<0||!['usd','miles','points'].includes(offer.unit)
      ||!Number.isFinite(offer.minimumSpendUsd)||offer.minimumSpendUsd<0||!Number.isInteger(offer.monthsToEarn)||offer.monthsToEarn<1
      ||!/^https:\/\//.test(offer.source)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(offer.observedAt))fail(filename,'malformed welcomeOffer');
  }
  if(c.approvalGuidance!==undefined&&c.approvalGuidance!==null&&typeof c.approvalGuidance!=='object')fail(filename,'approvalGuidance must be an object');
  if(c.redemptionDetail!==undefined&&c.redemptionDetail!==null){
    if(!Array.isArray(c.redemptionDetail.examples)||!c.redemptionDetail.examples.every(x=>typeof x.method==='string'&&Number.isFinite(x.centsPerPoint)&&x.centsPerPoint>=0))fail(filename,'invalid documented redemption example');
  }
  if(c.status==='published'){
    if(c.fictional!==false)fail(filename,'published cards cannot be fictional');
    if(typeof c.verifiedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(c.verifiedAt)||!Number.isFinite(Date.parse(c.verifiedAt))||c.verifiedAt>new Date().toISOString().slice(0,10))fail(filename,'published cards require valid, nonfuture verifiedAt');
    try {const url=new URL(c.issuerSource);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!url.hostname.includes('.'))throw new Error('Invalid source');}catch{fail(filename,'published cards require a clean HTTPS issuerSource with no query, fragment or credentials');}
    if(c.verificationLevel!=='selected-issuer-page-facts')fail(filename,'published cards must identify verification scope');
    if(c.imageFront!==null && c.imageFront!==undefined){
      const image=c.imageFront;
      if(typeof image.alt!=='string'||!image.alt.trim()||typeof image.url!=='string')fail(filename,'invalid image metadata');
      const host=new URL(image.url).hostname;
      const approved={"Chase":["creditcards.chase.com"],"Capital One":["ecm.capitalone.com"],"U.S. Bank":["www.usbank.com"]};
      if(!approved[c.issuer]?.includes(host)||!image.url.startsWith('https://')||new URL(image.url).search)fail(filename,'card art requires reviewed official host and clean https URL');
    }
  }else if(c.status==='demo' && c.fictional!==true){fail(filename,'demo cards must be explicitly fictional');}
  if(c.status==='demo' && (c.issuerSource!==null || c.verifiedAt!==null))fail(filename,'demo cards cannot claim an issuer source or verification');
}
const filenames=(await readdir(source)).filter(name=>name.endsWith('.json')).sort((a,b)=>{const x=a.slice(0,-5), y=b.slice(0,-5);return x<y?-1:x>y?1:0;});
const cards=[];const ids=new Set();
for(const filename of filenames){const card=JSON.parse(await readFile(resolve(source,filename),'utf8'));validate(card,filename);if(ids.has(card.id))fail(filename,'duplicate id');ids.add(card.id);if(card.status==='published')cards.push(card);}
const qc=JSON.parse(await readFile(reviewPath,'utf8'));
const offerQc=JSON.parse(await readFile(offerReviewPath,'utf8'));
if(offerQc.schemaVersion!==1||!Array.isArray(offerQc.cards))fail('OFFER-QC.json','invalid offer queue');
const offersById=new Map();
for(const offer of offerQc.cards){
 if(!offer||typeof offer.id!=='string'||typeof offer.approved!=='boolean'||!offer.candidate||typeof offer.candidate!=='object')fail('OFFER-QC.json','malformed offer entry');
 if(offersById.has(offer.id))fail('OFFER-QC.json','duplicate card id '+offer.id);
 if(!offer.candidate.headline||!['spend','tiered','instant','personalized','not_available','channel_variation'].includes(offer.candidate.kind))fail('OFFER-QC.json','invalid bonus type or headline for '+offer.id);
 for(const url of [offer.candidate.source,offer.candidate.alternateSource].filter(Boolean)){
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.search||parsed.hash)fail('OFFER-QC.json','unclean source URL for '+offer.id);
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(offer.observedAt)||offer.observedAt>new Date().toISOString().slice(0,10))fail('OFFER-QC.json','invalid observation date '+offer.id);
 if(!Array.isArray(offer.candidate.milestones))fail('OFFER-QC.json','milestones must be an array '+offer.id);
 for(const step of offer.candidate.milestones){
  if(!Number.isFinite(step.amount)||step.amount<=0||typeof step.unit!=='string'||!Number.isFinite(step.minimumSpendUsd)||step.minimumSpendUsd<0||(!Number.isInteger(step.monthsToEarn)&&!Number.isInteger(step.windowDays)))fail('OFFER-QC.json','invalid milestone for '+offer.id);
 }
 if(offer.approved && (!offer.reviewedBy?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(offer.reviewedAt||'')||offer.reviewedAt>new Date().toISOString().slice(0,10)||offer.reviewedAt<offer.observedAt)){
  fail('OFFER-QC.json','approved offer needs human reviewer and valid date for '+offer.id);
 }
 offersById.set(offer.id,offer);
}
if(qc.schemaVersion!==1||!Array.isArray(qc.cards))fail('HUMAN-QC.json','expected schemaVersion 1 and cards array');
const byId=new Map();
for(const entry of qc.cards){
 if(!entry||typeof entry.id!=='string'||typeof entry.name!=='string'||typeof entry.humanVerified!=='boolean'||!['directory','research'].includes(entry.reviewStage))fail('HUMAN-QC.json','each entry needs an id, card name and boolean humanVerified');
 if(byId.has(entry.id))fail('HUMAN-QC.json','duplicate approval entry: '+entry.id);
 byId.set(entry.id,entry);
}
if(byId.size!==cards.length)fail('HUMAN-QC.json','count differs from card records; run npm run qc:sync');
for(const [id,offer] of offersById){
 if(!byId.has(id))fail('OFFER-QC.json','unknown card '+id);
 if(offer.approved&&!byId.get(id).humanVerified)fail('OFFER-QC.json','cannot approve an offer for an unreviewed card '+id);
}
let approved=0;
const publicCards=cards.flatMap(card=>{
 const review=byId.get(card.id);
 if(!review)fail(card.id,'missing QC entry. Run npm run qc:sync');
 if(review.name!==card.name||review.issuer!==card.issuer||JSON.stringify(review.candidate)!==JSON.stringify(candidateFrom(card)))fail(card.id,'card details changed; run npm run qc:sync, then review again');
 if(review.humanVerified){
  approved++;
  const offer=offersById.get(card.id);
  return [{...card,status:'published',humanVerified:true,
    ...(offer?.approved?{signUpBenefit:{...offer.candidate,observedAt:offer.observedAt,reviewedAt:offer.reviewedAt}}:{})}];
}
 if(review.reviewStage==='research')return []; // Private-to-edit research entry until owner approval
 // Keep identity and source URL for discovery, but hide ALL unapproved financial terms and rates.
 return [{id:card.id,name:card.name,issuer:card.issuer,status:'pending_review',
  fictional:false,tone:card.tone,humanVerified:false,
  summary:'Terms and benefits are awaiting human review.',
  primaryLabel:'Pending human review',feeSummary:'Annual fee: pending human review',annualFeeUsd:null,
  rewards:[],categories:[],features:card.features.includes('airline')?['airline']:[],
  plainEnglish:'The proposed benefit details are currently in the human QC queue and have not been approved for visitors.',
  watchOut:'Do not rely on this card for a financial decision until its terms have been checked against the current issuer agreement.',
  limitations:'Annual fees, APRs, bonuses, redemption, and insurance benefits are intentionally hidden until human QC.',
  verifiedAt:null,issuerSource:card.issuerSource,verificationLevel:'pending-human-review',
  imageFront:card.imageFront??null,accessType:card.accessType??'public',airlineProgram:card.airlineProgram??null
 }];
});
const output=JSON.stringify({schemaVersion:1,cards:publicCards,reviewProgress:{approved,total:byId.size}},null,2)+'\n';
if(args.has('--check')) {const existing=await readFile(target,'utf8').catch(()=>null);if(existing!==output){console.error('Public catalog is out of date. Run: npm run build');process.exitCode=1;}else console.log(`Catalog validated: ${filenames.length} records, ${approved} human-reviewed, ${publicCards.length-approved} pending.`);}
else {await writeFile(target,output);console.log(`Compiled ${publicCards.length} cards: ${approved} reviewed, ${publicCards.length-approved} pending.`);}
