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
function docValid(d){if(!d.until)return null;const n=daysTo(d.until);return n<0?{c:"crit",t:L("abgelaufen","expired")}:n<=30?{c:"warn",t:L("läuft ab in "+n+" "+dayWord(n),"expires in "+n+" "+(n===1?"day":"days"))}:{c:"ok",t:L("gültig bis ","valid until ")+fdate(d.until)};}
function docsBlock(scope,ref,title,hint){
  const rk=d=>{const v=docValid(d);return v?{crit:0,warn:1,ok:2}[v.c]:3;};
  const list=docsFor(scope,ref).sort((a,b)=>scope==="firm"?rk(a)-rk(b):0);
  const rows=list.map(d=>{const v=docValid(d);return `<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${fsize(d.size||0)} · ${fdate(d.date)}${v?` · <span class="l-${v.c}">${v.t}</span>`:""}</span></button>${ib("edit",L("Gültigkeit","Validity"),`data-act="form" data-f="docvalid" data-id="${d.id}"`)}${S.confirm==="ddel:"+d.id?`<button type="button" class="ghost danger" data-act="doc-del" data-id="${d.id}">${L("Löschen?","Delete?")}</button>`:ib("trash",L("Dokument löschen","Delete document"),`data-act="ask" data-c="ddel:${d.id}"`)}</div>`;}).join("");
  return `<section class="docs"><div class="sh"><h2>${title}</h2><span class="cnt">${list.length}</span><span class="right"><label class="ib" data-tip="${L("Dokumente hinzufügen: PDF, Word, Excel oder Bild, auch mehrere auf einmal","Add documents: PDF, Word, Excel or image, several at once")}" aria-label="${L("Dokument hinzufügen","Add document")}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" data-imp="doc" data-id="${scope}|${ref}"></label></span></div>
    ${rows?`<div class="dlist">${rows}</div>`:`<div class="empty">${hint||L("Noch keine Dokumente. PDF, Word, Excel oder Bilder mit ＋ hinzufügen.","No documents yet. Add PDF, Word, Excel or images with ＋.")}</div>`}</section>`;
}
async function addDocs(files,key){
  const [scope,ref]=key.split("|");let n=0;
  for(const f of files){const id=newId("f");await FDB.put(id,f);DOCS().push({id,scope,ref,name:f.name,type:f.type,size:f.size,date:iso(TODAY)});n++;}
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
  if(!D.mig.projs){D.mig.projs=1;[["Umbau Villa Seeblick","Küsnacht","Bauherrschaft Keller","Sanierung Gebäudehülle"],["Anbau Schulhaus Au","Wädenswil","Gemeinde Wädenswil","Erweiterung um 2 Klassenzimmer"]].forEach(([n,pl,cl,de])=>{if(!D.projects.some(p=>p.name===n))D.projects.push({id:newId("p"),name:n,place:pl,client:cl,desc:de,closed:true,budget:[]});});}
  if(!D.mig.closedDemo){D.mig.closedDemo=1;const pa=D.example&&D.projects.find(p=>p.name==="Anbau Schulhaus Au"&&p.closed);if(pa&&!D.contracts.some(w=>w.pid===pa.id))seedClosedDemo(pa);}
  if(!D.mig.closedFees){D.mig.closedFees=1;const pa=D.example&&D.projects.find(p=>p.name==="Anbau Schulhaus Au"&&p.closed);if(pa&&D.contracts.some(w=>w.pid===pa.id)&&!D.contracts.some(w=>w.pid===pa.id&&w.bkp==="511"))seedClosedFees(pa);}
  if(!D.mig.closedMail){D.mig.closedMail=1;if(D.example)[["Gemeinde Wädenswil, Bauamt","bauamt@waedenswil.example"],["Bauversicherung Zürichsee AG","schaden@bauversicherung-zs.example"]].forEach(([n,e])=>{const k=D.contractors.find(x=>x.name===n);if(k&&!k.email)k.email=e;});}
  /* signatures point to people in the office team: name and title are kept once, in the team */
  if(!D.mig.signers2){D.mig.signers2=1;const F=D.firm||(D.firm={}),O=D.office||(D.office={team:[]});O.team=O.team||[];
    const ex=D.example&&/Beispiel Architekten|Example Architects/.test(F.name||"");
    const old=F.signers||[F.sig1,F.sig2].filter(Boolean).map(x=>{const [n,...r]=String(x).split(",");return {name:n.trim(),title:"",role:r.join(",").trim()};});
    if(ex&&O.team.some(m=>m.id==="m1"))F.signers=[{m:"m1",role:"Projektleiter"},{m:O.team.some(m=>m.id==="m3")?"m3":"",role:"Mitglied der Geschäftsleitung"}];
    else F.signers=old.map(g=>{if(g.m!==undefined)return g;if(!g.name)return {m:"",role:g.role||""};let m=O.team.find(x=>(x.name||"").trim().toLowerCase()===g.name.toLowerCase());
      if(!m){m={id:newId("m"),name:g.name,qual:g.title||"",extra:[],career:[]};O.team.push(m);}else if(!m.qual&&g.title)m.qual=g.title;return {m:m.id,role:g.role||""};});
    delete F.sig1;delete F.sig2;}
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
function incomeSection(){
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
  return `<section class="income"><div class="sh"><h2>${L("Einnahmen","Income")}</h2><span class="cnt">${L("letzte 12 Monate","last 12 months")}</span></div>
    <div class="legend"><span><i class="k s1"></i>${L("Gestellt","Billed")} <b>CHF ${nfq.format(Math.round(sumB))}</b></span><span><i class="k s2"></i>${L("Eingegangen","Received")} <b>CHF ${nfq.format(Math.round(sumP))}</b></span></div>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L("Gestellt und eingegangen pro Monat","Billed and received per month")}">${grid}${cols}</svg></div>
    <div class="two">
      <div><div class="sl">${L("Offen","Open")} · CHF ${nfq.format(Math.round(D2.openSum))}</div>
        <div class="obar">${seg(B.notdue,"b1")}${seg(B.overdue,"b2")}${seg(B.dunning,"b3")}</div>
        <div class="olegend"><span><i class="k b1"></i>${L("noch nicht fällig","not yet due")} <b>${nfq.format(Math.round(B.notdue))}</b></span><span><i class="k b2"></i>${L("überfällig","overdue")} <b>${nfq.format(Math.round(B.overdue))}</b></span><span><i class="k b3"></i>${L("in Mahnung","in reminder")} <b>${nfq.format(Math.round(B.dunning))}</b></span></div></div>
      <div><div class="sl">${L("Zahlungsdauer","Time to payment")}</div><div class="exp"><div><span class="ev">Ø ${D2.avg} ${L("Tage","days")}</span><span class="ss">${L("von der Rechnung bis zur Zahlung","from invoice to payment")}</span></div><div><span class="ev">${D2.late} ${L("von","of")} ${D2.nPaid}</span><span class="ss">${L("nach mehr als 30 Tagen bezahlt","paid after more than 30 days")}</span></div></div></div>
    </div></section>`;
}
function viewFees(){
  const list=PF().slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const G={open:list.filter(f=>!f.paid),due:list.filter(f=>remDue(f)),paid:list.filter(f=>f.paid)};
  if(!S.ffilter)S.ffilter="open";
  if(S.ffilter!=="all"&&!G[S.ffilter].length)S.ffilter=["open","due","paid"].find(k=>G[k].length)||"all";
  const shown=S.ffilter==="all"?list:G[S.ffilter];
  const tot=a=>a.reduce((x,f)=>x+feeTotal(f),0),nInv=n=>n===1?L("1 Rechnung","1 invoice"):n+" "+L("Rechnungen","invoices");
  const T={open:[L("Zu erhalten","To receive"),chf(tot(G.open),false),nInv(G.open.length),""],
    due:[L("Mahnung fällig","Reminder due"),G.due.length?chf(tot(G.due),false):"–",G.due.length?nInv(G.due.length):L("nach ","after ")+SET().rem.join(", ")+L(" Tagen"," days"),G.due.length?" crit":""],
    paid:[L("Bezahlt","Paid"),chf(tot(G.paid),false),nInv(G.paid.length),""]};
  const tile=k=>{const [l,v,ss,c]=T[k],n=G[k].length,sel=S.ffilter===k,inner=`<span class="sl">${l}</span><span class="sv${c}">${v}</span><span class="ss">${ss}</span>`;
    return n?`<button type="button" class="stat ftile${sel?" sel":""}" data-act="ffilter" data-f="${k}" aria-pressed="${sel}">${inner}</button>`:`<div class="stat ftile off">${inner}</div>`;};
  const fRow=f=>{const st=feeState(f);return row({act:"open-fee",id:f.id,c:st.c,title:esc(f.title||L("Honorar","Fee")),meta:esc(f.no)+" · "+fdate(f.date),amt:chf(feeTotal(f),false),label:st.t,lc:st.c});};
  const paidF=S.ffilter==="all"?shown.filter(f=>f.paid):[];
  const rows=shown.filter(f=>!paidF.includes(f)).map(fRow).join("")+foldRows(L("Bezahlt","Paid"),paidF.map(fRow).join(""),paidF.length);
  const miss=firmMissing();
  const head=`<div class="sh"><h2>${S.ffilter==="all"?L("Alle Honorarrechnungen","All fee invoices"):T[S.ffilter][0]}</h2><span class="cnt">${shown.length}</span><span class="right">${S.ffilter==="all"||!list.length?"":`<button type="button" class="ghost" data-act="ffilter" data-f="all">${L("Alle anzeigen","Show all")} (${list.length})</button>`}</span></div>`;
  return `${miss.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Für Rechnungen mit QR-Code fehlen Büro-Angaben: ","Firm details missing for QR invoices: ")}${miss.join(", ")}. <button type="button" class="ghost link" data-act="form" data-f="firm">${L("Ergänzen","Add")}</button></span></div>`:""}
    <div class="stats">${["open","due","paid"].map(tile).join("")}</div>
    <section>${head}<div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Honorarrechnungen.","No fee invoices yet.")}</span>${D.example?`<button type="button" class="btn" data-act="fee-demo">${L("Beispielrechnungen anzeigen","Show example invoices")}</button>`:""}</div>`}</div></section>`;
}

