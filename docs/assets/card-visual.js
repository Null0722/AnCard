// Original, locally rendered AnCard illustrations. No copied issuer artwork or logos.
// Image URLs are allowed only when the repository records explicit authorization.
export function identityType(card) {
  const name=String(card.name||'').toLowerCase();
  if(card.airlineProgram || /\b(united|delta|southwest|aadvantage|aeroplan|airways|iberia|aer lingus|atmos|mileup)\b/.test(name))return 'airline';
  if(/\b(hilton|marriott|hyatt|ihg|hotel|bonvoy)\b/.test(name))return 'hotel';
  if(/\bsecured\b/.test(name))return 'secured';
  if(/\b(student|students)\b/.test(name))return 'student';
  return 'other';
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
function artHue(id) {
  let hash=2166136261;
  for(const char of String(id||'ancard')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return 176+(hash>>>0)%150;
}
export function createCardVisual(card,allowExternal=false) {
  const art=element('div','ancard-original-art');
  const hue=artHue(card.id);
  art.style.setProperty('--visual-hue',String(hue));
  art.style.setProperty('--visual-second',String((hue+52)%360));
  art.dataset.identityType=identityType(card);
  art.setAttribute('role','img');
  art.setAttribute('aria-label','Original AnCard illustration for '+card.name+'; not issuer card artwork');
  art.append(element('span','ancard-art-mark','an/card.'));
  const chip=element('span','ancard-art-chip');chip.setAttribute('aria-hidden','true');art.append(chip);
  const bottom=element('div','ancard-art-bottom');
  bottom.append(element('span','ancard-art-name',card.name),element('span','ancard-art-disclaimer','Original illustration'));
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
