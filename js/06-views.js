/* arkitecton · Views: Home, Projekt, Rechnungen, Handwerker, Budget, Einstellungen, Ausschreibungen; render. */
"use strict";
const standalone=()=>window.navigator.standalone===true||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
function dataNotice(){
  if(D.noticeOk)return "";
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)&&!standalone();
  return `<div class="dnote"><p><b>${L("Testversion.","Test version.")}</b> ${L("Ihre Daten und Dokumente bleiben in diesem Browser auf diesem Gerät. Nichts geht an einen Server.","Your data and documents stay in this browser on this device. Nothing goes to a server.")}${ios?" "+L("Tipp: Über Teilen → «Zum Home-Bildschirm» wird arkitecton zur App, und Safari löscht die Daten nicht nach 7 Tagen ohne Nutzung.","Tip: Share → Add to Home Screen turns arkitecton into an app, and Safari will not delete the data after 7 days of non-use."):""} <button type="button" class="lnk" data-act="sheet" data-k="daten">${L("Sicherung","Backup")}</button></p><button type="button" class="ib" data-act="notice-ok" aria-label="${L("Verstanden","Got it")}" title="${L("Verstanden","Got it")}">✕</button></div>`;
}
function startSteps(){
  if(D.example)return "";
  const f=D.firm||{},steps=[
    {ok:!!(f.name&&f.iban&&f.city),t:L("Büro erfassen","Add your firm"),s:L("Name, Adresse, IBAN. Erscheint auf den Honorarrechnungen.","Name, address, IBAN. Shown on fee invoices."),a:'data-act="form" data-f="firm"'},
    {ok:D.projects.length>0,t:L("Erstes Projekt anlegen","Create your first project"),s:L("Name, Ort, Bauherrschaft.","Name, place, client."),a:'data-act="form" data-f="project"'},
    {ok:D.projects.some(p=>(p.budget||[]).length),t:L("Kostenvoranschlag erfassen","Enter the cost estimate"),s:L("BKP-Positionen mit Betrag. Daran misst arkitecton die Rechnungen.","BKP items with amounts. Invoices are measured against them."),a:D.projects.length?'data-act="nav" data-v="budget"':'data-act="form" data-f="project"'},
    {ok:D.invoices.length>0,t:L("Erste Rechnung scannen","Scan your first invoice"),s:L("QR-Rechnung fotografieren oder PDF wählen.","Photograph a QR bill or pick a PDF."),a:'data-act="capture"'}];
  const n=steps.filter(x=>x.ok).length;if(n===steps.length)return "";
  const next=steps.findIndex(x=>!x.ok);
  return `<section class="steps"><div class="sh"><h2>${L("Erste Schritte","Getting started")}</h2><span class="cnt">${n}/${steps.length}</span></div><ol>${steps.map((x,i)=>`<li class="${x.ok?"done":i===next?"next":""}"><button type="button" ${x.a}><span class="sn">${x.ok?"✓":i+1}</span><span class="st">${x.t}<span class="ss">${x.s}</span></span></button></li>`).join("")}</ol></section>`;
}
function viewFirm(){
  const today=TODAY.toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{weekday:"long",day:"numeric",month:"long"});
  const ps=D.projects.map(p=>withP(p.id,()=>{const chk=unpaid(PI()),fo=PF().filter(f=>!f.paid);return {p,chk,n:chk.length,sum:toPay(PI()),fl:flags().length,flc:flagSum(flags()),fees:fo.reduce((a,f)=>a+feeTotal(f),0),rem:fo.filter(f=>remDue(f)).length};}));
  const feeOpen=ps.reduce((a,x)=>a+x.fees,0),remN=ps.reduce((a,x)=>a+x.rem,0),tot=ps.reduce((a,x)=>a+x.sum,0);
  const parts=x=>[x.n?x.n+" "+(x.n===1?L("Rechnung offen","invoice open"):L("Rechnungen offen","invoices open")):"",x.fl?x.fl+" "+L("mit Mehrkosten","with extra costs"):"",x.rem?x.rem+" "+(x.rem===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):""].filter(Boolean).join(" · ")||L("nichts offen","nothing open");
  const rows=ps.filter(x=>!x.p.closed).map(x=>row({act:"open-project",id:x.p.id,c:x.rem?"crit":x.fl?"warn":x.n?"n":"ok",title:esc(x.p.name),meta:(x.p.place?esc(x.p.place)+" · ":"")+parts(x),amt:x.sum?chf(x.sum,false):"",label:""})).join("");
  const name=(D.firm&&D.firm.name)||L("Ihr Büro","Your firm");
  const tl=D.tenders.filter(x=>!closedT(x)&&daysTo(x.due)>=0).sort((a,b)=>toDate(a.due)-toDate(b.due));
  return `<div class="page">
    ${ph(esc(today),esc(name),"","")}
    ${dataNotice()}${startSteps()}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Offene Rechnungen","Open invoices")}</span><span class="sv">${chf(tot,false)}</span><span class="ss">${L("Handwerker","Contractors")} · ${openSub(ps.flatMap(x=>x.chk))}</span></div>
      <div class="stat"><span class="sl">${L("Zu erhalten","To receive")}</span><span class="sv">${chf(feeOpen,false)}</span><span class="ss${remN?" l-crit":""}">${remN?remN+" "+(remN===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):L("keine Mahnung fällig","no reminder due")}</span></div>
      <button type="button" class="stat" data-act="nav" data-v="ausschreibungen"><span class="sl">${L("Ausschreibungen","Tenders")}</span><span class="sv">${tl.length}</span><span class="ss">${(()=>{const o=D.tenders.filter(x=>!closedT(x)&&daysTo(x.due)>=0),y=o.filter(x=>fitOf(x).fit==="ok").length,pa=o.filter(x=>fitOf(x).fit==="partner").length;return [y?y+" "+L("Eignung erfüllt","eligible"):"",pa?pa+" "+L("nur mit Partner","only with partner"):""].filter(Boolean).join(" · ")||L("keine passend","none suitable");})()}</span></button>
    </div>
    ${(()=>{const tr=tenderTaskRows(),n=tenderTasks().length;return n?`<section><div class="sh"><h2>${L("Zu erledigen bei Ausschreibungen","Tender to-dos")}</h2><span class="cnt">${n}</span></div><div class="rows">${tr}</div></section>`:"";})()}
    ${FEES().length?incomeSection():""}
    <section><div class="sh"><h2>${L("Projekte","Projects")}</h2><span class="cnt">${ps.filter(x=>!x.p.closed).length}</span><span class="right">${ib("plus",L("Projekt erfassen","Add project"),'data-act="form-project"')}</span></div><div class="rows">${rows||`<div class="empty">${L("Noch keine Projekte.","No projects yet.")}</div>`}</div>${(()=>{const dn=ps.filter(x=>x.p.closed);return dn.length?`<details class="pdone hdone"><summary>${L("Abgeschlossene Projekte","Completed projects")} <span class="cnt">${dn.length}</span></summary><div class="rows">${dn.map(x=>row({act:"open-project",id:x.p.id,c:"ok",title:esc(x.p.name),meta:x.p.place?esc(x.p.place):"",amt:"",label:""})).join("")}</div></details>`:"";})()}</section>
    ${(()=>{const O=D.office||{},fd=docsFor("firm","firm"),bad=fd.map(docValid).filter(v=>v&&v.c!=="ok"),cr=bad.some(v=>v.c==="crit");
      return `<section><div class="sh"><h2>${L("Büroprofil","Office profile")}</h2></div><div class="rows">${row({act:"nav",v:"profil",c:bad.length?(cr?"crit":"warn"):"ok",title:L("Team, Referenzen, Unterlagen","Team, references, documents"),meta:[(O.team||[]).length+" "+L("Personen","people"),(O.refs||[]).length+" "+L("Referenzen","references"),fd.length+" "+L("Unterlagen","documents")].join(" · "),amt:"",label:bad.length?bad.length+" "+(cr?L("abgelaufen oder bald","expired or soon"):L("laufen bald ab","expiring soon")):"",lc:cr?"crit":"warn"})}</div></section>`;})()}
  </div>`;
}
function viewOverview(){
  const p=P(); if(!p) return noProject();
  const t=totals(budgetRows());
  const toCheck=PI().filter(i=>!counted(i)).sort((a,b)=>toDate(a.due)-toDate(b.due));
  const openSum=toPay(PI()),upl=unpaid(PI());
  const mt=missingTasks(),fl=flags(), flSum=flagSum(fl);
  /* cost status = approved and paid invoices incl. retention: retention is construction cost, only paid out later */
  const used=t.billed, pct=t.kv?Math.round(used/t.kv*100):0, held=r2(t.ret);
  const feeRows=PF().filter(f=>remDue(f)).map(f=>row({act:"open-fee",id:f.id,c:"crit",title:esc(L("Honorar ","Fee ")+f.no),meta:remName(remDue(f))+L(" senden"," to send"),amt:chf(feeTotal(f),false),label:L("seit "+feeAge(f)+" Tagen offen","open for "+feeAge(f)+" days"),lc:"crit"})).join("");
  const mtRows=mt.map(x=>row({act:"open-k",id:x.k.id,c:"crit",title:esc(x.k.name),meta:L("Fehlt: ","Missing: ")+x.m.join(", "),amt:"",label:L("Angaben fehlen","details missing"),lc:"crit"})).join("");
  /* deadlines of filed documents: warranty bonds, insurance certificates */
  const dl=docsOfProject(p.id).map(d=>[d,docValid(d)]).filter(([d,v])=>v&&v.c!=="ok").sort((a,b)=>(a[0].until||"").localeCompare(b[0].until||""));
  const dlRows=dl.map(([d,v])=>{const k=d.kid&&K(d.kid);return row({act:"doc-open",id:d.id,c:v.c,title:esc(k?k.name:d.name),meta:esc(dkShort(docKind(d)))+(docKind(d)==="gs"?L(" · Mängel rügen"," · report defects"):L(" · neu verlangen"," · request new")),amt:"",label:v.t,lc:v.c});}).join("");
  const nTodo=toCheck.length+mt.length+PF().filter(f=>remDue(f)).length+dl.length;
  /* same groups and words as the tiles on Rechnungen: Zu prüfen, Rückfrage */
  const invR=st=>toCheck.filter(i=>st==="rueckfrage"?i.status==="rueckfrage":i.status!=="rueckfrage").map(i=>{const k=K(W(i.w).k),dd=daysTo(i.due),q=i.status==="rueckfrage",tone=q?"crit":dueTone(dd);return row({act:"open-inv",id:i.id,c:tone,title:esc(k.name),meta:typeLabel(i),amt:chf(i.gross,false),label:dueText(dd),lc:tone});}).join("");
  const invP=invR("pruefen"),invQ=invR("rueckfrage");
  const todo=(invP?subTitle(L("Zu prüfen","To check"))+`<div class="rows">${invP}</div>`:"")+(invQ?subTitle(L("Rückfrage","Query"))+`<div class="rows">${invQ}</div>`:"")
    +(feeRows?subTitle(L("Mahnen","Send reminders"))+`<div class="rows">${feeRows}</div>`:"")
    +(mtRows?subTitle(L("Angaben ergänzen","Complete details"))+`<div class="rows">${mtRows}</div>`:"")
    +(dlRows?subTitle(L("Fristen","Deadlines"))+`<div class="rows">${dlRows}</div>`:"");
  const shown=S.allFlags?fl:fl.slice(0,3);
  const flagRows=shown.map(f=>row({act:f.act,id:f.id,v:f.v,c:f.c,title:esc(f.t),meta:esc(f.m),amt:f.chf===null?"":chf(f.chf,false),label:""})).join("");
  const today=TODAY.toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{weekday:"long",day:"numeric",month:"long"});
  return `<div class="page">
    <header class="ph"><span class="eyebrow">${esc(today)}</span><h1><button type="button" class="pswitch" data-act="sheet" data-k="projects" aria-haspopup="dialog" title="${L("Projekt wechseln","Switch project")}">${esc(p.name)}<span class="cv" aria-hidden="true">⌄</span></button></h1><div class="tools">${ib("plus",L("Projekt erfassen","Add project"),'data-act="form-project"')}${ib("edit",L("Projekt bearbeiten","Edit project"),'data-act="form-project-edit" data-id="'+p.id+'"')}</div>${[p.place,p.desc].filter(Boolean).length?`<p class="lead">${esc([p.place,p.desc].filter(Boolean).join(" · "))}</p>`:""}</header>
    ${startSteps()}
    <div class="stats">
      <button type="button" class="stat" data-act="to-pay"><span class="sl">${L("Offene Rechnungen","Open invoices")}</span><span class="sv">${chf(openSum,false)}</span><span class="ss">${L("Handwerker","Contractors")} · ${openSub(upl)}</span></button>
      <button type="button" class="stat" data-act="jump-flags"><span class="sl">${L("Mehrkosten","Extra costs")}</span><span class="sv${fl.length?" warn":""}">${chf(flSum,false)}</span><span class="ss">${fl.length?fl.length+" "+(fl.length===1?L("Hinweis","finding"):L("Hinweise","findings"))+L(" · über Vertrag, Offerte oder Budget"," · above contract, offer or budget"):L("keine","none")}</span></button>
      <button type="button" class="stat" data-act="nav" data-v="budget"><span class="sl">${L("Kostenstand","Cost status")}</span><span class="sv">${t.kv?pct+"%":"–"}</span><span class="ss kst"><span class="mini"><i style="width:${Math.min(100,pct)}%"></i></span>${t.kv?`<span>${chf(used,false)+L(" von "," of ")+nfq.format(t.kv)+L(" freigegeben"," approved")}</span>${held>0?`<span title="${L("Zurückbehalten, wird später ausbezahlt","Withheld, paid out later")}">${L("davon ","incl. ")+chf(held,false)+L(" Rückbehalt"," retention")}</span>`:""}`:L("kein Budget","no budget")}</span></button>
      ${PF().length?(()=>{const fo=PF().filter(f=>!f.paid),b=fo.reduce((a,f)=>a+feeTotal(f),0),rm=fo.filter(f=>remDue(f)).length;return `<button type="button" class="stat" data-act="to-fees"><span class="sl">${L("Honorar zu erhalten","Fees to receive")}</span><span class="sv">${chf(b,false)}</span><span class="ss${rm?" l-crit":""}">${rm?rm+" "+(rm===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):fo.length+" "+(fo.length===1?L("Rechnung offen","invoice open"):L("Rechnungen offen","invoices open"))}</span></button>`;})():""}
    </div>
    <section><div class="sh"><h2>${L("Zu erledigen","To do")}</h2><span class="cnt">${nTodo}</span></div>${todo||`<div class="rows"><div class="empty">${L("Alles erledigt.","All done.")}</div></div>`}</section>
    <section id="flags"><div class="sh"><h2>${L("Mehrkosten","Extra costs")}</h2><span class="cnt">${fl.length}</span>${fl.length>1?`<span class="legend-s">${L("Total ","Total ")+chf(flSum,false)+L(", Überschneidungen einmal gezählt",", overlaps counted once")}</span>`:""}</div><div class="rows">${flagRows||`<div class="empty">${L("Keine Mehrkosten.","No extra costs.")}</div>`}</div>
      ${fl.length>3?`<button type="button" class="more" data-act="all-flags">${S.allFlags?L("Weniger anzeigen","Show less"):L("Alle anzeigen","Show all")}</button>`:""}</section>
    ${docsGrouped("project",p.id,L("Projektdokumente","Project documents"),L("Pläne, Bewilligungen, Kostenvoranschlag mit ＋ ablegen.","Store plans, permits and estimates with ＋."))}
  </div>`;
}

