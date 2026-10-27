#!/usr/bin/env node
// Regenerate an unranked, readable proposal review sheet from the owner QC queue.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const input=resolve(root,'catalog/HUMAN-QC.json');
const output=resolve(root,'catalog/REVIEW-SHEET.md');
const args=new Set(process.argv.slice(2));
const fmt=v=>String(v??"Not verified").replace(/\s+/g," ").trim().replaceAll("|","\\|");
const earn=r=>{
 const label=fmt(r.label||"Earning rate");
 const rate=typeof r.rate==="number"?(r.unit==="percent"?r.rate+"%":r.rate+"X"):"Rate not verified";
 const cap=typeof r.capAmountUsd==="number"?" | Eligible spend cap: $"+r.capAmountUsd.toLocaleString()+(r.capPeriod?" per "+r.capPeriod:""):"";
 return "- "+label+": "+rate+cap+(r.condition?" | "+fmt(r.condition):"");
};
const perk=p=>{
 const quant=typeof p.amountUsd==="number"?"Up to $"+p.amountUsd.toLocaleString():"Amount not quantified";
 const period=typeof p.frequencyMonths==="number"&&p.frequencyMonths>0?" | every "+p.frequencyMonths+" months":"";
 return "- "+fmt(p.name)+": "+quant+period+(p.condition?" | "+fmt(p.condition):"");
};
function report(q){
 const n=q.cards.filter(e=>e.humanVerified).length;
 const lines=["# AnCard human QC review sheet","","**Unranked research inventory. No card is recommended or ranked in this file.**","","This is a generated READ-ONLY view. Review proposed terms and change approval in [HUMAN-QC.json](HUMAN-QC.json).","","**Review progress:** "+n+" of "+q.cards.length+" entries human approved. Unapproved financial details remain hidden from the public directory.",""];
 for(const e of q.cards){
  const c=e.candidate||{};
  lines.push("## "+fmt(e.name),"",
  "**Issuer:** "+fmt(e.issuer)+" | **Review status:** "+(e.humanVerified?"APPROVED":"PENDING")+" | **Stage:** "+(e.reviewStage==="research"?"Backend research, not publicly listed":"Established directory identity"),"",
  "- **Annual fee proposal:** "+fmt(c.feeSummary),
  "- **Monthly membership fee:** "+(typeof c.monthlyFeeUsd==="number"?"$"+c.monthlyFeeUsd+" per month":"Not verified / not applicable"),
  "- **Rewards model:** "+fmt(c.rewardStructure||"Not classified"),
  "- **Proposed headline:** "+fmt(c.primaryLabel),
  "- **Card bio:** "+fmt(c.bio||c.summary),
  "- **Spending categories:** "+fmt((c.categories||[]).join(", ")||"Not verified"),
  "- **Restrictions:** "+fmt(c.watchOut),
  "- **Additional limitations:** "+fmt(c.limitations),
  "",
  "### Proposed earning rates and caps","");
  const rules=c.earnRules||[];lines.push(...(rules.length?rules.map(earn):["No quantified earning rules recorded. Verify the official agreement."]),"",
  "### Proposed benefits and credits","");
  const perks=c.benefits||[];lines.push(...(perks.length?perks.map(perk):["No quantified extra benefits recorded. This does not mean the card has none."]),"",
  "**Issuer source:** "+(c.issuerSource?"[Official issuer reference]("+c.issuerSource+")":"Not supplied"),
  "**Source snapshot date:** "+fmt(c.verifiedAt),
  "**Reviewer notes:** "+fmt(e.reviewNotes||"None"),
  "**Reviewer:** "+fmt(e.reviewedBy||"Unassigned"),"",
  "To approve after verifying all claims, edit the matching `humanVerified` boolean in [HUMAN-QC.json](HUMAN-QC.json) and rebuild.","","---","");
 }
 return lines.join("\n")+"\n";
}
const qc=JSON.parse(await readFile(input,'utf8'));
const content=report(qc);
if(args.has('--check')){
 const existing=await readFile(output,'utf8').catch(()=>null);
 if(content!==existing){console.error('Card review sheet out of date. Run npm run build');process.exitCode=1;}
 else console.log('Unranked review sheet validated.');
}else{
 await writeFile(output,content);
 console.log('Generated review sheet for '+qc.cards.length+' unranked card research records.');
}
