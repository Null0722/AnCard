// Original, locally drawn AnCard concept art. No issuer logos, card layout replicas,
// payment-network marks, copied photographs, or external network requests.
// A color family is descriptive decoration, not proof of issuer affiliation or approval.
export function identityType(card) {
  const name=String(card.name||'').toLowerCase();
  if(card.airlineProgram || /\b(united|delta|southwest|aadvantage|aeroplan|airways|iberia|aer lingus|atmos|mileup)\b/.test(name))return 'airline';
  if(/\b(hilton|marriott|hyatt|ihg|hotel|bonvoy)\b/.test(name))return 'hotel';
  if(/\bsecured\b/.test(name))return 'secured';
  if(/\b(student|students)\b/.test(name))return 'student';
  return 'other';
}

// Product color families use commonplace palettes and an original AnCard composition.
// They deliberately do not reproduce bank card fronts, trade dress or branded patterns.
export function visualTheme(card) {
  const issuer=String(card?.issuer||'').toLowerCase();
  const name=String(card?.name||'').toLowerCase();
  if(issuer==='american express' && /^american express platinum$/.test(name))return 'platinum-mist';
  if(issuer==='american express' && /^american express gold$/.test(name))return 'gold-sand';
  if(issuer==='capital one' && /\bventure x\b/.test(name))return 'graphite-night';
  if(issuer==='capital one' && /\bventure\b/.test(name))return 'deep-ocean';
  if(issuer==='capital one' && /\bquicksilver\b/.test(name))return 'soft-steel';
  if(issuer==='capital one' && /\bsavor\b/.test(name))return 'warm-clay';
  if(issuer==='chase' && /\bsapphire reserve\b/.test(name))return 'midnight-indigo';
  if(issuer==='chase' && /\bsapphire\b/.test(name))return 'calm-indigo';
  if(issuer==='chase' && /\bfreedom\b/.test(name))return 'clear-blue';
  if(issuer==='citi' && /\bstrata\b/.test(name))return 'slate-violet';
  if(issuer==='bank of america' && /\bcustomized cash\b/.test(name))return 'rosewood';
  if(issuer==='wells fargo' && /\bautograph\b/.test(name))return 'wine-stone';
  if(issuer==='american express' && /\bblue cash\b/.test(name))return 'clear-blue';
  if(issuer==='american express' && /\bdelta\b/.test(name))return 'sky-fog';
  const type=identityType(card);
  return {airline:'sky-fog',hotel:'stone-forest',secured:'soft-sage',student:'lavender-haze'}[type]||'ink-slate';
}
export function rightsClearedAsset(card) {
  const image=card?.imageFront;
  return Boolean(image && image.usageAuthorization==='written-permission'
    && typeof image.rightsEvidenceUrl==='string' && /^https:\/\//i.test(image.rightsEvidenceUrl)
    && typeof image.url==='string' && /^https:\/\//i.test(image.url));
}
function element(tag,className,value) {
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(value!==undefined)el.textContent=String(value);
  return el;
}
export function createCardVisual(card,allowExternal=false) {
  const art=element('div','ancard-original-art');
  art.dataset.theme=visualTheme(card);
  art.dataset.identityType=identityType(card);
  art.setAttribute('role','img');
  art.setAttribute('aria-label','Independent AnCard color illustration for '+card.name+'. Not an official issuer card image.');
  art.append(element('span','ancard-art-mark','an/card.'));
  const motif=element('span','ancard-art-motif');
  motif.setAttribute('aria-hidden','true');
  art.append(motif);
  const bottom=element('div','ancard-art-bottom');
  bottom.append(element('span','ancard-art-name',card.name),element('span','ancard-art-disclaimer','Concept art, not official'));
  art.append(bottom);
  if(allowExternal && rightsClearedAsset(card)){
    const img=element('img','ancard-authorized-image');
    img.alt='Authorized official front artwork: '+card.name;
    img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    img.addEventListener('load',()=>{art.classList.add('has-authorized-image');art.setAttribute('aria-label',img.alt);});
    img.addEventListener('error',()=>{img.remove();art.classList.remove('has-authorized-image');});
    // No issuer request occurs without permission evidence AND affirmative visitor opt-in.
    img.src=card.imageFront.url;
    art.append(img);
  }
  return art;
}