function viewInvoices(){
  const p=P(); if(!p) return noProject();
  const sw=`<div class="seg" role="tablist"><button type="button" role="tab" data-act="rtab" data-t="kred" aria-selected="${S.rtab!=="deb"}">${L("Handwerker","Contractors")}</button><button type="button" role="tab" data-act="rtab" data-t="deb" aria-selected="${S.rtab==="deb"}">${L("Honorar","Fees")}</button></div>`;
  if(S.rtab==="deb") return `<div class="page invp">${ph(esc(p.name),L("Rechnungen","Invoices"),"",sw+ib("plus",L("Honorarrechnung erstellen","New fee invoice"),'data-act="form" data-f="fee"'))}${viewFees()}</div>`;
  const F=["zahlen","pruefen","rueckfrage","frei","bezahlt","all"], all=PIx();
  const of=f=>f==="all"?all:f==="zahlen"?unpaid(all):all.filter(i=>i.status===f);
  const fLabel=f=>f==="zahlen"?L("Offene Rechnungen","Open invoices"):stLabel(f);
  const cnt=f=>of(f).length;
  if(S.filter!=="all"&&!cnt(S.filter)&&all.length)S.filter=F.find(f=>f!=="all"&&cnt(f))||"all";
  const list=of(S.filter).slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const pay=S.filter==="zahlen";
  const byDue=S.filter!=="all"&&S.filter!=="bezahlt";
  const iRow=i=>{const w=W(i.w),k=K(w.k),dd=daysTo(i.due);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:esc(k.name),meta:typeLabel(i)+" · "+esc(i.no),amt:chf(pay?payout(i):i.gross,false),label:byDue?dueText(dd):stLabel(i.status),lc:byDue?dueTone(dd):STATUS[i.status].c});};
  const paidI=S.filter==="all"?list.filter(i=>i.status==="bezahlt"):[];
  const rows=list.filter(i=>!paidI.includes(i)).map(iRow).join("")+foldRows(L("Bezahlt","Paid"),paidI.map(iRow).join(""),paidI.length);
  const clean=S.filter==="pruefen"?list.filter(cleanInv):[];
  const bulkBar=clean.length>1?`<div class="bulkbar"><span><b>${clean.length} ${L("Rechnungen ohne Hinweise","invoices without remarks")}</b> · ${chf(clean.reduce((a,i)=>a+i.gross,0),false)}</span><button type="button" class="btn" data-act="bulk-open">${L("Gemeinsam freigeben","Approve together")}</button></div>`:"";
  const more=`<button type="button" class="ib" title="${L("Weitere Aktionen","More actions")}" aria-label="${L("Weitere Aktionen","More actions")}" data-act="sheet" data-k="rechnungen">${ico("more")}</button>`;
  return `<div class="page invp">
    ${ph(esc(p.name),L("Rechnungen","Invoices"),"",sw+`<span class="deskonly">${ib("plus",L("Rechnung erfassen: QR-Rechnung als PDF oder Foto","Add invoice: QR-bill as PDF or photo"),'data-act="capture"')}</span>`+more)}
    <div class="stats s4">${["pruefen","rueckfrage","frei","bezahlt"].map(f=>{const li=of(f),n=li.length,sum=f==="zahlen"?toPay(li):li.reduce((a,i)=>a+i.gross,0),sel=S.filter===f;const inner=`<span class="sl">${fLabel(f)}</span><span class="sv">${n?chf(sum,false):"–"}</span><span class="ss">${n===1?L("1 Rechnung","1 invoice"):n?n+" "+L("Rechnungen","invoices"):L("keine","none")}</span>`;return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="filter" data-f="${f}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;}).join("")}</div>
    <section><div class="sh"><h2>${S.filter==="all"?L("Alle Rechnungen","All invoices"):fLabel(S.filter)}</h2><span class="cnt">${list.length}</span>${pay&&list.some(i=>retention(i)>0)?`<span class="ss" style="margin-left:12px;color:var(--muted);font-size:.78rem">${L("Beträge nach Abzug des Rückbehalts","amounts after retention")}</span>`:""}<span class="right">${S.filter==="frei"&&list.length?`<button type="button" class="ghost" data-act="pay-pdf-all">${L("Zahlungsfreigabe an Bauherrschaft (PDF)","Payment release to client (PDF)")}</button>`:""}${S.filter==="all"||!all.length?"":`<button type="button" class="ghost" data-act="filter" data-f="all">${L("Alle anzeigen","Show all")} (${all.length})</button>`}</span></div>${bulkBar}<div class="rows">${rows||(all.length?`<div class="empty">${L("Keine Rechnungen mit diesem Status.","No invoices with this status.")}</div>`:`<div class="empty"><span>${L("Noch keine Rechnungen in diesem Projekt. Scannen Sie den QR-Zahlteil einer Handwerker-Rechnung.","No invoices in this project yet. Scan the QR payment part of a contractor invoice.")}</span></div>`)}</div></section>
  </div>`;
}

