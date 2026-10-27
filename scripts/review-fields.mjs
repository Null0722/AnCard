// Candidate terms mirrored into the ONE searchable approval queue. Field order matters for drift detection.
export function candidateFrom(c){
 return {summary:c.summary,annualFeeUsd:c.annualFeeUsd,feeSummary:c.feeSummary,primaryLabel:c.primaryLabel,plainEnglish:c.plainEnglish,
  watchOut:c.watchOut,limitations:c.limitations,rewards:c.rewards,categories:c.categories,features:c.features,
  issuerSource:c.issuerSource,verifiedAt:c.verifiedAt,verificationLevel:c.verificationLevel??'selected-issuer-page-facts',
  airlineProgram:c.airlineProgram??null,additionalSources:c.additionalSources??[],imageFront:c.imageFront??null,accessType:c.accessType??'public',
  bio:c.bio??null,rewardStructure:c.rewardStructure??null,earnRules:c.earnRules??[],benefits:c.benefits??[],monthlyFeeUsd:c.monthlyFeeUsd??null};
}
