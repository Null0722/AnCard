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
 console.log('Approval-only PR exception tests passed.');
}else{
 const dirty=git('diff','--name-only','--','docs/data/cards.json','catalog/REVIEW-SHEET.md');
 if(!dirty){
   console.log('Generated catalog and review sheet match their committed versions.');
 }else{
   const base=process.env.ANCARD_BASE_SHA;
   if(!base||!/^[0-9a-f]{40}$/i.test(base))throw Error('Pull request base SHA is required to check generated files.');
   const changed=git('diff','--name-only',base,'HEAD','--');
   if(changed!=='catalog/HUMAN-QC.json'){
     throw Error('Generated files changed but were not committed. Rebuild docs/data/cards.json and catalog/REVIEW-SHEET.md. Only an approval-only QC PR qualifies for automatic publication.');
   }
   const prior=JSON.parse(git('show',base+':catalog/HUMAN-QC.json'));
   const next=JSON.parse(readFileSync('catalog/HUMAN-QC.json','utf8'));
   if(!approvalOnly(prior,next)){
     throw Error('PR changes more than false-to-true humanVerified flags. Commit freshly generated output for changed records or revocations.');
   }
   console.log('Approval-only PR verified: changed false-to-true flags and no other fields. Main branch automated publisher will commit generated data after merge.');
 }
}
