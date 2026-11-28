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
/* the «Nächster Schritt» card: the same on every page. Title and deadline say what is to do; up to three points below,
   the rest behind «Alle anzeigen»; the main action at the bottom. With nothing to do it stays small: «Alles erledigt». */
const nRow=o=>`<button type="button" class="row" data-act="${o.act}" ${o.ex||""}>${dot(o.c)}<span class="rt">${o.title}</span><span class="rm">${o.meta||""}</span><span class="ra">${o.amt||""}</span><span class="rl l-${o.lc||o.c}">${o.label||""}</span></button>`;
const URG={crit:0,warn:1,n:2,ok:3};
function nextCard(o){
  const items=(o.items||[]).slice().sort((a,b)=>o.keep?0:(URG[a.c]-URG[b.c])),key=o.key||S.view,all=S.nextAll&&S.nextAll[key],lim=o.limit===0?1e9:3;
  if(!items.length&&!o.acts&&!o.title)return `<section class="tnext tdone"><div class="sh"><span class="kick">${L("Nächster Schritt","Next step")}</span></div><div class="tnh">${dot("ok")}<h2>${L("Alles erledigt","All done")}</h2></div></section>`;
  const shown=all?items:items.slice(0,lim);
  const more=items.length>lim?`<button type="button" class="ghost nmore" data-act="next-all" data-k="${key}">${all?L("Weniger anzeigen","Show less"):L("Alle anzeigen","Show all")+" ("+items.length+")"}</button>`:"";
  const title=o.title||(items.length===1?L("1 Punkt zu erledigen","1 thing to do"):items.length+" "+L("Punkte zu erledigen","things to do"));
  return `<section class="tnext"><div class="sh"><span class="kick">${o.kick||L("Nächster Schritt","Next step")}</span></div><div class="tnh"><h2>${title}</h2>${o.when?`<span class="when${o.whenC?" l-"+o.whenC:""}">${o.when}</span>`:""}</div>${shown.length?`<div class="rows">${shown.map(nRow).join("")}</div>`:""}${more||o.acts?`<div class="bar-actions">${more}${o.acts||""}</div>`:""}</section>`;
}
/* all projects in one place, each row with its most urgent point */
/* the state of every project, for the Projekte page and its tile sheets */
function projStats(){
  return D.projects.map(p=>withP(p.id,()=>{const rows=budgetRows(),t=totals(rows),fl=flags(),fo=PF().filter(f=>!f.paid);
    return {p,kv:t.kv,billed:t.billed,rest:t.rest,pct:t.kv?Math.round(t.billed/t.kv*100):0,fl:fl.length,flc:flagSum(fl),open:unpaid(PI()).length,over:rows.filter(r=>r.over).map(r=>({p,r})),fees:fo.reduce((a,f)=>a+feeTotal(f),0)};}));
}
const PJT={all:{l:()=>L("Laufende Projekte","Active projects"),f:x=>true},kv:{l:()=>L("Kostenvoranschlag","Cost estimate"),f:x=>x.kv>0},fl:{l:()=>L("Mehrkosten","Extra costs"),f:x=>x.flc>0},over:{l:()=>L("Über Budget","Over budget"),f:x=>x.over.length>0}};
const projCard=x=>{const p=x.p,bar=x.kv?Math.min(100,x.pct):0,warn=x.rest<0;
  const facts=[x.kv?L("Reserve ","Reserve ")+chf(x.rest,false):L("kein Budget","no budget"),x.flc?L("Mehrkosten ","Extra costs ")+chf(x.flc,false):"",x.open?x.open+" "+L("offen","open"):""].filter(Boolean);
  return `<button type="button" class="pcard" data-act="open-project" data-id="${p.id}"><span class="pc-h"><b>${esc(p.name)}</b><span>${esc(p.place||"")}</span></span>
    <span class="pc-k"><span class="pc-v">${x.kv?x.pct+" %":"0 %"}</span><span class="pc-l">${x.kv?L("Kostenstand von ","Cost status of ")+chf(x.kv,false):L("noch kein Kostenvoranschlag","no cost estimate yet")}</span></span>
    <span class="pc-bar${warn?" warn":""}"><i style="width:${bar}%"></i></span>
    <span class="pc-f">${facts.map((f,i)=>`<span class="${i===0&&warn?"l-warn":i===1?"l-warn":""}">${f}</span>`).join("")}</span></button>`;};
