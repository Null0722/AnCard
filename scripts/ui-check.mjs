#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {identityType,visualTheme,rightsClearedAsset} from '../docs/assets/card-visual.js';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=path=>readFile(resolve(root,path),'utf8');
const [home,dashboard,css,mainJs,dashJs,visual,feed]=await Promise.all([
 read('docs/index.html'),read('docs/dashboard/index.html'),read('docs/assets/styles.css'),
 read('docs/assets/app.js'),read('docs/dashboard/dashboard.js'),
 read('docs/assets/card-visual.js'),read('docs/data/cards.json')
]);
for(const id of ['card-results','load-more','issuer-filter','review-status','card-search','show-art','show-official-art','official-art-option','art-status','qc-queue','qc-queue-summary','qc-queue-cards','qc-queue-more','details-backdrop','trust-backdrop']){
 assert.ok(home.includes('id="'+id+'"'),'Missing directory control '+id);
}
for(const id of ['products','load-more','issuer','identity','review','show-art','show-official-art','official-art-option','art-status','compare','gate']){
 assert.ok(dashboard.includes('id="'+id+'"'),'Missing dashboard control '+id);
}
assert.match(dashboard,/type="module" src="\.\/dashboard\.js\?v=1\.1\.0"/);
assert.match(mainJs,/import .*card-visual\.js/);
assert.match(dashJs,/import .*card-visual\.js/);
assert.match(home,/id="review-status"><option value="approved" selected/);
assert.match(dashboard,/id="review" name="review"><option value="approved" selected/);
assert.ok(!home.includes('id="identity-filter"'),'Duplicate identity selector must be removed from the directory');
assert.ok(!dashboard.includes('id="cardtype"'),'Duplicate dashboard descriptor selector must be removed');
assert.match(home,/data-identity-quick="airline"/);
assert.match(home,/data-quick="cash_back"/);
assert.match(home,/data-quick="travel"/);
assert.match(mainJs,/function updateFacetCounts\(/);
assert.match(mainJs,/checkbox\.disabled=count===0&&!checkbox\.checked/);
assert.match(mainJs,/function renderQueue\(/);
assert.match(mainJs,/card\.humanVerified===true/);
assert.match(mainJs,/c=>!c\.humanVerified&&matchesBase\(c\)/);
assert.match(mainJs,/function makeFact\(/);
assert.match(mainJs,/term-tip/);
assert.match(css,/\.card-row\.premium-card/);
assert.match(css,/\.card-art-thumb/);
assert.match(css,/\.card-fact-value/);
assert.match(css,/@media print/);
assert.match(css,/\.card-inner\{transform:none!important/);
assert.match(css,/prefers-reduced-motion:reduce/);
for(const js of [mainJs,dashJs]){
 assert.ok(!js.includes('is-flipped'),'3D flip states must not return');
 assert.ok(!js.includes('toggleCardDetails'),'Expandable reverse layout must not return');
 assert.ok(!js.includes('flip-frame'),'Old layered flip frames must not return');
 assert.match(js,/createCardVisual/);
 assert.match(js,/referrerPolicy='no-referrer'/);
 assert.match(js,/visibleLimit\+=24/);
}
assert.ok(!css.includes('rotateY('),'3D rotation must not return');
assert.match(mainJs,/showIllustrations/);
assert.match(dashJs,/showIllustrations/);
assert.match(mainJs,/rightsClearedAsset/);
assert.match(dashJs,/rightsClearedAsset/);
assert.match(mainJs,/\.hidden=licensed===0/);
assert.match(dashJs,/\.hidden=available===0/);
assert.match(home,/id="show-art" checked/);
assert.match(home,/id="official-art-option" hidden/);
assert.match(dashboard,/id="official-art-option" hidden/);
assert.match(dashboard,/id="show-art" checked/);
assert.match(visual,/written-permission/);
assert.match(visual,/rightsEvidenceUrl/);
assert.match(visual,/if\(allowExternal && rightsClearedAsset\(card\)\)/);
assert.equal(visualTheme({issuer:'American Express',name:'American Express Platinum'}),'platinum-mist');
assert.equal(visualTheme({issuer:'American Express',name:'American Express Gold'}),'gold-sand');
assert.equal(visualTheme({issuer:'Capital One',name:'Capital One Venture X Rewards'}),'graphite-night');
assert.equal(visualTheme({issuer:'Capital One',name:'Capital One Venture Rewards'}),'deep-ocean');
assert.equal(visualTheme({issuer:'Chase',name:'Chase Sapphire Reserve'}),'midnight-indigo');
assert.equal(visualTheme({issuer:'Chase',name:'Chase Sapphire Preferred'}),'calm-indigo');
assert.equal(visualTheme({issuer:'Chase',name:'Chase Freedom Unlimited'}),'clear-blue');
assert.equal(visualTheme({issuer:'Citi',name:'Citi Double Cash'}),'ink-slate');
assert.equal(visualTheme({issuer:'American Express',name:'Delta SkyMiles Platinum American Express'}),'sky-fog');
assert.match(visual,/Concept art, not official/);
assert.match(css,/data-theme="platinum-mist"/);
assert.match(css,/data-theme="graphite-night"/);
assert.match(css,/data-theme="midnight-indigo"/);
assert.match(visual,/art\.dataset\.theme=visualTheme\(card\)/);
assert.ok(!visual.includes('ancard-art-chip'),'Illustrations must not copy a fake chip arrangement from physical cards');
assert.ok(!visual.includes('fetch('),'Illustrations must not request remote art');
assert.equal(identityType({name:'Hilton Honors American Express'}),'hotel');
assert.equal(identityType({name:'United Explorer Card'}),'airline');
assert.equal(identityType({name:'Platinum Secured Card'}),'secured');
assert.equal(identityType({name:'Quicksilver Rewards for Students'}),'student');
const testUrl='https://example.com/card.png';
assert.equal(rightsClearedAsset({imageFront:{url:testUrl}}),false);
assert.equal(rightsClearedAsset({imageFront:{url:testUrl,usageAuthorization:'written-permission'}}),false);
assert.equal(rightsClearedAsset({imageFront:{url:testUrl,usageAuthorization:'written-permission',rightsEvidenceUrl:'https://example.com/permission'}}),true);
const cards=JSON.parse(feed).cards;
assert.ok(Array.isArray(cards)&&cards.length>0);
assert.ok(cards.every(c=>!rightsClearedAsset(c)),'No issuer card is currently licensed for remote loading');
for(const text of [mainJs,dashJs]){
 assert.ok(!text.includes('localStorage')&&!text.includes('sessionStorage'),'Do not persist browsing state');
}
assert.ok(cards.every(c=>c.humanVerified||c.annualFeeUsd===null),'Unapproved annual fees must stay hidden');
const aer=cards.find(c=>c.id==='chase-aer-lingus');
assert.ok(aer?.humanVerified,'Aer Lingus reviewed seed card must exist');
assert.ok(aer.primaryLabel.includes('1 Avios per $1 elsewhere')&&!aer.primaryLabel.includes('Avtos'),'Reviewed seed copy must be correct');
assert.match(home,/No profiles\. No pitches\./);
assert.ok(!home.includes('Look for.'),'Decoder microcopy should use colons');
console.log('Fact-first UI guards passed: '+cards.length+' identity cards; reviewed-first queue, plain text, print and rights gate.');