function feeFormDef(F){
  const f=F.id?FE(F.id):null;
  if(!F.lines) F.lines=f?f.lines.map(l=>Object.assign({},l)):[{t:"",q:1,u:L("pauschal","lump sum"),p:""}];
  const p=P(),vat=f?f.vat:!!D.firm.vat;
  const lineRows=F.lines.map((l,i)=>`<div class="fline" data-i="${i}">
      <input class="lt" id="lt${i}" aria-label="${L("Bezeichnung","Description")}" placeholder="${L("z. B. Akonto 2, Phase Bauprojekt","e.g. progress payment 2")}" value="${esc(l.t)}">
      <input class="lq" id="lq${i}" inputmode="decimal" aria-label="${L("Menge","Qty")}" value="${esc(l.q)}">
      <input class="lu" id="lu${i}" aria-label="${L("Einheit","Unit")}" value="${esc(l.u)}">
      <input class="lp" id="lp${i}" inputmode="decimal" aria-label="${L("Ansatz CHF","Rate CHF")}" placeholder="0.00" value="${esc(l.p)}">
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
function readFirmForm(){if(!S.form||S.form.f!=="firm")return;const g=i=>val(i);Object.assign(S.form,{tmp:{fName:g("fName"),fStreet:g("fStreet"),fZip:g("fZip"),fCity:g("fCity"),fIban:g("fIban"),fEmail:g("fEmail"),fPhone:g("fPhone"),fVatNo:g("fVatNo"),fVat:(document.getElementById("fVat")||{}).checked}});}
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