function viewProjekte(){
  const ps=projStats(),act=ps.filter(x=>!x.p.closed),dn=ps.filter(x=>x.p.closed);
  const kv=act.reduce((a,x)=>a+x.kv,0),bil=act.reduce((a,x)=>a+x.billed,0),flc=act.reduce((a,x)=>a+x.flc,0),ov=act.reduce((a,x)=>a+x.over.length,0);
  const tile=(k,v,ss,c)=>{const n=act.filter(PJT[k].f).length,inner=`<span class="sl">${PJT[k].l()}</span><span class="sv${c&&n?" "+c:""}">${n?v:"0"}</span><span class="ss">${n?ss:L("keine","none")}</span>`;
    return n?`<button type="button" class="stat" data-act="sheet" data-k="pj:${k}" aria-haspopup="dialog">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  return `<div class="page">${ph("",L("Projekte","Projects"),"",ib("plus",L("Projekt erfassen","Add project"),'data-act="form-project"'))}
    <div class="stats s4">${tile("all",act.length,act.length===1?L("Projekt","project"):L("Projekte","projects"))}${tile("kv",chf(kv,false),kv?Math.round(bil/kv*100)+" % "+L("Kostenstand","cost status"):"")}${tile("fl",chf(flc,false),act.filter(PJT.fl.f).length+" "+L("Projekte","projects"),"warn")}${tile("over",ov,ov===1?L("Position","item"):L("Positionen","items"),"warn")}</div>
    <div class="pcards">${act.map(projCard).join("")||`<div class="empty">${L("Noch keine Projekte.","No projects yet.")}</div>`}</div>
    ${foldRows(L("Abgeschlossene Projekte","Completed projects"),dn.map(x=>row({act:"open-project",id:x.p.id,c:"ok",title:esc(x.p.name),meta:x.p.place?esc(x.p.place):"",amt:"",label:""})).join(""),dn.length)}
  </div>`;
}
/* the project overview shows the project itself. The tiles show the state of the tabs and jump there; invoices live on Home and in Rechnungen */
function viewOverview(){
  const p=P(); if(!p) return noProject();
  const t=totals(budgetRows()),fl=flags(),flSum=flagSum(fl),pct=t.kv?Math.round(t.billed/t.kv*100):0;
  const upl=unpaid(PI()),fo=PF().filter(f=>!f.paid),feeSum=fo.reduce((a,f)=>a+feeTotal(f),0),rm=fo.filter(f=>remDue(f)).length,nW=PC().length,sumW=PC().reduce((a,w)=>a+(w.sum||0),0);
  const tl=(act,ex,l,v,ss,c)=>`<button type="button" class="stat" data-act="${act}"${ex||""}><span class="sl">${l}</span><span class="sv${c?" "+c:""}">${v}</span><span class="ss">${ss}</span></button>`;
  const pts=[];
  missingTasks().forEach(x=>pts.push({act:"open-k",ex:`data-id="${x.k.id}"`,c:"warn",title:esc(x.k.name),meta:L("Fehlt: ","Missing: ")+x.m.join(", "),label:""}));
  docsOfProject(p.id).map(d=>[d,docValid(d)]).filter(([d,v])=>v&&v.c!=="ok").forEach(([d,v])=>{const k=d.kid&&K(d.kid);pts.push({act:"doc-open",ex:`data-id="${d.id}"`,c:v.c,title:esc(k?k.name:d.name),meta:esc(dkShort(docKind(d)))+(docKind(d)==="gs"?L(" · Mängel rügen"," · report defects"):L(" · neu verlangen"," · request new")),label:v.t});});
  const shown=S.allFlags?fl:fl.slice(0,3);
  const flagRows=shown.map(f=>row({act:f.act,id:f.id,v:f.v,c:f.c,title:esc(f.t),meta:esc(f.m),amt:f.chf===null?"":chf(f.chf,false),label:""})).join("");
  const addr=[p.client,p.cStreet,[p.cZip,p.cCity].filter(Boolean).join(" ")].filter(Boolean).map(esc).join(", ");
  const info=[[L("Bauherrschaft","Client"),addr||`<span class="l-n">${L("noch nicht erfasst","not recorded yet")}</span>`],[L("Ort","Place"),esc(p.place||"")||`<span class="l-n">${L("noch nicht erfasst","not recorded yet")}</span>`],[L("Beschreibung","Description"),esc(p.desc||"")||`<span class="l-n">${L("noch nicht erfasst","not recorded yet")}</span>`]];
  return `<div class="page">
    ${ph("",L("Übersicht","Overview"),"","")}
    ${startSteps()}
    <div class="stats s4">
      ${tl("to-pay","",L("Rechnungen","Invoices"),upl.length,upl.length?openTop(upl):L("nichts offen","nothing open"))}
      ${tl("nav",' data-v="handwerker"',L("Handwerker","Contractors"),nW,nW?chf(sumW,false):L("keine Werkverträge","no contracts"))}
      ${tl("nav",' data-v="budget"',L("Budget","Budget"),t.kv?pct+" %":"0 %",t.kv?L("von ","of ")+chf(t.kv,false):L("kein Budget","no budget"))}
      ${tl("to-fees","",L("Honorar","Fees"),chf(feeSum,false),rm?rm+" "+(rm===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):fo.length+" "+L("offen","open"),rm?"crit":"")}
    </div>
    ${nextCard({key:"proj:"+p.id,items:pts})}
    <section id="flags" class="tsec"><div class="sh"><h2>${L("Mehrkosten","Extra costs")}</h2><span class="cnt">${fl.length}</span>${fl.length?tSum(L("Total ","Total ")+chf(flSum,false),"warn"):tSum(L("keine","none"),"ok")}</div><div class="rows">${flagRows||`<div class="empty"><span>${L("Keine Mehrkosten. arkitecton vergleicht jede Rechnung mit Werkvertrag, Offerte und Budget.","No extra costs. arkitecton compares each invoice with contract, offer and budget.")}</span></div>`}</div>
      ${fl.length>3?`<button type="button" class="more" data-act="all-flags">${S.allFlags?L("Weniger anzeigen","Show less"):L("Alle anzeigen","Show all")}</button>`:""}</section>
    <section class="pinfo"><div class="sh"><h2>${L("Projekt","Project")}</h2><span class="right">${ib("edit",L("Projekt bearbeiten","Edit project"),'data-act="form-project-edit" data-id="'+p.id+'"')}</span></div>
      <dl>${info.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl></section>
    ${docsFold(docsGrouped("project",p.id,L("Projektdokumente","Project documents"),L("Pläne, Bewilligungen, Kostenvoranschlag mit ＋ ablegen.","Store plans, permits and estimates with ＋.")),docsOfProject(p.id))}
  </div>`;
}
/* ---------- Home: the four office tiles and every invoice of the office in one table ---------- */
/* every contractor invoice and every own fee of the office in one list, with project, type, status and reminder level */
function allInv(){
  const out=[];
  D.projects.forEach(p=>withP(p.id,()=>{
    PI().filter(live).forEach(i=>{const w=W(i.w)||{},k=K(w.k)||{};out.push({kind:"inv",id:i.id,pid:p.id,pname:p.name,closed:!!p.closed,no:i.no,date:i.date,who:k.name||"",what:typeLabel(i),amt:i.gross,st:i.status,lab:stLabel(i.status),c:STATUS[i.status].c,rem:"",open:i.status!=="bezahlt"});});
    PF().forEach(f=>{const due=remDue(f),sent=(f.rem||[]).length;out.push({kind:"fee",id:f.id,pid:p.id,pname:p.name,closed:!!p.closed,no:f.no,date:f.date,who:L("Honorar","Fee"),what:esc(f.title||""),amt:feeTotal(f),st:f.paid?"fpaid":due?"fdue":"fopen",lab:f.paid?L("Bezahlt","Paid"):due?L("Mahnung fällig","Reminder due"):L("Offen","Open"),c:f.paid?"ok":due?"crit":"n",rem:f.paid?"":due?String(due):sent?String(sent):"",open:!f.paid});});
  }));
  return out.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
/* the four tiles: what waits for the architect across all projects */
const AINV={pruefen:{l:()=>L("Zu prüfen","To check"),f:x=>x.st==="pruefen"},rueckfrage:{l:()=>L("Rückfrage","Query"),f:x=>x.st==="rueckfrage"},frei:{l:()=>L("Freigegeben","Approved"),f:x=>x.st==="frei"},fdue:{l:()=>L("Mahnung fällig","Reminder due"),f:x=>x.st==="fdue"}};
const ainvRow=x=>row({act:"p-open",id:x.id,c:x.c,title:esc(x.who),meta:esc(x.pname)+" · "+(x.kind==="inv"?x.what:L("Honorar","Fee"))+" · "+esc(x.no),amt:chf(x.amt,false),label:x.lab+(x.rem&&x.st==="fdue"?" · "+x.rem+L(". Stufe",". level"):""),lc:x.c}).replace('data-act="p-open"',`data-act="p-open" data-p="${x.pid}" data-k="${x.kind}"`);
function viewFirm(){
  const today=TODAY.toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{weekday:"long",day:"numeric",month:"long"});
  const all=allInv();
  const fs=S.aif||"open",ft=S.ait||"all",byT=x=>ft==="all"||x.kind===ft;
  /* status filter above the table: Offen, the four states that need the architect (with their count), Alle */
  const li=all.filter(x=>byT(x)&&(fs==="all"?true:fs==="open"?x.open:AINV[fs]?AINV[fs].f(x):x.open));
  const chip=(grp,v,l,cur)=>`<button type="button" class="chip${cur===v?" on":""}" data-act="aif" data-g="${grp}" data-f="${v}" aria-pressed="${cur===v}">${l}</button>`;
  const head=`<div class="ainv-h"><span>${L("Rechnung","Invoice")}</span><span>${L("Projekt","Project")}</span><span>${L("Typ","Type")}</span><span class="r">${L("Betrag","Amount")}</span><span>${L("Status","Status")}</span><span class="r">${L("Mahnstufe","Reminder")}</span></div>`;
  const trow=x=>`<button type="button" class="ainv-r" data-act="p-open" data-id="${x.id}" data-p="${x.pid}" data-k="${x.kind}"><span><b>${esc(x.who)}</b><small>${esc(x.no)} · ${fdate(x.date)}</small></span><span>${esc(x.pname)}</span><span>${x.kind==="inv"?L("Handwerker","Contractor"):L("Honorar","Fee")}</span><span class="r">${chf(x.amt,false)}</span><span><i class="pillst l-${x.c}"><i class="dot"></i>${x.lab}</i></span><span class="r mute">${x.rem||""}</span></button>`;
  /* the next step keeps only what the tiles and the table do not show: missing details, tenders, firm documents */
  const pts=[];
  D.projects.filter(p=>!p.closed).forEach(p=>withP(p.id,()=>{missingTasks().forEach(x=>pts.push({c:"warn",title:L("Angaben ergänzen","Complete details"),meta:esc(x.k.name)+" · "+x.m.join(", "),label:"",act:"open-k",ex:`data-id="${x.k.id}"`}));}));
  tenderTasks().forEach(x=>pts.push({c:x.c,title:esc(x.title),meta:esc(x.meta||tx(x.t.title)),label:x.label,act:"open-t",ex:`data-id="${x.t.id}"`}));
  docsFor("firm","firm").map(d=>[d,docValid(d)]).filter(([,v])=>v&&v.c!=="ok").forEach(([d,v])=>pts.push({c:v.c,title:L("Unterlage erneuern","Renew document"),meta:esc(d.name),label:v.t,act:"nav",ex:'data-v="profil"'}));
  return `<div class="page hov">
    ${ph(esc(today),vName("buero"),"","")}
    <p class="hov-lead">${L("Rechnungen, Ausschreibungen und Einnahmen des Büros auf einen Blick.","The office's invoices, tenders and income at a glance.")}</p>
    ${dataNotice()}${startSteps()}
    ${homeTiles()}
    ${nextCard({key:"home",items:pts})}
    <section class="ainv"><div class="sh"><h2>${L("Alle Rechnungen","All invoices")}</h2><span class="cnt">${li.length}</span></div>
      <div class="chips" role="group" aria-label="${L("Filter","Filter")}">${chip("s","open",L("Offen","Open"),fs)}${Object.keys(AINV).map(k=>{const n=all.filter(x=>byT(x)&&AINV[k].f(x)).length;return n?chip("s",k,AINV[k].l()+" "+n,fs):"";}).join("")}${chip("s","all",L("Alle","All"),fs)}<span class="sep"></span>${chip("t","all",L("Beide","Both"),ft)}${chip("t","inv",L("Handwerker","Contractor"),ft)}${chip("t","fee",L("Honorar","Fee"),ft)}</div>
      <div class="ainv-t">${head}${li.map(trow).join("")||`<div class="empty"><span>${L("Keine Rechnungen für diesen Filter.","No invoices for this filter.")}</span></div>`}</div>
      <div class="rows ainv-m">${li.map(ainvRow).join("")}</div>
    </section>
  </div>`;
}
/* the four tiles of Home: open invoices and fees per project, tenders, income */
function homeTiles(){
  const ps=D.projects.map(p=>withP(p.id,()=>{const chk=unpaid(PI()),fo=PF().filter(f=>!f.paid);return {chk,sum:toPay(PI()),fees:fo.reduce((a,f)=>a+feeTotal(f),0),rem:fo.filter(f=>remDue(f)).length};}));
  const feeOpen=ps.reduce((a,x)=>a+x.fees,0),remN=ps.reduce((a,x)=>a+x.rem,0),tot=ps.reduce((a,x)=>a+x.sum,0);
  const tl=D.tenders.filter(x=>!closedT(x)&&daysTo(x.due)>=0),fitN=tl.filter(x=>fitOf(x).fit==="ok").length;
  return `<div class="stats${FEES().length?" s4":""}">
      ${(t=>`<button type="button" class="stat" data-act="sheet" data-k="sum-inv" aria-haspopup="dialog">${t}</button>`)(`<span class="sl">${L("Offene Rechnungen","Open invoices")}</span><span class="sv">${chf(tot,false)}</span><span class="ss">${openTop(ps.flatMap(x=>x.chk))}</span>`)}
      ${(t=>`<button type="button" class="stat" data-act="sheet" data-k="sum-fee" aria-haspopup="dialog">${t}</button>`)(`<span class="sl">${L("Zu erhalten","To receive")}</span><span class="sv">${chf(feeOpen,false)}</span><span class="ss${remN?" l-crit":""}">${remN?remN+" "+(remN===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):L("keine Mahnung","no reminder")}</span>`)}
      <button type="button" class="stat" data-act="sheet" data-k="sum-ten" aria-haspopup="dialog"><span class="sl">${L("Ausschreibungen","Tenders")}</span><span class="sv">${tl.length}</span><span class="ss">${fitN?fitN+" "+L("passend","suitable"):L("keine passend","none suitable")}</span></button>
      ${FEES().length?`<button type="button" class="stat" data-act="sheet" data-k="income" aria-haspopup="dialog"><span class="sl">${L("Einnahmen","Income")}</span><span class="sv">${chf(Math.round(incomeSection("sum")),false)}</span><span class="ss">${L("12 Monate","12 months")}</span></button>`:""}
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
  /* the tiles open a sheet, so the list is never filtered: all invoices, the paid ones folded */
  S.filter="all";
  if(S.filter!=="all"&&!cnt(S.filter)&&all.length)S.filter=F.find(f=>f!=="all"&&cnt(f))||"all";
  const list=of(S.filter).slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const pay=S.filter==="zahlen";
  const byDue=S.filter!=="all"&&S.filter!=="bezahlt";
  const iRow=i=>{const w=W(i.w),k=K(w.k),dd=daysTo(i.due);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:esc(k.name),meta:typeLabel(i)+" · "+esc(i.no),amt:chf(pay?payout(i):i.gross,false),label:byDue?dueText(dd):stLabel(i.status),lc:byDue?dueTone(dd):STATUS[i.status].c});};
  const paidI=S.filter==="all"?list.filter(i=>i.status==="bezahlt"):[];
  const rows=list.filter(i=>!paidI.includes(i)).map(iRow).join("")+foldRows(L("Bezahlt","Paid"),paidI.map(iRow).join(""),paidI.length);
  
  /* no «Nächster Schritt» here: the tiles open exactly those invoices, and «gemeinsam freigeben» sits in the «Zu prüfen» sheet */
  const bulkBar="";
  const more=`<button type="button" class="ib" title="${L("Weitere Aktionen","More actions")}" aria-label="${L("Weitere Aktionen","More actions")}" data-act="sheet" data-k="rechnungen">${ico("more")}</button>`;
  return `<div class="page invp">
    ${ph(esc(p.name),L("Rechnungen","Invoices"),"",sw+`<span class="deskonly">${ib("plus",L("Rechnung erfassen: QR-Rechnung als PDF oder Foto","Add invoice: QR-bill as PDF or photo"),'data-act="capture"')}</span>`+more)}
    <div class="stats s4">${["pruefen","rueckfrage","frei","bezahlt"].map(f=>{const li=of(f),n=li.length,sum=f==="zahlen"?toPay(li):li.reduce((a,i)=>a+i.gross,0);const inner=`<span class="sl">${fLabel(f)}</span><span class="sv">${n?chf(sum,false):"0"}</span><span class="ss">${n===1?L("1 Rechnung","1 invoice"):n?n+" "+L("Rechnungen","invoices"):L("keine","none")}</span>`;return n?`<button type="button" class="stat" data-act="sheet" data-k="inv:${f}" aria-haspopup="dialog">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;}).join("")}</div>
    <section><div class="sh"><h2>${S.filter==="all"?L("Alle Rechnungen","All invoices"):fLabel(S.filter)}</h2><span class="cnt">${list.length}</span>${pay&&list.some(i=>retention(i)>0)?infoBtn("ret",L("Beträge","Amounts")):""}<span class="right">${S.filter==="frei"&&list.length?`<button type="button" class="ghost" data-act="pay-pdf-all">${L("Zahlungsfreigabe an Bauherrschaft (PDF)","Payment release to client (PDF)")}</button>`:""}${S.filter==="all"||!all.length?"":`<button type="button" class="ghost" data-act="filter" data-f="all">${L("Alle anzeigen","Show all")} (${all.length})</button>`}</span></div>${infoBox("ret",`<p>${L("Die Beträge sind nach Abzug des Rückbehalts: so viel wird ausbezahlt.","Amounts are after retention: this is what is paid out.")}</p>`)}${bulkBar}<div class="rows">${rows||(all.length?`<div class="empty">${L("Keine Rechnungen mit diesem Status.","No invoices with this status.")}</div>`:`<div class="empty"><span>${L("Noch keine Rechnungen in diesem Projekt. Scannen Sie den QR-Zahlteil einer Handwerker-Rechnung.","No invoices in this project yet. Scan the QR payment part of a contractor invoice.")}</span></div>`)}</div>${addRow(L("Rechnung erfassen","Add invoice"),'data-act="capture"')}</section>
  </div>`;
}

/* the contracts of the open project with billed amount and retention; shared by the Handwerker page and its tile sheets */
function kData(){
  const ws=PC().slice().sort((a,b)=>String(a.bkp).localeCompare(String(b.bkp),undefined,{numeric:true})||K(a.k).name.localeCompare(K(b.k).name));
  const loose=D.contractors.filter(k=>k.pid===D.pid&&!D.contracts.some(w=>w.k===k.id));
  const st=w=>{const li=D.invoices.filter(i=>i.w===w.id&&live(i)&&counted(i));const billed=r2(li.reduce((a,i)=>a+net(i),0)),ret=r2(li.reduce((a,i)=>a+retention(i),0));return {billed,ret};};
  const all=ws.map(w=>({w,k:K(w.k),...st(w)}));
  const kMiss=[...new Set([...all.map(x=>x.k),...loose])].filter(k=>missingOf(k).length);
  const T={sum:r2(all.reduce((a,x)=>a+(x.w.sum||0),0)),billed:r2(all.reduce((a,x)=>a+x.billed,0)),ret:r2(all.reduce((a,x)=>a+x.ret,0))};
  const FL={billed:x=>x.billed>0,ret:x=>x.ret>0,missing:x=>missingOf(x.k).length>0};
  return {all,loose,kMiss,T,FL};
}
function viewContractors(){
  if(S.kid&&K(S.kid)) return viewContractor(K(S.kid));
  if(!P()) return noProject(); /* same empty state as Rechnungen and Budget */
  const p=P(),{all,loose,kMiss,T,FL}=kData();
  const tile=(f,l,v,ss,n)=>{const inner=`<span class="sl">${l}</span><span class="sv">${n?v:"0"}</span><span class="ss">${n?ss:L("keine","none")}</span>`;return n?`<button type="button" class="stat" data-act="sheet" data-k="kw:${f||"all"}" aria-haspopup="dialog">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const nV=all.length;
  const missTile=kMiss.length?`<button type="button" class="stat" data-act="sheet" data-k="kw:missing" aria-haspopup="dialog"><span class="sl">${L("Angaben fehlen","Details missing")}</span><span class="sv warn">${kMiss.length}</span><span class="ss">${kMiss.length===1?L("1 Handwerker","1 contractor"):kMiss.length+" "+L("Handwerker","contractors")}</span></button>`
    :`<div class="stat ftile off"><span class="sl">${L("Angaben fehlen","Details missing")}</span><span class="sv">0</span><span class="ss">${L("alles vollständig","all complete")}</span></div>`;
  const more=`<button type="button" class="ib" title="${L("Weitere Aktionen","More actions")}" aria-label="${L("Weitere Aktionen","More actions")}" data-act="sheet" data-k="handwerker">${ico("more")}</button>`;
  const plus=ib("plus",L("Handwerker erfassen","Add contractor"),'data-act="sheet" data-k="k-add"');
  
  /* no «Nächster Schritt» here: the tiles open exactly these contractors (same rule as Rechnungen) */
  /* no list of contracts below the tiles: the tile «Werkverträge» opens them. Only contractors without a contract
     (not counted by any tile) and the empty state remain here */
  const looseSec=!all.length&&!loose.length?`<section><div class="rows"><div class="empty"><span>${L("Noch keine Handwerker in diesem Projekt. Mit + fügen Sie einen hinzu.","No contractors in this project yet. Use + to add one.")}</span></div></div>${addRow(L("Handwerker erfassen","Add contractor"),'data-act="sheet" data-k="k-add"')}</section>`
    :loose.length?`<section><div class="sh"><h2>${L("Ohne Werkvertrag","Without contract")}</h2><span class="cnt">${loose.length}</span></div><div class="rows">${loose.map(k=>row({act:"open-k",id:k.id,c:"n",title:esc(k.name),meta:missingOf(k).length?L("Fehlt: ","Missing: ")+esc(missingOf(k).join(", ")):"",amt:"",label:L("Werkvertrag erfassen","Add contract"),lc:"n"})).join("")}</div></section>`:"";
  return `<div class="page kpage">
    ${ph(p?esc(p.name):L("Büro","Office"),L("Handwerker","Contractors"),"",plus+more)}
    <div class="stats s4">${tile("",L("Werkverträge","Contracts"),chf(T.sum,false),nV===1?L("1 Vertrag","1 contract"):nV+" "+L("Verträge","contracts"),nV)}${tile("billed",L("Abgerechnet","Billed"),chf(T.billed,false),(T.sum?Math.round(T.billed/T.sum*100):0)+" %",all.filter(FL.billed).length)}${tile("ret",L("Rückbehalt","Retention"),chf(T.ret,false),(n=>n===1?L("1 Vertrag","1 contract"):n+" "+L("Verträge","contracts"))(all.filter(FL.ret).length),all.filter(FL.ret).length)}${missTile}</div>
    ${looseSec}
  </div>`;
}

