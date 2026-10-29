#!/usr/bin/env node
// Minimal DOM unit test for the dependency-free comparison widget.
import assert from 'node:assert/strict';
import {createComparisonWorkbench,MAX_COMPARE} from '../docs/assets/comparison-workbench.js';
class FakeElement{
 constructor(tag){this.tagName=tag.toLowerCase();this.className='';this.textContent='';this.children=[];this.attributes={};this.dataset={};this.style={};this.hidden=false;this.listeners={};this.scope='';this.colSpan=1;}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,cb){this.listeners[name]=cb;}
}
globalThis.document={createElement:tag=>new FakeElement(tag)};
const traverse=(el,predicate)=>[...(predicate(el)?[el]:[]),...el.children.flatMap(child=>traverse(child,predicate))];
const reviewed={id:'reviewed',name:'Sample Reviewed',issuer:'Example Issuer',humanVerified:true,
 annualFeeUsd:95,verifiedAt:'2026-10-29',primaryLabel:'2X travel',issuerSource:'https://example.com/card',
 welcomeOffer:{kind:'fixed',amount:200,unit:'usd',minimumSpendUsd:1000,monthsToEarn:3,observedAt:'2026-10-20',source:'https://example.com/offer'},
 earnRules:[{label:'Travel',rate:2,unit:'x'}],watchOut:'Rates can change'};
const pending={id:'pending',name:'Sample Pending',issuer:'Other Issuer',humanVerified:false,
 issuerSource:'https://example.com/other',annualFeeUsd:null,verifiedAt:null,
 welcomeOffer:{kind:'fixed',amount:99999,unit:'usd',minimumSpendUsd:0,monthsToEarn:1}};
const removed=[];
const root=createComparisonWorkbench([reviewed,pending],{onRemove:id=>removed.push(id)});
const tables=traverse(root,n=>n.tagName==='table');
assert.equal(tables.length,1);
const table=tables[0];
const headers=traverse(table,n=>n.tagName==='thead');
assert.equal(headers.length,1);
const filterButtons=traverse(root,n=>n.className==='workbench-filter');
assert.equal(filterButtons.length,5);
const groups=traverse(root,n=>n.tagName==='tbody');
assert.equal(groups.length,4);
const signup=filterButtons.find(n=>n.textContent==='Sign-up benefits');
signup.listeners.click();
assert.equal(groups.find(n=>n.dataset.section==='signup').hidden,false);
assert.ok(groups.filter(n=>n.dataset.section!=='signup').every(n=>n.hidden));
filterButtons.find(n=>n.textContent==='All terms').listeners.click();
assert.ok(groups.every(n=>!n.hidden));
const cells=traverse(root,n=>n.tagName==='td');
assert.ok(cells.some(n=>n.textContent.includes('200')));
assert.ok(!cells.some(n=>n.textContent.includes('99,999')),'Pending card bonus must not render');
const links=traverse(root,n=>n.tagName==='a');
assert.ok(links.length>0);
assert.ok(links.every(n=>n.rel==='noopener noreferrer'&&n.referrerPolicy==='no-referrer'));
const buttons=traverse(root,n=>n.className==='workbench-remove');
assert.equal(buttons.length,2);
buttons[1].listeners.click();
assert.deepEqual(removed,['pending']);
const capped=createComparisonWorkbench([reviewed,pending,reviewed,pending,reviewed],{});
assert.equal(traverse(capped,n=>n.className==='workbench-card-heading').length,MAX_COMPARE);
console.log('Comparison widget DOM smoke tests passed: four-card cap, sections, pending-data gate, source links, remove controls.');
