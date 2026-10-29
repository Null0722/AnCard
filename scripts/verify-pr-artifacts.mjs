#!/usr/bin/env node
// Enforce source/build consistency for PRs, except for safe approval-only changes.
// A newly approved card's generated data is published by the main branch workflow.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const noFlag=(record)=>{const {humanVerified,...rest}=record;return rest;};
export function approvalOnly(before,after){
 if(!before||!after||!Array.isArray(before.cards)||!Array.isArray(after.cards))return false;
 if(before.cards.length!==after.cards.length)return false;
 if(JSON.stringify({...before,cards:before.cards.map(noFlag)})!==
    JSON.stringify({...after,cards:after.cards.map(noFlag)}))return false;
 let increased=0;
 for(let i=0;i<before.cards.length;i++){
   const prior=before.cards[i].humanVerified;
   const next=after.cards[i].humanVerified;
   if(typeof prior!=='boolean'||typeof next!=='boolean')return false;
   if(prior===next)continue;
   if(prior!==false||next!==true)return false; // Revocations require committed public data.
   increased++;
 }
 return increased>0;
}
// Permit a reviewer to approve an unchanged, source-backed bonus proposal in one PR.
// Content edits, revoked approvals, or missing reviewer/date require committed build outputs.
export function offerApprovalOnly(before,after){
 if(!before||!after||!Array.isArray(before.cards)||!Array.isArray(after.cards))return false;
 if(before.cards.length!==after.cards.length)return false;
 const bare=entry=>{const {approved,reviewedBy,reviewedAt,...rest}=entry;return rest;};
 const trimmed=q=>({...q,cards:q.cards.map(bare)});
 if(JSON.stringify(trimmed(before))!==JSON.stringify(trimmed(after)))return false;
 let increased=0;
 for(let i=0;i<before.cards.length;i++){
  const prior=before.cards[i],next=after.cards[i];
  if(prior.approved===next.approved){
   if(prior.reviewedBy!==next.reviewedBy||prior.reviewedAt!==next.reviewedAt)return false;
   continue;
  }
  if(prior.approved!==false||next.approved!==true)return false;
  if(next.candidate?.kind==='channel_variation')return false;
  if(typeof next.reviewedBy!=='string'||!next.reviewedBy.trim()||
    !/^\d{4}-\d{2}-\d{2}$/.test(next.reviewedAt||''))return false;
  increased++;
 }
 return increased>0;
}
function git(...args){
 return execFileSync('git',args,{encoding:'utf8'}).trim();
}
if(process.argv.includes('--self-test')){
 const record={id:'example',name:'Example',candidate:{annualFeeUsd:95},reviewStage:'directory',humanVerified:false};
 const before={cards:[record],instructions:'Verify every field'};
 const approved={cards:[{...record,humanVerified:true}],instructions:before.instructions};
 assert.equal(approvalOnly(before,approved),true);
 assert.equal(approvalOnly(approved,before),false,'Revocation must regenerate public data');
 assert.equal(approvalOnly(before,{...approved,cards:[{...approved.cards[0],candidate:{annualFeeUsd:100}}]}),false,'Terms cannot change alongside exception');
 assert.equal(approvalOnly(before,{...approved,instructions:'Edited instructions'}),false);
 assert.equal(approvalOnly(before,before),false);
 assert.equal(approvalOnly(before,{cards:[]}),false);
 const offerRecord={id:'example',approved:false,reviewedBy:'',reviewedAt:null,candidate:{headline:'Sample',source:'https://example.com'}};
 const beforeOffers={schemaVersion:1,cards:[offerRecord]};
 const afterOffers={schemaVersion:1,cards:[{...offerRecord,approved:true,reviewedBy:'Human Reviewer',reviewedAt:'2026-10-29'}]};
 assert.equal(offerApprovalOnly(beforeOffers,afterOffers),true,'Offer signoff can use approval-only publishing');
 assert.equal(offerApprovalOnly(afterOffers,beforeOffers),false,'Offer revocation requires build artifacts');
 assert.equal(offerApprovalOnly(beforeOffers,{...afterOffers,cards:[{...afterOffers.cards[0],candidate:{headline:'Changed'}}]}),false,'Offer candidate cannot change in approval-only PR');
 assert.equal(offerApprovalOnly(beforeOffers,{...afterOffers,cards:[{...afterOffers.cards[0],reviewedBy:''}]}),false,'Reviewer required for bonus approval');
 console.log('Approval-only PR exception tests passed, including separately verified signup offers.');
}else{
 const dirty=git('diff','--name-only','--','docs/data/cards.json','catalog/REVIEW-SHEET.md');
 if(!dirty){
   console.log('Generated catalog and review sheet match their committed versions.');
 }else{
   const base=process.env.ANCARD_BASE_SHA;
   if(!base||!/^[0-9a-f]{40}$/i.test(base))throw Error('Pull request base SHA is required to check generated files.');
   const changed=git('diff','--name-only',base,'HEAD','--');
   if(changed==='catalog/OFFER-QC.json'){
     const prior=JSON.parse(git('show',base+':catalog/OFFER-QC.json'));
     const next=JSON.parse(readFileSync('catalog/OFFER-QC.json','utf8'));
     if(!offerApprovalOnly(prior,next))throw Error('Sign-up offer PR changed research terms or lacks reviewer signoff. Commit generated public catalog or use approval-only flow.');
     console.log('Offer approval-only PR verified. Main publisher will generate new public offer facts.');
   }else if(changed==='catalog/HUMAN-QC.json'){
     const prior=JSON.parse(git('show',base+':catalog/HUMAN-QC.json'));
     const next=JSON.parse(readFileSync('catalog/HUMAN-QC.json','utf8'));
     if(!approvalOnly(prior,next))throw Error('Card approval PR changed terms or lacks safe approvals. Commit generated artifacts.');
     console.log('Card approval-only PR verified. Main publisher will generate reviewed card facts.');
   }else{
     throw Error('Generated files changed but were not committed. Only approval-only card or offer QC changes qualify for automatic publication.');
   }
 }
}
