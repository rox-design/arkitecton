/* arkitecton · Documents on this device (IndexedDB), office profile, migrations. */
"use strict";
/* ---------- document storage (IndexedDB, this device) ---------- */
const FDB={db:null,open(){return this.db?Promise.resolve(this.db):new Promise((ok,no)=>{const r=indexedDB.open("arkitecton-files",1);r.onupgradeneeded=()=>r.result.createObjectStore("files");r.onsuccess=()=>{this.db=r.result;ok(r.result);};r.onerror=()=>no(r.error);});},
  /* every data space (?raum=…) keeps its files under its own prefix, so ids like f101 never collide; the default space stays unprefixed */
  key(id){return SPACE?SPACE+"::"+id:id;},
  mine(k){return SPACE?String(k).startsWith(SPACE+"::"):!String(k).includes("::");},
  async keys(){const db=await this.open();return new Promise(ok=>{const r=db.transaction("files").objectStore("files").getAllKeys();r.onsuccess=()=>ok((r.result||[]).filter(k=>this.mine(k)));r.onerror=()=>ok([]);});},
  async put(id,blob){const db=await this.open();return new Promise((ok,no)=>{const t=db.transaction("files","readwrite");t.objectStore("files").put(blob,this.key(id));t.oncomplete=ok;t.onerror=()=>no(t.error);});},
  async get(id){const db=await this.open();return new Promise((ok,no)=>{const r=db.transaction("files").objectStore("files").get(this.key(id));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});},
  async del(id){const db=await this.open();return new Promise(ok=>{const t=db.transaction("files","readwrite");t.objectStore("files").delete(this.key(id));t.oncomplete=ok;t.onerror=ok;});}};
const DOCS=()=>D.docs||(D.docs=[]);
const docsFor=(scope,ref)=>DOCS().filter(d=>d.scope===scope&&d.ref===ref).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
const kindOf=n=>{const e=(String(n).split(".").pop()||"").toLowerCase();return e==="pdf"?"PDF":["doc","docx"].includes(e)?"Word":["xls","xlsx","csv"].includes(e)?"Excel":["jpg","jpeg","png","heic"].includes(e)?L("Bild","Image"):e.toUpperCase();};
const fsize=b=>b>=1048576?(b/1048576).toFixed(1).replace(".0","")+" MB":Math.max(1,Math.round(b/1024))+" KB";
function docValid(d){if(!d.until)return null;const n=daysTo(d.until),gs=d.kind==="gs";return n<0?{c:"crit",t:gs?L("Garantie abgelaufen","warranty expired"):L("abgelaufen","expired")}:n<=dkWarnDays(d.kind)?gs?{c:"warn",t:L("Garantie endet in "+n+" "+dayWord(n),"warranty ends in "+n+" days")}:{c:"warn",t:L("läuft ab in "+n+" "+dayWord(n),"expires in "+n+" "+(n===1?"day":"days"))}:{c:"ok",t:L("gültig bis ","valid until ")+fdate(d.until)};}
/* one «···» per document instead of a pencil and a bin on every row: edit and delete sit in its menu, delete with undo */
const docMore=d=>`<button type="button" class="ib dmore" data-act="dmore" data-id="${d.id}" aria-label="${L("Aktionen für ","Actions for ")+esc(d.name)}" aria-haspopup="menu">${ico("more")}</button>`;
function docsBlock(scope,ref,title,hint){
  const rk=d=>{const v=docValid(d);return v?{crit:0,warn:1,ok:2}[v.c]:3;};
  const list=docsFor(scope,ref).filter(d=>!d.dossier&&!d.submitted&&!d.prot).sort((a,b)=>scope==="firm"?rk(a)-rk(b):0);
  const rows=list.map(d=>{const v=docValid(d);return `<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${fsize(d.size||0)} · ${fdate(d.date)}${v?` · <span class="l-${v.c}">${v.t}</span>`:""}</span></button>${docMore(d)}</div>`;}).join("");
  return `<section class="docs"><div class="sh"><h2>${title}</h2><span class="cnt">${list.length}</span><span class="right"><label class="ib" data-tip="${L("Dokumente hinzufügen: PDF, Word, Excel oder Bild, auch mehrere auf einmal","Add documents: PDF, Word, Excel or image, several at once")}" aria-label="${L("Dokument hinzufügen","Add document")}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" data-imp="doc" data-id="${scope}|${ref}"></label></span></div>
    ${rows?`<div class="dlist">${rows}</div>`:`<div class="empty">${hint||L("Noch keine Dokumente. PDF, Word, Excel oder Bilder mit ＋ hinzufügen.","No documents yet. Add PDF, Word, Excel or images with ＋.")}</div>`}</section>`;
}
/* ---------- document kinds: one document is stored once and shows wherever it belongs ----------
   project page: everything of the project, grouped by kind; contractor page: everything of the contractor, grouped by project */
const DKIND={
  av:[["Architektenvertrag","Architect contract"],["Architektenverträge","Architect contracts"]],
  bw:[["Baugesuch / Baubewilligung","Permit application / permit"],["Baubewilligung und Auflagen","Permit and conditions"]],
  gr:[["Plan / Grundlage","Plan / basis"],["Pläne und Grundlagen","Plans and basics"]],
  br:[["Brief / Korrespondenz","Letter"],["Briefe","Letters"]],
  of:[["Offerte","Offer"],["Offerten","Offers"]],
  wv:[["Werkvertrag","Contract"],["Werkverträge","Contracts"]],
  vs:[["Versicherungsnachweis","Insurance certificate"],["Versicherungsnachweise","Insurance certificates"]],
  na:[["Nachtrag","Change order"],["Nachträge","Change orders"]],
  rr:[["Regierapport","Time report"],["Regierapporte","Time reports"]],
  am:[["Ausmass","Measurement"],["Ausmasse","Measurements"]],
  ls:[["Lieferschein","Delivery note"],["Lieferscheine","Delivery notes"]],
  pr:[["Bausitzungsprotokoll","Site meeting minutes"],["Protokolle","Minutes"]],
  bj:[["Baujournal","Site journal"],["Baujournal","Site journal"]],
  ab:[["Abnahmeprotokoll / Mängelliste","Acceptance / defects"],["Abnahmen und Mängel","Acceptance and defects"]],
  gs:[["Garantieschein (Solidarbürgschaft)","Warranty bond"],["Garantiescheine","Warranty bonds"]],
  sr:[["Schlussabrechnung Handwerker","Contractor final account"],["Schlussabrechnungen","Final accounts"]],
  ba:[["Bauabrechnung","Construction account"],["Bauabrechnung","Construction account"]],
  so:[["Sonstiges","Other"],["Sonstiges","Other"]]};
/* the order of work on a building: the choice list is grouped like this so 18 kinds stay easy to scan */
const DK_PHASES=[[["Planung und Bewilligung","Planning and permit"],["av","bw","gr","br"]],[["Vergabe","Award"],["of","wv","vs"]],
  [["Ausführung","Construction"],["na","rr","am","ls","pr","bj"]],[["Abschluss und Garantie","Completion and warranty"],["ab","gs","sr","ba"]],[["Weiteres","More"],["so"]]];
const DK_ORDER=DK_PHASES.flatMap(g=>g[1]),DK_WITH_K=["of","wv","vs","na","rr","am","ls","ab","gs","sr"],DK_UNTIL=["gs","vs"];
const dkName=(k,pl)=>L(...DKIND[DKIND[k]?k:"so"][pl?1:0]);
const dkShort=k=>dkName(k).replace(/ \(.*\)| \/.*/,"");
const dkOptions=sel=>DK_PHASES.map(([g,ks])=>`<optgroup label="${esc(L(...g))}">${ks.map(k=>`<option value="${k}"${k===sel?" selected":""}>${esc(dkName(k))}</option>`).join("")}</optgroup>`).join("");
/* warranty bonds warn earlier: defects must be reported before the warranty ends */
const dkWarnDays=k=>k==="gs"?60:30;
function guessDocKind(name){const n=String(name||"").toLowerCase();
  return /architektenvertrag|planervertrag|sia.?102/.test(n)?"av":/garantieschein|bürgschaft|buergschaft|garantie/.test(n)?"gs":/nachtrag/.test(n)?"na":/schlussabrechnung/.test(n)?"sr":/bauabrechnung/.test(n)?"ba":
    /baujournal|bautagebuch/.test(n)?"bj":/versicherung/.test(n)?"vs":/werkvertrag|vertrag/.test(n)?"wv":/offerte|angebot/.test(n)?"of":/rapport|regie|stunden/.test(n)?"rr":/ausmass|massurkunde/.test(n)?"am":/lieferschein/.test(n)?"ls":
    /abnahme|mängel|maengel/.test(n)?"ab":/protokoll|sitzung/.test(n)?"pr":/baugesuch|bewilligung|auflage|verfügung/.test(n)?"bw":/brief|bauamt/.test(n)?"br":/plan|kostenvoranschlag|grundlage|kv/.test(n)?"gr":"so";}
