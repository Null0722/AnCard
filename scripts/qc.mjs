#!/usr/bin/env node
// Safe sync: preserves a true QC decision ONLY if the entire reviewed candidate is unchanged.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateFrom} from './review-fields.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const directory=resolve(root,'catalog/cards'),path=resolve(root,'catalog/HUMAN-QC.json');
const old=JSON.parse(await readFile(path,'utf8').catch(()=>'{"cards":[]}'));
const known=new Map((old.cards||[]).map(x=>[x.id,x]));
const cards=[];
for(const filename of (await readdir(directory)).filter(n=>n.endsWith('.json')).sort()){
 const card=JSON.parse(await readFile(resolve(directory,filename),'utf8'));
 if(card.status!=='published')continue; // Keep demo cards in Git, not in the review queue.
 const candidate=candidateFrom(card), before=known.get(card.id);
 const unchanged=before && before.name===card.name && before.issuer===card.issuer && JSON.stringify(before.candidate)===JSON.stringify(candidate);
 cards.push({id:card.id,name:card.name,issuer:card.issuer,humanVerified:Boolean(unchanged&&before.humanVerified===true),
  candidate,reviewNotes:unchanged?(before.reviewNotes||''):'',reviewedBy:unchanged?(before.reviewedBy||''):''});
}
cards.sort((a,b)=>a.name.localeCompare(b.name)||a.issuer.localeCompare(b.issuer));
const output={schemaVersion:1,instructions:"Ctrl+F the card name; verify the candidate against its issuerSource; then flip humanVerified false -> true. Run npm run build && npm test. Changed cards reset to false after npm run qc:sync.",cards};
await writeFile(path,JSON.stringify(output,null,2)+'\n');
console.log('QC queue synced:',cards.length,'cards;',cards.filter(c=>c.humanVerified).length,'remain approved.');
