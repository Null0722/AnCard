#!/usr/bin/env node
// Build a readable research review sheet from the canonical owner QC queue.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const input=resolve(root,'catalog/HUMAN-QC.json');
const output=resolve(root,'catalog/REVIEW-SHEET.md');
const args=new Set(process.argv.slice(2));
const qc=JSON.parse(await readFile(input,'utf8'));
const toText=value=>String(value??'Not supplied').replace(/\s+/g,' ').trim().replaceAll('|','\\|');
function report(qc){
 const lines=[
  '# AnCard Human QC review sheet',
  '',
  'Research proposals only. This file is generated for convenient reading. Approval changes belong in [HUMAN-QC.json](HUMAN-QC.json), not here.',
  '',
  'To review a card: press Ctrl+F, search its name, compare every proposed term with the official issuer agreement, and then edit the matching humanVerified flag in HUMAN-QC.json.',
  '',
  'Current queue: '+qc.cards.length+' cards. Human approved: '+qc.cards.filter(c=>c.humanVerified).length+'. Pending: '+qc.cards.filter(c=>!c.humanVerified).length+'.',
  ''
 ];
 for(const e of qc.cards){
  const c=e.candidate||{};
  lines.push('## '+toText(e.name),'',
   '- **Issuer:** '+toText(e.issuer),
   '- **ID:** '+toText(e.id),
   '- **QC status:** '+(e.humanVerified?'APPROVED (true)':'PENDING (false)'),
   '- **Proposed annual fee:** '+toText(c.feeSummary),
   '- **Proposed rewards and benefits:** '+toText(c.primaryLabel),
   '- **Important restrictions:** '+toText(c.watchOut),
   '- **Additional limitations:** '+toText(c.limitations),
   '- **Reward types:** '+toText((c.rewards||[]).join(', ')||'Not specified'),
   '- **Spending categories:** '+toText((c.categories||[]).join(', ')||'Not specified'),
   '- **Source checked date:** '+toText(c.verifiedAt),
   '- **Official issuer source:** '+(c.issuerSource?'[Open issuer disclosures]('+c.issuerSource+')':'Not supplied'),
   '- **Reviewer:** '+toText(e.reviewedBy||'Not assigned'),
   '- **Review notes:** '+toText(e.reviewNotes||'None'),
   '',
   "To approve after verifying all facts, change the matching card's humanVerified flag in [HUMAN-QC.json](HUMAN-QC.json) and rebuild.",
   '',
   '---',
   ''
  );
 }
 return lines.join('\n')+'\n';
}
const generated=report(qc);
if(args.has('--check')){
 const previous=await readFile(output,'utf8').catch(()=>null);
 if(previous!==generated){console.error('Review sheet is out of date. Run npm run build.');process.exitCode=1;}
 else console.log('Readable QC review sheet validated.');
}else{await writeFile(output,generated);console.log('Generated '+qc.cards.length+' readable card review entries.');}
