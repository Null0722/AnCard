#!/usr/bin/env node
// Dependency-free checks for independently reviewed signup bonuses.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {formatOffer,MAX_COMPARE} from '../docs/assets/comparison-workbench.js';
const get=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const offers=await get('catalog/OFFER-QC.json');
const catalog=await get('docs/data/cards.json');
const reviews=await get('catalog/HUMAN-QC.json');
assert.equal(MAX_COMPARE,4);
assert.equal(offers.schemaVersion,1);
assert.equal(offers.cards.length,7);
assert.equal(new Set(offers.cards.map(c=>c.id)).size,7);
const verified=new Map(reviews.cards.map(c=>[c.id,c.humanVerified]));
for(const entry of offers.cards){
 assert.ok(verified.has(entry.id),'Offer research must use a known card id');
 assert.ok(!entry.approved||verified.get(entry.id),'Cannot approve bonus ahead of card QC');
 assert.ok(!entry.approved||(entry.reviewedBy?.trim()&&/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt)),'Approved offer needs reviewer/date');
 const pub=catalog.cards.find(c=>c.id===entry.id);
 assert.ok(pub,'Research entry card is missing in public directory');
 if(!entry.approved)assert.ok(!pub.signUpBenefit,'Unapproved research bonus leaked to website: '+entry.id);
}
const amazon=offers.cards.find(x=>x.id==='chase-amazon-visa');
assert.equal(amazon.candidate.kind,'instant');
assert.equal(amazon.candidate.instantBenefit.spendRequired,false);
const aeroplan=offers.cards.find(x=>x.id==='chase-aeroplan');
assert.equal(aeroplan.candidate.kind,'tiered');
assert.equal(aeroplan.candidate.milestones.length,2);
const atmos=offers.cards.find(x=>x.id==='boa-atmos-ascent');
assert.equal(atmos.candidate.kind,'channel_variation');
const green=offers.cards.find(x=>x.id==='amex-green');
assert.equal(green.candidate.kind,'not_available');
const pending=formatOffer({humanVerified:false,welcomeOffer:{kind:'fixed',unit:'usd',amount:123,minimumSpendUsd:0,monthsToEarn:1}});
assert.match(pending.headline,/pending/i);
assert.ok(!pending.headline.includes('123'));
const unknown=formatOffer({humanVerified:true});
assert.match(unknown.headline,/Not verified/);
const legacy=formatOffer({humanVerified:true,welcomeOffer:{kind:'up_to',unit:'points',amount:100000,minimumSpendUsd:8000,monthsToEarn:6,source:'https://www.americanexpress.com/us/credit-cards/',observedAt:'2026-10-27'}});
assert.match(legacy.headline,/As high as 100,000 points/);
assert.match(legacy.status,/snapshot/);
const approvedTiered=formatOffer({humanVerified:true,signUpBenefit:{
 kind:'tiered',headline:'Two milestones',source:'https://creditcards.chase.com/example',observedAt:'2026-10-29',
 milestones:[{amount:75000,minimumSpendUsd:4000,monthsToEarn:3},{amount:40000,minimumSpendUsd:20000,monthsToEarn:12}]
}});
assert.match(approvedTiered.spend,/4,000/);assert.match(approvedTiered.spend,/20,000/);
assert.match(approvedTiered.timing,/3 months/);assert.match(approvedTiered.timing,/12 months/);
const approvedInstant=formatOffer({humanVerified:true,signUpBenefit:{
 kind:'instant',headline:'Gift card on approval',source:'https://creditcards.chase.com/example',observedAt:'2026-10-29',milestones:[],
 instantBenefit:{kind:'gift_card',amountUsd:50,spendRequired:false,trigger:'Upon approval'}
}});
assert.match(approvedInstant.spend,/No minimum/);
assert.match(approvedInstant.timing,/Upon approval/);
console.log('Sign-up offer guards passed: seven research records, separate approval, tiered and instant offer formats.');