function cmpBody(w){
  const c=compare(w);
  const op=w.offerPdf,opd=op&&DOCS().find(d=>d.id===op.doc);
  const pdfIn=lbl=>`<label class="btn${lbl?"":" primary"}">${lbl||L("Offerte als PDF","Offer as PDF")}<input type="file" accept="application/pdf,.pdf" data-imp="offerpdf" data-id="${w.id}"></label>`;
  if(!c&&op) return `<div class="stats"><div class="stat"><span class="sl">${L("Offerte","Offer")}</span><span class="sv">${chf(op.sum,false)}</span><span class="ss">${L("als PDF, ","as PDF, ")+fdate(op.date)}</span></div><div class="stat"><span class="sl">${L("Vertragssumme","Contract sum")}</span><span class="sv">${w.sum?chf(w.sum,false):L("fehlt","missing")}</span><span class="ss">${w.sum&&r2(w.sum)!==r2(op.sum)?L("weicht von der Offerte ab","differs from the offer"):L("im Werkvertrag","in the contract")}</span></div></div>
    <section class="docs"><div class="sh"><h2>${L("Offerte","Offer")}</h2></div>${opd?`<div class="dlist"><div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${opd.id}"><span class="dk">PDF</span><span class="dn">${esc(opd.name)}</span><span class="dm">${fsize(opd.size||0)} · ${fdate(opd.date)}</span></button></div></div>`:""}
    <div class="empty"><span>${L("Positionen mit der Schlussabrechnung vergleichen: Offerte zusätzlich aus Excel laden.","To compare items with the final account: also load the offer from Excel.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap">${pdfIn(L("Anderes PDF","Other PDF"))}<label class="btn">${L("Positionen aus Excel","Items from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label></div></div></section>`;
  if(!c) return `<section><div class="empty"><span>${L("Noch keine Offerte. Am einfachsten als PDF, so wie sie vom Handwerker kommt.","No offer yet. Easiest as PDF, as it comes from the contractor.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap">${pdfIn()}<label class="btn">${L("Offerte aus Excel","Offer from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label>${D.example&&w.id==="w6"?`<button type="button" class="btn" data-act="ex-offer">${L("Beispiel laden","Load example")}</button>`:""}<button type="button" class="btn" data-act="x-template">${L("Leere Vorlage","Blank template")}</button></div></div></section>`;
  const list=c.rows.filter(r=>S.cmpAll||!c.hasFinal||r.kind!=="same");
  const q=r=>r.kind==="new"?L("nicht offeriert","not in offer"):r.kind==="missing"?L("nicht abgerechnet","not billed"):c.hasFinal?nfq.format(r.oq)+" → "+nfq.format(r.fq)+" "+esc(r.unit||""):nfq.format(r.oq)+" "+esc(r.unit||"");
  const rows=list.map(r=>`<div class="row static">${dot(r.kind==="new"?"crit":r.kind==="more"?"warn":r.kind==="less"?"ok":"n")}<span class="rt">${esc(r.text)}</span><span class="rm">Pos ${esc(r.pos)} · ${q(r)}</span><span class="ra">${c.hasFinal?`<span class="${r.diff>0?"up":r.diff<0?"down":""}">${r.diff?sgn(r.diff):"0.00"}</span>`:nf2.format(r.oa)}</span><span class="rl"></span></div>`).join("");
  return `<div class="stats">
      <div class="stat"><span class="sl">${L("Offerte","Offer")}</span><span class="sv">${chf(c.ot,false)}</span><span class="ss">${c.rows.filter(r=>r.kind!=="new").length} ${L("Positionen","items")}</span></div>
      <div class="stat"><span class="sl">${L("Schlussabrechnung","Final account")}</span><span class="sv">${c.hasFinal?chf(c.ft,false):L("offen","open")}</span><span class="ss">${c.hasFinal?c.changed+" "+L("Abweichungen","differences"):L("noch nicht geladen","not loaded yet")}</span></div>
      <div class="stat"><span class="sl">${L("Differenz","Difference")}</span><span class="sv${c.hasFinal&&c.diff>0?" warn":""}">${c.hasFinal?(c.diff>0?"+":c.diff<0?"−":"")+chf(Math.abs(c.diff),false):L("offen","open")}</span><span class="ss">${c.hasFinal&&c.ot?(c.diff/c.ot*100>0?"+":"")+(c.diff/c.ot*100).toFixed(1)+"%":""}</span></div>
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
  /* running projects first; completed ones wait in a closed group, so the page stays short after many projects */
  const runP=pids.filter(pid=>!PJ(pid).closed),doneP=pids.filter(pid=>PJ(pid).closed);
  const byState=fn=>runP.map(fn).join("")+(doneP.length?`<details class="pdone hdone kdone"><summary>${L("Abgeschlossene Projekte","Completed projects")} <span class="cnt">${doneP.length}</span></summary>${doneP.map(fn).join("")}</details>`:"");
  let body="";
  const KCARD=()=>nextCard({key:"k:"+k.id,items:kPoints()});
  if(S.wid&&W(S.wid)&&W(S.wid).k===k.id){
    const w=W(S.wid);
    const bi=S.cmpBack&&INV(S.cmpBack.inv);
    body=`${bi?`<button type="button" class="back" data-act="back-inv">${BACK_I}${L("Zurück zur Rechnung ","Back to invoice ")}${esc(bi.no)}</button>`:backBtn("back-w",L("Alle Verträge","All contracts"))}
      <div class="ctx">${esc(PJ(w.pid).name)} · BKP ${w.bkp} ${esc(bName(w.bkp))}</div>${cmpBody(w)}`;
  } else if(S.ktab==="konto"){
    const oi=invOf(all).filter(i=>i.status!=="bezahlt"&&live(i)),open=oi.reduce((a,i)=>a+payout(i),0),gross=oi.reduce((a,i)=>a+net(i),0),oret=r2(gross-open);
    const top=all.length?`<div class="total"><span>${L("Offen","Open")}</span><span class="tv">${chf(open,false)}</span>${oret>0?`<span class="ts">${L("nach Rückbehalt ","after retention ")+chf(oret,false)}</span>`:oret<0?`<span class="ts">${L("mit Rückbehalt ","incl. retention ")+chf(-oret,false)}</span>`:""}</div>`:"";
    body=top+KCARD()+addHere+byState(pid=>{
      const ws=all.filter(w=>w.pid===pid),inv=invOf(ws),multi=ws.length>1;
      const stats=ws.map(w=>{const iv=inv.filter(i=>i.w===w.id),paid=iv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0),ret=iv.filter(counted).reduce((a,i)=>a+retention(i),0);
        /* the retention tile only where the contract has one */
        return `${multi?`<div class="ctx">BKP ${w.bkp} ${esc(bName(w.bkp))}</div>`:""}<div class="stats">
        <button type="button" class="stat" data-act="form" data-f="contract" data-id="${k.id}" data-w="${w.id}"><span class="sl">${L("Werkvertrag","Contract")}</span><span class="sv">${w.sum?chf(w.sum,false):"–"}</span><span class="ss">BKP ${w.bkp}</span></button>
        <div class="stat"><span class="sl">${L("Ausbezahlt","Paid out")}</span><span class="sv">${chf(paid,false)}</span><span class="ss">${(n=>n+" "+(n===1?L("Zahlung","payment"):L("Zahlungen","payments")))(iv.filter(i=>i.status==="bezahlt").length)}</span></div>
        ${retPct(w)>0||ret>0?`<div class="stat"><span class="sl">${L("Rückbehalt","Retention")}</span><span class="sv">${chf(ret,false)}</span><span class="ss">${retPct(w)} %</span></div>`:""}</div>`;}).join("");
      const rows=inv.map(i=>{const w=W(i.w);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:typeLabel(i)+(multi?` <span class="sp">· BKP ${w.bkp}</span>`:""),meta:esc(i.no)+" · "+fdate(i.date),amt:chf(i.gross,false),label:stLabel(i.status)});}).join("");
      const addInv=pid===cur?`<button type="button" class="add" data-act="form" data-f="invoice" data-id="${k.id}">${L("+ Erfassen","+ Add")}</button>`:"";
      const addW=pid===cur?`<button type="button" class="ghost" data-act="form" data-f="contract" data-id="${k.id}">${L("+ Weiterer Werkvertrag","+ Another contract")}</button>`:"";
      const po=inv.filter(i=>i.status!=="bezahlt"&&live(i)).reduce((a,i)=>a+payout(i),0);
      return group(pid,`${stats}<section><div class="sh"><h2>${L("Rechnungen","Invoices")}</h2><span class="cnt">${inv.length}</span>${addInv}</div><div class="rows">${rows||`<div class="empty">${L("Noch keine Rechnungen.","No invoices yet.")}</div>`}</div></section>${addW}`,po?chf(po,false)+" "+L("offen","open"):inv.length+" "+(inv.length===1?L("Rechnung","invoice"):L("Rechnungen","invoices")));
    });
  } else {
    body=KCARD()+addHere+byState(pid=>{
      const ws=all.filter(w=>w.pid===pid);
      const rows=ws.map(w=>{const c=compare(w);return row({act:"open-w",id:w.id,c:!c?(w.offerPdf?"n":"warn"):c.hasFinal?(c.diff>0?"warn":"ok"):"n",title:"BKP "+w.bkp+" "+esc(bName(w.bkp)),meta:!c?(w.offerPdf?L("Offerte ","Offer ")+chf(w.offerPdf.sum,false)+" · PDF":L("Offerte fehlt","No offer yet")):L("Offerte ","Offer ")+chf(c.ot,false)+" · "+(c.hasFinal?L("Schluss ","Final ")+chf(c.ft,false):L("Schluss fehlt","Final missing")),amt:c&&c.hasFinal?sgn(c.diff):"",lc:"n",label:L("Öffnen →","Open →")});}).join("");
      return group(pid,`<div class="rows">${rows}</div>`,ws.length+" "+(ws.length===1?L("Vertrag","contract"):L("Verträge","contracts")));
    });
  }
  const inW=S.wid&&W(S.wid)&&W(S.wid).k===k.id;
  /* next step for this contractor: missing details, invoices to check or queried, contracts without an offer, documents running out */
  function kPoints(){const mk=missingOf(k),kp=[];
  if(mk.length)kp.push({act:"form",ex:`data-f="contractor" data-id="${k.id}"`,c:"warn",title:L("Angaben ergänzen","Complete details"),meta:L("Fehlt: ","Missing: ")+mk.join(", "),label:""});
  invOf(all).filter(i=>(i.status==="pruefen"||i.status==="rueckfrage")&&live(i)).forEach(i=>{const dd=daysTo(i.due),q=i.status==="rueckfrage",w=W(i.w);kp.push({act:"p-open",ex:`data-id="${i.id}" data-p="${w.pid}" data-k="inv"`,c:q?"crit":dueTone(dd),title:(q?L("Rückfrage klären","Resolve query"):L("Rechnung prüfen","Check invoice")),meta:typeLabel(i)+" · "+esc(PJ(w.pid).name),amt:chf(i.gross,false),label:dueText(dd)});});
  all.filter(w=>!PJ(w.pid).closed&&!compare(w)&&!w.offerPdf).forEach(w=>kp.push({act:"open-w",ex:`data-id="${w.id}"`,c:"n",title:L("Offerte ablegen","Add the offer"),meta:"BKP "+w.bkp+" "+esc(bName(w.bkp))+" · "+esc(PJ(w.pid).name),label:""}));
  docsOfContractor(k.id).map(d=>[d,docValid(d)]).filter(([,v])=>v&&v.c!=="ok").forEach(([d,v])=>kp.push({act:"doc-open",ex:`data-id="${d.id}"`,c:v.c,title:esc(dkShort(docKind(d))),meta:esc(d.name),label:v.t}));return kp;}
  return `<div class="page">
    ${inW?"":backBtn("back-k",L("Handwerker","Contractors"))}
    ${ph("",esc(k.name),lead,tools)}

    ${all.length?`<div class="tabs" role="tablist"><button type="button" role="tab" data-act="ktab" data-t="konto" aria-selected="${S.ktab==="konto"}">${L("Konto","Account")}</button><button type="button" role="tab" data-act="ktab" data-t="vergleich" aria-selected="${S.ktab==="vergleich"}">${L("Offerte und Abrechnung","Offer and final account")}</button></div>`:""}
    ${body||addHere}
    ${S.wid&&W(S.wid)&&W(S.wid).k===k.id?"":docsFold(docsGrouped("contractor",k.id,L("Dokumente","Documents"),L("Offerten, Werkverträge, Versicherungsnachweise mit ＋ ablegen.","Store offers, contracts and certificates with ＋.")),docsOfContractor(k.id))}
  </div>`;
}
const ONE_BROW=(r,act,sub,base,pc)=>`<button type="button" class="brow row${S.hl===r.b.bkp?" hl":""}" ${act}><span class="code">${r.b.bkp}</span><div><span>${esc(tx(r.b))}</span><div class="bar"><i class="c-paid" style="width:${pc(r.paid)}%"></i><i class="c-appr" style="width:${pc(r.approved)}%"></i><i class="c-open" style="width:${pc(r.open)}%"></i>${r.kv?`<span class="kv" style="left:${r.kv/base*100}%"></span>`:""}</div><span class="bsub">${sub}</span></div><span class="kvc">${r.kv?chf(r.kv,false):"–"}</span><span class="nums${r.none?" mute":""}">${r.forecast?chf(r.forecast,false):"–"}</span><span class="rest ${r.rest<0?"up":r.none?"mute":""}">${r.kv&&!r.none?chf(r.rest,false):"–"}</span></button>`;
/* budget positions and the filters behind the Budget tiles; shared by the page and its tile sheets */
const BUD_F={all:r=>true,aw:r=>r.awarded>0,no:r=>!r.awarded,over:r=>r.rest<0};
/* the BKP table (grouped by main group with subtotals, a bar per position, legend) for the given positions */
function budgetTable(rows){
  const p=P(),fcL=p&&p.closed?L("Endkosten","Final cost"):L("Prognose","Forecast");
  const one=r=>{const base=Math.max(r.kv,r.awarded,r.billed+r.open,r.forecast,1),pc=x=>Math.max(0,x)/base*100;
    const act=`data-act="kv-explain" data-id="${r.b.bkp}"`;
    const sub=(r.kv?`<span class="bmob">KV ${nf0.format(r.kv)} · ${fcL} ${nf0.format(r.forecast)} · </span>`:"")+(r.rev?`<span class="l-n">${L("revidiert, ursprünglich ","revised, originally ")+nf0.format(r.b.kv||0)}</span> · `:"")+(r.none?L("nicht vergeben","not awarded"):[r.awarded?L("vergeben ","awarded ")+nf0.format(r.awarded):L("ohne Werkvertrag","no contract"),r.billed+r.open?L("abgerechnet ","billed ")+nf0.format(r.billed+r.open):""].filter(Boolean).join(" · "));
    return ONE_BROW(r,act,sub,base,pc);};
  /* BKP as a tree, like the cost estimate: main group (2), group (21), item (211), sub-item (211.1).
     Every level with finer positions below is a row of its own with its sums and opens or closes. */
  const chain=c=>{const [m,s]=String(c).split("."),out=[m.charAt(0)];if(m.length>=2)out.push(m.slice(0,2));if(m.length>=3)out.push(m.slice(0,3));if(s!==undefined)out.push(c);return [...new Set(out)];};
  const root={kids:new Map(),rows:[]};
  rows.forEach(r=>{let n=root;const ch=chain(r.b.bkp);ch.forEach((c,k)=>{if(k===ch.length-1){n.rows.push(r);return;}if(!n.kids.has(c))n.kids.set(c,{code:c,kids:new Map(),rows:[]});n=n.kids.get(c);});});
  const all=rows.length>=budgetRows().length,pp=P()||{},gName=c=>((pp.bkpGroups||{})[c])||(c.length===1?bkpMainName(c):bkpCat(c))||"BKP "+c;
  /* the full table opens at the main groups; a tile that shows a selection opens everything */
  const isOpen=(c,lv)=>S.bopen&&c in S.bopen?S.bopen[c]:(!all||lv===0);
  const flat=n=>[...n.rows,...[...n.kids.values()].flatMap(flat)];
  const sortK=(a,b)=>String(a).localeCompare(String(b),"de",{numeric:true});
  const draw=(n,lv)=>{
    /* items and finer levels in BKP order, e.g. 211 (with 211.1 below) before 214 */
    const own=n.rows.map(r=>[r.b.bkp,one(r).replace('class="brow row','style="--lv:'+lv+'" class="brow row')]);
    const kids=[...n.kids.values()].map(g=>{
      const rs=flat(g);
      return [g.code,(()=>{const kv=rs.reduce((a,r)=>a+(r.kv||0),0),aw=rs.reduce((a,r)=>a+(r.forecast||0),0),rest=rs.reduce((a,r)=>a+(r.kv?r.rest:0),0),o=isOpen(g.code,lv);
      return `<button type="button" class="bgroup lv${lv}" style="--lv:${lv}" data-act="bgrp" data-id="${g.code}" aria-expanded="${o}"><span class="code">${g.code}</span><span class="gn"><i class="car" aria-hidden="true"></i><span>${esc(gName(g.code))}${kv?`<span class="bmob gsub">KV ${nf0.format(kv)} · ${fcL} ${nf0.format(aw)}</span>`:""}</span></span><span class="kvc">${kv?chf(kv,false):"–"}</span><span class="nums">${aw?chf(aw,false):"–"}</span><span class="rest${rest<0?" up":rs.every(r=>r.none)?" mute":""}">${kv&&!rs.every(r=>r.none)?chf(rest,false):"–"}</span></button>${o?draw(g,lv+1):""}`;})()];});
    return own.concat(kids).sort((a,b)=>sortK(a[0],b[0])).map(x=>x[1]).join("");};
  const br=draw(root,0);
  return `<div class="btable"><div class="bhead"><span>BKP</span><span>${L("Arbeitsgattung","Trade")}</span><span class="kvc">${L("Kostenvoranschlag","Estimate")}</span><span class="nums">${fcL}</span><span class="rest">${L("Reserve","Reserve")}</span></div>${br}
    <div class="legend"><span><i class="c-paid"></i>${L("Bezahlt","Paid")}</span><span><i class="c-appr"></i>${L("Freigegeben","Approved")}</span><span><i class="c-open"></i>${L("Zu prüfen","To check")}</span><span><i style="width:1px;height:12px;background:var(--ink)"></i>${L("Kostenvoranschlag","Estimate")}</span></div></div>`;
}
function viewBudget(){
  const p=P(); if(!p) return noProject();
  const allRows=budgetRows(), t=totals(allRows), nP=n=>n===1?L("1 Position","1 item"):n+" "+L("Positionen","items");
  /* each tile opens a sheet with exactly the positions it counts */
  const bt=(f,l,v,ss,c)=>{const n=allRows.filter(BUD_F[f]).length,inner=`<span class="sl">${l}</span><span class="sv${c||""}">${n?v:"0"}</span><span class="ss">${ss}</span>`;return n?`<button type="button" class="stat" data-act="sheet" data-k="bud:${f}" aria-haspopup="dialog">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const sumB=(f,g)=>allRows.filter(BUD_F[f]).reduce((a,r)=>a+g(r),0);
  /* no «Nächster Schritt» and no table below: the tiles open exactly these positions. Only the empty state remains */
  const empty=allRows.length?"":`<section><div class="rows"><div class="empty"><span>${L("Noch kein Kostenvoranschlag. Erfassen Sie die BKP-Positionen mit Betrag, daran misst arkitecton alle Rechnungen.","No cost estimate yet. Add the BKP items with amounts; arkitecton measures every invoice against them.")}</span><label class="btn primary">${L("Kostenvoranschlag hochladen (Excel)","Upload cost estimate (Excel)")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="kv" data-id="${D.pid}"></label></div></div>${addRow(L("BKP-Position erfassen","Add BKP item"),'data-act="form" data-f="bkp"')}</section>`;
  return `<div class="page">
    ${ph(esc(p.name),"Budget","",ib("plus",L("BKP-Position erfassen","Add BKP item"),'data-act="form" data-f="bkp"')+excelBtn("budget"))}
    <div class="stats s4">${bt("all",t.rev?L("Kostenvoranschlag rev.","Revised estimate"):L("Kostenvoranschlag","Cost estimate"),chf(t.kv,false),t.rev?L("ursprünglich ","originally ")+chf(t.kv0,false):nP(allRows.length))}${bt("aw",L("Vergeben","Awarded"),chf(t.awarded,false),(t.kv?Math.round(t.awarded/t.kv*100)+" %":""))}${bt("no",L("Nicht vergeben","Not awarded"),chf(sumB("no",r=>r.kv),false),nP(allRows.filter(BUD_F.no).length))}${bt("over",L("Über Budget","Over budget"),chf(sumB("over",r=>-r.rest),false),nP(allRows.filter(BUD_F.over).length)," warn")}</div>
    ${empty}
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
  const st=SET();
  const seg=(name,cur,opts)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-act="${name}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join("")}</div>`;
  const num=(id,v,unit,lbl)=>`<label class="setnum"><input id="${id}" data-set="${id}" inputmode="numeric" autocomplete="off" value="${v}" aria-label="${esc(lbl)}"><span>${unit}</span></label>`;
  const row=(t,hint,ctrl)=>`<div class="setrow"><div><div class="st">${t}</div>${hint?`<div class="sh2">${hint}</div>`:""}</div><div class="sc">${ctrl}</div></div>`;
  /* a setting with an explanation: the explanation sits behind the «i» */
  const rowI=(t,expl,ctrl)=>{const k="set:"+t;return `<div class="setrow"><div><div class="st">${t}${infoBtn(k,t)}</div>${infoBox(k,`<p>${expl}</p>`)}</div><div class="sc">${ctrl}</div></div>`;};
  return `<div class="page">${ph("",L("Einstellungen","Settings"),"","")}
    <section><div class="sh"><h2>${L("Ansicht","View")}</h2></div>
      ${rowI(L("Erscheinungsbild","Appearance"),L("Automatisch folgt der Einstellung Ihres Geräts.","Automatic follows your device setting."),seg("theme-set",themeMode(),[["auto",L("Automatisch","Automatic")],["light",L("Hell","Light")],["dark",L("Dunkel","Dark")]]))}
      ${row(L("Sprache","Language"),"",seg("lang-set",S.lang,[["de","Deutsch"],["en","English"]]))}
    </section>
    <section><div class="sh"><h2>${L("Büroprofil","Office profile")}</h2></div>
      ${row(L("Büro, Team, Referenzen, Unterlagen","Office, team, references, documents"),"",`<button type="button" class="btn" data-act="nav" data-v="profil">${L("Zum Büroprofil","Open office profile")}</button>`)}
    </section>
    <section><div class="sh"><h2>${L("Standardwerte","Defaults")}</h2></div>
      ${rowI(L("Rückbehalt","Retention"),L("Gilt für neue Werkverträge, meist 0 %. Öffentliche Bauherren behalten oft einen Rückbehalt. Pro Werkvertrag änderbar.","Applies to new contracts, usually 0 %. Public clients often hold back retention. Changeable per contract."),num("ret",st.ret,"%",L("Rückbehalt","Retention")))}
      ${rowI(L("Zahlungsfrist Handwerker","Contractor payment term"),L("Gilt, wenn die Rechnung kein Fälligkeitsdatum enthält.","Applies when the invoice has no due date."),num("term",st.term,L("Tage","days"),L("Zahlungsfrist Handwerker","Contractor payment term")))}
      ${rowI(L("Zahlungsfrist Honorar","Fee payment term"),L("Steht auf Ihren neuen Honorarrechnungen.","Printed on your new fee invoices."),num("feeTerm",st.feeTerm,L("Tage","days"),L("Zahlungsfrist Honorar","Fee payment term")))}
      ${rowI(L("Mahnungen","Reminders"),L("1., 2. und 3. Mahnung, in Tagen ab Rechnungsdatum.","1st, 2nd and 3rd reminder, in days from the invoice date."),`<div class="setrem">${num("rem0",st.rem[0],"",L("1. Mahnung","1st reminder"))}${num("rem1",st.rem[1],"",L("2. Mahnung","2nd reminder"))}${num("rem2",st.rem[2],L("Tage","days"),L("3. Mahnung","3rd reminder"))}</div>`)}
      <div class="ferr" id="setErr" role="alert"></div>
    </section>
    <section><div class="sh"><h2>${L("BKP-Liste","BKP list")}</h2></div>
      ${(()=>{const own=D.bkpList||[],inf=D.bkpListInfo||{},sub=own.filter(o=>o[0].includes(".")).length;
        return (own.length?row:rowI)(own.length?L("Eigene Liste aktiv","Own list active"):L("Standardliste","Standard list"),own.length?esc(inf.name||"")+" · "+own.length+L(" Codes"," codes")+(sub?", "+sub+L(" Unterpositionen"," sub-items"):"")+" · "+fdate(inf.date||iso(TODAY)):L("Hauptgruppen 0 bis 9 und Positionen bis 3 Stellen. Für Unterpositionen wie 211.5 laden Sie Ihre eigene Liste als Excel: Spalte A Nummer, Spalte B Bezeichnung.","Main groups 0 to 9 and items up to 3 digits. For sub-items like 211.5, load your own list as Excel: column A number, column B name."),
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
/* sections fold; on the tender detail each section opens by default only when something there needs doing (data-fd="1" = closed).
   The state is fixed when the tender is first shown, so a section never closes by itself while someone works in it. */
function foldSections(){const tk=S.view==="ausschreibungen"&&S.tid?"t:"+S.tid+":":null;
  if(!["buero","uebersicht","profil"].includes(S.view)&&!tk)return;const st=tk?(S.tfold||(S.tfold={})):foldGet();
  document.querySelectorAll("#main section").forEach(sec=>{const sh=sec.querySelector(":scope>.sh"),h=sh&&sh.querySelector("h2");if(!h||sh.querySelector(".fold")||(tk&&!sec.dataset.fk))return;
    const k=tk?tk+sec.dataset.fk:S.view+":"+h.textContent.trim(),closed=tk?(k in st?st[k]:(st[k]=sec.dataset.fd==="1")):(k in st?!!st[k]:sec.dataset.fd==="1");sec.classList.add("foldable");sec.classList.toggle("folded",closed);
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
  if(kind==="doc"){const d=DOCS().find(x=>x.id===key);if(!d)return [];return [it(L("Öffnen","Open"),"doc-open",`data-id="${d.id}"`),it(d.scope==="tender"||d.scope==="firm"?L("Gültigkeit bearbeiten","Edit validity"):L("Bearbeiten","Edit"),"form",`data-f="docvalid" data-id="${d.id}"`),Object.assign(it(L("Löschen","Delete"),"doc-del",`data-id="${d.id}"`),{danger:true})];}
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
  el.innerHTML=`<div class="pophead${P0.kind==="doc"?" pdoc":""}">${P0.kind==="proj"?L("Projekt","Project"):P0.kind==="doc"?esc(((DOCS().find(x=>x.id===P0.key))||{}).name||""):vName(P0.key)}</div>`+items.map(x=>x.imp?`<label class="popi" role="menuitem"><span>${esc(x.label)}</span><input type="file" accept=".xlsx,.xls,.csv" data-imp="${x.imp}" aria-label="${esc(x.label)}"></label>`:`<button type="button" class="popi${x.danger?" danger":""}" role="menuitem" data-act="${x.act}" ${x.ex}>${esc(x.label)}</button>`).join("")+foot;
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
  /* closed with a summary when the team is complete; open when a tender needs a QES nobody has */
  const qN=tm.filter(m=>(m.extra||[]).includes("qes")).length,qGap=tenderTasks().some(x=>/QES/.test(x.title));
  return `<section id="team" class="tsec" data-fd="${tm.length&&!qGap?1:0}"><div class="sh"><h2>${L("Team","Team")}</h2><span class="cnt">${tm.length}</span>${tm.length?tSum(qGap?L("QES fehlt","QES missing"):sg.length+" "+L("unterschreiben","sign")+" · "+qN+" QES",qGap?"warn":""):tSum(L("noch niemand","nobody yet"),"crit")}<span class="right">${ib("plus",L("Person erfassen","Add person"),'data-act="form" data-f="person"')}</span></div>
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
  const TL={refs:[L("Referenzen","References"),O.refs.length,O.refs.length?L("bis ","up to ")+mio(maxC):L("noch keine","none yet")],
    pub:[L("Öffentlich","Public"),G.pub.length,L("Bauherrschaft","client")],
    sugg:[L("Vorschläge","Suggestions"),sugg.length,L("aus Projekten","from projects")]};
  const tile=k=>{const [l,v,ss]=TL[k],n=G[k].length,sel=S.pfilter===k,inner=`<span class="sl">${l}</span><span class="sv">${v||"0"}</span><span class="ss">${ss}</span>`;
    return n||k==="refs"?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="pfilter" data-f="${k}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const refRow=r=>row({act:"form",id:r.id,c:r.pub?"acc":"n",title:esc(tx(r)),meta:[esc(r.client||""),r.type&&RTYPE[r.type]?tx(RTYPE[r.type]):"",r.phases?"SIA "+esc(r.phases):""].filter(Boolean).join(" · "),amt:r.cost?mio(r.cost):"",label:r.running?L("laufend","ongoing"):String(r.year||""),lc:"n"}).replace('data-act="form"','data-act="form" data-f="ref"');
  const sRow=p=>row({act:"form",c:"n",title:esc(p.name),meta:[esc(p.place||""),esc(p.client||"")].filter(Boolean).join(" · "),amt:"",label:L("Als Referenz übernehmen","Use as reference"),lc:"acc"}).replace('data-act="form"','data-act="form" data-f="ref" data-w="'+p.id+'"');
  const fl=S.pfilter,list=G[fl],rows=(fl==="sugg"?list.map(sRow):list.map(refRow)).join("");
  const sig=f.sigRule==="kollektiv2"?L("kollektiv zu zweien","jointly by two"):L("Einzelunterschrift","single signature");
  /* next step: missing team or references, documents running out, and a missing QES when a tender needs one */
  const pp=[];
  if(!O.team.length)pp.push({act:"form",ex:'data-f="person"',c:"crit",title:L("Team erfassen","Add the team"),meta:L("für Unterschriften und Eignung","for signatures and eligibility"),label:""});
  if(!O.refs.length)pp.push({act:"form",ex:'data-f="ref"',c:"crit",title:L("Referenzen erfassen","Add references"),meta:L("für die Eignung bei Ausschreibungen","for tender eligibility"),label:""});
  docsFor("firm","firm").map(d=>[d,docValid(d)]).filter(([,v])=>v&&v.c!=="ok").forEach(([d,v])=>pp.push({act:"dmore",ex:`data-id="${d.id}"`,c:v.c,title:esc(d.name),meta:L("neue Unterlage ablegen","file a new document"),label:v.t}));
  tenderTasks().filter(x=>/QES/.test(x.title)).forEach(x=>pp.push({act:"jump",ex:'data-k="team"',c:x.c,title:esc(x.title),meta:L("bei der Person «QES» ankreuzen","tick «QES» at the person"),label:x.label}));
  const pcard=nextCard({key:"profil",items:pp,acts:pp.some(x=>x.act==="dmore")?`<label class="btn primary">${L("Neue Unterlage ablegen","File a new document")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" data-imp="doc" data-id="firm|firm"></label>`:""});
  return `<div class="page">${ph("",L("Büroprofil","Office profile"),"","")}${pcard}
    ${!O.refs.length||!O.team.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Solange Referenzen und Team fehlen, kann arkitecton die Eignung bei Ausschreibungen nicht prüfen.","As long as references and team are missing, arkitecton cannot check tender eligibility.")}</span></div>`:""}
    <section class="tsec" data-fd="${f.name&&f.iban&&f.city?1:0}"><div class="sh"><h2>${L("Büro","Office")}</h2>${tSum(f.name&&f.iban&&f.city?esc(f.name):L("Angaben fehlen","details missing"),f.name&&f.iban&&f.city?"":"warn")}</div>
      ${srow(esc(f.name||L("Büroname fehlt","Firm name missing")),[adr,f.iban?"IBAN "+fmtIban(f.iban):L("IBAN fehlt","IBAN missing"),f.vatNo||"",L("Zeichnungsberechtigung: ","Signing: ")+sig].filter(Boolean).map(esc).join(" · "),`<button type="button" class="btn" data-act="form" data-f="firm">${L("Bearbeiten","Edit")}</button>`)}
    </section>
    ${teamSection(srow)}
    <section id="refs" class="tsec" data-fd="${O.refs.length?1:0}"><div class="sh"><h2>${L("Referenzen","References")}</h2><span class="cnt">${O.refs.length}</span>${O.refs.length?tSum(G.pub.length+" "+L("öffentlich","public")+(sugg.length?" · "+sugg.length+" "+L("Vorschläge","suggestions"):"")):tSum(L("noch keine","none yet"),"crit")}<span class="right">${ib("plus",L("Referenz erfassen","Add reference"),'data-act="form" data-f="ref"')}</span></div>
      <div class="stats">${["refs","pub","sugg"].map(tile).join("")}</div>
      <div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Referenzen. Mit + erfassen Sie eine, oder übernehmen Sie ein abgeschlossenes Projekt.","No references yet. Use + to add one, or take over a completed project.")}</span></div>`}</div></section>
    ${docsFold(docsBlock("firm","firm",L("Unterlagen des Büros","Firm documents"),L("Handelsregister, Versicherung, AHV, Betreibungsregister: einmal ablegen, für jede Bewerbung bereit. Mit Gültigkeit warnt arkitecton vor Ablauf.","Register extract, insurance, social security: store once, ready for every bid.")),docsFor("firm","firm"))}
    <section><div class="sh"><h2>${L("Einstellungen","Settings")}</h2></div><div class="rows">${row({act:"nav",v:"einstellungen",c:"n",title:L("Darstellung, Standardwerte, Daten","Appearance, defaults, data"),meta:"",amt:"",label:""})}</div></section>
  </div>`;
}
function viewTenders(){
  if(S.tid&&T(S.tid)) return viewTender(T(S.tid));
  const O=D.office;
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
      return [L("Zuschlag erhalten","Contract awarded"),won?String(won):"0",ss,won?" ok":""];})()};
  const tile=k=>{const [l,v,ss,c]=TL[k],n=G[k].length,sel=S.tfilter===k,inner=`<span class="sl">${l}</span><span class="sv${c}">${n?v:"0"}</span><span class="ss">${ss}</span>`;
    return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="tfilter" data-f="${k}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  /* next step: the tender with the nearest deadline, its open points lead straight into the right section */
  const card=(()=>{if(!next)return nextCard({});const nd=daysTo(next.due),op=docsOf(next).filter(d=>!d.done),ft=fitOf(next).fit;
    return nextCard({key:"tl",title:bidName(next)+L(" einreichen"," to submit"),when:esc(tx(next.title))+" · "+(nd===0?L("heute","today"):L("in "+nd+" "+dayWord(nd),"in "+nd+" "+(nd===1?"day":"days"))),whenC:nd<=2?"crit":nd<=7?"warn":"",
      items:tenderPoints(next,op,ft).map(x=>({c:x.c,title:x.title,meta:x.meta,label:x.label,act:x.k?"open-tgo":x.act,ex:x.k?`data-id="${next.id}" data-k="${x.k}"`:x.ex})),
      acts:`<button type="button" class="btn primary" data-act="open-t" data-id="${next.id}">${L("Ausschreibung öffnen","Open tender")}</button>`});})();
  return `<div class="page">${ph("",L("Ausschreibungen","Tenders"),"",ib("plus",L("Ausschreibung erfassen","Add tender"),'data-act="form" data-f="tender"')+excelBtn("tender"))}
    ${noProf}
    <div class="stats s4">${["open","ok","partner","done"].map(tile).join("")}</div>
    ${card}
    <section><div class="sh"><h2>${S.tfilter==="done"?L("Eingereichte Verfahren","Submitted procedures"):TL[S.tfilter][0]}</h2><span class="cnt">${list.length}</span><span class="right">${S.tfilter==="open"?"":`<button type="button" class="ghost" data-act="tfilter" data-f="open">${L("Alle offenen anzeigen","Show all open")} (${active.length})</button>`}</span></div><div class="rows">${rows||`<div class="empty"><span>${L("Keine Verfahren.","No procedures.")}</span></div>`}</div></section>
  </div>`;
}

function viewPerson(m,tsw){
  const cr=curRole(m),car=(m.career||[]).slice().sort((a,b)=>(b.to||9999)-(a.to||9999)||b.from-a.from);
  const st=(l,v,ss)=>`<div class="stat"><span class="sl">${l}</span><span class="sv">${v}</span><span class="ss">${ss}</span></div>`;
  const pl=roleYears(m,"pl"),bl=roleYears(m,"bl"),tot=roleYears(m);
  const cRow=c=>{const i=m.career.indexOf(c);return row({act:"form",id:m.id,c:c.to?"n":"ok",title:tx(ROLES[c.role]||{de:c.role,en:c.role}),meta:esc(c.firm||""),amt:c.from+L(" bis "," to ")+(c.to||L("heute","today")),label:yrs(spanY(c)),lc:"n"}).replace('data-act="form"','data-act="form" data-f="career" data-w="'+i+'"');};
  const nowC=car.filter(c=>!c.to),pastC=car.filter(c=>c.to);
  const rows=(nowC.length?nowC:pastC.slice(0,1)).map(cRow).join("")+foldRows(L("Frühere Stationen","Earlier positions"),(nowC.length?pastC:pastC.slice(1)).map(cRow).join(""),(nowC.length?pastC:pastC.slice(1)).length);
  const xs=(m.extra||[]).filter(x=>XQ[x]);
  return `<div class="page">
    <button type="button" class="back" data-act="back-m">${BACK_I}${L("Büroprofil","Office profile")}</button>
    ${ph(L("Team","Team")+(cr?" · "+tx(ROLES[cr]):""),esc(m.name),esc(m.qual||""),ib("edit",L("Person bearbeiten","Edit person"),`data-act="form" data-f="person" data-id="${m.id}"`))}
    <div class="stats">${st(L("Berufserfahrung","Experience"),tot?yrs(tot):"0",tot?L("seit ","since ")+startY(m):L("Werdegang erfassen","add career"))}${st(L("Als Projektleiter","As project lead"),pl?yrs(pl):"0",pl?L("Projektleitung","project management"):L("keine Erfahrung erfasst","none recorded"))}${st(L("Als Bauleiter","As site manager"),bl?yrs(bl):"–",xs.includes("blfa")?tx(XQ.blfa):bl?L("Bauleitung","site management"):L("keine Erfahrung erfasst","none recorded"))}</div>
    <section><div class="sh"><h2>${L("Werdegang","Career")}</h2><span class="cnt">${car.length}</span><span class="right"><button type="button" class="ghost" data-act="form" data-f="career" data-id="${m.id}">+ ${L("Station","Position")}</button></span></div><div class="rows">${rows||`<div class="empty"><span>${L("Noch kein Werdegang. Erfassen Sie die Rollen mit Jahren, auch bei früheren Arbeitgebern.","No career yet. Add roles with years, including former employers.")}</span></div>`}</div></section>
    <section><div class="sh"><h2>${L("Zusatzqualifikationen","Additional qualifications")}</h2><span class="cnt">${xs.length}</span></div><div class="rows">${xs.map(x=>`<div class="row static">${dot("ok")}<span class="rt">${tx(XQ[x])}</span><span class="rm"></span><span class="ra"></span><span class="rl"></span></div>`).join("")||`<div class="empty"><span>${L("Keine erfasst. Über den Stift oben ergänzen.","None yet. Add them with the pencil above.")}</span></div>`}</div></section>
  </div>`;
}

/* a document section that opens by default only when it is empty or a document runs out; the header says how many and what runs out */
function docsFold(html,list){const bad=list.map(docValid).filter(v=>v&&v.c!=="ok"),cr=bad.some(v=>v.c==="crit");
  const sum=bad.length?tSum(bad.length+" "+(cr?L("abgelaufen oder bald","expired or soon"):L("laufen bald ab","expiring soon")),cr?"crit":"warn"):"";
  return html.replace('<section class="docs">',`<section class="docs tsec" data-fd="${list.length&&!bad.length?1:0}">`).replace(/(<span class="cnt">\d+<\/span>)/,"$1"+sum);}
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
    ${dos.length?`<div class="dlist">${dos.map(d=>`<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${L("Dossier","Dossier")} · ${fsize(d.size||0)} · ${fdate(d.date)}</span></button>${docMore(d)}</div>`).join("")}</div>`
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
/* the open points of a tender in preparation, used on the tender and on the tender list; k names the section that holds the point */
function tenderPoints(t,open,fit){const out=[],add=(c,title,meta,label,k,act,ex)=>out.push({c,title,meta,label,k,act,ex}),phs=phaseOf(t);
  if(fit==="no")add("crit",L("Eignung nicht erfüllt","Not eligible"),L("Teilnahme nur mit Partner oder gar nicht","only with a partner or not at all"),"","elig");
  else if(fit==="partner")add("warn",L("Eignung nur mit Partner","Eligible only with partner"),"","","elig");
  if(t.status==="neu")add("n",L("Teilnahme entscheiden","Decide on participation"),L("Eignung, Team und Kriterien prüfen","check eligibility, team and criteria"),"","elig");
  if(open.length)add("warn",open.length===1?L("1 Unterlage offen","1 document open"):open.length+" "+L("Unterlagen offen","documents open"),open.map(d=>esc(d.t)).join(" · "),"","docs");
  const cr=crewOf(t),free=cr.filter(x=>!x.m).length,hot=cr.map(crewMember).filter((m,i,a)=>m&&a.indexOf(m)===i).filter(m=>{const l=crewLoad(t,m.id);return l.oth.length&&l.tot>100;});
  if(free)add("warn",free===1?L("1 Rolle im Team offen","1 team role open"):free+" "+L("Rollen im Team offen","team roles open"),"","","crew");
  hot.forEach(m=>add("crit",esc(m.name)+L(" überbucht"," overbooked"),L("auch in anderen Ausschreibungen eingeplant","also planned in other tenders"),"","crew"));
  const k=sigCheck(t);if(k&&k.c!=="ok")add(k.c,k.c==="crit"?L("QES fehlt im Büro","No QES in the office"):L("Zweite QES fehlt","Second QES missing"),L("im Büroprofil bei der Person ankreuzen","tick it at the person in the office profile"),"",null,"nav",'data-v="profil"');
  const qd=t.qDue?daysTo(t.qDue):-1;if(qd>=0&&t.status==="arbeit")add(qd<=3?"warn":"n",L("Fragen stellen","Ask questions"),L("auf simap.ch im Forum","in the simap.ch forum"),L("bis ","by ")+fdate(t.qDue),"src");
  const key=phs===1?"gek":"zk",nz=(t[key]||[]).filter(z=>!z.me).length;if(nz&&t.status==="arbeit")add("n",L("Kriterien einschätzen","Assess the criteria"),L("zeigt, wo Sie Punkte holen","shows where you earn points"),"",key);
  return out;}
function tenderNext(t,docs,open,fit){
  const c=closedT(t),dd=daysTo(t.due),it=[];
  const item=(cc,title,meta,label,act,ex)=>it.push(`<button type="button" class="row" data-act="${act}" ${ex}>${dot(cc)}<span class="rt">${title}</span><span class="rm">${meta||""}</span><span class="ra"></span><span class="rl l-${cc}">${label||""}</span></button>`);
  const go=k=>`data-k="${k}"`;
  let title,when="",acts="";
  const btn=(lab,act,s,pr,dis)=>`<button type="button" class="btn${pr?" primary":""}" data-act="${act}" data-id="${t.id}"${s?` data-${act==="t-res"?"w":"s"}="${s}"`:""}${dis?" disabled":""}>${lab}</button>`;
  const skip=`<button type="button" class="ghost" data-act="t-status" data-id="${t.id}" data-s="verzichtet">${L("Nicht teilnehmen","Skip")}</button>`;
  const reopen=s=>`<button type="button" class="ghost" data-act="t-status" data-id="${t.id}" data-s="${s}">${s==="arbeit"?L("Wieder öffnen","Reopen"):L("Entscheid zurücksetzen","Reset decision")}</button>`;
  if(t.status==="neu"||t.status==="arbeit"){
    const nm=bidName(t);title=nm+L(" einreichen"," to submit");when=dd<0?L("Frist vorbei","deadline passed"):L("bis ","by ")+fdate(t.due);
    tenderPoints(t,open,fit).forEach(x=>item(x.c,x.title,x.meta,x.label,x.k?"t-go":x.act,x.k?go(x.k):x.ex));
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
    <div class="stats${resultTile(t)?" s4":""}">
      <div class="stat"><span class="sl">${phs===1?L("Teilnahmeantrag","Request to participate"):L("Eingabe","Submission")}</span><span class="sv${!c&&dd<=7?(dd<=2?" crit":" warn"):""}">${c?(t.status==="verzichtet"?tx(TST[t.status]):L("Eingereicht","Submitted")):dd<0?L("vorbei","closed"):dd===0?L("heute","today"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days"))}</span><span class="ss">${fdate(c&&t.sub?t.sub:t.due)}</span></div>
      ${resultTile(t)}
      <div class="stat"><span class="sl">${L("Eignung","Eligibility")}</span><span class="sv ${FIT[fit].c}">${tx(FIT[fit])}</span><span class="ss">${okN} ${L("von","of")} ${ev.length}</span></div>
      <div class="stat"><span class="sl">${L("Baukosten","Construction cost")}</span><span class="sv">${mio(t.cost)}</span><span class="ss">BKP 291</span></div>
    </div>
    ${tenderNext(t,docs,open,fit)}
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
  document.getElementById("main").innerHTML=pNav()+({buero:viewFirm,projekte:viewProjekte,uebersicht:viewOverview,rechnungen:viewInvoices,handwerker:viewContractors,budget:viewBudget,ausschreibungen:viewTenders,profil:viewProfil,einstellungen:viewSettings})[S.view]();
  tilePanel();trimRail();foldSections();renderOverlay();
}
/* on the computer a tile does not open a sheet: its content opens right below the tiles (same content as the phone sheet).
   Tapping the tile again or × closes it; leaving the page closes it too. In Handwerker and Budget the first tile (Werkverträge, Kostenvoranschlag) is open on arrival, so its list is there right away */
const TSEL_START={handwerker:"kw:all",budget:"bud:all"};
const isDesk=()=>!matchMedia("(max-width:820px)").matches;
function tilePanel(){
  const here=S.view+"|"+D.pid+"|"+(S.rtab||"");if(S.tselAt!==here){S.tsel=TSEL_START[S.view]||null;S.tselAt=here;}
  if(!S.tsel||!isDesk())return;
  const t=[...document.querySelectorAll('#main .stats [data-act="sheet"]')].find(e=>e.dataset.k===S.tsel);if(!t){S.tsel=null;return;}
  const prev=S.sheet;S.sheet=S.tsel;let html="";try{html=sheetHTML();}finally{S.sheet=prev;}
  const tpl=document.createElement("template");tpl.innerHTML=html;const sh=tpl.content.querySelector(".sheet");if(!sh)return;
  const h=sh.querySelector(".ohead h2"),b=sh.querySelector(".obody");
  b.querySelectorAll('[data-act="close"]').forEach(x=>x.dataset.act="tsel-close");
  const sec=document.createElement("section");sec.className="tpanel";sec.id="tpanel";sec.setAttribute("aria-labelledby","tpT");
  sec.innerHTML=`<div class="tph"><h2 id="tpT">${h?h.innerHTML:""}</h2><button type="button" class="x" data-act="tsel-close" aria-label="${L("Schliessen","Close")}">×</button></div><div class="tpb">${b?b.innerHTML:""}</div>`;
  t.classList.add("sel");t.setAttribute("aria-expanded","true");t.setAttribute("aria-controls","tpanel");
  document.querySelectorAll('#main .stats [data-act="sheet"]').forEach(e=>{if(e!==t)e.setAttribute("aria-expanded","false");});
  t.closest(".stats").insertAdjacentElement("afterend",sec);
}