const docKind=d=>d.kind||guessDocKind(d.name);
const docsOfProject=pid=>DOCS().filter(d=>(d.scope==="project"&&d.ref===pid)||(d.scope==="doc"&&d.pid===pid)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
const docsOfContractor=kid=>DOCS().filter(d=>(d.scope==="contractor"&&d.ref===kid)||(d.scope==="doc"&&d.kid===kid)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
function docRow(d){const v=docValid(d);return `<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${fsize(d.size||0)} · ${fdate(d.date)}${d.pages>1?" · "+d.pages+L(" Seiten"," pages"):""}${v?` · <span class="l-${v.c}">${v.t}</span>`:""}</span></button>${docMore(d)}</div>`;}
/* grouped list: by kind on the project, by project on the contractor */
function docsGrouped(scope,ref,title,hint){
  const list=scope==="project"?docsOfProject(ref):docsOfContractor(ref);
  let groups;
  if(scope==="project")groups=DK_ORDER.map(k=>[dkName(k,1),list.filter(d=>docKind(d)===k)]).filter(g=>g[1].length);
  else{const pids=[...new Set(list.map(d=>d.pid||""))];groups=pids.map(pid=>[pid&&PJ(pid)?PJ(pid).name:L("Ohne Projekt","No project"),list.filter(d=>(d.pid||"")===pid)]).sort((a,b)=>a[0]===L("Ohne Projekt","No project")?1:b[0]===L("Ohne Projekt","No project")?-1:0);}
  const body=groups.map(([g,ds])=>`<div class="dgrp"><span>${esc(g)}</span><span class="cnt">${ds.length}</span></div><div class="dlist">${ds.map(docRow).join("")}</div>`).join("");
  return `<section class="docs"><div class="sh"><h2>${title}</h2><span class="cnt">${list.length}</span><span class="right"><button type="button" class="ib dscbtn" data-act="dscan" ${scope==="project"?`data-pid="${esc(ref)}"`:`data-kid="${esc(ref)}"`} aria-label="${L("Dokument scannen","Scan document")}" data-tip="${L("Papier mit der Handykamera scannen und hier ablegen","Scan paper with the phone camera and file it here")}">${navIco("scan")}</button><label class="ib" data-tip="${L("Dokumente hinzufügen: PDF, Word, Excel oder Bild, auch mehrere auf einmal.","Add documents: PDF, Word, Excel or image, several at once.")}" aria-label="${L("Dokument hinzufügen","Add document")}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" data-imp="doc" data-id="${scope}|${ref}"></label></span></div>
    ${body||`<div class="empty">${hint}</div>`}</section>`;
}
async function addDocs(files,key){
  let [scope,ref]=key.split("|");let n=0;const dossier=scope==="tdos",flag={tsub:{submitted:true},tsub1:{submitted:true,phase:1},tprot:{prot:true}}[scope];if(dossier||flag)scope="tender";
  for(const f of files){const id=newId("f");await FDB.put(id,f);const d={id,scope,ref,name:f.name,type:f.type,size:f.size,date:iso(TODAY)};if(scope==="project"||scope==="contractor")d.kind=guessDocKind(f.name);if(dossier)d.dossier=true;if(flag)Object.assign(d,flag);DOCS().push(d);n++;}
  render();toast(n===1?L("Dokument gespeichert","Document saved"):n+L(" Dokumente gespeichert"," documents saved"));
}
async function openDoc(id){
  const d=DOCS().find(x=>x.id===id),b=d&&await FDB.get(id);
  if(!b)return toast(L("Datei ist auf diesem Gerät nicht vorhanden.","File is not on this device."));
  const url=URL.createObjectURL(b.type?b:new Blob([b],{type:d.type||"application/octet-stream"}));
  if(/pdf|image/.test(d.type||"")){const w=window.open(url,"_blank");if(!w)saveBlob(d.name,b);}else saveBlob(d.name,b);
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
/* tiny one-page PDF for example documents */
function samplePdf(lines){
  const esc_=s=>String(s).replace(/[\\()]/g,m=>"\\"+m).replace(/[^\x20-\x7e]/g,c=>({"ä":"a","ö":"o","ü":"u","Ä":"A","Ö":"O","Ü":"U","é":"e","è":"e","à":"a","·":"-","’":"'"}[c]||"?"));
  const txt="BT /F1 18 Tf 60 760 Td ("+esc_(lines[0])+") Tj /F1 11 Tf "+lines.slice(1).map(l=>"0 -22 Td ("+esc_(l)+") Tj").join(" ")+" ET";
  const objs=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>","<< /Length "+txt.length+" >>\nstream\n"+txt+"\nendstream","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let out="%PDF-1.4\n";const off=[];objs.forEach((o,i)=>{off.push(out.length);out+=(i+1)+" 0 obj\n"+o+"\nendobj\n";});
  const x=out.length;out+="xref\n0 "+(objs.length+1)+"\n0000000000 65535 f \n"+off.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")+"trailer\n<< /Size "+(objs.length+1)+" /Root 1 0 R >>\nstartxref\n"+x+"\n%%EOF";
  return new Blob([out],{type:"application/pdf"});
}
/* example: a warranty bond running out and an insurance certificate, so the deadlines show under «Zu erledigen» */
/* example: a tender dossier PDF for two tenders, with qualification and award criteria as in a real dossier */
async function addDossiers(){
  for(const t of (D.tenders||[]).filter(x=>["t1","t2"].includes(x.id))){
    if(DOCS().some(d=>d.scope==="tender"&&d.ref===t.id&&d.dossier))continue;
    const lines=["Ausschreibungsunterlagen",tx(t.title),t.client||"","","6 Eignungskriterien"].concat((t.reqs||[]).map((r,i)=>"EK "+(i+1)+": "+evalReq(r).t),["","7 Zuschlagskriterien"],(t.zk||[]).map((z,i)=>"ZK "+(i+1)+": "+z.t+" "+z.w+" %"));
    const b=samplePdf(lines.concat(["","Beispieldokument, fiktive Daten."]));const id=newId("f");await FDB.put(id,b);
    DOCS().push({id,scope:"tender",ref:t.id,dossier:true,name:"Ausschreibungsunterlagen "+tx(t.title)+".pdf",type:"application/pdf",size:b.size,date:addDays(iso(TODAY),-10)});}
  saveData();
}
async function addDocs3(){
  const ad=n=>addDays(iso(TODAY),n),p1=D.projects.find(p=>p.id==="p1")||D.projects[0];if(!p1)return;
  const onP=nm=>D.contractors.find(c=>c.name.startsWith(nm)&&D.contracts.some(w=>w.k===c.id&&w.pid===p1.id))||D.contractors.find(c=>D.contracts.some(w=>w.k===c.id&&w.pid===p1.id));
  const mk=async(k,kind,name,lines,date,until)=>{if(!k)return;const b=samplePdf(lines.concat(["","Beispieldokument, fiktive Daten."]));const id=newId("f");await FDB.put(id,b);
    DOCS().push({id,scope:"doc",ref:p1.id,pid:p1.id,kid:k.id,kind,name,type:"application/pdf",size:b.size,date:ad(date),until:until==null?null:ad(until)});};
  const f=onP("Fenster"),m=onP("Meier");
  await mk(f,"gs","Garantieschein "+(f&&f.name)+".pdf",["Garantieschein (Solidarbuergschaft)",(f&&f.name)||"","Haftungsbetrag: 10 % der Vertragssumme","Dauer: 2 Jahre ab Abnahme"],-685,45);
  if(m&&m!==f)await mk(m,"vs","Versicherungsnachweis "+m.name+".pdf",["Versicherungsnachweis Betriebshaftpflicht",m.name],-350,12);
  await mk(f,"na","Nachtrag 1 "+(f&&f.name)+".pdf",["Nachtrag 1","Zusaetzliche Fensterbaenke Nordfassade",(f&&f.name)||""],-60);
  saveData();
}
async function addDemoDocs(){
  const ad=n=>addDays(iso(TODAY),n),F=D.firm.name||"Beispiel Architekten GmbH";
  const mk=async(scope,ref,name,lines,date,until)=>{const b=samplePdf(lines.concat(["","Beispieldokument, fiktive Daten."]));const id=newId("f");await FDB.put(id,b);DOCS().push({id,scope,ref,name,type:"application/pdf",size:b.size,date:ad(date),until:until===undefined?null:ad(until)});};
  await mk("firm","firm","Handelsregisterauszug.pdf",["Handelsregisterauszug",F],-95,-5);
  await mk("firm","firm","Versicherungsnachweis Berufshaftpflicht.pdf",["Versicherungsnachweis",F],-160,205);
  await mk("firm","firm","Bestätigung AHV-Beiträge.pdf",["Bestaetigung AHV-Beitraege",F],-340,20);
  await mk("firm","firm","Referenzliste 2026.pdf",["Referenzliste 2026",F],-40);
  await mk("firm","firm","Firmenporträt.pdf",["Firmenportraet",F],-200);
  const p1=D.projects[0];if(p1){await mk("project",p1.id,"Baubewilligung.pdf",["Baubewilligung",p1.name],-230);await mk("project",p1.id,"Kostenvoranschlag.pdf",["Kostenvoranschlag",p1.name],-260);}
  const kon=(nm,files)=>{const k=D.contractors.find(c=>c.name.startsWith(nm));return k?files.map(f=>mk("contractor",k.id,f[0],[f[1],k.name],f[2])):[];};
  for(const p of [...kon("Meier",[["Offerte Malerarbeiten.pdf","Offerte Malerarbeiten",-150]]),...kon("Fenster",[["Offerte Fenster.pdf","Offerte Fenster und Aussentueren",-210],["Werkvertrag BKP 221.pdf","Werkvertrag BKP 221",-190]])]) await p;
  const t=D.tenders[0];if(t){await mk("tender",t.id,"Ausschreibungsunterlagen.pdf",["Ausschreibungsunterlagen",tx(t.title)],-10);await mk("tender",t.id,"Fragen und Antworten.pdf",["Fragen und Antworten",tx(t.title)],-3);}
}
/* ---------- example: a submitted tender with the full dossier ----------
   Documents follow what Zurich procurement asks of planners: bid form with company details, self-declaration,
   proof of taxes and social contributions, commercial and debt-enforcement register extracts, references,
   key people, fee offer, task analysis and approach, liability insurance. All data fictional. */
function tenderDocPdf(title,sub,blocks,o){
  const {jsPDF}=window.jspdf,a3=o&&o.a3,doc=new jsPDF({unit:"mm",format:a3?"a3":"a4",orientation:a3?"landscape":"portrait"}),F=D.firm||{},W0=a3?420:210,H0=a3?297:297,R=W0-20;
  const T=(t,x,y,op)=>doc.text(String(t),x,y,op||{}),font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);};
  let y=20;font(9,true);T(F.name||"Beispiel Architekten GmbH",20,y);font(8);T([F.street,[F.zip,F.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),20,y+4.5);
  font(8);doc.setTextColor(110);T(L("Beispieldokument, fiktive Daten","Example document, fictional data"),R,y,{align:"right"});doc.setTextColor(20);
  y=38;font(a3?20:15,true);T(title,20,y);font(9);doc.setTextColor(90);T(sub,20,y+6.5);doc.setTextColor(20);y+=18;
  const colW=a3?(W0-50)/2:170;let x=20,top=y;
  blocks.forEach(b=>{
    const need=(b.lines?b.lines.length*5:0)+(b.table?b.table.length*5.6:0)+10;
    if(y+need>H0-30){if(a3&&x===20){x=20+colW+10;y=top;}else{doc.addPage();y=20;x=20;top=y;}}
    if(b.h){font(10.5,true);T(b.h,x,y);y+=6;}
    if(b.lines){font(9);b.lines.forEach(l=>{doc.splitTextToSize(l,colW).forEach(ln=>{T(ln,x,y);y+=4.6;});});y+=3;}
    if(b.table){b.table.forEach((r,n)=>{font(9,n===b.table.length-1&&b.sum);T(r[0],x,y);if(r[1]!=null)T(String(r[1]),x+colW,y,{align:"right"});y+=5.4;});doc.setLineWidth(.15);doc.line(x,y-3.6,x+colW,y-3.6);y+=4;}
  });
  if(o&&o.sign){y=Math.max(y+8,H0-48);font(9);T((F.city||"Wädenswil")+", "+fdate(o.date),20,y);const s0=signer(0).name||"Andrea Keller",s1=signer(1).name||"Marco Brunner";
    doc.line(20,y+18,85,y+18);doc.line(110,y+18,175,y+18);font(8.5);T(s0,20,y+22.5);T(s1,110,y+22.5);font(7.5);doc.setTextColor(110);T(L("Rechtsgültige Unterschrift","Authorised signature"),20,y+26);T(L("Rechtsgültige Unterschrift","Authorised signature"),110,y+26);doc.setTextColor(20);}
  return doc.output("blob");
}
async function seedSubmittedTender(){
  if(!D.example||!D.tenders||D.tenders.some(t=>t.id==="t5"))return;
  await libsPDF();
  const ad=n=>addDays(iso(TODAY),n),sub=ad(-3),F=D.firm||{},tm=(D.office||{}).team||[],r1=(D.office.refs||[]).find(r=>r.id==="r1"),r3=(D.office.refs||[]).find(r=>r.id==="r3");
  const t={id:"t5",title:{de:"Gesamtsanierung Schulhaus Dorf",en:"Full refurbishment, village school"},client:"Gemeinde Rüschlikon, Liegenschaften",proc:"offen",phases:"31–53",cost:3.4,qDue:ad(-24),due:ad(-2),sub,status:"eingereicht",subAt:"14:32",subForm:"simap",sig:"qes",
    reqs:[{k:"refs",n:2,since:2016,minCost:2.5,pub:true,types:["schule"]},{k:"team",tag:"pl"},{k:"disc",need:["291"]}],
    docs:[{id:"d9",de:"Angebotsformular mit Angaben zur Unternehmung",en:"Bid form with company details",file:"01 Angebotsformular.pdf"},{id:"d3",auto:"self",file:"02 Selbstdeklaration.pdf"},
      {id:"d7",de:"Nachweis Steuern und Sozialabgaben",en:"Proof of taxes and social contributions",file:"03 Nachweis Steuern und Sozialabgaben.pdf"},{id:"d8",de:"Handelsregisterauszug",en:"Commercial register extract",file:"04 Handelsregisterauszug.pdf"},
      {id:"d10",de:"Betreibungsregisterauszug (max. 3 Monate alt)",en:"Debt enforcement register extract (max. 3 months)",file:"05 Betreibungsregisterauszug.pdf"},{id:"d11",de:"Nachweis Berufshaftpflichtversicherung",en:"Professional liability insurance",file:"06 Berufshaftpflicht.pdf"},
      {id:"d1",auto:"refs",file:"07 Referenzblätter.pdf"},{id:"d2",auto:"team",file:"08 Schlüsselpersonen.pdf"},{id:"d6",de:"Honorarofferte (Honorarparameter SIA 102)",en:"Fee offer (SIA 102 parameters)",file:"09 Honorarofferte.pdf"},
      {id:"d4",de:"Auftragsanalyse und Vorgehensvorschlag (2 A3)",en:"Task analysis and approach (2 A3)",file:"10 Auftragsanalyse und Vorgehen A3.pdf"}],
    done:{d9:true,d3:true,d7:true,d8:true,d10:true,d11:true,d6:true,d4:true}};
  D.tenders.push(t);
  /* fee offer arithmetic, computed so every total adds up */
  const H={base:r2(2680*138)};H.disc=r2(H.base*.03);H.nk=r2((H.base-H.disc)*.03);H.net=r2(H.base-H.disc+H.nk);H.vat=r2(H.net*.081);H.tot=r2(H.net+H.vat);
  const T0="Gesamtsanierung Schulhaus Dorf · Gemeinde Rüschlikon",uid="CHE-412.587.903",m=n=>tm[n]||{},nm=n=>m(n).name||["Andrea Keller","Marco Brunner","Lea Hofmann"][n];
  const files=[
    ["01 Angebotsformular.pdf",tenderDocPdf("Angebotsformular",T0,[{h:"Anbieterin",table:[["Firma",F.name||"Beispiel Architekten GmbH"],["Adresse",[F.street,[F.zip,F.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")],["Rechtsform","GmbH, gegründet 2009"],["UID",uid],["MWST-Nummer",F.vatNo||uid+" MWST"],["Ansprechperson",nm(0)+", "+(F.email||"info@beispiel-architekten.example")]]},
      {h:"Angaben zur Unternehmung",table:[["Mitarbeitende","8 (7,2 Vollzeitstellen)"],["Davon in Ausbildung (Lernende)","1 Zeichnerin EFZ Architektur"],["Umsatz Durchschnitt 3 Jahre","CHF 1,6 Mio."],["Berufshaftpflicht","CHF 5 Mio. Personen- und Sachschäden"]]},
      {h:"Angebot",table:[["Leistungen","Architekturleistungen SIA 102, Teilphasen 31–53"],["Honorar gemäss Honorarofferte, inkl. MWST","CHF "+nf2.format(H.tot)],["Gültigkeit des Angebots","180 Tage ab Eingabe"],["Subplanende","keine"]]},
      {lines:["Die Anbieterin bestätigt, die Ausschreibungsunterlagen vollständig erhalten zu haben, und anerkennt sie als Grundlage des Angebots."]}],{sign:true,date:sub})],
    ["02 Selbstdeklaration.pdf",tenderDocPdf("Selbstdeklaration",T0+" · gemäss Art. 12 und 26 IVöB",[{lines:["Die Anbieterin bestätigt mit ihrer Unterschrift, dass sie:"]},
      {table:[["die Arbeitsschutzbestimmungen und Arbeitsbedingungen einhält","ja"],["die Melde- und Bewilligungspflichten (BGSA) einhält","ja"],["die Lohngleichheit von Frau und Mann einhält (Logib-Analyse 2025)","ja"],["das Umweltrecht einhält","ja"],["die Regeln zur Vermeidung von Korruption einhält","ja"],["Steuern und Sozialabgaben bezahlt hat","ja"],["keine Abreden getroffen hat, die den Wettbewerb beeinträchtigen","ja"]]},
      {lines:["Falsche Angaben können zum Ausschluss vom Verfahren, zum Widerruf des Zuschlags und zu Sanktionen nach Art. 44 und 45 IVöB führen."]}],{sign:true,date:sub})],
    ["03 Nachweis Steuern und Sozialabgaben.pdf",tenderDocPdf("Nachweis Steuern und Sozialabgaben",T0,[{table:[["AHV/IV/EO/ALV, Ausgleichskasse Zürich","bezahlt, Bestätigung vom "+fdate(ad(-21))],["Berufliche Vorsorge (BVG)","bezahlt, Bestätigung vom "+fdate(ad(-25))],["Unfallversicherung (UVG)","bezahlt, Bestätigung vom "+fdate(ad(-25))],["Staats- und Gemeindesteuern","bezahlt, Bestätigung vom "+fdate(ad(-30))],["Mehrwertsteuer","bezahlt, Bestätigung vom "+fdate(ad(-30))]]},{lines:["Die einzelnen Bestätigungen der Auskunftsstellen liegen bei."]}])],
    ["04 Handelsregisterauszug.pdf",tenderDocPdf("Handelsregisterauszug",(F.name||"Beispiel Architekten GmbH")+" · Kanton Zürich",[{table:[["Firma",F.name||"Beispiel Architekten GmbH"],["UID",uid],["Sitz",F.city||"Wädenswil"],["Rechtsform","Gesellschaft mit beschränkter Haftung"],["Zweck","Planung und Realisierung von Hochbauten, Architektur und Bauleitung"],["Zeichnungsberechtigt",nm(0)+", "+nm(2)+", je kollektiv zu zweien"],["Auszug vom",fdate(ad(-20))]]}])],
    ["05 Betreibungsregisterauszug.pdf",tenderDocPdf("Betreibungsregisterauszug",(F.name||"Beispiel Architekten GmbH")+" · Betreibungsamt "+(F.city||"Wädenswil"),[{table:[["Betreibungen in den letzten 5 Jahren","keine"],["Verlustscheine","keine"],["Konkurseröffnungen","keine"],["Auszug vom",fdate(ad(-18))+" (weniger als 3 Monate alt)"]]}])],
    ["06 Berufshaftpflicht.pdf",tenderDocPdf("Nachweis Berufshaftpflichtversicherung",(F.name||"Beispiel Architekten GmbH"),[{table:[["Versicherung","Bauversicherung Zürichsee AG"],["Police","BH-2026-48812"],["Deckung Personen- und Sachschäden","CHF 5'000'000"],["Deckung Vermögensschäden","CHF 1'000'000"],["Gültig bis","31.12.2027"]]}])],
    ["07 Referenzblätter.pdf",tenderDocPdf("Referenzblätter",T0+" · Eignungskriterium Referenzen",[r1,r3].filter(Boolean).map((r,n)=>({h:(n+1)+". "+tx(r),table:[["Bauherrschaft",r.client+" (öffentlich)"],["Fertigstellung",String(r.year)],["Baukosten BKP 1–9","CHF "+String(r.cost).replace(".",",")+" Mio."],["Erbrachte Teilphasen SIA 102",r.phases],["Projektleitung",nm(0)],["Auskunftsperson","Leiter Liegenschaften, Tel. 044 000 00 0"+(n+1)]]})))],
    ["08 Schlüsselpersonen.pdf",tenderDocPdf("Schlüsselpersonen",T0,[0,1].map(n=>({h:(n?"Bauleitung: ":"Projektleitung: ")+nm(n),lines:[(m(n).qual||(n?"Bauleiter Hochbau mit eidg. Fachausweis":"dipl. Architekt FH"))+", "+(n?"12":"18")+" Jahre Berufserfahrung.",n?"Bauleitung bei «Erweiterung Schulhaus, Horgen» und «Instandsetzung Wohnsiedlung, Thalwil». Erfahrung mit Bauen im laufenden Schulbetrieb.":"Projektleitung bei «Erweiterung Schulhaus, Horgen» und «Neubau Doppelkindergarten, Adliswil». Verfügbarkeit für dieses Projekt: 60 %."]})))],
    ["09 Honorarofferte.pdf",tenderDocPdf("Honorarofferte",T0+" · Honorarparameter gemäss SIA 102",[{h:"Parameter",table:[["Mittlerer Stundenansatz","CHF 138.00"],["Teamfaktor","1,0"],["Anpassungsfaktor","1,0"],["Rabatt","3 %"]]},
      {h:"Aufwandschätzung",table:[["31 Vorprojekt","260 h"],["32 Bauprojekt","540 h"],["33 Bewilligungsverfahren","90 h"],["41 Ausschreibung","430 h"],["51 Ausführungsprojekt","380 h"],["52 Ausführung","860 h"],["53 Inbetriebnahme, Abschluss","120 h"],["Total","2'680 h"]],sum:true},
      {h:"Honorar",table:[["2'680 h × CHF 138.00","CHF "+nf2.format(H.base)],["Rabatt 3 %","CHF -"+nf2.format(H.disc)],["Nebenkosten 3 %","CHF "+nf2.format(H.nk)],["Total exkl. MWST","CHF "+nf2.format(H.net)],["MWST 8,1 %","CHF "+nf2.format(H.vat)],["Total inkl. MWST","CHF "+nf2.format(H.tot)]],sum:true}],{sign:true,date:sub})],
    ["10 Auftragsanalyse und Vorgehen A3.pdf",tenderDocPdf("Auftragsanalyse und Vorgehensvorschlag",T0,[
      {h:"Aufgabenverständnis",lines:["Das Schulhaus aus dem Jahr 1964 wird gesamtsaniert: Gebäudehülle, Haustechnik, Erdbebenertüchtigung und hindernisfreier Zugang. Die Schule bleibt während der Bauzeit in Betrieb.","Ziel: Betriebsunterbrüche minimal halten, Kosten von CHF 3,4 Mio. einhalten, Bausubstanz und Charakter erhalten."]},
      {h:"Vorgehen",lines:["1. Zustandsaufnahme und Schadstoffuntersuchung vor dem Vorprojekt.","2. Etappierung nach Trakten, laute Arbeiten in den Schulferien.","3. Provisorien für zwei Klassenzimmer während der Etappe Ost.","4. Kostensteuerung mit Kostenvoranschlag ±10 % am Ende des Bauprojekts."]},
      {h:"Termine",lines:["Vorprojekt und Bauprojekt: Januar bis Juli 2027","Bewilligung: August bis Oktober 2027","Ausführung in drei Etappen: Sommerferien 2028 bis Herbstferien 2029"]},
      {h:"Risiken und Massnahmen",lines:["Schadstoffe (Asbest, PCB): frühe Untersuchung, Reserve 5 % im Kostenvoranschlag.","Laufender Schulbetrieb: Abstimmung mit Schulleitung vor jeder Etappe, Lärmplan.","Lieferfristen Fenster: Ausschreibung vorgezogen, Bestellung vor Baubeginn."]},
      {h:"Projektorganisation",lines:["Projektleitung: "+nm(0)+", Bauleitung: "+nm(1)+", Mitarbeit Planung: "+nm(2)+".","Fachplanende nach Wahl der Bauherrschaft, Koordination durch die Gesamtleitung."]}],{a3:true})],
    ["Eingangsbestätigung Eingabe.pdf",tenderDocPdf("Eingangsbestätigung",T0,[{table:[["Angebot von",F.name||"Beispiel Architekten GmbH"],["Eingegangen am",fdate(sub)+", 14:32 Uhr"],["Eingabefrist",fdate(ad(-2))+", 12:00 Uhr"],["Anzahl Dateien","10"],["Status","fristgerecht eingegangen"]]},{lines:["Diese Bestätigung wurde automatisch erstellt. Über den Zuschlag werden alle Anbietenden schriftlich informiert."]}])]];
  for(const [name,blob] of files){const id=newId("f");await FDB.put(id,blob);DOCS().push({id,scope:"tender",ref:"t5",name,type:"application/pdf",size:blob.size,date:name.startsWith("Eingang")?sub:ad(-4),submitted:true});}
  t.res={own:H.tot};saveData();
}
function runMigrations(){
  if(!D)return;D.mig=D.mig||{};
  if(!D.mig.ret0){D.mig.ret0=1;if(D.example){D.contracts.forEach(w=>{if(/^w\d$/.test(w.id)&&w.ret===10)w.ret=0;});if(D.settings&&D.settings.ret===10)delete D.settings.ret;}}
  if(!D.mig.bkpgrp){D.mig.bkpgrp=1;const p1=D.example&&D.projects.find(p=>p.id==="p1");if(p1&&p1.budget){EX_BKP_EXTRA.forEach(([bkp,de,en,kv])=>{if(!p1.budget.some(b=>b.bkp===bkp))p1.budget.push({bkp,de,en,kv});});p1.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));}}
  if(!D.mig.team2&&D.office){D.mig.team2=1;const Y=YNOW(),names=["Andrea Keller","Marco Brunner","Lea Hofmann","Simon Frei","Nina Graf"];
    D.office.team=D.office.team.map((m,i)=>{if(m.career)return m;const r=/Bauleiter/.test(m.role&&m.role.de)?"bl":/Projektleiter/.test(m.role&&m.role.de)?"pl":"arch",here=Math.min(m.years||1,r==="arch"?m.years:8);
      const career=[{role:r,firm:D.firm.name||L("Eigenes Büro","Own office"),from:Y-here+1,to:null}];
      if((m.years||0)>here)career.push({role:r==="pl"?"arch":r,firm:r==="bl"?"Muster Bau AG":"Atelier Weber AG",from:Y-m.years+1,to:Y-here});
      return {id:"m"+(i+1),name:names[i]||L("Person ","Person ")+(i+1),qual:m.qual||"",extra:(m.tags||[]).map(t=>t==="bl"?"blfa":"pub"),career};});
    (D.office.refs||[]).forEach((r,i)=>{if(!r.id)r.id="r"+(i+1);});}
  if(!D.example)return;
  if(!D.mig.docs){D.mig.docs=1;if(!DOCS().length&&window.indexedDB)addDemoDocs().then(render).catch(()=>{});}
  if(!D.mig.fees){if(!(D.fees||[]).length)addDemoFees();D.mig.fees=1;}
  if(!D.mig.income){addIncomeHistory();D.mig.income=1;}
  if(!D.mig.fillEmpty){D.mig.fillEmpty=1;D.projects.filter(p=>!p.closed&&!D.contracts.some(w=>w.pid===p.id)&&!FEES().some(f=>f.pid===p.id)).forEach(seedProjectDemo);}
  if(!D.mig.projs){D.mig.projs=1;[["Umbau Villa Seeblick","Küsnacht","M. und S. Keller","Sanierung Gebäudehülle"],["Anbau Schulhaus Au","Wädenswil","Gemeinde Wädenswil","Erweiterung um 2 Klassenzimmer"]].forEach(([n,pl,cl,de])=>{if(!D.projects.some(p=>p.name===n))D.projects.push({id:newId("p"),name:n,place:pl,client:cl,desc:de,closed:true,budget:[]});});}
  if(!D.mig.closedDemo){D.mig.closedDemo=1;const pa=D.example&&D.projects.find(p=>p.name==="Anbau Schulhaus Au"&&p.closed);if(pa&&!D.contracts.some(w=>w.pid===pa.id))seedClosedDemo(pa);}
  if(!D.mig.closedFees){D.mig.closedFees=1;const pa=D.example&&D.projects.find(p=>p.name==="Anbau Schulhaus Au"&&p.closed);if(pa&&D.contracts.some(w=>w.pid===pa.id)&&!D.contracts.some(w=>w.pid===pa.id&&w.bkp==="511"))seedClosedFees(pa);}
  /* example data: the second closed project has contracts, invoices and fees too, so no tile is empty */
  if(!D.mig.villaDemo){D.mig.villaDemo=1;const pv=D.example&&D.projects.find(p=>p.name==="Umbau Villa Seeblick"&&p.closed);if(pv&&!D.contracts.some(w=>w.pid===pv.id))seedVillaDemo(pv);}
  /* example data: cost estimate names outside BKP 2 (112 Demolition, 421 Garden works) exist in English too */
  if(!D.mig.bkpEn){D.mig.bkpEn=1;D.projects.forEach(p=>(p.budget||[]).forEach(b=>{const s=EX_BKP_EXTRA.find(x=>x[0]===b.bkp);if(s&&b.de===s[1]&&(!b.en||b.en===b.de))b.en=s[2];}));}
  /* contractor documents get their project when the contractor works on exactly one, so they also show on that project */
  if(!D.mig.docs2){D.mig.docs2=1;DOCS().forEach(d=>{if(d.scope!=="contractor")return;const ps=[...new Set(D.contracts.filter(w=>w.k===d.ref).map(w=>w.pid))];d.kind=d.kind||guessDocKind(d.name);if(ps.length===1){d.scope="doc";d.kid=d.ref;d.pid=ps[0];d.ref=ps[0];}});}
  if(!D.mig.docs3){D.mig.docs3=1;DOCS().forEach(d=>{if(d.kind==="br"&&/baugesuch|bewilligung|auflage/i.test(d.name))d.kind="bw";});
    if(D.example&&window.indexedDB)addDocs3().then(render).catch(e=>console.error(e));}
  if(!D.mig.tzk){D.mig.tzk=1;if(D.example){
    const Z={t1:[["analyse",35],["team",25],["ref",15],["preis",25]],t2:[["analyse",30],["team",20],["ref",20],["preis",30]],t3:[["analyse",40],["team",20],["ref",10],["preis",30]],t4:[["analyse",30],["team",30],["ref",20],["preis",20]]};
    const ME={t1:["m","s","s","m"],t2:["s","s","m","w"]};
    (D.tenders||[]).forEach(t=>{if(!t.src)t.src={url:"https://www.simap.ch",id:L("Beispiel","Example")};
      if(!t.zk&&Z[t.id])t.zk=Z[t.id].map(([typ,w],i)=>({typ,t:L(...ZKT[typ]),w,me:(ME[t.id]||[])[i]||""}));
      (t.reqs||[]).forEach((r,i)=>{if(!r.src)r.src=L("Dossier, Kap. 6 Eignungskriterien, EK ","Dossier, ch. 6 qualification criteria, EK ")+(i+1);});});
    if(window.indexedDB)addDossiers().then(render).catch(e=>console.error(e));}}
  if(!D.mig.subT){D.mig.subT=1;if(D.example&&window.indexedDB)seedSubmittedTender().then(render).catch(e=>console.error(e));}
  if(!D.mig.sig){D.mig.sig=1;if(D.example){D.firm.sigRule=D.firm.sigRule||"kollektiv2";const m1=((D.office||{}).team||[])[0];if(m1){m1.extra=m1.extra||[];if(!m1.extra.includes("qes"))m1.extra.push("qes");}
    const S_={t1:"qes",t2:"qes",t3:"scan",t4:"qes",t5:"qes",t6:"qes",t7:"qes",t8:"papier"};(D.tenders||[]).forEach(t=>{if(!t.sig&&S_[t.id])t.sig=S_[t.id];});}}
  if(!D.mig.crew){D.mig.crew=1;if(D.example)seedCrews();}
  if(!D.mig.bids){D.mig.bids=1;if(D.example&&window.indexedDB)seedBids().then(render).catch(e=>console.error(e));}
  /* example data: the weighted qualification criteria of t2 are all assessed, so every criterion shows its rating */
  if(!D.mig.gekDemo){D.mig.gekDemo=1;if(D.example)(D.tenders||[]).filter(x=>x.id==="t2").forEach(x=>(x.gek||[]).forEach(z=>{if(!z.me)z.me="w";}));}
  if(!D.mig.closedMail){D.mig.closedMail=1;if(D.example)[["Gemeinde Wädenswil, Bauamt","bauamt@waedenswil.example"],["Bauversicherung Zürichsee AG","schaden@bauversicherung-zs.example"]].forEach(([n,e])=>{const k=D.contractors.find(x=>x.name===n);if(k&&!k.email)k.email=e;});}
  /* signatures point to people in the office team: name and title are kept once, in the team */
  if(!D.mig.kvr){D.mig.kvr=1;const p0=D.example&&(D.projects||[]).find(p=>p.id==="p1"),b=p0&&(p0.budget||[]).find(x=>x.bkp==="285");if(b&&b.kvr==null&&b.kv===36000)b.kvr=41000;}
  if(!D.mig.signers3){D.mig.signers3=1;const G=(D.firm||{}).signers;if(D.example&&G&&G[1]&&G[1].m==="m3"&&G[1].role==="Mitglied der Geschäftsleitung"&&((D.office||{}).team||[]).some(m=>m.id==="m2"))G[1]={m:"m2",role:"Bauleitung"};}
  if(!D.mig.signers2){D.mig.signers2=1;const F=D.firm||(D.firm={}),O=D.office||(D.office={team:[]});O.team=O.team||[];
    const ex=D.example&&/Beispiel Architekten|Example Architects/.test(F.name||"");
    const old=F.signers||[F.sig1,F.sig2].filter(Boolean).map(x=>{const [n,...r]=String(x).split(",");return {name:n.trim(),title:"",role:r.join(",").trim()};});
    if(ex&&O.team.some(m=>m.id==="m1"))F.signers=[{m:"m1",role:"Projektleiter"},{m:O.team.some(m=>m.id==="m2")?"m2":"",role:"Bauleitung"}];
    else F.signers=old.map(g=>{if(g.m!==undefined)return g;if(!g.name)return {m:"",role:g.role||""};let m=O.team.find(x=>(x.name||"").trim().toLowerCase()===g.name.toLowerCase());
      if(!m){m={id:newId("m"),name:g.name,qual:g.title||"",extra:[],career:[]};O.team.push(m);}else if(!m.qual&&g.title)m.qual=g.title;return {m:m.id,role:g.role||""};});
    delete F.sig1;delete F.sig2;}
  /* example data: every open example project shows at least one invoice with «Rückfrage» and one «Freigegeben» */
  if(!D.mig.statusDemo){D.mig.statusDemo=1;if(D.example)D.projects.filter(p=>!p.closed).forEach(p=>{
    const ws=D.contracts.filter(w=>w.pid===p.id&&!D.invoices.some(i=>i.w===w.id&&i.type==="schluss"));if(!ws.length)return;
    const has=st=>D.invoices.some(i=>i.status===st&&ws.some(w=>w.id===i.w));
    const add=(w,st,day,why)=>{const n=D.invoices.filter(i=>i.w===w.id&&i.type==="akonto").length+1,no="AK-"+String(700+D.invoices.length),r=makeRef(no),gross=Math.max(1000,Math.round(w.sum*0.2/1000)*1000);
      const i={id:newId("i"),no,w:w.id,type:"akonto",n,date:addDays(iso(TODAY),day),due:addDays(iso(TODAY),day+30),gross,status:st,ref:r.ref,log:[{d:addDays(iso(TODAY),day),t:L("Erfasst","Recorded")}]};
      i.log.push({d:addDays(iso(TODAY),day+2),t:st==="rueckfrage"?why:L("Freigegeben","Approved")});D.invoices.push(i);};
    const ok=ws.filter(w=>{const k=D.contractors.find(c=>c.id===w.k)||{};return k.iban&&k.street;}),pool=ok.length?ok:ws,pick=k=>pool[Math.max(0,Math.min(k,pool.length-1))];
    if(!has("rueckfrage"))add(pick(pool.length-1),"rueckfrage",-12,L("Rückfrage gesendet: Ausmass Position 3 fehlt","Query sent: quantity for item 3 missing"));
    if(!has("frei"))add(pick(pool.length-2),"frei",-8);
  });}
  /* example data: every Handwerker tile of an open example project has something to show (retention, billed amount, missing details) */
  if(!D.mig.kwDemo){D.mig.kwDemo=1;if(D.example)D.projects.filter(p=>!p.closed).forEach(p=>{
    const ws=D.contracts.filter(w=>w.pid===p.id);if(!ws.length)return;
    const billed=w=>D.invoices.filter(i=>i.w===w.id&&live(i)&&counted(i)).reduce((a,i)=>a+net(i),0);
    if(!ws.some(w=>billed(w)>0)){const w=ws[0],i=D.invoices.find(i=>i.w===w.id&&i.status==="pruefen");if(i)i.status="bezahlt";}
    
    const ks=[...new Set(ws.map(w=>w.k))].map(id=>D.contractors.find(k=>k.id===id)).filter(Boolean);
    if(ks.length>1&&!ks.some(k=>missingOf(k).length)){const k=ks[ks.length-1];k.iban="";}
  });}
  /* example data: the Rechnungen tiles «Zu prüfen» and «Mahnung fällig» are not empty in any open example project */
  if(!D.mig.invDemo2){D.mig.invDemo2=1;if(D.example)D.projects.filter(p=>!p.closed).forEach(p=>{
    const ws=D.contracts.filter(w=>w.pid===p.id&&!D.invoices.some(i=>i.w===w.id&&i.type==="schluss"));
    if(ws.length&&!D.invoices.some(i=>i.status==="pruefen"&&ws.some(w=>w.id===i.w))){const w=ws.find(w=>{const k=D.contractors.find(c=>c.id===w.k)||{};return k.iban&&k.street;})||ws[0],
      n=D.invoices.filter(i=>i.w===w.id&&i.type==="akonto").length+1,no="AK-"+String(700+D.invoices.length),r=makeRef(no);
      D.invoices.push({id:newId("i"),no,w:w.id,type:"akonto",n,date:addDays(iso(TODAY),-4),due:addDays(iso(TODAY),26),gross:Math.max(1000,Math.round((w.sum||10000)*0.2/1000)*1000),status:"pruefen",ref:r.ref,log:[{d:addDays(iso(TODAY),-4),t:L("Erfasst","Recorded")}]});}
    const fs=FEES().filter(f=>f.pid===p.id);
    if(fs.length&&!fs.some(f=>remDue(f))){const no=(()=>{const y=TODAY.getFullYear(),n=FEES().filter(f=>String(f.no).startsWith(y+"-")).reduce((a,f)=>Math.max(a,parseInt(String(f.no).slice(5),10)||0),0)+1;return y+"-"+String(n).padStart(3,"0");})(),r=makeRef(no),day=-(SET().rem[0]+35);
      D.fees.push({id:newId("h"),pid:p.id,no,date:addDays(iso(TODAY),day),title:L("Honorar Akonto, Ausführungsplanung","Fee progress payment, construction drawings"),lines:[{t:L("Akonto, Phase Ausführungsplanung","Progress payment, construction drawings"),q:1,u:L("pauschal","lump sum"),p:6500}],vat:!!(D.firm||{}).vat,vatRate:8.1,refType:r.type,ref:r.ref,rem:[],paid:null,log:[{d:addDays(iso(TODAY),day),t:L("Erstellt","Created")}]});}
  });}
  /* example data: a contract with 10 % retention in every open example project. Retention is frozen per approved invoice,
     so the already counted akontos of that contract get the 10 % as well (example data only) */
  if(!D.mig.retDemo){D.mig.retDemo=1;if(D.example)D.projects.filter(p=>!p.closed).forEach(p=>{
    const ws=D.contracts.filter(w=>w.pid===p.id);if(!ws.length)return;
    const ak=w=>D.invoices.filter(i=>i.w===w.id&&live(i)&&counted(i)&&i.type==="akonto");
    if(ws.some(w=>ak(w).some(i=>retention(i)>0)))return;
    const w=ws.filter(w=>!D.invoices.some(i=>i.w===w.id&&i.type==="schluss")).sort((a,b)=>ak(b).reduce((s,i)=>s+net(i),0)-ak(a).reduce((s,i)=>s+net(i),0))[0];
    if(!w||!ak(w).length)return;w.ret=10;ak(w).forEach(i=>{i.retPct=10;});
  });}
  /* example data: every Budget tile of an open example project has something to show (a position not awarded, a position over budget) */
  if(!D.mig.budDemo){D.mig.budDemo=1;if(D.example)D.projects.filter(p=>!p.closed&&Array.isArray(p.budget)&&p.budget.length).forEach(p=>{
    const ws=D.contracts.filter(w=>w.pid===p.id);
    if(p.budget.every(b=>ws.some(w=>w.bkp===b.bkp))){const c=STD_BKP.find(x=>!p.budget.some(b=>b.bkp===x[0])&&!ws.some(w=>w.bkp===x[0]));
      if(c){p.budget.push({bkp:c[0],de:c[1],en:c[2],kv:9500});p.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));}}
    const keep=D.pid;D.pid=p.id;const rows=budgetRows();D.pid=keep;
    if(!rows.some(r=>r.rest<0)){const r=rows.filter(r=>!r.none&&r.forecast>0&&r.b.kvr==null).sort((a,b)=>a.rest-b.rest)[0];
      if(r)r.b.kv=Math.max(1000,Math.floor(r.forecast*0.94/500)*500);}
  });}
  if(!D.mig.feeno){D.mig.feeno=1;const by={};FEES().slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).forEach(f=>{const y=String(f.date).slice(0,4);by[y]=(by[y]||0)+1;f.no=y+"-"+String(by[y]).padStart(3,"0");const r=makeRef(f.no);if(f.refType===r.type)f.ref=r.ref;});}
}
function incomeData(){
  const months=[];const t=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);
  for(let i=11;i>=0;i--){const d=new Date(t.getFullYear(),t.getMonth()-i,1);months.push({y:d.getFullYear(),m:d.getMonth(),billed:0,paid:0});}
  const key=s=>{const d=toDate(s);return d.getFullYear()*12+d.getMonth();};
  const idx=k=>months.findIndex(x=>x.y*12+x.m===k);
  FEES().forEach(f=>{const tot=feeTotal(f);const a=idx(key(f.date));if(a>=0)months[a].billed+=tot;if(f.paid){const b=idx(key(f.paid));if(b>=0)months[b].paid+=tot;}});
  const open=FEES().filter(f=>!f.paid);
  const bucket={notdue:0,overdue:0,dunning:0};
  open.forEach(f=>{const v=feeTotal(f);if((f.rem||[]).length||remDue(f))bucket.dunning+=v;else if(daysTo(feeDue(f))<0)bucket.overdue+=v;else bucket.notdue+=v;});
  const paidL=FEES().filter(f=>f.paid&&-daysTo(f.paid)<=365),avg=paidL.length?Math.round(paidL.reduce((a,f)=>a+(toDate(f.paid)-toDate(f.date))/864e5,0)/paidL.length):0;
  const late=paidL.filter(f=>(toDate(f.paid)-toDate(f.date))/864e5>30).length;
  return {months,bucket,avg,nPaid:paidL.length,late,openSum:open.reduce((a,f)=>a+feeTotal(f),0)};
}
function incomeSection(only){
  const D2=incomeData(),M=D2.months,max=Math.max(1,...M.map(x=>Math.max(x.billed,x.paid)));
  const mn=m=>new Date(2026,m,1).toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{month:"short"}).replace(".","");
  const mob=window.innerWidth<821,W=mob?360:720,H=mob?190:200,pad=mob?32:28,base=H-22,cw=(W-pad)/12,bw=Math.min(16,cw*(mob?.36:.3));
  const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;return ([1,1.5,2,2.5,3,4,5,6,8,10].find(x=>x>=n))*p;};const top=nice(max);
  const y=v=>base-(v/top)*(base-14);
  const grid=[0,.5,1].map(f=>`<line x1="${pad}" x2="${W}" y1="${y(top*f)}" y2="${y(top*f)}" class="gl"/><text x="${pad-6}" y="${y(top*f)+3}" class="ax" text-anchor="end">${f?nfq.format(top*f/1000)+"k":"0"}</text>`).join("");
  const bar=(x,v,cls)=>{if(!v)return "";const yy=y(v),h=base-yy,r=Math.min(3,h);return `<path class="${cls}" d="M${x},${base} V${yy+r} Q${x},${yy} ${x+r},${yy} H${x+bw-r} Q${x+bw},${yy} ${x+bw},${yy+r} V${base} Z"/>`;};
  const cols=M.map((m,i)=>{const x0=pad+i*cw+cw/2-bw-1;const tip=`${mn(m.m)} ${m.y}: ${L("gestellt","billed")} CHF ${nfq.format(Math.round(m.billed))}, ${L("eingegangen","received")} CHF ${nfq.format(Math.round(m.paid))}`;
    return `<g class="col"><title>${tip}</title><rect x="${pad+i*cw}" y="0" width="${cw}" height="${base}" class="hit"/>${bar(x0,m.billed,"s1")}${bar(x0+bw+2,m.paid,"s2")}${!mob||i%2===1?`<text x="${pad+i*cw+cw/2}" y="${H-6}" class="ax" text-anchor="middle">${mn(m.m)}</text>`:""}</g>`;}).join("");
  const sumB=M.reduce((a,m)=>a+m.billed,0),sumP=M.reduce((a,m)=>a+m.paid,0);
  const B=D2.bucket,tot=Math.max(1,B.notdue+B.overdue+B.dunning),seg=(v,cls)=>v?`<span class="${cls}" style="flex:${v/tot}"></span>`:"";
  const hd=`<div class="sh"><h2>${L("Einnahmen","Income")}</h2><span class="cnt">${L("12 Monate","12 months")}</span>${tSum(L("eingegangen ","received ")+chf(Math.round(sumP),false)+" · Ø "+D2.avg+" "+L("Tage","days"))}</div>`;
  const bd=`
    <div class="legend"><span><i class="k s1"></i>${L("Gestellt","Billed")} <b>CHF ${nfq.format(Math.round(sumB))}</b></span><span><i class="k s2"></i>${L("Eingegangen","Received")} <b>CHF ${nfq.format(Math.round(sumP))}</b></span></div>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L("Gestellt und eingegangen pro Monat","Billed and received per month")}">${grid}${cols}</svg></div>
    <div class="two">
      <div><div class="sl">${L("Offen","Open")} · CHF ${nfq.format(Math.round(D2.openSum))}</div>
        <div class="obar">${seg(B.notdue,"b1")}${seg(B.overdue,"b2")}${seg(B.dunning,"b3")}</div>
        <div class="olegend"><span><i class="k b1"></i>${L("noch nicht fällig","not yet due")} <b>${nfq.format(Math.round(B.notdue))}</b></span><span><i class="k b2"></i>${L("überfällig","overdue")} <b>${nfq.format(Math.round(B.overdue))}</b></span><span><i class="k b3"></i>${L("in Mahnung","in reminder")} <b>${nfq.format(Math.round(B.dunning))}</b></span></div></div>
      <div><div class="sl">${L("Zahlungsdauer","Time to payment")}</div><div class="exp"><div><span class="ev">Ø ${D2.avg} ${L("Tage","days")}</span><span class="ss">${L("von der Rechnung bis zur Zahlung","from invoice to payment")}</span></div><div><span class="ev">${D2.late} ${L("von","of")} ${D2.nPaid}</span><span class="ss">${L("nach mehr als 30 Tagen bezahlt","paid after more than 30 days")}</span></div></div></div>
    </div>`;
  /* the chart alone, for the income tile: opens as a sheet */
  if(only==="body")return `<div class="income">${bd}</div>`;
  if(only==="sum")return sumP;
  return `<section class="income tsec" data-fd="1">${hd}${bd}</section>`;
}
function viewFees(){
  const list=PF().slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const G={open:list.filter(f=>!f.paid),due:list.filter(f=>remDue(f)),paid:list.filter(f=>f.paid)};
  if(!S.ffilter)S.ffilter="open";
  S.ffilter="all"; /* the tiles open a sheet; the list shows every fee invoice */
  if(S.ffilter!=="all"&&!G[S.ffilter].length)S.ffilter=["open","due","paid"].find(k=>G[k].length)||"all";
  const shown=S.ffilter==="all"?list:G[S.ffilter];
  const tot=a=>a.reduce((x,f)=>x+feeTotal(f),0),nInv=n=>n===1?L("1 Rechnung","1 invoice"):n+" "+L("Rechnungen","invoices");
  const T={open:[L("Zu erhalten","To receive"),chf(tot(G.open),false),nInv(G.open.length),""],
    due:[L("Mahnung fällig","Reminder due"),G.due.length?chf(tot(G.due),false):"0",G.due.length?nInv(G.due.length):L("keine","none"),G.due.length?" crit":""],
    paid:[L("Bezahlt","Paid"),chf(tot(G.paid),false),nInv(G.paid.length),""]};
  const tile=k=>{const [l,v,ss,c]=T[k],n=G[k].length,inner=`<span class="sl">${l}</span><span class="sv${c}">${v}</span><span class="ss">${ss}</span>`;
    return n?`<button type="button" class="stat" data-act="sheet" data-k="fee:${k}" aria-haspopup="dialog">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const fRow=f=>{const st=feeState(f);return row({act:"open-fee",id:f.id,c:st.c,title:esc(f.title||L("Honorar","Fee")),meta:esc(f.no)+" · "+fdate(f.date),amt:chf(feeTotal(f),false),label:st.t,lc:st.c});};
  const paidF=S.ffilter==="all"?shown.filter(f=>f.paid):[];
  const rows=shown.filter(f=>!paidF.includes(f)).map(fRow).join("")+foldRows(L("Bezahlt","Paid"),paidF.map(fRow).join(""),paidF.length);
  const miss=firmMissing();
  const head=`<div class="sh"><h2>${S.ffilter==="all"?L("Alle Honorarrechnungen","All fee invoices"):T[S.ffilter][0]}</h2><span class="cnt">${shown.length}</span><span class="right">${S.ffilter==="all"||!list.length?"":`<button type="button" class="ghost" data-act="ffilter" data-f="all">${L("Alle anzeigen","Show all")} (${list.length})</button>`}</span></div>`;
  /* no «Nächster Schritt» here: the tile «Mahnung fällig» opens exactly those invoices */
  return `${miss.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Für Rechnungen mit QR-Code fehlen Büro-Angaben: ","Firm details missing for QR invoices: ")}${miss.join(", ")}. <button type="button" class="ghost link" data-act="form" data-f="firm">${L("Ergänzen","Add")}</button></span></div>`:""}
    <div class="stats">${["open","due","paid"].map(tile).join("")}</div>
    <section>${head}<div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Honorarrechnungen.","No fee invoices yet.")}</span>${D.example?`<button type="button" class="btn" data-act="fee-demo">${L("Beispielrechnungen anzeigen","Show example invoices")}</button>`:""}</div>`}</div>${addRow(L("Honorarrechnung erstellen","New fee invoice"),'data-act="form" data-f="fee"')}</section>`;
}

function feeFormDef(F){
  const f=F.id?FE(F.id):null;
  if(!F.lines) F.lines=f?f.lines.map(l=>Object.assign({},l)):[{t:"",q:1,u:L("pauschal","lump sum"),p:""}];
  const p=P(),vat=f?f.vat:!!D.firm.vat;
  const lineRows=F.lines.map((l,i)=>`<div class="fline" data-i="${i}">
      <input class="lt" id="lt${i}" aria-label="${L("Bezeichnung","Description")}" placeholder="${L("z. B. Akonto 2, Phase Bauprojekt","e.g. progress payment 2")}" value="${esc(l.t)}">
      <label class="fc cq"><span>${L("Menge","Qty")}</span><input class="lq" id="lq${i}" inputmode="decimal" autocomplete="off" value="${esc(l.q)}"></label>
      <label class="fc cu"><span>${L("Einheit","Unit")}</span><input class="lu" id="lu${i}" value="${esc(l.u)}"></label>
      <label class="fc cp"><span>${L("Ansatz CHF","Rate CHF")}</span><input class="lp" id="lp${i}" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(l.p)}"></label>
      ${F.lines.length>1?`<button type="button" class="ib sm" title="${L("Zeile entfernen","Remove line")}" aria-label="${L("Zeile entfernen","Remove line")}" data-act="fee-delline" data-c="${i}">${ico("trash")}</button>`:"<span></span>"}
    </div>`).join("");
  const body=fld("fNo",L("Rechnungsnummer","Invoice no."),f?f.no:nextFeeNo(),{req:true})+fld("fDate",L("Datum","Date"),f?f.date:iso(TODAY),{type:"date",req:true})
    +fld("fTitle",L("Betreff","Subject"),f?f.title:"",{wide:true,ph:L("z. B. Honorar Akonto 2","e.g. Fee progress payment 2")})
    +`<div class="f wide"><span class="l">${L("Positionen","Items")}</span><div class="flhead"><span>${L("Bezeichnung","Description")}</span><span>${L("Menge","Qty")}</span><span>${L("Einheit","Unit")}</span><span>${L("Ansatz","Rate")}</span><span></span></div>${lineRows}
      <button type="button" class="ghost" data-act="fee-addline">${L("+ Position","+ Item")}</button></div>
    <div class="f"><label for="fVatSel">${L("MWST","VAT")}</label><select id="fVatSel">${VAT_RATES().map(([r,n])=>`<option value="${r}"${vat&&vrate(f||{vat:1})===r?" selected":""}>${nf1(r)} %  ·  ${n}</option>`).join("")}<option value="0"${vat?"":" selected"}>${L("Ohne MWST","No VAT")}</option></select>${D.firm.vat?"":`<span class="hint">${L("Ihr Büro ist in den Einstellungen als nicht MWST-pflichtig erfasst.","Your firm is set as not subject to VAT in Settings.")}</span>`}</div>
    <div class="f wide"><div class="calc" id="feeCalc"></div><span class="hint">${L("An: ","To: ")}${esc(p&&p.client||L("Bauherrschaft im Projekt ergänzen","add the client in the project"))}${p&&p.ccity?" · "+esc([p.cstreet,[p.czip,p.ccity].join(" ")].filter(Boolean).join(", ")):""}</span></div>`;
  return {title:f?L("Honorarrechnung bearbeiten","Edit fee invoice"):L("Neue Honorarrechnung","New fee invoice"),body};
}
function keepFeeFields(fn){const keep=["fNo","fDate","fTitle"].map(i=>[i,val(i)]),vat=(document.getElementById("fVatSel")||{}).value;fn();keep.forEach(([i,v])=>{const e=document.getElementById(i);if(e)e.value=v;});const c=document.getElementById("fVatSel");if(c&&vat!=null)c.value=vat;feeCalcUpdate();}
function readFirmForm(){if(!S.form||S.form.f!=="firm")return;const g=i=>val(i);Object.assign(S.form,{tmp:{fName:g("fName"),fStreet:g("fStreet"),fZip:g("fZip"),fCity:g("fCity"),fIban:g("fIban"),fEmail:g("fEmail"),fPhone:g("fPhone"),fVatNo:g("fVatNo"),fVat:(document.getElementById("fVat")||{}).checked,fSigRule:g("fSigRule")}});}
function readFeeLines(){const F=S.form;if(!F||!F.lines)return;F.lines=F.lines.map((l,i)=>({t:val("lt"+i),q:val("lq"+i),u:val("lu"+i),p:val("lp"+i)}));}
function feeCalcUpdate(){
  const F=S.form;if(!F||F.f!=="fee")return;readFeeLines();
  const tmp={lines:F.lines.map(l=>({q:num(l.q)||0,p:num(l.p)||0})),...vatSelVal()};
  const e=document.getElementById("feeCalc");if(!e)return;
  e.innerHTML=`<span>${L("Zwischentotal","Subtotal")}</span><span class="r">${nf2.format(feeSub(tmp))}</span>${tmp.vat?`<span>${L("MWST ","VAT ")+nf1(vrate(tmp))} %</span><span class="r">${nf2.format(feeVat(tmp))}</span>`:""}<span class="sum">${L("Total","Total")}</span><span class="r sum">CHF ${nf2.format(feeTotal(tmp))}</span>`;
}
function saveFee(F,fail){
  readFeeLines();
  const lines=F.lines.filter(l=>l.t||num(l.p)).map(l=>({t:l.t,q:num(l.q)||0,u:l.u,p:num(l.p)||0}));
  if(!val("fNo")) return fail(L("Rechnungsnummer fehlt.","Invoice number missing."),"fNo");
  if(!val("fDate")) return fail(L("Datum fehlt.","Date missing."),"fDate");
  if(!lines.length) return fail(L("Mindestens eine Position mit Betrag erfassen.","Add at least one item with an amount."));
  if(lines.some(l=>!l.t)) return fail(L("Jede Position braucht eine Bezeichnung.","Each item needs a description."));
  const no=val("fNo");
  if(FEES().some(x=>x.no===no&&x.id!==F.id)) return fail(L("Diese Rechnungsnummer gibt es schon.","This invoice number already exists."));
  const {vat,vatRate}=vatSelVal();
  let f=F.id&&FE(F.id);
  if(f){Object.assign(f,{no,date:val("fDate"),title:val("fTitle"),lines,vat,vatRate});logInv(f,L("Bearbeitet","Edited"));}
  else{const r=makeRef(no);f={id:newId("h"),pid:D.pid,no,date:val("fDate"),title:val("fTitle"),lines,vat,vatRate,term:SET().feeTerm,refType:r.type,ref:r.ref,rem:[],paid:null,log:[]};logInv(f,L("Erstellt","Created"));FEES().push(f);}
  const id=f.id;closeAll();S.rtab="deb";S.fdrawer=id;go("rechnungen");S.fdrawer=id;render();toast(L("Rechnung gespeichert","Invoice saved"));
}

function feeDrawerHTML(f){
  const st=feeState(f),p=PJ(f.pid)||{},r=remDue(f);
  const lines=f.lines.map(l=>`<span>${esc(l.t)}${+l.q!==1?`<span class="sp"> · ${nfq.format(l.q)} ${esc(l.u||"")} × ${nf2.format(l.p)}</span>`:""}</span><span class="r">${nf2.format(r2(l.q*l.p))}</span>`).join("");
  const log=(f.log||[]).map(x=>`<dt>${fdate(x.d)}</dt><dd>${esc(x.t)}</dd>`).join("");
  let actions;
  if(f.paid) actions=`<button type="button" class="btn" data-act="fee-unpaid" data-id="${f.id}">${L("Zahlung zurücknehmen","Undo payment")}</button>`;
  else actions=`${r?`<button type="button" class="btn" data-act="fee-remind" data-id="${f.id}">${remName(r)}</button>`:""}<button type="button" class="btn primary" data-act="fee-paid" data-id="${f.id}">${L("Bezahlt","Paid")}</button>`;
  return `<div class="scrim" data-act="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dT">
    <div class="ohead"><div><h2 id="dT">${esc(p.client||L("Bauherrschaft","Client"))}</h2><div class="sub">${esc(f.no)} · ${fdate(f.date)}${f.title?" · "+esc(f.title):""}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody">
      <div class="big"><span class="amt">${chf(feeTotal(f))}</span></div>
      <div class="payline"><span class="l-${st.c}">${st.t}</span><span>${f.paid?L("am ","on ")+fdate(f.paid):st.d?L("am ","on ")+fdate(st.d):L("fällig ","due ")+fdate(feeDue(f))}</span></div>
      ${r?`<div class="notice"><span class="ic crit" aria-hidden="true">!</span><span>${L("Seit ","Open for ")}${feeAge(f)}${L(" Tagen offen. "," days. ")}${remName(r)}${L(" ist fällig."," is due.")}</span></div>`:""}
      <div class="calc">${lines}<span>${L("Zwischentotal","Subtotal")}</span><span class="r">${nf2.format(feeSub(f))}</span>${f.vat?`<span>${L("MWST ","VAT ")+nf1(vrate(f))} %</span><span class="r">${nf2.format(feeVat(f))}</span>`:""}<span class="sum">${L("Total","Total")}</span><span class="r sum">CHF ${nf2.format(feeTotal(f))}</span></div>
      <details><summary>${L("Zahlungsdaten","Payment details")}</summary><div class="in"><dl class="kv"><dt>IBAN</dt><dd>${esc(fmtIban(D.firm.iban||""))}</dd><dt>${L("Referenz","Reference")}</dt><dd>${esc(fmtRefOut(f.refType,f.ref))}</dd></dl></div></details>
      <details><summary>${L("Verlauf","History")}</summary><div class="in"><dl class="kv">${log}</dl></div></details>
      <div class="dtools">${ibl("download",L("PDF herunterladen","Download PDF"),`data-act="fee-pdf" data-id="${f.id}"`,"PDF")}${f.paid?"":ibl("edit",L("Bearbeiten","Edit"),`data-act="form" data-f="fee" data-id="${f.id}"`)}<span class="qsep"></span>${S.confirm==="fdel:"+f.id?`<button type="button" class="ghost danger" data-act="fee-del" data-id="${f.id}">${L("Wirklich löschen?","Really delete?")}</button>`:ib("trash",L("Rechnung löschen","Delete invoice"),`data-act="ask" data-c="fdel:${f.id}"`)}</div>
    </div>
    <div class="ofoot">${actions}</div></aside>`;
}
