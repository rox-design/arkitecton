/* arkitecton · Invoice drawer and checks, QR scanning (camera, photo, PDF), capture flow. */
"use strict";

/* ---------- invoice drawer ---------- */
function checksFor(i){
  const w=W(i.w),k=K(w.k),out=[],m=missingOf(k);
  const blocking=m.filter(x=>x!==L("E-Mail","Email"));
  out.push(blocking.length?{s:"crit",t:L("Für die Zahlung fehlt: ","Missing for payment: ")+blocking.join(", "),fix:k.id,need:blocking.join(", ")}:m.length?{s:"warn",t:L("E-Mail für Rückfragen fehlt","Email for queries missing"),fix:k.id}:{s:"ok",t:L("Handwerkerdaten vollständig","Contractor details complete")});
  let over=0;if(w.sum>0){const after=billedOn(w.id,i.id)+net(i);out.push({s:"ok",t:"BKP "+w.bkp+" "+bName(w.bkp)});out.push(after<=w.sum?{s:"ok",t:L("Im Werkvertrag: ","Within contract: ")+chf(after,false)+" / "+chf(w.sum,false)}:{s:"warn",over:1,money:1,t:L("Über Werkvertrag: +","Above contract: +")+chf(after-w.sum)});if(after>w.sum)over=after-w.sum;}
  else out.push({s:"warn",t:"BKP "+w.bkp+L(": keine Werkvertragssumme",": no contract sum")});
  if(i.type==="regie") out.push({s:"warn",money:1,t:L("Regie ausserhalb Werkvertrag: Rapporte prüfen","Time & materials outside contract: check time sheets")});
  if(i.type==="schluss"){const c=compare(w);if(c&&c.hasFinal&&c.diff>0&&over&&Math.abs(over-c.diff)<0.01){const k=out.findIndex(x=>x.over);out.splice(k,1);out.push({s:"warn",money:1,t:L("Über Werkvertrag und Offerte: ","Above contract and offer: ")+sgn(c.diff),link:w.id});}else out.push(c&&c.hasFinal?{s:c.diff>0?"warn":"ok",money:c.diff>0?1:0,t:L("Gegenüber Offerte: ","Against offer: ")+sgn(c.diff),link:w.id}:{s:"info",t:L("Offertvergleich: Schlussabrechnung laden","Offer comparison: load final account"),link:w.id});}
  if(i.type==="akonto"&&i.n>1){const have=new Set(D.invoices.filter(x=>x.w===w.id&&x.type==="akonto"&&x.id!==i.id).map(x=>x.n));const miss=[];for(let n=1;n<i.n;n++)if(!have.has(n))miss.push(n);if(miss.length)out.push({s:"warn",t:L("Akonto ","Progress payment ")+miss.join(", ")+L(" nicht erfasst"," not recorded")});}
  const dup=i.ref&&live(i)&&D.invoices.some(x=>x.id!==i.id&&live(x)&&norm(x.ref)===norm(i.ref));
  if(i.fx)out.push({s:"warn",t:L("Rechnung in ","Invoice in ")+i.fx.cur+" "+nf2.format(i.fx.amount)+L(", in CHF erfasst",", entered in CHF")});
  out.push(dup?{s:"crit",t:L("Mögliche Doppelrechnung","Possible duplicate")}:i.ref?{s:"ok",t:L("Keine Doppelrechnung","No duplicate")}:{s:"warn",t:L("Ohne QR-Referenz","No QR reference")});
  const dd=daysTo(i.due);if(dd<=7&&!counted(i))out.push({s:"warn",t:L("Zahlung ","Payment ")+dueText(dd)});
  return out;
}
function queryText(i){
  const k=K(W(i.w).k),m=missingOf(k).filter(x=>x!==L("E-Mail","Email")),noIban=!k.iban;
  if(S.lang==="de") return `Guten Tag\n\nBetreffend Ihre Rechnung ${i.no} vom ${fdate(i.date)}, Projekt ${projTitle(PJ(W(i.w).pid))}:\n\n`+(m.length?`Uns fehlen folgende Angaben: ${m.join(", ")}. `+(noIban?`Bitte senden Sie uns die Rechnung als QR-Rechnung.`:`Bitte ergänzen Sie diese.`)+`\n\n`:`Bitte senden Sie uns die Unterlagen (Ausmass oder Regierapporte) zur Prüfung.\n\n`)+`Freundliche Grüsse\n${D.firm.name||"Bauleitung"}`;
  return `Hello\n\nRegarding your invoice ${i.no} dated ${fdate(i.date)}, project ${projTitle(PJ(W(i.w).pid))}:\n\n`+(m.length?`We are missing: ${m.join(", ")}. `+(noIban?`Please send it as a QR-bill.`:`Please provide these details.`)+`\n\n`:`Please send the supporting documents (measurements or time sheets).\n\n`)+`Kind regards\n${D.firm.name||"Site management"}`;
}
function drawerHTML(i){
  const w=W(i.w),k=K(w.k),cs=checksFor(i),crit=cs.some(c=>c.s==="crit");
  const issues=cs.filter(c=>c.s!=="ok"), oks=cs.filter(c=>c.s==="ok");
  const ICON={ok:"✓",warn:"!",crit:"✕",info:"i"}, ret=retention(i);
  const li=c=>`<li><span class="ic ${c.s}" aria-hidden="true">${ICON[c.s]}</span><span>${esc(c.t)}${c.link?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="open-cmp" data-id="${c.link}">${L("Vergleich","Comparison")}</button>`:""}${c.fix?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="query">${L("Anfragen","Request")}</button> <button type="button" class="ghost" style="padding:0;margin-left:10px;text-decoration:underline" data-act="form" data-f="contractor" data-id="${c.fix}">${L("Selbst ergänzen","Add yourself")}</button>`:""}</span></li>`;
  const retLine=i.type==="akonto"?[L("Rückbehalt ","Retention ")+invPct(i)+"%","− "+nf2.format(ret)]:i.type==="schluss"?[L("Freigabe Rückbehalt","Retention released"),"+ "+nf2.format(-ret)]:[L("Rückbehalt","Retention"),"0.00"];
  const cr=cs.find(c=>c.s==="crit"),why=cr?`<span class="act-hint">${cr.need?L("Erst ergänzen: ","First add: ")+esc(cr.need):L("Erst Doppelrechnung klären","Resolve the duplicate first")}</span>`:"";
  const money=cs.some(c=>c.money&&c.s==="warn"),apLbl=money?L("Trotzdem freigeben","Approve anyway"):L("Freigeben","Approve");
  let actions="";
  if(i.status==="rueckfrage") actions=why+`<button type="button" class="btn" data-act="answer" data-id="${i.id}">${L("Antwort erhalten","Reply received")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${apLbl}</button>`;
  else if(!counted(i)) actions=why+`<button type="button" class="btn" data-act="query">${L("Rückfrage","Query")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${apLbl}</button>`;
  else if(i.status==="frei") actions=`<button type="button" class="btn" data-act="pay-pdf" data-id="${i.id}">${L("Zahlungsempfehlung (PDF)","Payment recommendation (PDF)")}</button><button type="button" class="btn primary" data-act="paid" data-id="${i.id}">${L("Als bezahlt markieren","Mark as paid")}</button>`;
  else if(i.status==="bezahlt") actions=`<button type="button" class="btn" data-act="inv-unpaid" data-id="${i.id}">${L("Zahlung zurücknehmen","Undo payment")}</button>`;
  const done=S.done&&S.done.id===i.id?`<div class="done"><span class="h">${L("Für Sie erledigt","Done for you")}</span><div class="chips">${S.done.items.map(x=>`<span class="chip ok">${esc(x)}</span>`).join("")}</div></div>`:"";
  const log=i.log&&i.log.length?`<details><summary>${L("Verlauf","History")}</summary><div class="in"><dl class="kv">${i.log.map(e=>`<dt>${fdate(e.d)}</dt><dd>${esc(e.t)}</dd>`).join("")}</dl></div></details>`:"";
  const delBtn=S.confirm==="del:"+i.id?`<button type="button" class="ghost danger" data-act="del-inv" data-id="${i.id}">${L("Wirklich löschen?","Really delete?")}</button>`:ib("trash",L("Rechnung löschen","Delete invoice"),`data-act="ask" data-c="del:${i.id}"`);
  return `<div class="scrim" data-act="close"></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dT">
    <div class="ohead"><div><h2 id="dT" style="font-size:1.125rem;font-weight:500">${esc(k.name)}</h2><div class="sub">${typeLabel(i)} · ${esc(i.no)} · ${fdate(i.date)}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody">
      <span class="biglbl">${L("Auszahlung","Payout")}</span>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><span class="big">${chf(payout(i))}</span><span class="l-${STATUS[i.status].c}" style="white-space:nowrap">${stLabel(i.status)}</span></div>
      <div class="gross"><span>${L("Rechnungsbetrag","Invoice amount")} ${chf(i.gross)}</span><span>${counted(i)?"":dueText(daysTo(i.due))}</span></div>
      ${done}
      ${i.repl&&INV(i.repl)?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt durch Rechnung ","Replaced by invoice ")}<button type="button" class="ghost link" data-act="open-inv" data-id="${i.repl}">${esc(INV(i.repl).no)}</button>. ${L("Zählt nicht mehr.","No longer counted.")}</span></div>`:""}
      ${i.replaces&&INV(i.replaces)?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt Rechnung ","Replaces invoice ")}<button type="button" class="ghost link" data-act="open-inv" data-id="${i.replaces}">${esc(INV(i.replaces).no)}</button></span></div>`:""}
      ${issues.length?`<ul class="checks" style="border-top:1px solid var(--line)">${issues.map(li).join("")}</ul>`:`<div class="notice"><span class="ic ok" aria-hidden="true">✓</span><span>${L("Alle Prüfungen in Ordnung","All checks passed")}</span></div>`}
      <div class="calc"><span>${L("Rechnung","Invoice")}</span><span class="r">${nf2.format(i.gross)}</span>${i.ded&&i.ded.amt?`<span>${L("Abzug","Deduction")} <span class="sp">· ${esc(i.ded.why)}</span></span><span class="r">− ${nf2.format(i.ded.amt)}</span>`:""}<span>${retLine[0]}</span><span class="r">${retLine[1]}</span><span class="sum">${L("Auszahlung","Payout")}</span><span class="r sum">${chf(payout(i))}</span></div>
      <div>
        ${oks.length&&issues.length?`<details><summary>${L("Weitere Prüfungen: ","Other checks: ")}${oks.length} ${L("in Ordnung","passed")}</summary><div class="in"><ul class="checks">${oks.map(li).join("")}</ul></div></details>`:""}
        <details><summary>${L("Zahlungsdaten","Payment details")}</summary><div class="in"><dl class="kv"><dt>IBAN</dt><dd>${k.iban?esc(k.iban):`<span class="neg">${L("fehlt","missing")}</span>`}</dd><dt>${L("Referenz","Reference")}</dt><dd>${i.ref?esc(i.ref):"–"}</dd><dt>${L("Fällig","Due")}</dt><dd>${fdate(i.due)}</dd></dl></div></details>
        ${log}
        ${S.queryOpen?`<details open><summary>${L("Rückfrage an ","Query to ")+esc(k.name)}</summary><div class="in" style="display:flex;flex-direction:column;gap:10px"><textarea id="qtext" aria-label="${L("Nachricht","Message")}">${esc(queryText(i))}</textarea><div class="qtools">${ibl("copy",L("Kopieren","Copy"),'data-act="copy-query"')}${navigator.share?ibl("share",L("Teilen (Mail, WhatsApp …)","Share (Mail, WhatsApp …)"),`data-act="share-query" data-id="${i.id}"`,L("Teilen","Share")):""}${k.email?ibl("mail",L("In Gmail öffnen","Open in Gmail"),`data-act="gmail-query" data-id="${i.id}"`,"Gmail"):""}${k.email&&!navigator.share?`<a class="ibl" title="${L("Im Mailprogramm öffnen","Open in mail app")}" href="mailto:${esc(k.email)}?subject=${encodeURIComponent(L("Rechnung ","Invoice ")+i.no)}" data-act="mail-query">${ico("mail")}<span>${L("E-Mail","Email")}</span></a>`:""}<span class="qsep"></span><button type="button" class="btn" data-act="mark-query" data-id="${i.id}">${L("Rückfrage gesendet","Query sent")}</button></div>${k.email?"":`<span class="hint">${L("Keine E-Mail-Adresse hinterlegt. Text kopieren und per Telefon oder WhatsApp senden, oder die E-Mail ergänzen.","No email on file. Copy the text and send it another way, or add the email.")}</span>`}</div></details>`:""}
      </div>
      ${i.status==="ersetzt"?"":`<div class="dtools">${i.status==="frei"?`<button type="button" class="ghost" data-act="unapprove" data-id="${i.id}">${L("Freigabe zurücknehmen","Undo approval")}</button>`:""}${!counted(i)?`${i.status==="rueckfrage"&&!S.queryOpen?`<button type="button" class="ghost" data-act="query">${L("Nochmals nachfragen","Ask again")}</button>`:""}<button type="button" class="ghost" data-act="form" data-f="ded" data-id="${i.id}">${i.ded?L("Abzug ändern","Edit deduction"):L("Abzug erfassen","Add deduction")}</button><button type="button" class="ghost" data-act="replace" data-id="${i.id}">${L("Durch neue Rechnung ersetzen","Replace with new invoice")}</button>`:""}<span class="qsep"></span>${delBtn}</div>`}
    </div>
    ${actions?`<div class="ofoot">${actions}</div>`:""}
  </div>`;
}
const logInv=(i,t)=>{(i.log=i.log||[]).push({d:iso(new Date()),t});};
function linkReplace(oldId,ni){const o=D.invoices.find(x=>x.id===oldId);if(!o)return;o.status="ersetzt";o.repl=ni.id;if(ni.w===o.w){ni.type=o.type;ni.n=o.n;}ni.replaces=o.id;logInv(o,L("Ersetzt durch ","Replaced by ")+ni.no);logInv(ni,L("Ersetzt Rechnung ","Replaces invoice ")+o.no);}

/* ---------- QR-bill ---------- */
function parseSPC(txt){
  const l=String(txt).split(/\r?\n/);if(l[0].trim()!=="SPC")return null;
  let street,zip,city;
  if(l[4]==="K"){const m=(l[7]||"").match(/^(\d{4,6})\s+(.*)$/);street=l[6]||"";zip=m?m[1]:"";city=m?m[2]:(l[7]||"");}
  else{street=[l[6],l[7]].filter(Boolean).join(" ");zip=l[8]||"";city=l[9]||"";}
  return {name:(l[5]||"").trim(),street:street.trim(),zip:zip.trim(),city:city.trim(),iban:fmtIban(l[3]||""),amount:parseFloat(l[18])||0,cur:(l[19]||"CHF").trim().toUpperCase()||"CHF",ref:fmtRef(l[28]||""),msg:(l[29]||"").trim(),bill:(l.slice(30).find(x=>/^\/\/S1\//.test(x||""))||"").trim(),no:""};
}
function swicoNo(b){if(!b)return "";const parts=b.slice(4).replace(/\\\//g,"\u0000").split("/").map(x=>x.replace(/\u0000/g,"/"));for(let i=0;i<parts.length-1;i++)if(parts[i]==="10")return parts[i+1].trim();return "";}
function swicoField(b,tag){if(!b)return "";const parts=b.slice(4).replace(/\\\//g,"\u0000").split("/").map(x=>x.replace(/\u0000/g,"/"));for(let i=0;i<parts.length-1;i++)if(parts[i]===tag)return parts[i+1].trim();return "";}
function swicoDates(d){const r={date:"",due:""};const t=swicoField(d.bill,"11").slice(0,6);if(/^\d{6}$/.test(t))r.date="20"+t.slice(0,2)+"-"+t.slice(2,4)+"-"+t.slice(4,6);const c=swicoField(d.bill,"40");if(c){const net=c.split(";").map(x=>x.split(":")).find(x=>+x[0]===0);if(net&&/^\d+$/.test(net[1]||""))r.due=addDays(r.date||iso(TODAY),+net[1]);}return r;}
/* arkitecton books in CHF: a QR bill in EUR keeps its original amount for reference, the CHF amount is entered by hand */
function fxCheck(d){if(d&&d.cur&&d.cur!=="CHF"&&!d.fx){d.fx={cur:d.cur,amount:d.amount};d.amount=0;}return d;}
function setDates(d){const x=swicoDates(d);d.dateSrc=!!x.date;d.dueSrc=!!x.due;d.date=x.date||iso(TODAY);d.due=x.due||addDays(d.date,SET().term);}
function guessNo(d){const sw=swicoNo(d.bill);if(sw)return sw;const m=(d.msg||"").match(/(?:rechnungs?(?:nummer|nr\.?)?|rg\.?|re\.?|invoice(?:\s*no\.?)?|nr\.?)\s*(?:nr\.?|no\.?)?\s*[:#]?\s*(\d[A-Za-z0-9\-\/\.]{2,}|[A-Za-z]{1,4}[\-\.]?\d[A-Za-z0-9\-\/\.]*)/i);return m?m[1]:"";}
function guessKind(d){const m=d.msg||"";let x=m.match(/akonto\s*(?:nr\.?|no\.?)?\s*(\d{1,2})/i);if(x)return {type:"akonto",n:+x[1]};if(/schluss/i.test(m))return {type:"schluss",n:0};if(/regie/i.test(m))return {type:"regie",n:0};if(/akonto/i.test(m))return {type:"akonto",n:0};return {type:"",n:0};}
const BKP_KEYS=[["maler","285"],["elektr","230"],["sanitä","250"],["sanita","250"],["schrein","273"],["gipser","271"],["spengl","222"],["bedach","224"],["dach","224"],["heizung","240"],["lüftung","240"],["boden","281"],["küche","258"],["fenster","221"],["reinigung","287"],["baumeister","211"],["metallbau","272"],["holzbau","214"],["fassade","226"],["putz","226"]];
function guessBkp(d){const t=((d.msg||"")+" "+(d.name||"")).toLowerCase();const h=BKP_KEYS.find(([k])=>t.includes(k));return h?h[1]:"";}
let cam=null;
function camErrText(e){
  const nm=e&&e.name,msg=String(e&&e.message||""),ua=navigator.userAgent,mac=/Mac/.test(navigator.platform||ua);
  const safari=/Safari/.test(ua)&&!/Chrome|Chromium|Edg|Firefox/.test(ua),ff=/Firefox/.test(ua);
  if(nm==="NotFoundError"||nm==="OverconstrainedError")return L("Keine Kamera gefunden. Wählen Sie die Rechnung als PDF oder Foto.","No camera found. Choose the invoice as PDF or photo.");
  if(nm==="NotReadableError")return L("Die Kamera wird von einem anderen Programm benutzt (z.B. Zoom, Teams). Schliessen Sie es und versuchen Sie es erneut.","The camera is used by another app (e.g. Zoom, Teams). Close it and try again.");
  if(/system/i.test(msg)&&mac)return L("macOS erlaubt dem Browser die Kamera nicht. Systemeinstellungen › Datenschutz & Sicherheit › Kamera › Browser einschalten, dann den Browser neu starten.","macOS does not allow the browser to use the camera. System Settings › Privacy & Security › Camera › turn on the browser, then restart the browser.");
  const how=safari?L("Safari › Einstellungen › Websites › Kamera › rox-design.github.io auf «Fragen» oder «Erlauben» stellen.","Safari › Settings › Websites › Camera › set rox-design.github.io to «Ask» or «Allow».")
    :ff?L("Klicken Sie auf das Kamera-Symbol links in der Adresszeile und heben Sie die Sperre auf.","Click the camera icon on the left of the address bar and remove the block.")
    :L("Klicken Sie auf das Symbol links in der Adresszeile › Kamera › «Zulassen».","Click the icon on the left of the address bar › Camera › «Allow».");
  return L("Die Kamera ist für diese Seite gesperrt, darum fragt der Browser nicht mehr nach. ","Camera is blocked for this site, so the browser no longer asks. ")+how+(mac?L(" Falls es danach nicht geht: Systemeinstellungen › Datenschutz & Sicherheit › Kamera."," If it still fails: System Settings › Privacy & Security › Camera."):"");
}
async function startCam(){
  const M=S.modal; if(!M||M.step!==1||cam) return;
  if(typeof jsQR!=="function"){M.camErr=L("Der QR-Leser wurde nicht geladen. Bitte die Seite neu laden.","The QR reader did not load. Please reload the page.");return renderOverlay();}
  if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){M.camErr=L("Live-Kamera hier nicht verfügbar. Bitte ein Foto aufnehmen.","Live camera not available here. Please take a photo.");return renderOverlay();}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1920},height:{ideal:1080}}});
    if(!S.modal||S.modal.step!==1){stream.getTracks().forEach(t=>t.stop());return;}
    cam={stream,cv:document.createElement("canvas"),last:0,raf:0};
    attachCam();
    cam.raf=requestAnimationFrame(scanLoop);
  }catch(e){if(S.modal){S.modal.camErr=camErrText(e);renderOverlay();}}
}
function attachCam(){const v=document.getElementById("camv");if(!cam||!v)return;if(v.srcObject!==cam.stream){v.srcObject=cam.stream;v.play().catch(()=>{});}}
function scanLoop(ts){
  if(!cam) return; cam.raf=requestAnimationFrame(scanLoop);
  if(ts-cam.last<140) return; cam.last=ts;
  const v=document.getElementById("camv"); if(!v||v.readyState<2||!v.videoWidth) return;
  const vw=v.videoWidth,vh=v.videoHeight,side=Math.min(vw,vh)*0.82,sx=(vw-side)/2,sy=(vh-side)/2,out=Math.min(820,Math.round(side));
  cam.cv.width=out;cam.cv.height=out;const ctx=cam.cv.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(v,sx,sy,side,side,0,0,out,out);
  const r=jsQR(ctx.getImageData(0,0,out,out).data,out,out,{inversionAttempts:"dontInvert"});
  if(r&&qrText(r)){
    const d=parseSPC(qrText(r));
    if(d){D.realScan=true;saveData();stopCam();try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}d.no=guessNo(d);setDates(d);fxCheck(d);S.modal.data=d;S.modal.step=2;renderOverlay();}
    else{const h=document.getElementById("camhint");if(h)h.textContent=L("QR-Code erkannt, aber keine Schweizer QR-Rechnung.","QR code found, but not a Swiss QR-bill.");}
  }
}
function stopCam(){if(!cam)return;cancelAnimationFrame(cam.raf);cam.stream.getTracks().forEach(t=>t.stop());cam=null;}
function qrText(r){if(r.data)return r.data;if(!r.binaryData||!r.binaryData.length)return "";const b=Uint8Array.from(r.binaryData);try{return new TextDecoder("utf-8",{fatal:true}).decode(b);}catch(e){return new TextDecoder("iso-8859-1").decode(b);}}
async function decodeQR(file){
  if(typeof jsQR!=="function") throw new Error("lib");
  const url=URL.createObjectURL(file),img=new Image();
  try{
    await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});
    const W0=img.naturalWidth,H0=img.naturalHeight,cv=document.createElement("canvas"),ctx=cv.getContext("2d",{willReadFrequently:true});
    const regions=[[0,0,1,1],[0,.45,1,.55],[0,.5,.5,.5],[0,.55,.45,.45],[.5,.5,.5,.5],[0,0,.5,.5],[.25,.25,.5,.5]];
    for(const [rx,ry,rw,rh] of regions){
      for(const max of [1100,1600,800]){
        const sw=W0*rw,sh=H0*rh,s=Math.min(1,max/Math.max(sw,sh));
        cv.width=Math.max(1,Math.round(sw*s));cv.height=Math.max(1,Math.round(sh*s));
        ctx.drawImage(img,W0*rx,H0*ry,sw,sh,0,0,cv.width,cv.height);
        const r=jsQR(ctx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height);
        if(r&&qrText(r)) return qrText(r);
      }
    }
    return null;
  }finally{URL.revokeObjectURL(url);}
}
let pdfLib=null;
function loadPdfJs(){if(pdfLib)return pdfLib;pdfLib=new Promise((res,rej)=>{if(window.pdfjsLib)return res(window.pdfjsLib);const sc=document.createElement("script");sc.src="vendor/pdf.min.js";sc.onload=()=>{try{window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js";res(window.pdfjsLib);}catch(e){rej(e);}};sc.onerror=e=>{pdfLib=null;rej(e);};document.head.appendChild(sc);});return pdfLib;}
const isPdf=f=>f&&(f.type==="application/pdf"||/\.pdf$/i.test(f.name||""));
async function decodePdfQR(file){
  const lib=await loadPdfJs();const doc=await lib.getDocument({data:await file.arrayBuffer()}).promise;
  const n=doc.numPages,order=[n];for(let i=1;i<n&&order.length<4;i++)order.push(i);if(n>1&&!order.includes(n-1))order.push(n-1);
  for(const pn of [...new Set(order)]){
    const page=await doc.getPage(pn);
    for(const scale of [2.5,4]){
      const vp=page.getViewport({scale}),cv=document.createElement("canvas");cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);
      const ctx=cv.getContext("2d",{willReadFrequently:true});ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);
      await page.render({canvasContext:ctx,viewport:vp}).promise;
      const blob=await new Promise(r=>cv.toBlob(r,"image/png"));const t=await decodeQR(blob);if(t)return t;
    }
  }
  return null;
}
async function onScanFile(file){
  if(!file||!S.modal) return;
  stopCam();
  const pdf=isPdf(file);
  if(!pdf&&!/^image\//.test(file.type)){S.modal.err=L("Bitte ein PDF oder Foto der Rechnung wählen.","Please choose a PDF or photo of the invoice.");return renderOverlay();}
  S.modal.busy=true;S.modal.err="";renderOverlay();
  let txt=null;try{txt=pdf?await decodePdfQR(file):await decodeQR(file);}catch(e){txt=null;}
  if(!S.modal)return;S.modal.busy=false;
  const d=txt?parseSPC(txt):null;
  if(!d){S.modal.err=txt?L("Das ist keine Schweizer QR-Rechnung.","This is not a Swiss QR-bill."):(pdf?L("Im PDF wurde kein QR-Zahlteil gefunden.","No QR payment part found in the PDF."):L("Kein QR-Code erkannt. Zahlteil näher fotografieren.","No QR code found. Photograph the payment part closer."));return renderOverlay();}
  D.realScan=true;saveData();d.no=guessNo(d);setDates(d);fxCheck(d);S.modal.data=d;S.modal.step=2;renderOverlay();
}
function resolveCapture(d){
  const k=D.contractors.find(c=>(c.iban&&norm(c.iban)===norm(d.iban))||c.name.trim().toLowerCase()===d.name.trim().toLowerCase())||null;
  const dup=D.invoices.find(x=>live(x)&&!(S.modal&&S.modal.rep===x.id)&&((d.ref&&x.ref&&norm(x.ref)===norm(d.ref))||(k&&d.no&&W(x.w).k===k.id&&x.no===d.no&&x.gross===d.amount)))||null;
  return {k,dup,w:k?CW(k.id):null};
}
const bkpOptions=sel=>{const p=P();const own=p?p.budget.map(b=>[b.bkp,tx(b)]):[];const rest=STD_BKP.filter(s=>!own.some(o=>o[0]===s[0])).map(s=>[s[0],S.lang==="de"?s[1]:s[2]]);
  if(sel&&!own.concat(rest).some(o=>o[0]===sel))rest.push([sel,bName(sel)]);
  const all=own.concat(rest).sort((a,b)=>a[0].localeCompare(b[0]));const groups=[...new Set(all.map(o=>bkpMain(o[0])))];
  return groups.map(g=>`<optgroup label="${g} ${esc(bkpMainName(g))}">${all.filter(o=>bkpMain(o[0])===g).map(([c,n])=>`<option value="${c}"${c===sel?" selected":""}>${c} ${esc(n)}</option>`).join("")}</optgroup>`).join("");};
function wrapCapture(title,body,foot){
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mT">
    <div class="ohead"><h2 id="mT" style="font-size:1.125rem;font-weight:500">${title}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody">${body}</div>${foot?`<div class="ofoot">${foot}</div>`:""}</div>`;
}
function captureHTML(){
  const M=S.modal,d=M.data;let body="",foot="",title=L("QR scannen","Scan QR");
  const RO=M.rep&&INV(M.rep),RK=RO&&K(W(RO.w).k);
  const repNote=RO?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt ","Replaces ")}${esc(RO.no)} · ${esc(RK.name)} · ${typeLabel(RO)}</span></div>`:"";
  if(!P()){
    body=`<div class="empty">${L("Bitte zuerst ein Projekt anlegen.","Please create a project first.")}<button type="button" class="btn primary" data-act="form" data-f="project">${L("Projekt anlegen","Create project")}</button></div>`;
  } else if(M.step===1){
    body=repNote+`<div class="scanbox">
      ${M.fileFirst?`<span class="camhint">${M.busy?L("Rechnung wird gelesen …","Reading invoice …"):L("Wählen Sie die Rechnung als PDF oder Foto, oder ziehen Sie die Datei hierher. arkitecton liest den QR-Zahlteil.","Choose the invoice as PDF or photo, or drop the file here. arkitecton reads the QR payment part.")}</span>`:M.camErr?`<span class="err">${esc(M.camErr)}</span><button type="button" class="btn block" data-act="cam-retry">${L("Kamera erneut versuchen","Try camera again")}</button>`:`<div class="cam"><video id="camv" playsinline muted autoplay></video><div class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div><span class="camhint" id="camhint">${M.busy?L("Foto wird gelesen …","Reading photo …"):L("QR-Code des Zahlteils in den Rahmen halten","Hold the payment part's QR code in the frame")}</span>`}
      ${M.err?`<span class="err">${esc(M.err)}</span>`:""}
      <label class="btn${M.camErr||M.fileFirst?" primary":""} block">${M.fileFirst?L("Rechnung wählen (PDF oder Foto)","Choose invoice (PDF or photo)"):L("PDF oder Foto wählen","Choose PDF or photo")}<input type="file" id="scanIn" accept="application/pdf,.pdf,image/*" aria-label="${L("Foto der QR-Rechnung","Photo of the QR-bill")}"></label>
      ${(()=>{const lk=(M.fileFirst?`<button type="button" class="ghost" data-act="use-cam">${L("Kamera verwenden","Use camera")}</button>`:"")+(M.err?`<button type="button" class="ghost" data-act="manual">${L("Ohne QR erfassen","Add without QR")}</button>`:"")+(D.example&&!D.realScan&&!M.rep?`<button type="button" class="ghost" data-act="use-sample">${L("Beispielrechnung","Example invoice")}</button>`:"");return lk?`<div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center">${lk}</div>`:"";})()}</div>`;
  } else {
    if(!M.pid) M.pid=defaultPid(d);
    const R=withP(M.pid,()=>resolveCapture(d));
    if(M.step===3&&R.dup){
      title=L("Bereits erfasst","Already recorded");
      body=`<div class="notice"><span class="ic crit" aria-hidden="true">✕</span><span>${L("Doppelrechnung verhindert","Duplicate prevented")} · ${esc(R.dup.no)} · ${chf(R.dup.gross)}</span></div>`;
      foot=`<button type="button" class="btn" data-act="open-inv" data-id="${R.dup.id}">${L("Öffnen","Open")}</button><button type="button" class="btn primary" data-act="close">OK</button>`;
    } else if(RO&&(!R.k||R.k.id!==RK.id)){
      title=esc(d.name);
      body=repNote+`<div class="notice"><span class="ic crit" aria-hidden="true">✕</span><span>${L("Diese Rechnung ist von ","This invoice is from ")}${esc(d.name)}. ${L("Ersetzen geht nur mit einer Rechnung von ","Replacing only works with an invoice from ")}${esc(RK.name)}.</span></div>`;
      foot=`<button type="button" class="btn" data-act="replace" data-id="${RO.id}">${L("Andere Rechnung scannen","Scan another invoice")}</button><button type="button" class="btn primary" data-act="close">OK</button>`;
    } else {
      title=L("Rechnung erkannt","Invoice recognised");
      body=withP(M.pid,()=>{
        const G=d.typeSel?{type:d.typeSel,n:d.akN}:RO&&R.w&&R.w.id===RO.w?{type:RO.type,n:RO.n}:guessKind(d);
        const nAk=G.n||(R.w?D.invoices.filter(x=>x.w===R.w.id&&x.type==="akonto").length+1:1);d.akN=nAk;const so=v=>G.type===v?" selected":"";
        const qAdr=[d.street,[d.zip,d.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        const adrHint=!R.k?L("Neuer Handwerker, wird angelegt","New contractor, will be added"):(!R.k.street&&qAdr)?L("Fehlt beim Handwerker, wird übernommen","Missing for this contractor, will be added"):"";
        const projs=D.projects.filter(p=>!p.closed||p.id===M.pid);
        return repNote+`<div class="fields">
        <div class="f wide"><span class="l">${L("Von","From")}</span><span class="v">${esc(R.k?R.k.name:d.name)}</span></div>
        <div class="f wide"><span class="l">${L("Adresse","Address")}</span><span class="v">${qAdr?esc(qAdr):"–"}</span>${adrHint?`<span class="hint">${adrHint}</span>`:""}</div>
        <div class="f wide"><span class="l">IBAN</span><span class="v">${esc(d.iban)}</span></div>
        <div class="f wide"><label for="capProj">${L("Projekt","Project")}</label>${projs.length>1?`<select id="capProj" class="${M.pidSrc==="none"?"needs":""}">${projs.map(p=>`<option value="${p.id}"${p.id===M.pid?" selected":""}>${esc(p.name)}${p.place?" · "+esc(p.place):""}</option>`).join("")}</select>`:`<span class="v">${esc(P().name)}</span>`}${pidHint(M)?`<span class="hint${M.pidSrc==="none"?" warn":""}">${pidHint(M)}</span>`:""}</div>
        ${R.w?`<div class="f wide"><span class="l">${L("Werkvertrag","Contract")}</span><span class="v">BKP ${R.w.bkp} ${esc(bName(R.w.bkp))}${R.w.sum?" · "+chf(R.w.sum,false):""}</span></div>`
          :`<div class="f wide"><label for="capBkp">BKP</label><select id="capBkp">${bkpOptions(d.bkpSel||guessBkp(d))}</select><span class="hint">${L("Noch kein Werkvertrag in diesem Projekt. Die Summe können Sie später ergänzen.","No contract in this project yet. You can add the sum later.")}</span></div>`}
        <div class="f"><label for="capType">${L("Art","Type")}</label><select id="capType"><option value="akonto"${so("akonto")}>${L("Akonto ","Progress payment ")+nAk}</option><option value="schluss"${so("schluss")}>${L("Schlussrechnung","Final invoice")}</option><option value="regie"${so("regie")}>${L("Regie","Time & materials")}</option></select></div>
        <div class="f"><label for="capAmt">${L("Betrag CHF","Amount CHF")}</label><input id="capAmt" class="amt" inputmode="decimal" value="${d.amount?nf2.format(d.amount):""}">${d.fx?`<span class="hint l-warn">${L("Rechnung in ","Invoice in ")+esc(d.fx.cur)+" "+nf2.format(d.fx.amount)+L(". arkitecton rechnet in CHF: Betrag in CHF eintragen.",". arkitecton works in CHF: enter the amount in CHF.")}</span>`:""}</div>
        <div class="f wide"><label for="capNo">${L("Rechnungsnummer","Invoice number")}</label><input id="capNo" value="${esc(d.no||"")}" placeholder="${L("Von der Rechnung abtippen","Type from the invoice")}">${d.no?"":`<span class="hint">${L("Diese Rechnung hat keine Nummer im QR-Code.","This invoice has no number in its QR code.")}</span>`}</div>
        <div class="f"><span class="l">${L("Rechnungsdatum","Invoice date")}</span><span class="v">${fdate(d.date)}</span>${d.dateSrc?"":`<span class="hint">${L("Heute, nicht im QR-Code","Today, not in QR code")}</span>`}</div>
        <div class="f"><span class="l">${L("Zahlbar bis","Due")}</span><span class="v">${fdate(d.due)}</span>${d.dueSrc?"":`<span class="hint">${L(SET().term+" Tage angenommen",SET().term+" days assumed")}</span>`}</div>
        ${M.err?`<span class="err f wide">${esc(M.err)}</span>`:""}</div>`;});
      foot=`<button type="button" class="btn primary" data-act="confirm-capture">${L("Übernehmen","Add invoice")}</button>`;
    }
  }
  return wrapCapture(title,body,foot);
}
const normTxt=t=>String(t||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/str\.?(?=\s|\d|$)/g,"strasse").replace(/[^a-z0-9]+/g," ").trim();
function projectFromText(d){
  const raw=[d.msg,d.bill,d.text].filter(Boolean).join("\n");if(!raw)return null;
  const line=(raw.match(/(?:objekt|baustelle|bauvorhaben|bauobjekt|projekt)\s*[:\-]?\s*([^\n\/–;|]{3,80}?)(?=\s+[-–]\s|[\n\/–;|]|$)/i)||[])[1];
  const hay=" "+normTxt(line||raw)+" ";let best=null;
  D.projects.filter(p=>!p.closed).forEach(p=>{
    const toks=normTxt(p.name).split(" ").filter(t=>t.length>2&&!/^(mfh|efh|zfh|neubau|umbau|haus|ueberbauung)$/.test(t)||/^\d+[a-z]?$/.test(t));
    if(!toks.length)return;const hit=toks.filter(t=>hay.includes(" "+t+" ")).length;
    const words=toks.filter(t=>!/^\d/.test(t)),nums=toks.filter(t=>/^\d/.test(t));
    const ok=words.some(t=>hay.includes(" "+t+" "))&&(!nums.length||nums.some(t=>hay.includes(" "+t+" ")));
    const sc=ok?hit/toks.length:0;if(sc>0&&(!best||sc>best.sc))best={pid:p.id,sc,src:(line||"").trim()};});
  return best;
}
const pidHint=M=>({text:L("Erkannt aus der Rechnung","Taken from the invoice")+(M.pidTxt?`: «${esc(M.pidTxt)}»`:""),k:L("Erkannt am Werkvertrag mit diesem Handwerker","Matched by this contractor's contract"),none:L("Auf der Rechnung steht kein Objekt. Bitte Projekt prüfen.","The invoice names no site. Please check the project."),man:L("Von Hand gewählt","Chosen manually")})[M.pidSrc];
function defaultPid(d){
  const M=S.modal,RO=M&&M.rep&&INV(M.rep);if(RO){M.pidSrc="rep";return W(RO.w).pid;}
  const t=projectFromText(d);if(t){M.pidSrc="text";M.pidTxt=t.src;return t.pid;}
  const k=D.contractors.find(c=>(c.iban&&norm(c.iban)===norm(d.iban))||c.name.trim().toLowerCase()===d.name.trim().toLowerCase());
  if(k&&!D.contracts.some(w=>w.k===k.id&&w.pid===D.pid)){const ps=[...new Set(D.contracts.filter(w=>w.k===k.id).map(w=>w.pid))].filter(id=>{const p=PJ(id);return p&&!p.closed;});if(ps.length===1){M.pidSrc="k";return ps[0];}}
  M.pidSrc="none";return D.pid;
}
function readCapture(){const d=S.modal&&S.modal.data;if(!d)return;const g=id=>document.getElementById(id);
  if(g("capAmt")){const v=num(g("capAmt").value);d.amount=v&&v>0?r2(v):0;}
  if(g("capNo"))d.no=g("capNo").value.trim();if(g("capType"))d.typeSel=g("capType").value;if(g("capBkp"))d.bkpSel=g("capBkp").value;}
function ensureBkp(bkp){const p=P();if(!p.budget.some(b=>b.bkp===bkp)){const s=STD_BKP.find(x=>x[0]===bkp);p.budget.push({bkp,de:s?s[1]:bkp,en:s?s[2]:bkp,kv:0});p.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));}}
function confirmCapture(){
  readCapture();const d=S.modal.data;
  if(!d.amount){S.modal.err=L("Betrag eingeben","Enter the amount");return renderOverlay();}
  S.modal.err="";
  const moved=S.modal.pid&&S.modal.pid!==D.pid;if(S.modal.pid)D.pid=S.modal.pid;
  const R=resolveCapture(d);if(R.dup){S.modal.step=3;logDup();return renderOverlay();}
  const items=[L("QR gelesen","QR read")],type=(document.getElementById("capType")||{}).value||"akonto";
  let k=R.k,w=R.w;
  if(!k){k={id:newId("k"),name:d.name,street:d.street,zip:d.zip,city:d.city,iban:d.iban,email:"",phone:""};D.contractors.push(k);items.push(L("Handwerker angelegt","Contractor added"));}
  else{const add=[];if(!k.street&&d.street){k.street=d.street;k.zip=d.zip;k.city=d.city;add.push(L("Adresse","address"));}if(!k.iban&&d.iban){k.iban=d.iban;add.push("IBAN");}if(add.length)items.push(add.join(L(" und "," and "))+L(" ergänzt"," added"));}
  if(!w){const bkp=(document.getElementById("capBkp")||{}).value||"211";ensureBkp(bkp);w={id:newId("w"),pid:D.pid,k:k.id,bkp,sum:0,ret:SET().ret};D.contracts.push(w);}
  items.push("BKP "+w.bkp);
  const n=type==="akonto"?(d.akN||D.invoices.filter(x=>x.w===w.id&&x.type==="akonto").length+1):0;
  const ni={id:newId("i"),no:d.no||L("ohne Nr.","no number"),w:w.id,type,n,date:d.date||iso(TODAY),due:d.due||addDays(d.date||iso(TODAY),SET().term),gross:r2(d.amount),status:"pruefen",ref:d.ref||""};if(d.fx)ni.fx=d.fx;
  logInv(ni,L("Per QR erfasst","Captured via QR"));
  D.invoices.push(ni);if(S.modal&&S.modal.rep)linkReplace(S.modal.rep,ni);
  if(type==="akonto")items.push(L("Rückbehalt ","Retention ")+nf2.format(retention(ni)));
  if(d.ref)items.push(L("Keine Doppelrechnung","No duplicate"));
  S.done={id:ni.id,items};S.modal=null;S.drawer=ni.id;S.queryOpen=false;render();
  if(moved)toast(L("Im Projekt ","Filed in ")+P().name);
}
function logDup(){const M=S.modal;if(!M||M.logged||!M.data)return;M.logged=true;D.events.unshift({pid:D.pid,c:"crit",t:M.data.name,m:L("Doppelrechnung verhindert","duplicate prevented"),chf:M.data.amount,act:"nav",v:"rechnungen"});}
