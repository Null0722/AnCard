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
const filenames=(await readdir(source)).filter(name=>name.endsWith('.json')).sort();
const cards=[];const ids=new Set();
for(const filename of filenames){const card=JSON.parse(await readFile(resolve(source,filename),'utf8'));validate(card,filename);if(ids.has(card.id))fail(filename,'duplicate id');ids.add(card.id);if(card.status==='published')cards.push(card);}
const qc=JSON.parse(await readFile(reviewPath,'utf8'));
if(qc.schemaVersion!==1||!Array.isArray(qc.cards))fail('HUMAN-QC.json','expected schemaVersion 1 and cards array');
const byId=new Map();
for(const entry of qc.cards){
 if(!entry||typeof entry.id!=='string'||typeof entry.name!=='string'||typeof entry.humanVerified!=='boolean')fail('HUMAN-QC.json','each entry needs an id, card name and boolean humanVerified');
 if(byId.has(entry.id))fail('HUMAN-QC.json','duplicate approval entry: '+entry.id);
 byId.set(entry.id,entry);
}
if(byId.size!==filenames.length)fail('HUMAN-QC.json','count differs from card records; run npm run qc:sync');
let approved=0;
const publicCards=cards.map(card=>{
 const review=byId.get(card.id);
 if(!review)fail(card.id,'missing QC entry. Run npm run qc:sync');
 if(review.name!==card.name||review.issuer!==card.issuer||JSON.stringify(review.candidate)!==JSON.stringify(candidateFrom(card)))fail(card.id,'card details changed; run npm run qc:sync, then review again');
 if(review.humanVerified){approved++;return {...card,humanVerified:true};}
 // Keep identity and source URL for discovery, but hide ALL unapproved financial terms and rates.
 return {...card,status:'pending_review',humanVerified:false,annualFeeUsd:null,
  feeSummary:'Annual fee: pending human review',summary:'Terms and benefits are awaiting human review.',
  primaryLabel:'Pending human review',rewards:[],categories:[],
  features:card.features.includes('airline')?['airline']:[],
  plainEnglish:'The proposed benefit details are currently in the human QC queue and have not been approved for visitors.',
  watchOut:'Do not rely on this card for a financial decision until its terms have been checked against the current issuer agreement.',
  limitations:'Annual fees, APRs, bonuses, redemption, and insurance benefits are intentionally hidden until human QC.',
  verifiedAt:null,verificationLevel:'pending-human-review',additionalSources:[]};
});
const output=JSON.stringify({schemaVersion:1,cards:publicCards},null,2)+'\n';
if(args.has('--check')) {const existing=await readFile(target,'utf8').catch(()=>null);if(existing!==output){console.error('Public catalog is out of date. Run: npm run build');process.exitCode=1;}else console.log(`Catalog validated: ${filenames.length} records, ${approved} human-reviewed, ${publicCards.length-approved} pending.`);}
else {await writeFile(target,output);console.log(`Compiled ${publicCards.length} cards: ${approved} reviewed, ${publicCards.length-approved} pending.`);}