function viewContractors(){
  if(S.kid&&K(S.kid)) return viewContractor(K(S.kid));
  if(!P()) return noProject(); /* same empty state as Rechnungen and Budget */
  const p=P(),ws=PC().slice().sort((a,b)=>String(a.bkp).localeCompare(String(b.bkp),undefined,{numeric:true})||K(a.k).name.localeCompare(K(b.k).name));
  const loose=D.contractors.filter(k=>k.pid===D.pid&&!D.contracts.some(w=>w.k===k.id));
  const st=w=>{const li=D.invoices.filter(i=>i.w===w.id&&live(i)&&counted(i));const billed=r2(li.reduce((a,i)=>a+net(i),0)),ret=r2(li.reduce((a,i)=>a+retention(i),0));return {billed,ret};};
  const all=ws.map(w=>({w,k:K(w.k),...st(w)}));
  const kMiss=[...new Set([...all.map(x=>x.k),...loose])].filter(k=>missingOf(k).length);
  const T={sum:r2(all.reduce((a,x)=>a+(x.w.sum||0),0)),billed:r2(all.reduce((a,x)=>a+x.billed,0)),ret:r2(all.reduce((a,x)=>a+x.ret,0))};
  const FL={billed:x=>x.billed>0,ret:x=>x.ret>0,missing:x=>missingOf(x.k).length>0};
  if(S.kfilter&&FL[S.kfilter]&&!all.some(FL[S.kfilter])&&!(S.kfilter==="missing"&&kMiss.length))S.kfilter="";
  const kf=FL[S.kfilter]?S.kfilter:"",onlyMiss=kf==="missing";
  const shown=kf?all.filter(FL[kf]):all, shownLoose=kf==="missing"?loose.filter(k=>missingOf(k).length):kf?[]:loose;
  const missTxt=k=>{const m=missingOf(k);return m.length?`<span class="mwarn">${m.length===1?L(m[0]+" fehlt",m[0]+" missing"):L(m.length+" Angaben fehlen",m.length+" details missing")}</span>`:"";};
  const rows=shown.map(x=>{const sum=x.w.sum||0,pc=sum?Math.round(x.billed/sum*100):0,over=sum&&x.billed>sum;
      return row({act:"open-k",id:x.k.id,c:over?"crit":x.billed?"ok":"n",title:esc(x.k.name),meta:"BKP "+x.w.bkp+" "+esc(bName(x.w.bkp)),amt:kf==="billed"?chf(x.billed,false):kf==="ret"?chf(x.ret,false):chf(sum,false),
        label:`<span class="kprog${over?" over":""}"><span class="kbar"><i style="width:${Math.min(100,pc)}%"></i></span><span>${kf==="billed"?L("von","of")+" "+nf0.format(sum)+" · "+pc+" %":kf==="ret"?L("Rückbehalt","retention")+" "+retPct(x.w)+" %":pc+" % "+L("abgerechnet","billed")}</span>${missTxt(x.k)}</span>`,lc:over?"crit":"n"});}).join("")
    +shownLoose.map(k=>row({act:"open-k",id:k.id,c:"n",title:esc(k.name),meta:L("Noch kein Werkvertrag","No contract yet")+(missingOf(k).length?" · "+missTxt(k):""),amt:"",label:L("Werkvertrag erfassen","Add contract"),lc:"n"})).join("");
  const tile=(f,l,v,ss,n)=>{const sel=kf===f,inner=`<span class="sl">${l}</span><span class="sv">${n?v:"–"}</span><span class="ss">${n?ss:L("keine","none")}</span>`;return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="kfilter" data-f="${f}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const nV=all.length;
  const missTile=kMiss.length?`<button type="button" class="stat ftile${onlyMiss?" sel":""}" data-act="kfilter" data-f="missing" aria-pressed="${onlyMiss}"><span class="sl">${L("Angaben fehlen","Details missing")}</span><span class="sv warn">${kMiss.length}</span><span class="ss">${kMiss.length===1?L("1 Handwerker","1 contractor"):kMiss.length+" "+L("Handwerker","contractors")}</span></button>`
    :`<div class="stat ftile off"><span class="sl">${L("Angaben fehlen","Details missing")}</span><span class="sv">–</span><span class="ss">${L("alles vollständig","all complete")}</span></div>`;
  const more=`<button type="button" class="ib" title="${L("Weitere Aktionen","More actions")}" aria-label="${L("Weitere Aktionen","More actions")}" data-act="sheet" data-k="handwerker">${ico("more")}</button>`;
  const plus=ib("plus",L("Handwerker erfassen","Add contractor"),'data-act="sheet" data-k="k-add"');
  const head=`<div class="sh"><h2>${({billed:L("Mit Abrechnungen","With billing"),ret:L("Mit Rückbehalt","With retention"),missing:L("Angaben fehlen","Details missing")})[kf]||L("Alle Werkverträge","All contracts")}</h2><span class="cnt">${shown.length+shownLoose.length}</span><span class="right">${kf?`<button type="button" class="ghost" data-act="kfilter" data-f="">${L("Alle anzeigen","Show all")} (${nV+loose.length})</button>`:""}</span></div>`;
  return `<div class="page kpage">
    ${ph(p?esc(p.name):L("Büro","Office"),L("Handwerker","Contractors"),"",plus+more)}
    <div class="stats s4">${tile("",L("Werkverträge","Contracts"),chf(T.sum,false),nV===1?L("1 Vertrag","1 contract"):nV+" "+L("Verträge","contracts"),nV)}${tile("billed",L("Abgerechnet","Billed"),chf(T.billed,false),(T.sum?Math.round(T.billed/T.sum*100):0)+" % "+L("der Verträge","of contracts"),all.filter(FL.billed).length)}${tile("ret",L("Rückbehalt","Retention"),chf(T.ret,false),L("zurückbehalten","held back"),all.filter(FL.ret).length)}${missTile}</div>
    <section>${head}<div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Handwerker in diesem Projekt. Mit + fügen Sie einen hinzu.","No contractors in this project yet. Use + to add one.")}</span></div>`}</div></section>
  </div>`;
}

function cmpBody(w){
  const c=compare(w);
  const op=w.offerPdf,opd=op&&DOCS().find(d=>d.id===op.doc);
  const pdfIn=lbl=>`<label class="btn${lbl?"":" primary"}">${lbl||L("Offerte als PDF","Offer as PDF")}<input type="file" accept="application/pdf,.pdf" data-imp="offerpdf" data-id="${w.id}"></label>`;
  if(!c&&op) return `<div class="stats"><div class="stat"><span class="sl">${L("Offerte","Offer")}</span><span class="sv">${chf(op.sum,false)}</span><span class="ss">${L("als PDF, ","as PDF, ")+fdate(op.date)}</span></div><div class="stat"><span class="sl">${L("Vertragssumme","Contract sum")}</span><span class="sv">${w.sum?chf(w.sum,false):"–"}</span><span class="ss">${w.sum&&r2(w.sum)!==r2(op.sum)?L("weicht von der Offerte ab","differs from the offer"):L("im Werkvertrag","in the contract")}</span></div></div>
    <section class="docs"><div class="sh"><h2>${L("Offerte","Offer")}</h2></div>${opd?`<div class="dlist"><div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${opd.id}"><span class="dk">PDF</span><span class="dn">${esc(opd.name)}</span><span class="dm">${fsize(opd.size||0)} · ${fdate(opd.date)}</span></button></div></div>`:""}
    <div class="empty"><span>${L("Positionen mit der Schlussabrechnung vergleichen: Offerte zusätzlich aus Excel laden.","To compare items with the final account: also load the offer from Excel.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap">${pdfIn(L("Anderes PDF","Other PDF"))}<label class="btn">${L("Positionen aus Excel","Items from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label></div></div></section>`;
  if(!c) return `<section><div class="empty"><span>${L("Noch keine Offerte. Am einfachsten als PDF, so wie sie vom Handwerker kommt.","No offer yet. Easiest as PDF, as it comes from the contractor.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap">${pdfIn()}<label class="btn">${L("Offerte aus Excel","Offer from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label>${D.example&&w.id==="w6"?`<button type="button" class="btn" data-act="ex-offer">${L("Beispiel laden","Load example")}</button>`:""}<button type="button" class="btn" data-act="x-template">${L("Leere Vorlage","Blank template")}</button></div></div></section>`;
  const list=c.rows.filter(r=>S.cmpAll||!c.hasFinal||r.kind!=="same");
  const q=r=>r.kind==="new"?L("nicht offeriert","not in offer"):r.kind==="missing"?L("nicht abgerechnet","not billed"):c.hasFinal?nfq.format(r.oq)+" → "+nfq.format(r.fq)+" "+esc(r.unit||""):nfq.format(r.oq)+" "+esc(r.unit||"");
  const rows=list.map(r=>`<div class="row static">${dot(r.kind==="new"?"crit":r.kind==="more"?"warn":r.kind==="less"?"ok":"n")}<span class="rt">${esc(r.text)}</span><span class="rm">Pos ${esc(r.pos)} · ${q(r)}</span><span class="ra">${c.hasFinal?`<span class="${r.diff>0?"up":r.diff<0?"down":""}">${r.diff?sgn(r.diff):"0.00"}</span>`:nf2.format(r.oa)}</span><span class="rl"></span></div>`).join("");
  return `<div class="stats">
      <div class="stat"><span class="sl">${L("Offerte","Offer")}</span><span class="sv">${chf(c.ot,false)}</span><span class="ss">${c.rows.filter(r=>r.kind!=="new").length} ${L("Positionen","items")}</span></div>
      <div class="stat"><span class="sl">${L("Schlussabrechnung","Final account")}</span><span class="sv">${c.hasFinal?chf(c.ft,false):"–"}</span><span class="ss">${c.hasFinal?c.changed+" "+L("Abweichungen","differences"):L("noch nicht geladen","not loaded yet")}</span></div>
      <div class="stat"><span class="sl">${L("Differenz","Difference")}</span><span class="sv${c.hasFinal&&c.diff>0?" warn":""}">${c.hasFinal?(c.diff>0?"+":c.diff<0?"−":"")+chf(Math.abs(c.diff),false):"–"}</span><span class="ss">${c.hasFinal&&c.ot?(c.diff/c.ot*100>0?"+":"")+(c.diff/c.ot*100).toFixed(1)+"%":""}</span></div>
    </div>
    <section><div class="sh"><h2>${c.hasFinal&&!S.cmpAll?L("Abweichungen","Differences"):L("Alle Positionen","All items")}</h2><span class="cnt">${list.length}</span>${c.hasFinal?`<button type="button" class="ghost right" data-act="cmp-all">${S.cmpAll?L("Nur Abweichungen","Differences only"):L("Alle Positionen","All items")}</button>`:""}</div><div class="rows">${rows}</div>
    ${!c.hasFinal?`<div class="empty"><div style="display:flex;gap:10px;flex-wrap:wrap"><label class="btn primary">${L("Schlussabrechnung aus Excel","Final account from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="final" data-id="${w.id}"></label>${D.example&&w.id==="w6"?`<button type="button" class="btn" data-act="ex-final">${L("Beispiel laden","Load example")}</button>`:""}</div></div>`:""}</section>`;
}
function viewContractor(k){
  const all=KC(k.id), cur=D.pid;
  const pids=[...new Set(all.map(w=>w.pid))].filter(PJ).sort((a,b)=>(b===cur)-(a===cur)||PJ(a).name.localeCompare(PJ(b).name));
  if(S.kOpen==null||S.kOpen.k!==k.id)S.kOpen={k:k.id,ids:{}};
  const isOpen=pid=>pid in S.kOpen.ids?S.kOpen.ids[pid]:pid===cur;
  const invOf=ws=>D.invoices.filter(i=>ws.some(w=>w.id===i.w)).sort((a,c)=>toDate(a.date)-toDate(c.date));
  const lead=(k.city?esc(k.street)+", "+esc(k.zip)+" "+esc(k.city):`<span class="neg">${L("Adresse fehlt","Address missing")}</span>`)+(k.iban?"":` · <span class="neg">${L("IBAN fehlt","IBAN missing")}</span>`);
  const tools=ib("edit",L("Bearbeiten","Edit"),`data-act="form" data-f="contractor" data-id="${k.id}"`)+(CW(k.id)?excelBtn("k:"+k.id):"");
  const addHere=P()&&!pids.includes(cur)?`<div class="empty"><span>${L("Kein Werkvertrag in ","No contract in ")}${esc(P().name)}.</span><button type="button" class="btn primary" data-act="form" data-f="contract" data-id="${k.id}">${L("Werkvertrag erfassen","Add contract")}</button></div>`:"";
  const group=(pid,inner,count)=>{const p=PJ(pid);return `<details class="site" data-pid="${pid}"${isOpen(pid)?" open":""}><summary><span class="sn">${esc(p.name)}${p.place?`<span class="sp"> · ${esc(p.place)}</span>`:""}</span><span class="sc">${count}</span></summary><div class="in">${inner}</div></details>`;};
  let body="";
  if(S.wid&&W(S.wid)&&W(S.wid).k===k.id){
    const w=W(S.wid);
    const bi=S.cmpBack&&INV(S.cmpBack.inv);
    body=`${bi?`<button type="button" class="back" data-act="back-inv">← ${L("Zurück zur Rechnung ","Back to invoice ")}${esc(bi.no)}</button>`:backBtn("back-w",L("Alle Verträge","All contracts"))}
      <div class="ctx">${esc(PJ(w.pid).name)} · BKP ${w.bkp} ${esc(bName(w.bkp))}</div>${cmpBody(w)}`;
  } else if(S.ktab==="konto"){
    const oi=invOf(all).filter(i=>i.status!=="bezahlt"&&live(i)),open=oi.reduce((a,i)=>a+payout(i),0),gross=oi.reduce((a,i)=>a+net(i),0),oret=r2(gross-open);
    const top=all.length?`<div class="total"><span>${L("Offen","Open")}</span><span class="tv">${chf(open,false)}</span><span class="ts">${oi.length?L("Rechnungen ","Invoices ")+chf(gross,false)+(oret>0?L(" minus Rückbehalt "," minus retention ")+chf(oret,false):oret<0?L(" plus freigegebener Rückbehalt "," plus released retention ")+chf(-oret,false):""):L("nichts offen","nothing open")} · ${pids.length} ${pids.length===1?L("Projekt","project"):L("Projekte","projects")}</span></div>`:"";
    body=top+addHere+pids.map(pid=>{
      const ws=all.filter(w=>w.pid===pid),inv=invOf(ws),multi=ws.length>1;
      const stats=ws.map(w=>{const iv=inv.filter(i=>i.w===w.id),billed=iv.filter(counted).reduce((a,i)=>a+net(i),0),paid=iv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0),ret=iv.filter(counted).reduce((a,i)=>a+retention(i),0);
        return `${multi?`<div class="ctx">BKP ${w.bkp} ${esc(bName(w.bkp))}</div>`:""}<div class="stats">
        <button type="button" class="stat" data-act="form" data-f="contract" data-id="${k.id}" data-w="${w.id}"><span class="sl">${multi?"":"BKP "+w.bkp+" · "}${L("Werkvertrag","Contract")} · ${retPct(w)}% ${L("Rückbehalt","retention")}</span><span class="sv">${w.sum?chf(w.sum,false):"–"}</span><span class="ss">${L("freigegeben","approved")} ${chf(billed,false)}</span></button>
        <div class="stat"><span class="sl">${L("Ausbezahlt","Paid out")}</span><span class="sv">${chf(paid,false)}</span><span class="ss">${(n=>n+" "+(n===1?L("Zahlung","payment"):L("Zahlungen","payments")))(iv.filter(i=>i.status==="bezahlt").length)}</span></div>
        <div class="stat"><span class="sl">${L("Rückbehalt","Retention")}</span><span class="sv">${chf(ret,false)}</span><span class="ss">${L("bis Schlusszahlung","until final payment")}</span></div></div>`;}).join("");
      const rows=inv.map(i=>{const w=W(i.w);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:typeLabel(i)+(multi?` <span class="sp">· BKP ${w.bkp}</span>`:""),meta:esc(i.no)+" · "+fdate(i.date),amt:chf(i.gross,false),label:stLabel(i.status)});}).join("");
      const addInv=pid===cur?`<button type="button" class="add" data-act="form" data-f="invoice" data-id="${k.id}">${L("+ Erfassen","+ Add")}</button>`:"";
      const addW=pid===cur?`<button type="button" class="ghost" data-act="form" data-f="contract" data-id="${k.id}">${L("+ Weiterer Werkvertrag","+ Another contract")}</button>`:"";
      return group(pid,`${stats}<section><div class="sh"><h2>${L("Rechnungen","Invoices")}</h2><span class="cnt">${inv.length}</span>${addInv}</div><div class="rows">${rows||`<div class="empty">${L("Noch keine Rechnungen.","No invoices yet.")}</div>`}</div></section>${addW}`,inv.length+" "+(inv.length===1?L("Rechnung","invoice"):L("Rechnungen","invoices")));
    }).join("");
  } else {
    body=addHere+pids.map(pid=>{
      const ws=all.filter(w=>w.pid===pid);
      const rows=ws.map(w=>{const c=compare(w);return row({act:"open-w",id:w.id,c:!c?(w.offerPdf?"n":"warn"):c.hasFinal?(c.diff>0?"warn":"ok"):"n",title:"BKP "+w.bkp+" "+esc(bName(w.bkp)),meta:!c?(w.offerPdf?L("Offerte ","Offer ")+chf(w.offerPdf.sum,false)+" · PDF":L("Offerte fehlt","No offer yet")):L("Offerte ","Offer ")+chf(c.ot,false)+" · "+(c.hasFinal?L("Schluss ","Final ")+chf(c.ft,false):L("Schluss fehlt","Final missing")),amt:c&&c.hasFinal?sgn(c.diff):"",lc:"n",label:L("Öffnen →","Open →")});}).join("");
      return group(pid,`<div class="rows">${rows}</div>`,ws.length+" "+(ws.length===1?L("Vertrag","contract"):L("Verträge","contracts")));
    }).join("");
  }
  const inW=S.wid&&W(S.wid)&&W(S.wid).k===k.id;
  return `<div class="page">
    ${inW?"":backBtn("back-k",L("Handwerker","Contractors"))}
    ${ph("",esc(k.name),lead,tools)}
    ${all.length?`<div class="tabs" role="tablist"><button type="button" role="tab" data-act="ktab" data-t="konto" aria-selected="${S.ktab==="konto"}">${L("Konto","Account")}</button><button type="button" role="tab" data-act="ktab" data-t="vergleich" aria-selected="${S.ktab==="vergleich"}">${L("Offerte und Abrechnung","Offer and final account")}</button></div>`:""}
    ${body||addHere}
    ${S.wid&&W(S.wid)&&W(S.wid).k===k.id?"":docsGrouped("contractor",k.id,L("Dokumente","Documents"),L("Offerten, Werkverträge, Versicherungsnachweise mit ＋ ablegen.","Store offers, contracts and certificates with ＋."))}
  </div>`;
}
function viewBudget(){
  const p=P(); if(!p) return noProject();
  const allRows=budgetRows(), t=totals(allRows);
  const BF={aw:r=>r.awarded>0,no:r=>!r.awarded,over:r=>r.rest<0};if(!BF[S.bfilter]||!allRows.some(BF[S.bfilter]))S.bfilter="";
  const rows=S.bfilter?allRows.filter(BF[S.bfilter]):allRows,nP=n=>n===1?L("1 Position","1 item"):n+" "+L("Positionen","items");
  const bt=(f,l,v,ss,c)=>{const n=f?allRows.filter(BF[f]).length:allRows.length,sel=S.bfilter===f,inner=`<span class="sl">${l}</span><span class="sv${c||""}">${n?v:"–"}</span><span class="ss">${ss}</span>`;return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="bfilter" data-f="${f}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const sumB=(f,g)=>allRows.filter(BF[f]).reduce((a,r)=>a+g(r),0);
  const fcL=p.closed?L("Endkosten","Final cost"):L("Prognose","Forecast");
  const one=r=>{const base=Math.max(r.kv,r.awarded,r.billed+r.open,r.forecast,1),pc=x=>Math.max(0,x)/base*100;
    const act=`data-act="kv-explain" data-id="${r.b.bkp}"`;
    const sub=(r.kv?`<span class="bmob">KV ${nf0.format(r.kv)} · ${fcL} ${nf0.format(r.forecast)} · </span>`:"")+(r.rev?`<span class="l-n">${L("revidiert, ursprünglich ","revised, originally ")+nf0.format(r.b.kv||0)}</span> · `:"")+(r.none?L("nicht vergeben","not awarded"):[r.awarded?L("vergeben ","awarded ")+nf0.format(r.awarded):L("ohne Werkvertrag","no contract"),r.billed+r.open?L("abgerechnet ","billed ")+nf0.format(r.billed+r.open):""].filter(Boolean).join(" · "));
    return `<button type="button" class="brow row${S.hl===r.b.bkp?" hl":""}" ${act}><span class="code">${r.b.bkp}</span><div><span>${esc(tx(r.b))}</span><div class="bar"><i class="c-paid" style="width:${pc(r.paid)}%"></i><i class="c-appr" style="width:${pc(r.approved)}%"></i><i class="c-open" style="width:${pc(r.open)}%"></i>${r.kv?`<span class="kv" style="left:${r.kv/base*100}%"></span>`:""}</div><span class="bsub">${sub}</span></div><span class="kvc">${r.kv?chf(r.kv,false):"–"}</span><span class="nums${r.none?" mute":""}">${r.forecast?chf(r.forecast,false):"–"}</span><span class="rest ${r.rest<0?"up":r.none?"mute":""}">${r.kv&&!r.none?chf(r.rest,false):"–"}</span></button>`;};
  /* grouped by BKP main group (0 Grundstück … 9 Ausstattung) with a subtotal line, as in a cost estimate */
  const grp=[...new Set(rows.map(r=>bkpMain(r.b.bkp)))].sort();
  const br=grp.map(g=>{const rs=rows.filter(r=>bkpMain(r.b.bkp)===g),kv=rs.reduce((a,r)=>a+(r.kv||0),0),aw=rs.reduce((a,r)=>a+(r.forecast||0),0),rest=rs.reduce((a,r)=>a+(r.kv?r.rest:0),0);
    return `<div class="bgroup"><span class="code">${g}</span><span class="gn">${esc(bkpMainName(g))}</span><span class="kvc">${kv?chf(kv,false):"–"}</span><span class="nums">${aw?chf(aw,false):"–"}</span><span class="rest${rest<0?" up":rs.every(r=>r.none)?" mute":""}">${kv&&!rs.every(r=>r.none)?chf(rest,false):"–"}</span></div>`+rs.map(one).join("");}).join("");
  return `<div class="page">
    ${ph(esc(p.name),"Budget","",ib("plus",L("BKP-Position erfassen","Add BKP item"),'data-act="form" data-f="bkp"')+excelBtn("budget"))}
    <div class="stats s4">${bt("",t.rev?L("Kostenvoranschlag rev.","Revised estimate"):L("Kostenvoranschlag","Cost estimate"),chf(t.kv,false),t.rev?L("ursprünglich ","originally ")+chf(t.kv0,false):nP(allRows.length))}${bt("aw",L("Vergeben","Awarded"),chf(t.awarded,false),(t.kv?Math.round(t.awarded/t.kv*100)+" % "+L("des Kostenvoranschlags","of the estimate"):""))}${bt("no",L("Nicht vergeben","Not awarded"),chf(sumB("no",r=>r.kv),false),nP(allRows.filter(BF.no).length))}${bt("over",L("Über Budget","Over budget"),chf(sumB("over",r=>-r.rest),false),nP(allRows.filter(BF.over).length)," warn")}</div>
    <section><div class="sh"><h2>${({aw:L("Vergeben","Awarded"),no:L("Nicht vergeben","Not awarded"),over:L("Über Budget","Over budget")})[S.bfilter]||L("Alle Positionen","All items")}</h2><span class="cnt">${rows.length}</span><span class="right"><span class="ss" style="color:var(--muted);font-size:.875rem">${L("Reserve","Reserve")} <b style="font-weight:500;color:${t.rest<0?"var(--warn)":"var(--ink)"}">${chf(t.rest,false)}</b></span>${S.bfilter?`<button type="button" class="ghost" data-act="bfilter" data-f="">${L("Alle anzeigen","Show all")} (${allRows.length})</button>`:""}</span></div>${allRows.length?`<div class="bulkbar costbar"><span><b>${L("Kostenstand für die Bauherrschaft","Cost status for the client")}</b> · ${L("Budget, ","Budget, ")+fcL+L(" und Reserve als PDF zum Versenden"," and reserve as a PDF to send")}</span><button type="button" class="btn" data-act="cost-pdf">${L("PDF erstellen","Create PDF")}</button></div>`:""}</section>
    <section>${br?`<div class="bhead"><span>BKP</span><span>${L("Arbeitsgattung","Trade")}</span><span class="kvc">${L("Kostenvoranschlag","Estimate")}</span><span class="nums">${fcL}</span><span class="rest">${L("Reserve","Reserve")}</span></div>`:""}${br||`<div class="empty"><span>${L("Noch kein Kostenvoranschlag. Erfassen Sie die BKP-Positionen mit Betrag, daran misst arkitecton alle Rechnungen.","No cost estimate yet. Add the BKP items with amounts; arkitecton measures every invoice against them.")}</span><div class="eb"><button type="button" class="btn primary" data-act="form" data-f="bkp">${L("BKP-Position erfassen","Add BKP item")}</button></div></div>`}
      ${rows.length?`<div class="legend"><span><i class="c-paid"></i>${L("Bezahlt","Paid")}</span><span><i class="c-appr"></i>${L("Freigegeben","Approved")}</span><span><i class="c-open"></i>${L("Zu prüfen","To check")}</span><span><i style="width:1px;height:12px;background:var(--ink)"></i>${L("Kostenvoranschlag","Estimate")}</span></div>`:""}</section>
  </div>`;
}

/* ---------- settings ---------- */
const navMode=()=>{try{return localStorage.getItem("arkitecton:nav")==="min"?"min":"open";}catch(e){return "open";}};
const themeMode=()=>{try{const t=localStorage.getItem("arkitecton:theme");return t==="light"||t==="dark"?t:"auto";}catch(e){return "auto";}};
function setTheme(t){try{if(t==="auto")localStorage.removeItem("arkitecton:theme");else localStorage.setItem("arkitecton:theme",t);}catch(e){}if(t==="auto")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",t);themeMeta();}
function themeMeta(){const t=themeMode(),dark=t==="dark"||(t==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",dark?"#111110":"#fafaf8");}
/* ---------- projects: last change, favourites, bin ---------- */
const projSig=p=>{const ws=D.contracts.filter(w=>w.pid===p.id),ids=new Set(ws.map(w=>w.id));const j=JSON.stringify([p.name,p.place,p.client,p.desc,p.budget,ws,D.invoices.filter(i=>ids.has(i.w)),(D.fees||[]).filter(f=>f.pid===p.id)]);let h=0;for(let i=0;i<j.length;i++)h=(h*31+j.charCodeAt(i))|0;return h+":"+j.length;};
function stampProjects(){if(!D||!D.projects)return;D.projects.forEach(p=>{const g=projSig(p);if(p.sig&&p.sig!==g)p.edited=new Date().toISOString();p.sig=g;});}
function lastEdited(p){if(p.edited)return p.edited.slice(0,10);const ids=new Set(D.contracts.filter(w=>w.pid===p.id).map(w=>w.id));const ds=[...D.invoices.filter(i=>ids.has(i.w)),...(D.fees||[]).filter(f=>f.pid===p.id)].flatMap(x=>(x.log||[]).map(l=>l.d)).filter(Boolean).sort();return ds.length?ds[ds.length-1].slice(0,10):null;}
const activeProjects=()=>D.projects.filter(p=>!p.closed).sort((a,b)=>(b.fav?1:0)-(a.fav?1:0));
function trashProject(id){const p=D.projects.find(x=>x.id===id);if(!p)return;const ws=D.contracts.filter(w=>w.pid===id),ids=new Set(ws.map(w=>w.id));
  const e={id:newId("x"),at:iso(TODAY),p,contracts:ws,invoices:D.invoices.filter(i=>ids.has(i.w)),fees:(D.fees||[]).filter(f=>f.pid===id)};
  D.trash=D.trash||[];D.trash.unshift(e);D.projects=D.projects.filter(x=>x.id!==id);D.contracts=D.contracts.filter(w=>w.pid!==id);D.invoices=D.invoices.filter(i=>!ids.has(i.w));if(D.fees)D.fees=D.fees.filter(f=>f.pid!==id);
  if(D.pid===id){const n=activeProjects()[0];D.pid=n?n.id:null;}}
function restoreTrash(tid){const e=(D.trash||[]).find(x=>x.id===tid);if(!e)return;D.projects.push(e.p);D.contracts.push(...e.contracts);D.invoices.push(...e.invoices);D.fees=(D.fees||[]).concat(e.fees);D.trash=D.trash.filter(x=>x.id!==tid);if(!D.pid)D.pid=e.p.id;}
function setNavMode(m){try{localStorage.setItem("arkitecton:nav",m);}catch(e){}document.getElementById("app").classList.toggle("rail-min",m==="min");}
function viewSettings(){
  const st=SET(),f=D.firm||{};
  const seg=(name,cur,opts)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-act="${name}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join("")}</div>`;
  const num=(id,v,unit,lbl)=>`<label class="setnum"><input id="${id}" data-set="${id}" inputmode="numeric" autocomplete="off" value="${v}" aria-label="${esc(lbl)}"><span>${unit}</span></label>`;
  const row=(t,hint,ctrl)=>`<div class="setrow"><div><div class="st">${t}</div>${hint?`<div class="sh2">${hint}</div>`:""}</div><div class="sc">${ctrl}</div></div>`;
  return `<div class="page">${ph("",L("Einstellungen","Settings"),"","")}
    <section><div class="sh"><h2>${L("Ansicht","View")}</h2></div>
      ${row(L("Erscheinungsbild","Appearance"),L("Automatisch folgt der Einstellung Ihres Geräts.","Automatic follows your device setting."),seg("theme-set",themeMode(),[["auto",L("Automatisch","Automatic")],["light",L("Hell","Light")],["dark",L("Dunkel","Dark")]]))}
      ${row(L("Sprache","Language"),"",seg("lang-set",S.lang,[["de","Deutsch"],["en","English"]]))}
    </section>
    <section><div class="sh"><h2>${L("Büroprofil","Office profile")}</h2></div>
      ${row(L("Büro, Team, Referenzen, Unterlagen","Office, team, references, documents"),L("Haben einen eigenen Bereich.","Have their own section."),`<button type="button" class="btn" data-act="nav" data-v="profil">${L("Zum Büroprofil","Open office profile")}</button>`)}
    </section>
    <section><div class="sh"><h2>${L("Standardwerte","Defaults")}</h2><span class="legend-s">${L("Gelten für neue Werkverträge und Rechnungen","Apply to new contracts and invoices")}</span></div>
      ${row(L("Rückbehalt","Retention"),L("Standard für neue Werkverträge, meist 0 %. Öffentliche Bauherren wie die Stadt behalten oft einen Rückbehalt. Pro Werkvertrag änderbar.","Default for new contracts, usually 0 %. Public clients such as the city often hold back retention. Can be changed per contract."),num("ret",st.ret,"%",L("Rückbehalt","Retention")))}
      ${row(L("Zahlungsfrist Handwerker","Contractor payment term"),L("Wenn die Rechnung kein Fälligkeitsdatum enthält.","When the invoice has no due date."),num("term",st.term,L("Tage","days"),L("Zahlungsfrist Handwerker","Contractor payment term")))}
      ${row(L("Zahlungsfrist Honorar","Fee payment term"),L("Steht auf Ihren neuen Honorarrechnungen.","Printed on your new fee invoices."),num("feeTerm",st.feeTerm,L("Tage","days"),L("Zahlungsfrist Honorar","Fee payment term")))}
      ${row(L("Mahnungen","Reminders"),L("1., 2. und 3. Mahnung, Tage ab Rechnungsdatum.","1st, 2nd and 3rd reminder, days from the invoice date."),`<div class="setrem">${num("rem0",st.rem[0],"",L("1. Mahnung","1st reminder"))}${num("rem1",st.rem[1],"",L("2. Mahnung","2nd reminder"))}${num("rem2",st.rem[2],L("Tage","days"),L("3. Mahnung","3rd reminder"))}</div>`)}
      <div class="ferr" id="setErr" role="alert"></div>
    </section>
    <section><div class="sh"><h2>${L("BKP-Liste","BKP list")}</h2></div>
      ${(()=>{const own=D.bkpList||[],inf=D.bkpListInfo||{},sub=own.filter(o=>o[0].includes(".")).length;
        return row(own.length?L("Eigene Liste aktiv","Own list active"):L("Standardliste","Standard list"),own.length?esc(inf.name||"")+" · "+own.length+L(" Codes"," codes")+(sub?", "+sub+L(" Unterpositionen"," sub-items"):"")+" · "+fdate(inf.date||iso(TODAY)):L("Hauptgruppen 0 bis 9 und Positionen bis 3 Stellen. Für Unterpositionen wie 211.5 laden Sie Ihre eigene Liste als Excel: Spalte A Nummer, Spalte B Bezeichnung.","Main groups 0 to 9 and items up to 3 digits. For sub-items like 211.5, load your own list as Excel: column A number, column B name."),
          `<div class="setbtns"><label class="btn">${own.length?L("Andere Liste laden","Load other list"):L("Eigene Liste laden","Load own list")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="bkplist"></label>${own.length?`<button type="button" class="btn" data-act="bkp-reset">${L("Standardliste verwenden","Use standard list")}</button>`:""}</div>`);})()}
    </section>
    <section><div class="sh"><h2>${L("Papierkorb","Bin")}</h2><span class="cnt">${(D.trash||[]).length}</span></div>
      ${(D.trash||[]).length?(D.trash||[]).map(t=>row(esc(t.p.name),L("Gelöscht am ","Deleted on ")+fdate(t.at)+" · "+t.invoices.length+" "+L("Rechnungen","invoices")+", "+t.fees.length+" "+L("Honorarrechnungen","fee invoices"),`<div class="setbtns"><button type="button" class="btn" data-act="trash-restore" data-id="${t.id}">${L("Wiederherstellen","Restore")}</button>${S.confirm==="tp:"+t.id?`<button type="button" class="btn danger" data-act="trash-purge" data-id="${t.id}">${L("Wirklich endgültig löschen?","Really delete permanently?")}</button>`:`<button type="button" class="btn" data-act="ask" data-c="tp:${t.id}">${L("Endgültig löschen","Delete permanently")}</button>`}</div>`)).join(""):`<p class="fine" style="color:var(--muted);font-size:.875rem;margin:14px 0 0">${L("Leer. Gelöschte Projekte landen hier und lassen sich wiederherstellen.","Empty. Deleted projects land here and can be restored.")}</p>`}
    </section>
    <section><div class="sh"><h2>${L("Daten und Sicherung","Data and backup")}</h2></div>
      <div class="menu setmenu">${menuItems(sheetDef("daten"))}</div>
      <p class="fine" style="color:var(--muted);font-size:.78rem;max-width:62ch">${esc(sheetDef("daten").note||"")}</p>
    <p class="fine" style="color:var(--faint);font-size:.78rem;margin-top:18px">${L("Version","Version")} ${esc(((document.querySelector('script[src*="app.js"]')||{}).src||"").split("v=")[1]||"–")}</p>
    </section>
  </div>`;
}
function saveSetting(el){
  const v=Number(String(el.value).replace(/[^\d.]/g,"")),k=el.dataset.set,e=document.getElementById("setErr"),st=SET();
  const bad=m=>{el.setAttribute("aria-invalid","true");if(e)e.textContent=m;};
  el.removeAttribute("aria-invalid");if(e)e.textContent="";
  if(!el.value.trim()||isNaN(v))return bad(L("Bitte eine Zahl eingeben.","Please enter a number."));
  D.settings=D.settings||{};
  if(k==="ret"){if(v<0||v>30)return bad(L("Rückbehalt zwischen 0 und 30 %.","Retention between 0 and 30 %."));D.settings.ret=v;}
  else if(k==="term"||k==="feeTerm"){if(v<1||v>180)return bad(L("Zahlungsfrist zwischen 1 und 180 Tagen.","Payment term between 1 and 180 days."));D.settings[k]=Math.round(v);}
  else if(/^rem/.test(k)){const r=st.rem.slice();r[+k.slice(3)]=Math.round(v);
    if(!(r[0]<r[1]&&r[1]<r[2]))return bad(L("Die Mahnstufen müssen aufsteigen, z. B. 60, 90, 120.","Reminder steps must increase, e.g. 60, 90, 120."));
    if(r[0]<=st.feeTerm)return bad(L("Die 1. Mahnung muss nach der Zahlungsfrist von "+st.feeTerm+" Tagen kommen.","The 1st reminder must come after the "+st.feeTerm+"-day payment term."));
    D.settings.rem=r;}
  saveData();toast(L("Gespeichert","Saved"));
}
function pageActs(){const s=new Set();document.querySelectorAll("#main [data-act]").forEach(e=>{s.add(e.dataset.act+"|"+(e.dataset.f||""));if(e.dataset.act==="sheet"&&e.dataset.k!=="projects"&&e.dataset.k!=="daten"){const d=sheetDef(e.dataset.k);(d&&d.groups||[]).forEach(g=>g[1].forEach(x=>s.add(x.imp?"imp:"+x.imp+"|":x.act+"|"+(x.f||""))));}});return s;}
const itemKey=x=>x.imp?"imp:"+x.imp+"|":x.act+"|"+(((x.ex||"").match(/data-f="([^"]+)"/)||[])[1]||"");
const FOLDK="arkitecton:fold",foldGet=()=>{try{return JSON.parse(localStorage.getItem(FOLDK)||"{}")}catch(e){return {}}};
/* sections fold; on the tender detail each section opens by default only when something there needs doing (data-fd="1" = closed), and the choice holds for the session */
function foldSections(){const tk=S.view==="ausschreibungen"&&S.tid?"t:"+S.tid+":":null;
  if(S.view!=="buero"&&S.view!=="uebersicht"&&!tk)return;const st=tk?(S.tfold||(S.tfold={})):foldGet();
  document.querySelectorAll("#main section").forEach(sec=>{const sh=sec.querySelector(":scope>.sh"),h=sh&&sh.querySelector("h2");if(!h||sh.querySelector(".fold")||(tk&&!sec.dataset.fk))return;
    const k=tk?tk+sec.dataset.fk:S.view+":"+h.textContent.trim(),closed=tk?(k in st?st[k]:sec.dataset.fd==="1"):!!st[k];sec.classList.add("foldable");sec.classList.toggle("folded",closed);
    const b=document.createElement("button");b.type="button";b.className="fold";b.dataset.act="fold";b.dataset.k=k;if(tk)b.dataset.s="t";b.setAttribute("aria-expanded",String(!closed));b.setAttribute("aria-label",(closed?L("Aufklappen: ","Expand: "):L("Zuklappen: ","Collapse: "))+h.textContent.trim());b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';sh.appendChild(b);});}
function trimRail(){const b=document.querySelector('.rail .nrow>button[data-act="nav"][data-v="'+S.view+'"]');if(!b)return;const row=b.parentNode,on=pageActs();
  row.querySelectorAll(".nact .na").forEach(n=>{if(n.dataset.act==="nmore"){if(!popItems("nav",S.view).length)n.remove();}else if(on.has(n.dataset.act+"|"+(n.dataset.f||"")))n.remove();});}
function popItems(kind,key){
  const it=(label,act,ex)=>({label,act,ex:ex||""}),im=(label,imp)=>({label,imp}),xl=" (Excel)";
  const navList=kind!=="nav"?[]:({
    uebersicht:[it(L("Projekt bearbeiten","Edit project"),"form-project-edit",`data-id="${D.pid}"`),it(L("Kostenübersicht für die Bauherrschaft","Cost overview for the client")+xl,"x-report"),...popItems("proj",D.pid).filter(x=>x.act!=="form-project-edit")],
    rechnungen:[it(L("Ohne QR erfassen","Add without QR"),"form",'data-f="invoice"'),it(L("Honorarrechnung erstellen","New fee invoice"),"form",'data-f="fee"'),it(L("Rechnungsliste","Invoice list")+xl,"x-invoices")],
    handwerker:[im(L("Handwerkerliste importieren","Import contractor list"),"contractors"),it(L("Handwerkerliste","Contractor list")+xl,"x-contractors")],
    budget:[it(L("Kostenstand für die Bauherrschaft (PDF)","Cost status for the client (PDF)"),"cost-pdf"),it(L("Bauabrechnung (PDF)","Construction account (PDF)"),"final-pdf"),it(L("Budget nach BKP","Budget by BKP")+xl,"x-budget")],
    ausschreibungen:[it(L("Verfahrensliste","Procedure list")+xl,"x-tenders"),it(L("Referenzliste","Reference list")+xl,"x-refs")]})[key]||[];
  if(kind==="nav"&&key===S.view){const on=pageActs();return navList.filter(x=>!on.has(itemKey(x)));}
  if(kind==="nav")return navList;
  const p=D.projects.find(x=>x.id===key);if(!p)return [];
  return [it(p.fav?L("Aus Favoriten entfernen","Remove from favourites"):L("Zu Favoriten","Add to favourites"),"pfav",`data-id="${p.id}"`),
    it(L("Umbenennen","Rename"),"form-project-edit",`data-id="${p.id}"`),
    S.pconfirm===p.id?it(L("Wirklich in den Papierkorb?","Really move to bin?"),"ptrash",`data-id="${p.id}"`):it(L("In den Papierkorb","Move to bin"),"pask",`data-id="${p.id}"`)].map((x,i)=>i===2?Object.assign(x,{danger:true}):x);
}
function renderPop(){let el=document.getElementById("pop");if(!el){el=document.createElement("div");el.id="pop";el.setAttribute("role","menu");document.body.appendChild(el);}
  const P0=S.pop;if(!P0){el.className="";el.innerHTML="";return;}
  const items=popItems(P0.kind,P0.key);
  const foot=(P0.kind==="proj"||(P0.kind==="nav"&&P0.key==="uebersicht"))?(()=>{const p=D.projects.find(x=>x.id===(P0.kind==="proj"?P0.key:D.pid)),d=p&&lastEdited(p);return d?`<div class="popfoot">${L("Zuletzt geändert am ","Last changed on ")+fdate(d)}</div>`:"";})():"";
  el.innerHTML=`<div class="pophead">${P0.kind==="proj"?L("Projekt","Project"):vName(P0.key)}</div>`+items.map(x=>x.imp?`<label class="popi" role="menuitem"><span>${esc(x.label)}</span><input type="file" accept=".xlsx,.xls,.csv" data-imp="${x.imp}" aria-label="${esc(x.label)}"></label>`:`<button type="button" class="popi${x.danger?" danger":""}" role="menuitem" data-act="${x.act}" ${x.ex}>${esc(x.label)}</button>`).join("")+foot;
  el.className="on";const r=P0.rect,w=el.offsetWidth,h=el.offsetHeight;
  el.style.left=Math.min(innerWidth-w-8,r.right+6)+"px";el.style.top=Math.max(8,Math.min(innerHeight-h-8,r.top-6))+"px";
  const f=el.querySelector(".popi");if(f&&P0.kb)f.focus();}
function closePop(){if(S.pop){S.pop=null;S.pconfirm=null;renderPop();}}
/* the office team lives with the office data; tenders and signatures read from it */
function teamSection(row){
  const O=D.office,tm=O.team||[],sg=(D.firm.signers||[]).filter(g=>g.m&&tm.some(m=>m.id===g.m));
  const signs=id=>sg.find(g=>g.m===id);
  const mRow=m=>{const cr=curRole(m),g=signs(m.id);return `<button type="button" class="row" data-act="open-m" data-id="${m.id}">${dot(g?"ok":"n")}<span class="rt">${esc(m.name)}</span><span class="rm">${[cr?tx(ROLES[cr]):"",m.qual?esc(m.qual):""].filter(Boolean).join(" · ")}</span><span class="ra">${yrs(roleYears(m))}</span><span class="rl l-n">${[g?L("unterschreibt","signs"):"",(m.extra||[]).includes("qes")?"QES":""].filter(Boolean).join(" · ")}</span></button>`;};
  const sgTxt=sg.map(g=>{const m=tm.find(x=>x.id===g.m);return esc(m.name)+(g.role?" ("+esc(g.role)+")":"");}).join(" · ");
  return `<section id="team"><div class="sh"><h2>${L("Team","Team")}</h2><span class="cnt">${tm.length}</span><span class="right">${ib("plus",L("Person erfassen","Add person"),'data-act="form" data-f="person"')}</span></div>
      <div class="rows">${tm.map(mRow).join("")||`<div class="empty"><span>${L("Noch niemand erfasst. Das Team braucht arkitecton für Unterschriften auf Briefen und für die Eignung bei Ausschreibungen.","Nobody yet. arkitecton uses the team for signatures on letters and for tender eligibility.")}</span></div>`}</div>
      ${row(L("Unterschriften auf Briefen","Signatures on letters"),sgTxt||L("Noch niemand festgelegt. Gilt für Zahlungsfreigabe und Kostenstand.","Nobody set yet. Used for payment release and cost status."),`<button type="button" class="btn" data-act="form" data-f="signers">${L("Festlegen","Set")}</button>`)}
    </section>`;
}
/* the office profile: firm data, team, references and the firm documents (bid folder), kept once and used for invoices, letters and every bid */
function viewProfil(){
  const O=D.office,f=D.firm||{};
  if(S.mid&&O.team.find(m=>m.id===S.mid))return viewPerson(O.team.find(m=>m.id===S.mid),"");
  const srow=(t,hint,ctrl)=>`<div class="setrow"><div><div class="st">${t}</div>${hint?`<div class="sh2">${hint}</div>`:""}</div><div class="sc">${ctrl}</div></div>`;
  const adr=[f.street,[f.zip,f.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const sugg=D.projects.filter(p=>p.closed&&!p.refId&&!(p.refSkip));
  const G={refs:O.refs,pub:O.refs.filter(r=>r.pub),sugg};
  if(!G[S.pfilter]||(!G[S.pfilter].length&&S.pfilter!=="refs"))S.pfilter="refs";
  const maxC=Math.max(0,...O.refs.filter(r=>!r.running).map(r=>r.cost||0));
  const TL={refs:[L("Referenzen","References"),O.refs.length,O.refs.length?L("grösstes Projekt ","largest project ")+mio(maxC):L("noch keine erfasst","none yet")],
    pub:[L("Öffentliche Bauherrschaft","Public clients"),G.pub.length,L("oft verlangt bei Ausschreibungen","often required in tenders")],
    sugg:[L("Vorschläge","Suggestions"),sugg.length,L("abgeschlossene Projekte als Referenz","completed projects as reference")]};
  const tile=k=>{const [l,v,ss]=TL[k],n=G[k].length,sel=S.pfilter===k,inner=`<span class="sl">${l}</span><span class="sv">${v||"–"}</span><span class="ss">${ss}</span>`;
    return n||k==="refs"?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="pfilter" data-f="${k}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const refRow=r=>row({act:"form",id:r.id,c:r.pub?"acc":"n",title:esc(tx(r)),meta:[esc(r.client||""),r.type&&RTYPE[r.type]?tx(RTYPE[r.type]):"",r.phases?"SIA "+esc(r.phases):""].filter(Boolean).join(" · "),amt:r.cost?mio(r.cost):"",label:r.running?L("laufend","ongoing"):String(r.year||""),lc:"n"}).replace('data-act="form"','data-act="form" data-f="ref"');
  const sRow=p=>row({act:"form",c:"n",title:esc(p.name),meta:[esc(p.place||""),esc(p.client||"")].filter(Boolean).join(" · "),amt:"",label:L("Als Referenz übernehmen","Use as reference"),lc:"acc"}).replace('data-act="form"','data-act="form" data-f="ref" data-w="'+p.id+'"');
  const fl=S.pfilter,list=G[fl],rows=(fl==="sugg"?list.map(sRow):list.map(refRow)).join("");
  const sig=f.sigRule==="kollektiv2"?L("kollektiv zu zweien","jointly by two"):L("Einzelunterschrift","single signature");
  return `<div class="page">${ph("",L("Büroprofil","Office profile"),L("Einmal pflegen: für Rechnungen, Briefe und jede Bewerbung bereit.","Keep once: ready for invoices, letters and every bid."),"")}
    ${!O.refs.length||!O.team.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Solange Referenzen und Team fehlen, kann arkitecton die Eignung bei Ausschreibungen nicht prüfen.","As long as references and team are missing, arkitecton cannot check tender eligibility.")}</span></div>`:""}
    <section><div class="sh"><h2>${L("Büro","Office")}</h2></div>
      ${srow(esc(f.name||L("Büroname fehlt","Firm name missing")),[adr,f.iban?"IBAN "+fmtIban(f.iban):L("IBAN fehlt","IBAN missing"),f.vatNo||"",L("Zeichnungsberechtigung: ","Signing: ")+sig].filter(Boolean).map(esc).join(" · "),`<button type="button" class="btn" data-act="form" data-f="firm">${L("Bearbeiten","Edit")}</button>`)}
    </section>
    ${teamSection(srow)}
    <section id="refs"><div class="sh"><h2>${L("Referenzen","References")}</h2><span class="cnt">${O.refs.length}</span><span class="right">${ib("plus",L("Referenz erfassen","Add reference"),'data-act="form" data-f="ref"')}</span></div>
      <div class="stats">${["refs","pub","sugg"].map(tile).join("")}</div>
      <div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Referenzen. Mit + erfassen Sie eine, oder übernehmen Sie ein abgeschlossenes Projekt.","No references yet. Use + to add one, or take over a completed project.")}</span></div>`}</div></section>
    ${docsBlock("firm","firm",L("Unterlagen des Büros","Firm documents"),L("Handelsregister, Versicherung, AHV, Betreibungsregister: einmal ablegen, für jede Bewerbung bereit. Mit Gültigkeit warnt arkitecton vor Ablauf.","Register extract, insurance, social security: store once, ready for every bid."))}
  </div>`;
}
function viewTenders(){
  if(S.tid&&T(S.tid)) return viewTender(T(S.tid));
  const O=D.office;
  const tsw=`<button type="button" class="btn" data-act="nav" data-v="profil">${L("Büroprofil","Office profile")}</button>`;
  const noProf=!O.refs.length||!O.team.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Solange Referenzen und Team fehlen, kann arkitecton die Eignung bei Ausschreibungen nicht prüfen.","As long as references and team are missing, arkitecton cannot check tender eligibility.")} <button type="button" class="ghost link" data-act="nav" data-v="profil">${L("Im Büroprofil ergänzen","Add in the office profile")}</button></span></div>`:"";
  const active=D.tenders.filter(t=>!closedT(t)),closed=D.tenders.filter(closedT);
  const G={open:active,ok:active.filter(t=>fitOf(t).fit==="ok"),partner:active.filter(t=>fitOf(t).fit==="partner"),done:closed};
  if(!G[S.tfilter])S.tfilter="open";
  if(!G[S.tfilter].length&&S.tfilter!=="open")S.tfilter="open";
  const next=active.filter(t=>fitOf(t).fit!=="no").sort((a,b)=>toDate(a.due)-toDate(b.due))[0];
  const list=G[S.tfilter].slice().sort((a,b)=>closedT(a)?toDate(b.due)-toDate(a.due):toDate(a.due)-toDate(b.due));
  const tRow=t=>{const f=fitOf(t).fit,c=closedT(t),dd=daysTo(t.due);return row({act:"open-t",id:t.id,c:c?"n":FIT[f].c,title:esc(tx(t.title)),meta:(c?"":(isSel(t)?(phaseOf(t)===1?L("Teilnahmeantrag ","Request "):L("Angebot ","Bid ")):"")+(dd<0?L("vorbei","closed"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days")))+" · ")+esc(t.client),amt:c?"":fdate(t.due),label:c?(t.status==="eingereicht"?L("Zuschlag ausstehend","Award pending"):t.status==="pq"?L("Auswahl ausstehend","Selection pending"):tx(TST[t.status])):tx(FIT[f]),lc:c?(t.status==="gewonnen"?"ok":"n"):undefined});};
  const doneT=S.tfilter==="open"?closed.slice().sort((a,b)=>toDate(b.due)-toDate(a.due)):[],waitL=doneT.filter(waitT),endL=doneT.filter(t=>!waitT(t));
  const rows=list.map(tRow).join("")+foldRows(L("Eingereicht, Entscheid ausstehend","Submitted, decision pending"),waitL.map(tRow).join(""),waitL.length)+foldRows(L("Abgeschlossen","Closed"),endL.map(tRow).join(""),endL.length);
  const nT=n=>n===1?L("1 Verfahren","1 procedure"):n+" "+L("Verfahren","procedures");
  const TL={open:[L("Offene Verfahren","Open procedures"),String(active.length),next?L("nächste Eingabe ","next deadline ")+fdate(next.due):L("keine Frist offen","no open deadline"),""],
    ok:[L("Eignung erfüllt","Eligible"),String(G.ok.length),nT(G.ok.length),G.ok.length?" ok":""],
    partner:[L("Nur mit Partner","Only with partner"),String(G.partner.length),nT(G.partner.length),G.partner.length?" warn":""],
    done:(()=>{const dec=D.tenders.filter(t=>t.status==="gewonnen"||t.status==="verloren"),won=dec.filter(t=>t.status==="gewonnen").length,pend=D.tenders.filter(t=>t.status==="eingereicht").length;
      const lost=dec.length-won,ss=[lost?lost+" "+L("ohne Zuschlag","not awarded"):"",pend?pend+" "+L("ausstehend","pending"):""].filter(Boolean).join(" · ")||(won?nT(won):L("noch kein Entscheid","no decision yet"));
      return [L("Zuschlag erhalten","Contract awarded"),won?String(won):"–",ss,won?" ok":""];})()};
  const tile=k=>{const [l,v,ss,c]=TL[k],n=G[k].length,sel=S.tfilter===k,inner=`<span class="sl">${l}</span><span class="sv${c}">${n?v:"–"}</span><span class="ss">${ss}</span>`;
    return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="tfilter" data-f="${k}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  return `<div class="page">${ph("",L("Ausschreibungen","Tenders"),"",tsw+ib("plus",L("Ausschreibung erfassen","Add tender"),'data-act="form" data-f="tender"')+excelBtn("tender"))}
    ${noProf}
    <div class="stats s4">${["open","ok","partner","done"].map(tile).join("")}</div>
    <section><div class="sh"><h2>${S.tfilter==="done"?L("Eingereichte Verfahren","Submitted procedures"):TL[S.tfilter][0]}</h2><span class="cnt">${list.length}</span><span class="right">${S.tfilter==="open"?"":`<button type="button" class="ghost" data-act="tfilter" data-f="open">${L("Alle offenen anzeigen","Show all open")} (${active.length})</button>`}</span></div><div class="rows">${rows||`<div class="empty"><span>${L("Keine Verfahren.","No procedures.")}</span></div>`}</div></section>
  </div>`;
}

function viewPerson(m,tsw){
  const cr=curRole(m),car=(m.career||[]).slice().sort((a,b)=>(b.to||9999)-(a.to||9999)||b.from-a.from);
  const st=(l,v,ss)=>`<div class="stat"><span class="sl">${l}</span><span class="sv">${v}</span><span class="ss">${ss}</span></div>`;
  const pl=roleYears(m,"pl"),bl=roleYears(m,"bl"),tot=roleYears(m);
  const cRow=c=>{const i=m.career.indexOf(c);return row({act:"form",id:m.id,c:c.to?"n":"ok",title:tx(ROLES[c.role]||{de:c.role,en:c.role}),meta:esc(c.firm||""),amt:c.from+" – "+(c.to||L("heute","today")),label:yrs(spanY(c)),lc:"n"}).replace('data-act="form"','data-act="form" data-f="career" data-w="'+i+'"');};
  const nowC=car.filter(c=>!c.to),pastC=car.filter(c=>c.to);
  const rows=(nowC.length?nowC:pastC.slice(0,1)).map(cRow).join("")+foldRows(L("Frühere Stationen","Earlier positions"),(nowC.length?pastC:pastC.slice(1)).map(cRow).join(""),(nowC.length?pastC:pastC.slice(1)).length);
  const xs=(m.extra||[]).filter(x=>XQ[x]);
  return `<div class="page">
    <button type="button" class="back" data-act="back-m">← ${L("Büroprofil","Office profile")}</button>
    ${ph(L("Team","Team")+(cr?" · "+tx(ROLES[cr]):""),esc(m.name),esc(m.qual||""),ib("edit",L("Person bearbeiten","Edit person"),`data-act="form" data-f="person" data-id="${m.id}"`))}
    <div class="stats">${st(L("Berufserfahrung","Experience"),tot?yrs(tot):"–",tot?L("seit ","since ")+startY(m):L("Werdegang erfassen","add career"))}${st(L("Als Projektleiter","As project lead"),pl?yrs(pl):"–",pl?L("Projektleitung","project management"):L("keine Erfahrung erfasst","none recorded"))}${st(L("Als Bauleiter","As site manager"),bl?yrs(bl):"–",xs.includes("blfa")?tx(XQ.blfa):bl?L("Bauleitung","site management"):L("keine Erfahrung erfasst","none recorded"))}</div>
    <section><div class="sh"><h2>${L("Werdegang","Career")}</h2><span class="cnt">${car.length}</span><span class="right"><button type="button" class="ghost" data-act="form" data-f="career" data-id="${m.id}">+ ${L("Station","Position")}</button></span></div><div class="rows">${rows||`<div class="empty"><span>${L("Noch kein Werdegang. Erfassen Sie die Rollen mit Jahren, auch bei früheren Arbeitgebern.","No career yet. Add roles with years, including former employers.")}</span></div>`}</div></section>
    <section><div class="sh"><h2>${L("Zusatzqualifikationen","Additional qualifications")}</h2><span class="cnt">${xs.length}</span></div><div class="rows">${xs.map(x=>`<div class="row static">${dot("ok")}<span class="rt">${tx(XQ[x])}</span><span class="rm"></span><span class="ra"></span><span class="rl"></span></div>`).join("")||`<div class="empty"><span>${L("Keine erfasst. Über den Stift oben ergänzen.","None yet. Add them with the pencil above.")}</span></div>`}</div></section>
  </div>`;
}

/* a section of the tender detail: a one-line summary in the header, open by default only when something there needs doing */
const tSum=(txt,c)=>txt?`<span class="sum${c?" l-"+c:""}">${txt}</span>`:"";
const tSec=(fk,closed,cls,head,body)=>`<section class="tsec${cls?" "+cls:""}" data-fk="${fk}" data-fd="${closed?1:0}">${head}${body}</section>`;
/* an «i» next to a section title: tapping it shows what the section is and how to use it */
const infoBtn=(k,label)=>`<button type="button" class="ibtn" data-act="info" data-k="${k}" aria-expanded="${!!(S.info&&S.info[k])}" aria-label="${L("Erklärung: ","Explanation: ")+label}"><span aria-hidden="true">i</span></button>`;
const infoBox=(k,html)=>S.info&&S.info[k]?`<div class="ibox">${html}</div>`:"";
/* a short explanation behind a tap, so the page stays readable */
const tInfo=(label,body)=>`<details class="inf"><summary>${label}</summary><div class="infb">${body}</div></details>`;
/* where the tender comes from: the publication on simap.ch, the downloaded dossier and the required signature */
function tenderSource(t,c){
  const src=t.src||{},dos=docsFor("tender",t.id).filter(d=>d.dossier),k=!c&&sigCheck(t);
  const link=src.url?`<a class="srclink" href="${esc(src.url)}" target="_blank" rel="noopener">${L("Publikation auf simap.ch","Publication on simap.ch")}${src.id?` · ${L("Projekt-ID ","Project ID ")}${esc(src.id)}`:""} ↗</a>`:`<span class="muted">${L("Noch kein Link zur Publikation","No link to the publication yet")}</span>`;
  const sum=[src.url?"simap":"",dos.length?L("Dossier","Dossier"):"",t.sig?(t.sig==="qes"?"QES":L(...SIGREQ[t.sig]).split(",")[0]):""].filter(Boolean).join(" · ");
  const head=`<div class="sh"><h2>${L("Ausschreibung","Tender")}</h2>${tSum(k&&k.c!=="ok"?L("Unterschrift fehlt","Signature missing"):sum||L("unvollständig","incomplete"),k&&k.c!=="ok"?k.c:(!src.url&&!dos.length?"warn":""))}<span class="right">${c?"":ib("edit",L("Link und Unterschrift bearbeiten","Edit link and signature"),`data-act="form" data-f="tsrc" data-id="${t.id}"`)}<label class="ib" data-tip="${L("Ausschreibungsunterlagen (Dossier) als PDF ablegen","Add the tender dossier as PDF")}" aria-label="${L("Dossier ablegen","Add dossier")}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.zip" data-imp="doc" data-id="tdos|${t.id}"></label></span></div>`;
  const body=`<div class="tsrow">${link}</div>${sigBlock(t,c)}
    ${dos.length?`<div class="dlist">${dos.map(d=>`<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${L("Dossier","Dossier")} · ${fsize(d.size||0)} · ${fdate(d.date)}</span></button>${S.confirm==="ddel:"+d.id?`<button type="button" class="ghost danger" data-act="doc-del" data-id="${d.id}">${L("Löschen?","Delete?")}</button>`:ib("trash",L("Dokument löschen","Delete document"),`data-act="ask" data-c="ddel:${d.id}"`)}</div>`).join("")}</div>`
      :`<div class="empty">${L("Ausschreibungsunterlagen von simap.ch herunterladen und mit ＋ ablegen.","Download the dossier from simap.ch and add it with ＋.")}</div>`}`;
  return tSec("src",true,"tsrc docs",head,body);
}
/* award criteria (and, in phase 1 of a selective procedure, the weighted qualification criteria): weight, own assessment, the biggest lever; what earns points sits behind a tap */
function tenderAward(t,c,key){
  key=key||"zk";const gek=key==="gek",zk=t[key]||[],S_=zkSum(t,key);
  const title=gek?L("Gewichtete Eignungskriterien","Weighted qualification criteria"):L("Zuschlagskriterien","Award criteria");
  const todo=zk.filter(z=>!z.me).length;
  const sum=!zk.length?tSum(L("noch nicht erfasst","not entered yet"),c?"":"warn"):todo?tSum(todo+" "+L("nicht eingeschätzt","not assessed"),c?"":"warn"):tSum(L("Einschätzung ","Assessment ")+S_.pct+" %");
  const ik="crit:"+key,expl=infoBox(ik,`<p>${gek?L("Diese Kriterien entscheiden, welche Büros zum Angebot eingeladen werden.","These criteria decide which firms are invited to bid."):L("Diese Kriterien entscheiden, wer den Zuschlag erhält.","These criteria decide who wins the contract.")} ${L("Die Prozente stehen im Dossier: So viel zählt jedes Kriterium.","The percentages come from the dossier: how much each criterion counts.")}</p><p>${L("Wählen Sie bei jedem Kriterium, wie stark Ihr Büro dort ist. arkitecton rechnet daraus, wie viele Punkte Sie erwarten können, und zeigt den grössten Hebel: dort lohnt sich die Arbeit an der Bewerbung am meisten.","Choose for each criterion how strong your office is. arkitecton estimates your points and shows the biggest lever: where work on the bid pays off most.")}</p><p>${L("«Tipp» zeigt, womit Sie beim jeweiligen Kriterium Punkte holen.","«Tip» shows how to earn points on that criterion.")}</p>`);
  const head=`<div class="sh"><h2>${title}</h2>${infoBtn(ik,title)}${sum}<span class="right">${c?"":ib("edit",L("Kriterien bearbeiten","Edit criteria"),`data-act="form" data-f="zk" data-id="${t.id}" data-w="${key}"`)}</span></div>${expl}`;
  if(!zk.length)return tSec(key,!!c,"zk",head,`<div class="empty">${gek?L("Gewichtete Eignungskriterien aus dem Dossier übernehmen. Sie entscheiden, wer zum Angebot eingeladen wird.","Enter the weighted qualification criteria from the dossier. They decide who is invited to bid."):L("Zuschlagskriterien mit Gewichtung aus dem Dossier übernehmen. Dann zeigt arkitecton, wo Sie am meisten Punkte holen.","Enter the award criteria with weights from the dossier.")}${c?"":`<button type="button" class="btn" data-act="form" data-f="zk" data-id="${t.id}" data-w="${key}">${L("Kriterien erfassen","Add criteria")}</button>`}</div>`);
  const lever=S_.lever?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Grösster Hebel: ","Biggest lever: ")}<b>${esc(S_.lever.t)}</b> (${S_.lever.w} %)${S_.lever.me?" · "+L("heute ","now ")+L(ZKME[S_.lever.me][1],ZKME[S_.lever.me][2]):""}</span></div>`:"";
  const rows=zk.map((z,i)=>`<div class="zkrow"><div class="zkh"><span class="zkn">${esc(z.t)}</span><span class="zkw">${+z.w||0} %</span></div><div class="zkbar"><i style="width:${Math.min(100,+z.w||0)}%"></i></div>
    <div class="zkctl"><div class="zkme" role="group" aria-label="${L("Eigene Einschätzung: ","Own assessment: ")+esc(z.t)}">${Object.keys(ZKME).map(k=>`<button type="button" data-act="zk-me" data-id="${t.id}" data-k="${key}" data-i="${i}" data-v="${k}" aria-pressed="${z.me===k}"${c?" disabled":""}>${L(ZKME[k][1],ZKME[k][2])}</button>`).join("")}</div>${tInfo(L("Tipp","Tip"),esc(zkHint(t,z)))}</div></div>`).join("");
  const foot=S_.tot!==100?`<div class="zkfoot"><span class="l-warn">${L("Gewichtung total ","Total weight ")}${S_.tot} %${L(", sollte 100 % sein",", should be 100 %")}</span></div>`:"";
  return tSec(key,!!c||!todo,"zk",head,lever+rows+foot);
}
/* the two phases of a selective procedure, as a small stepper */
function phaseBar(t){if(!isSel(t))return "";const ph=phaseOf(t),pq=t.pq||{},st=t.status;
  const s1=pq.sel?"done":st==="nichtausg"?"stop":st==="pq"?"wait":"now",s2=!pq.sel?"later":waitT(t)||decidedT(t)?"done":"now";
  const lab={done:L("erledigt","done"),now:L("jetzt","now"),wait:L("Auswahl ausstehend","selection pending"),stop:L("nicht ausgewählt","not selected"),later:L("nur wenn ausgewählt","only if selected")};
  const it=(n,name,s,sub)=>`<li class="ph-${s}"><span class="pn">${s==="done"?"✓":n}</span><span><b>${name}</b><span class="res">${lab[s]}${sub?" · "+sub:""}</span></span></li>`;
  return `<ol class="phases" aria-label="${L("Phasen","Phases")}">${it(1,L("Teilnahmeantrag","Request to participate"),s1,pq.sub?L("eingereicht ","submitted ")+fdate(pq.sub):fdate(ph===1?t.due:pq.due))}${it(2,L("Angebot","Bid"),s2,pq.sel?fdate(t.due):(pq.max?L("höchstens "+pq.max+" Büros","at most "+pq.max+" firms"):""))}</ol>`;}
/* what is to do now on this tender: one line per open point (a tap leads to the section), and the main actions */
function tenderNext(t,docs,open,fit){
  const c=closedT(t),phs=phaseOf(t),dd=daysTo(t.due),it=[];
  const item=(cc,title,meta,label,act,ex)=>it.push(`<button type="button" class="row" data-act="${act}" ${ex}>${dot(cc)}<span class="rt">${title}</span><span class="rm">${meta||""}</span><span class="ra"></span><span class="rl l-${cc}">${label||""}</span></button>`);
  const go=k=>`data-k="${k}"`;
  let title,when="",acts="";
  const btn=(lab,act,s,pr,dis)=>`<button type="button" class="btn${pr?" primary":""}" data-act="${act}" data-id="${t.id}"${s?` data-${act==="t-res"?"w":"s"}="${s}"`:""}${dis?" disabled":""}>${lab}</button>`;
  const skip=`<button type="button" class="ghost" data-act="t-status" data-id="${t.id}" data-s="verzichtet">${L("Nicht teilnehmen","Skip")}</button>`;
  const reopen=s=>`<button type="button" class="ghost" data-act="t-status" data-id="${t.id}" data-s="${s}">${s==="arbeit"?L("Wieder öffnen","Reopen"):L("Entscheid zurücksetzen","Reset decision")}</button>`;
  if(t.status==="neu"||t.status==="arbeit"){
    const nm=bidName(t);title=nm+L(" einreichen"," to submit");when=dd<0?L("Frist vorbei","deadline passed"):L("bis ","by ")+fdate(t.due);
    if(fit==="no")item("crit",L("Eignung nicht erfüllt","Not eligible"),L("Teilnahme nur mit Partner oder gar nicht","only with a partner or not at all"),"","t-go",go("elig"));
    else if(fit==="partner")item("warn",L("Eignung nur mit Partner","Eligible only with partner"),"","","t-go",go("elig"));
    if(t.status==="neu")item("n",L("Teilnahme entscheiden","Decide on participation"),L("Eignung, Team und Kriterien prüfen","check eligibility, team and criteria"),"","t-go",go("elig"));
    if(open.length)item("warn",open.length===1?L("1 Unterlage offen","1 document open"):open.length+" "+L("Unterlagen offen","documents open"),open.map(d=>esc(d.t)).join(" · "),"","t-go",go("docs"));
    const cr=crewOf(t),free=cr.filter(x=>!x.m).length,hot=cr.map(crewMember).filter((m,i,a)=>m&&a.indexOf(m)===i).filter(m=>{const l=crewLoad(t,m.id);return l.oth.length&&l.tot>100;});
    if(free)item("warn",free===1?L("1 Rolle im Team offen","1 team role open"):free+" "+L("Rollen im Team offen","team roles open"),"","","t-go",go("crew"));
    hot.forEach(m=>item("crit",esc(m.name)+L(" überbucht"," overbooked"),L("auch in anderen Ausschreibungen eingeplant","also planned in other tenders"),"","t-go",go("crew")));
    const k=sigCheck(t);if(k&&k.c!=="ok")item(k.c,k.c==="crit"?L("QES fehlt im Büro","No QES in the office"):L("Zweite QES fehlt","Second QES missing"),L("im Büroprofil bei der Person ankreuzen","tick it at the person in the office profile"),"","nav",'data-v="profil"');
    const qd=t.qDue?daysTo(t.qDue):-1;if(qd>=0&&t.status==="arbeit")item(qd<=3?"warn":"n",L("Fragen stellen","Ask questions"),L("auf simap.ch im Forum","in the simap.ch forum"),L("bis ","by ")+fdate(t.qDue),"t-go",go("src"));
    const key=phs===1?"gek":"zk",nz=(t[key]||[]).filter(z=>!z.me).length;if(nz&&t.status==="arbeit")item("n",L("Kriterien einschätzen","Assess the criteria"),L("zeigt, wo Sie Punkte holen","shows where you earn points"),"","t-go",go(key));
    acts=skip+(t.status==="neu"?btn(L("Bewerbung starten","Start bid"),"t-status","arbeit",true,fit==="no"):btn(nm+L(" eingereicht …"," submitted …"),"t-submit","",true,fit==="no"||open.length>0));
    if(!it.length)it.push(`<div class="row static">${dot("ok")}<span class="rt">${L("Alles bereit zum Einreichen","Ready to submit")}</span><span class="rm"></span><span class="ra"></span><span class="rl"></span></div>`);
  }else if(t.status==="pq"){title=L("Auswahl abwarten","Wait for the selection");when=(t.pq||{}).max?L("höchstens "+t.pq.max+" Büros","at most "+t.pq.max+" firms"):"";
    acts=reopen("arbeit")+btn(L("Nicht ausgewählt","Not selected"),"t-res","nsel")+btn(L("Ausgewählt","Selected"),"t-res","sel",true);}
  else if(t.status==="eingereicht"){title=L("Zuschlag abwarten","Wait for the award");when=t.sub?L("eingereicht am ","submitted on ")+fdate(t.sub):"";
    acts=reopen("arbeit")+btn(L("Kein Zuschlag","Not awarded"),"t-res","lost")+btn(L("Zuschlag erhalten","Contract awarded"),"t-res","won",true);}
  else if(t.status==="verzichtet"){title=L("Nicht teilgenommen","Not taking part");acts=reopen("arbeit");}
  else if(decidedT(t)){const r=t.res||{},at=t.status==="nichtausg"?(t.pq||{}).at:r.at;
    title=t.status==="gewonnen"?L("Zuschlag erhalten","Contract awarded"):t.status==="verloren"?L("Kein Zuschlag","Not awarded"):L("Nicht ausgewählt","Not selected");when=at?L("Verfügung vom ","Decision of ")+fdate(at):"";
    acts=reopen(t.status==="nichtausg"?"pq":"eingereicht");}
  else return "";
  /* after the submission the open points are the steps below; they also appear as tasks on the start page */
  if(waitT(t)||decidedT(t))tenderTasks().filter(x=>x.t===t).forEach(x=>item(x.c,esc(x.title),"",x.label,"t-go",go("after")));
  return `<section class="tnext"><div class="sh"><span class="kick">${decidedT(t)||t.status==="verzichtet"?L("Stand","Status"):L("Nächster Schritt","Next step")}</span></div><div class="tnh"><h2>${title}</h2>${when?`<span class="when${!c&&dd>=0&&dd<=7?(dd<=2?" l-crit":" l-warn"):""}">${when}</span>`:""}</div>${it.length?`<div class="rows">${it.join("")}</div>`:""}<div class="bar-actions">${acts}</div></section>`;
}
function viewTender(t){
  const {ev,fit}=fitOf(t), docs=docsOf(t), dd=daysTo(t.due), c=closedT(t), open=docs.filter(d=>!d.done), phs=phaseOf(t);
  const ICON={ok:"✓",warn:"!",crit:"✕"};
  const docLi=d=>{if(d.linked)return `<li><span class="ic ${d.lc==="crit"?"crit":d.lc==="warn"?"warn":"ok"}" aria-hidden="true">${d.lc==="crit"?"✕":d.lc==="warn"?"!":"✓"}</span><span>${esc(d.t)}<span class="res">${esc(d.sub)}</span>${c?"":`<button type="button" class="ghost link" data-act="t-unlink" data-id="${t.id}" data-d="${d.id}">${L("Andere wählen","Choose another")}</button>`}</span><button type="button" class="ghost tfile" data-act="doc-open" data-id="${d.linked.id}">${L("Öffnen","Open")}</button></li>`;
    const pick=!c&&!d.auto&&!d.done&&docsFor("firm","firm").length&&(d.sugg||!/honorar|angebot|offerte|analyse|vorgehen|a3|preis|formular/i.test(d.t))?(d.sugg?`<button type="button" class="ghost link" data-act="t-link" data-id="${t.id}" data-d="${d.id}" data-f="${d.sugg.id}">${L("Übernehmen: ","Use: ")+esc(d.sugg.name)}</button>`:`<button type="button" class="ghost link" data-act="form" data-f="tlink" data-id="${t.id}" data-w="${d.id}">${L("Aus Büro-Unterlagen wählen","Choose from firm documents")}</button>`):"";
    return `<li>${d.auto?`<span class="ic ${d.done?"ok":"crit"}" aria-hidden="true">${d.done?"✓":"✕"}</span>`:`<input type="checkbox" id="doc-${d.id}" data-act="t-doc" data-t="${t.id}" data-d="${d.id}"${d.done?" checked":""}${c?" disabled":""}>`}<span><label${d.auto?"":` for="doc-${d.id}"`}>${esc(d.t)}</label>${d.sub?`<span class="res one">${esc(d.sub)}</span>`:""}${pick}</span>${d.file?`<button type="button" class="ghost tfile" data-act="doc-open" data-id="${d.file.id}">${L("Öffnen","Open")}</button>`:""}</li>`;};
  /* open documents first: they are what is left to do */
  const dsort=docs.filter(d=>!d.done).concat(docs.filter(d=>d.done));
  const okN=ev.filter(e=>e.s==="ok").length;
  const elig=tSec("elig",!!c||fit==="ok","",`<div class="sh"><h2>${L("Eignung","Eligibility")}</h2><span class="cnt">${okN}/${ev.length}</span>${tSum(tx(FIT[fit]),FIT[fit].c)}</div>`,
    `<ul class="checks">${ev.map((e,ix)=>`<li${t.reqs[ix]&&t.reqs[ix].src?' class="hasinf"':""}><span class="ic ${e.s}" aria-hidden="true">${ICON[e.s]}</span><span>${esc(e.t)}<span class="res">${esc(e.res)}</span></span>${t.reqs[ix]&&t.reqs[ix].src?tInfo(L("Quelle","Source"),esc(t.reqs[ix].src)):""}</li>`).join("")}</ul>`);
  const dlist=tSec("docs",!!c||!open.length,"",`<div class="sh"><h2>${L("Unterlagen","Documents")}</h2><span class="cnt">${docs.length-open.length}/${docs.length}</span>${tSum(open.length?open.length+" "+L("offen","open"):L("vollständig","complete"),open.length?"warn":"ok")}</div>`,
    `<ul class="checks tdocs">${dsort.map(docLi).join("")}</ul>`);
  const files=docsFor("tender",t.id).filter(d=>!d.dossier&&!d.submitted&&!d.prot);
  const fblock=docsBlock("tender",t.id,L("Dateien","Files"),L("Fragen und Antworten, eigene Entwürfe mit ＋ ablegen.","Store questions, answers and drafts with ＋.")).replace('<section class="docs">',`<section class="docs tsec" data-fk="files" data-fd="${files.length?0:1}">`);
  /* in phase 1 of a selective procedure only the qualification criteria count; the award criteria follow with the invitation */
  const crit=phs===1?tenderAward(t,c,"gek"):tenderAward(t,c);
  return `<div class="page tdetail${c?" tclosed":""}">
    ${backBtn("back-t",L("Ausschreibungen","Tenders"))}
    ${ph(esc(t.client)+(t.own?"":" · "+L("Beispiel","Example")),esc(tx(t.title)),tx(PROC[t.proc]||PROC.offen)+" · SIA "+esc(t.phases||""),excelBtn("t:"+t.id))}
    ${phaseBar(t)}
    ${tenderNext(t,docs,open,fit)}
    <div class="stats${resultTile(t)?" s4":""}">
      <div class="stat"><span class="sl">${phs===1?L("Teilnahmeantrag","Request to participate"):L("Eingabe","Submission")}</span><span class="sv${!c&&dd<=7?(dd<=2?" crit":" warn"):""}">${c?(t.status==="verzichtet"?tx(TST[t.status]):L("Eingereicht","Submitted")):dd<0?L("vorbei","closed"):dd===0?L("heute","today"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days"))}</span><span class="ss">${fdate(c&&t.sub?t.sub:t.due)}</span></div>
      ${resultTile(t)}
      <div class="stat"><span class="sl">${L("Eignung","Eligibility")}</span><span class="sv ${FIT[fit].c}">${tx(FIT[fit])}</span><span class="ss">${okN} ${L("von","of")} ${ev.length}</span></div>
      <div class="stat"><span class="sl">${L("Baukosten","Construction cost")}</span><span class="sv">${mio(t.cost)}</span><span class="ss">BKP 291</span></div>
    </div>
    ${tenderAfter(t)}
    ${dlist}
    ${elig}
    ${crewBlock(t,c)}
    ${crit}
    ${tenderSource(t,c)}
    ${fblock}
  </div>`;
}

(function(){const cur=(document.querySelector('script[src*="app.js"]')||{}).src||"";const v=(cur.match(/v=([^&]+)/)||[])[1];if(!v||location.hostname==="localhost")return;
  /* never reload while someone is entering something: a form, a scan, a panel, or a focused field. The check repeats, so the update follows once the user is idle. */
  const busy=()=>!!(S.dscan||S.form||S.modal||S.sheet||S.drawer||S.fdrawer||S.kvx||S.queryOpen||(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)));
  const check=()=>{if(busy())return;fetch(location.pathname+"?nc="+Date.now(),{cache:"no-store"}).then(r=>r.text()).then(t=>{const nv=(t.match(/app\.js\?v=([^"&]+)/)||[])[1];if(nv&&nv!==v&&!busy()&&!sessionStorage.getItem("ark-up-"+nv)){sessionStorage.setItem("ark-up-"+nv,"1");location.replace(location.pathname+"?v="+nv+(SPACE?"&raum="+SPACE:"")+location.hash);}}).catch(()=>{});};
  check();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check();});window.addEventListener("pageshow",check);setInterval(()=>{if(document.visibilityState==="visible")check();},120000);})();
/* the app computes due dates from «today» at load: after midnight, reload once nothing is being entered */
/* a new day: move TODAY forward in place (deadlines, "in n days") and redraw; an open form keeps its input and is redrawn when it closes */
function rollDay(){const n=new Date();n.setHours(0,0,0,0);if(n.getTime()===TODAY.getTime())return;TODAY.setTime(n.getTime());
  const busy=S.form||S.modal||S.sheet||S.drawer||S.fdrawer||(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));if(!busy)render();}
setInterval(rollDay,60000);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")rollDay();});window.addEventListener("focus",rollDay);
function render(){queueMicrotask(()=>document.querySelectorAll('input[type=file]').forEach(x=>{if(!x.title)x.title=" ";}));
  stampProjects();stampRet();saveData();
  const app=document.getElementById("app");
  if(!D){
    app.style.display="block";
    document.querySelector(".rail").style.display="none";document.querySelector(".topbar").style.display="none";document.getElementById("tabbar").style.display="none";
    document.getElementById("main").innerHTML=viewWelcome();
    return renderOverlay();
  }
  app.style.display="";document.querySelector(".rail").style.display="";document.querySelector(".topbar").style.display="";document.getElementById("tabbar").style.display="";
  renderChrome();swipeHint();
  document.getElementById("main").innerHTML=({buero:viewFirm,uebersicht:viewOverview,rechnungen:viewInvoices,handwerker:viewContractors,budget:viewBudget,ausschreibungen:viewTenders,profil:viewProfil,einstellungen:viewSettings})[S.view]();
  trimRail();foldSections();renderOverlay();
}
