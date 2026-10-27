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
for(const id of ['card-results','load-more','issuer-filter','identity-filter','review-status','card-search','show-art','show-official-art','official-art-option','art-status','details-backdrop','trust-backdrop']){
 assert.ok(home.includes('id="'+id+'"'),'Missing directory control '+id);
}
for(const id of ['products','load-more','issuer','identity','review','show-art','show-official-art','official-art-option','art-status','compare','gate']){
 assert.ok(dashboard.includes('id="'+id+'"'),'Missing dashboard control '+id);
}
assert.match(dashboard,/type="module" src="\.\/dashboard\.js"/);
assert.match(mainJs,/import .*card-visual\.js/);
assert.match(dashJs,/import .*card-visual\.js/);
assert.ok(css.includes('.flip-inner')&&css.includes('.premium-card.is-flipped'),'Missing flip CSS');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'Reduced-motion fallback required');
assert.match(mainJs,/front\.inert=toBack;back\.inert=!toBack/);
assert.match(dashJs,/front\.inert=onBack;back\.inert=!onBack/);
assert.match(mainJs,/visibleLimit\+=24/);
assert.match(dashJs,/visibleLimit\+=24/);
assert.match(visual,/written-permission/);
assert.match(visual,/rightsEvidenceUrl/);
assert.match(visual,/if\(allowExternal && rightsClearedAsset\(card\)\)/);
assert.match(home,/id="show-art" checked/);
assert.match(home,/id="official-art-option" hidden/);
assert.match(dashboard,/id="official-art-option" hidden/);
assert.match(mainJs,/showIllustrations=event\.target\.checked/);
assert.match(dashJs,/showIllustrations=event\.target\.checked/);
assert.match(dashJs,/source\.referrerPolicy='no-referrer'/);
assert.match(dashboard,/id="show-art" checked/);
assert.match(mainJs,/node\('a','source-link flip-issuer-source','View issuer source'\)/);
assert.match(mainJs,/showIllustrations\?createCardVisual/);
assert.match(dashJs,/showIllustrations\?createCardVisual/);
assert.match(mainJs,/source\.referrerPolicy='no-referrer'/);
assert.match(mainJs,/\$\('#official-art-option'\)\.hidden=licensed===0/);
assert.match(dashJs,/byId\('official-art-option'\)\.hidden=available===0/);
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
console.log('Premium UI guards passed: '+cards.length+' identity cards; local art, keyboard flip and rights gate.');
