/* arkitecton · PDFs: QR-bill for fees, payment recommendation and release, file storage helpers. */
"use strict";

/* ---------- PDF with Swiss QR-bill ---------- */
/* libraries load on first use; one promise per file, so parallel callers wait for the same load, and a failed load can be retried */
const LIBS={};
const loadScript=src=>LIBS[src]||(LIBS[src]=new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>{delete LIBS[src];s.remove();no(new Error("lib "+src));};document.head.appendChild(s);}));
const libXLSX=()=>loadScript("vendor/xlsx.full.min.js"),libQR=()=>loadScript("vendor/jsQR.js");
async function libsPDF(){await loadScript("vendor/jspdf.umd.min.js");await loadScript("vendor/qrcode-gen.js");}
function qrPayload(f){
  /* the reference type must match the account: QR-IBAN needs a QR reference, a normal IBAN a creditor reference. If the office changed its IBAN since, renew it. */
  {const want=isQrIban(D.firm.iban)?"QRR":"SCOR";if(f.refType!==want){const r=makeRef(f.no);f.refType=r.type;f.ref=r.ref;saveData();}}
  const F=D.firm,p=PJ(f.pid)||{},[cs,cb]=splitStreet(F.street),[ds,db]=splitStreet(p.cstreet);
  const hasD=!!(p.client&&p.czip&&p.ccity);
  const d=f.date.replace(/-/g,"").slice(2);
  let bill="//S1/10/"+String(f.no).replace(/\//g,"\\/")+"/11/"+d;
  if(f.vat&&F.vatNo) bill+="/30/"+String(F.vatNo).replace(/\D/g,"")+"/32/"+vrate(f);
  bill+="/40/0:"+(+f.term||SET().feeTerm||30);
  const cut=(s,n)=>String(s||"").slice(0,n);
  return ["SPC","0200","1",norm(F.iban),"S",cut(F.name,70),cut(cs,70),cut(cb,16),cut(F.zip,16),cut(F.city,35),"CH",
    "","","","","","","",
    feeTotal(f).toFixed(2),"CHF",
    hasD?"S":"",hasD?cut(p.client,70):"",hasD?cut(ds,70):"",hasD?cut(db,16):"",hasD?cut(p.czip,16):"",hasD?cut(p.ccity,35):"",hasD?"CH":"",
    f.refType,f.ref,cut(L("Rechnung ","Invoice ")+f.no,140),"EPD",bill].join("\n");
}
async function payPDF(i){
  await libsPDF();
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"}),F=D.firm,w=W(i.w),k=K(w.k),p=PJ(w.pid)||{};
  const T=(t,x,y,o)=>doc.text(String(t),x,y,o||{}),font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);};
  const seal=await sealRelease([i],p),img=await mosaicPng(seal.url,700);
  let y=20;font(10,true);T(F.name||"",20,y);font(9);[F.street,[F.zip,F.city].filter(Boolean).join(" "),F.phone,F.email].filter(Boolean).forEach((l,n)=>T(l,20,y+5+n*4.5));
  sealBlock(doc,img.data,seal,154,10,36);
  font(10);[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean).forEach((l,n)=>T(l,118,58+n*5));
  font(9);T((F.city?F.city+", ":"")+fdate(seal.date),118,84);
  font(14,true);T(L("Zahlungsfreigabe ","Payment release ")+seal.no,20,97);
  font(9);T(L("Projekt: ","Project: ")+[p.name,p.place].filter(Boolean).join(", "),20,104);
  y=115;font(10);doc.splitTextToSize(L("Wir haben die folgende Rechnung geprüft und geben den unten stehenden Betrag zur Zahlung frei.","We have checked the following invoice and recommend that you pay the amount below."),170).forEach((l,n)=>T(l,20,y+n*5));y+=16;
  const kv=(a,b)=>{font(9);T(a,20,y);T(b,70,y);y+=5.5;};
  kv(L("Unternehmer","Contractor"),[k.name,[k.zip,k.city].filter(Boolean).join(" ")].filter(Boolean).join(", "));
  kv(L("Arbeitsgattung","Trade"),"BKP "+w.bkp+" "+bName(w.bkp));kv(L("Rechnung","Invoice"),typeLabel(i)+" · "+i.no+" · "+fdate(i.date)+" · "+i.vno);
  kv(L("Werkvertrag","Contract"),"CHF "+nf2.format(w.sum||0)+(i.type==="regie"?L(" (Regie ausserhalb Werkvertrag)"," (outside contract)"):""));
  y+=4;doc.setLineWidth(.2);doc.line(20,y,190,y);y+=7;
  const ln=(a,b,bold)=>{font(bold?10:9,bold);T(a,20,y);T(b,190,y,{align:"right"});y+=bold?7:5.5;};
  const ret=retention(i);ln(L("Rechnungsbetrag","Invoice amount"),nf2.format(i.gross));
  if(i.ded&&i.ded.amt)ln(L("Abzug: ","Deduction: ")+i.ded.why,"- "+nf2.format(i.ded.amt));
  if(ret>0)ln(L("Rückbehalt ","Retention ")+invPct(i)+" %","- "+nf2.format(ret));if(ret<0)ln(L("Freigabe Rückbehalt","Retention released"),"+ "+nf2.format(-ret));
  doc.line(120,y-1,190,y-1);y+=4;ln(L("Zur Zahlung freigegeben CHF","Released for payment CHF"),nf2.format(payout(i)),true);
  y+=4;kv(L("Zahlbar bis","Payable by"),fdate(i.due));kv("IBAN",k.iban||L("fehlt","missing"));if(i.ref)kv(L("Referenz","Reference"),i.ref);
  const iss=checksFor(i).filter(c=>c.s==="warn");if(iss.length){y+=4;font(9,true);T(L("Hinweise aus der Prüfung","Notes from the check"),20,y);y+=5.5;font(9);iss.forEach(c=>{doc.splitTextToSize("– "+c.t,170).forEach(l=>{T(l,20,y);y+=4.8;});});}
  y=Math.max(y+18,232);sig3(doc,y,p);
  doc.save(L("Zahlungsfreigabe","Payment-release")+"_"+String(k.name).replace(/[^\w]+/g,"-")+"_"+String(i.no).replace(/[^\w]+/g,"-")+".pdf");
}
/* one release letter to the client for all released invoices of the project: the client pays the contractors */
async function payPDFAll(list){
  if(!list.length)return;await libsPDF();
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"}),F=D.firm,p=P()||{};
  const T=(t,x,y,o)=>doc.text(String(t),x,y,o||{}),font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);};
  /* one page per group of up to SEAL_MAX invoices, each with its own number and check code */
  const all=list.slice().sort((a,b)=>toDate(a.due)-toDate(b.due)),pages=[];for(let n=0;n<all.length;n+=SEAL_MAX)pages.push(all.slice(n,n+SEAL_MAX));
  for(let pn=0;pn<pages.length;pn++){const part=pages[pn];if(pn)doc.addPage();
    const seal=await sealRelease(part,p),img=await mosaicPng(seal.url,700);
    let y=20;font(10,true);T(F.name||"",20,y);font(9);[F.street,[F.zip,F.city].filter(Boolean).join(" "),F.phone,F.email].filter(Boolean).forEach((l,n)=>T(l,20,y+5+n*4.5));
    sealBlock(doc,img.data,seal,154,10,36);
    font(10);[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean).forEach((l,n)=>T(l,118,58+n*5));
    font(9);T((F.city?F.city+", ":"")+fdate(seal.date),118,84);
    font(14,true);T(L("Zahlungsfreigabe ","Payment release ")+seal.no,20,97);font(9);T(L("Projekt: ","Project: ")+[p.name,p.place].filter(Boolean).join(", ")+(pages.length>1?L(" · Seite "," · page ")+(pn+1)+L(" von "," of ")+pages.length:""),20,104);
    y=115;font(10);doc.splitTextToSize(L("Wir haben die folgenden Rechnungen geprüft und geben sie zur Zahlung frei. Bitte überweisen Sie die Beträge bis zum jeweiligen Datum.","We have checked the following invoices and release them for payment. Please pay each amount by its date."),170).forEach((l,n)=>T(l,20,y+n*5));y+=16;
    font(8,true);T(L("Unternehmer","Contractor"),20,y);T(L("Rechnung","Invoice"),82,y);T(L("Zahlbar bis","Payable by"),128,y);T("CHF",190,y,{align:"right"});y+=2;doc.setLineWidth(.2);doc.line(20,y,190,y);y+=5;
    let sum=0;part.forEach(i=>{const w=W(i.w),k=K(w.k),amt=payout(i);sum+=amt;
      font(9);T(String(k.name).slice(0,34),20,y);T(String(typeLabel(i)+" · "+i.no).slice(0,28),82,y);T(fdate(i.due),128,y);T(nf2.format(amt),190,y,{align:"right"});y+=4.2;
      font(7.5);T("BKP "+w.bkp+" "+String(bName(w.bkp)).slice(0,22)+" · "+i.vno,20,y);T("IBAN "+(k.iban||L("fehlt","missing"))+(i.ref?"  ·  Ref. "+i.ref:""),82,y);y+=6;});
    doc.line(120,y-2,190,y-2);y+=3;font(10,true);T(L("Total zur Zahlung","Total for payment"),20,y);T(nf2.format(r2(sum)),190,y,{align:"right"});
    y=Math.max(y+22,232);sig3(doc,y,p);}
  doc.save(L("Zahlungsfreigabe","Payment-release")+"_"+String(p.name||"").replace(/[^\w]+/g,"-")+"_"+iso(TODAY)+".pdf");
}
/* the check code with its caption, top right of a page */
function sealBlock(doc,png,seal,x,y,size){
  doc.addImage(png,"PNG",x,y,size,size);
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(20);doc.text(L("Echtheit prüfen: Code scannen","Check authenticity: scan code"),x+size,y+size+3.5,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(6.5);doc.setTextColor(110);doc.text(seal.no+" · "+L("Schlüssel ","Key ")+seal.print,x+size,y+size+6.6,{align:"right"});doc.setTextColor(20);
}
/* cost status for the client: estimate, awarded, billed, forecast and reserve per BKP, grouped by main group */
/* the people who sign: team member + role from the office settings */
function signer(n){const sg=((D.firm||{}).signers||[])[n]||{},tm=((D.office||{}).team||[]).find(m=>m.id===sg.m)||{};return {name:tm.name||"",title:tm.qual||"",role:sg.role||""};}
/* payment release: architect, site management and client sign, as on the usual Swiss payment order */
function sig3(doc,y,p){
  const cols=[[L("Architekt","Architect"),signer(0).name||(D.firm||{}).name||""],[L("Bauleitung","Site management"),signer(1).name],[L("Bauherrschaft","Client"),(p&&p.client)||""]];
  cols.forEach(([lab,nm],n)=>{const x=20+n*59;doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.text(lab,x,y);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(110);doc.text(L("Ort, Datum","Place, date"),x,y+4);doc.setTextColor(20);
    doc.setLineWidth(.2);doc.line(x,y+20,x+52,y+20);doc.setFontSize(8.5);if(nm)doc.text(String(nm).slice(0,34),x,y+24.5);});
}
async function costPDF(){
  const p=P();if(!p)return;const rows=budgetRows().filter(r=>r.kv||r.b.kv||r.awarded||r.billed||r.open);if(!rows.length){toast(L("Noch kein Kostenvoranschlag.","No cost estimate yet."));return;}
  await libsPDF();
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"}),F=D.firm,t=totals(rows),fc=r2(rows.reduce((a,r)=>a+r.forecast,0)),closed=!!p.closed;
  const fit=(x,w)=>{if(doc.getTextWidth(x)<=w)return x;while(x.length>3&&doc.getTextWidth(x+"…")>w)x=x.slice(0,-1);return x.trimEnd()+"…";};
  const T=(x,X,Y,o)=>doc.text(String(x),X,Y,o||{}),font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);},n0=v=>v?nf0.format(Math.round(v)):"–",gray=on=>doc.setTextColor(on?110:20);
  let y=20;font(10,true);T(F.name||"",20,y);font(9);[F.street,[F.zip,F.city].filter(Boolean).join(" "),F.phone,F.email].filter(Boolean).forEach((l,n)=>T(l,20,y+5+n*4.5));
  font(10);[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean).forEach((l,n)=>T(l,118,52+n*5));
  font(9);T((F.city?F.city+", ":"")+fdate(iso(TODAY)),118,80);
  font(14,true);T(L("Kostenstand","Cost status"),20,95);font(9);T(L("Projekt: ","Project: ")+[p.name,p.place].filter(Boolean).join(", ")+L(" · Stand "," · as of ")+fdate(iso(TODAY)),20,102);
  /* summary */
  y=114;const fcL=closed?L("Endkosten","Final cost"):L("Prognose Endkosten","Forecast final cost");
  const sum=[[t.rev?L("Kostenvoranschlag revidiert","Revised estimate"):L("Kostenvoranschlag","Cost estimate"),t.kv],[L("Vergeben","Awarded"),t.awarded],[L("Abgerechnet (geprüft)","Billed (checked)"),t.billed],[L("davon bezahlt","of which paid"),t.paid],[fcL,fc],[L("Reserve","Reserve"),t.rest]];
  sum.forEach(([l,v],n)=>{const X=20+(n%3)*57,Y=y+Math.floor(n/3)*14;font(8);gray(1);T(l,X,Y);gray(0);font(11,n===5);if(n===5&&v<0)doc.setTextColor(180,40,30);T("CHF "+nf0.format(Math.round(v)),X,Y+5.5);gray(0);});
  y+=28;
  const RV=t.rev,C=RV?[98,117,136,155,173,190]:[106,127,148,169,190],NW=RV?50:58,head=[L("Kostenvor.","Estimate")].concat(RV?[L("KV rev.","Revised")]:[],[L("Vergeben","Awarded"),L("Abgerechnet","Billed"),closed?L("Endkosten","Final cost"):L("Prognose","Forecast"),L("Reserve","Reserve")]);
  const th=()=>{font(7.5,true);T("BKP",20,y);T(L("Arbeitsgattung","Trade"),33,y);head.forEach((h,n)=>T(h,C[n],y,{align:"right"}));y+=2;doc.setLineWidth(.2);doc.line(20,y,190,y);y+=4.5;};
  th();
  const nums=(vals,b)=>{if(!RV)vals.splice(1,1);const last=vals.length-1;font(8,b);vals.forEach((v,n)=>{if(n===last&&v<0)doc.setTextColor(180,40,30);T(v===null?"–":n0(v),C[n],y,{align:"right"});gray(0);});};
  const grp=[...new Set(rows.map(r=>bkpMain(r.b.bkp)))].sort();
  grp.forEach(g=>{const rs=rows.filter(r=>bkpMain(r.b.bkp)===g);
    if(y>262){doc.addPage();y=20;th();}
    font(8,true);T(g,20,y);T(fit(String(bkpMainName(g)),NW),33,y);
    nums([rs.reduce((a,r)=>a+(r.b.kv||0),0),rs.reduce((a,r)=>a+r.kv,0),rs.reduce((a,r)=>a+r.awarded,0),rs.reduce((a,r)=>a+r.billed,0),rs.reduce((a,r)=>a+r.forecast,0),rs.every(r=>r.none)?null:rs.reduce((a,r)=>a+(r.kv?r.rest:0),0)],true);y+=5;
    rs.forEach(r=>{if(y>270){doc.addPage();y=20;th();}
      font(8);T(r.b.bkp,20,y);T(fit(String(tx(r.b))+(r.none?L(" (nicht vergeben)"," (not awarded)"):""),NW),33,y);
      nums([r.b.kv||0,r.kv,r.awarded,r.billed,r.forecast,r.none||!r.kv?null:r.rest]);y+=4.1;});
    y+=1;});
  doc.line(20,y-2,190,y-2);y+=3;font(9,true);T("Total",20,y);nums([t.kv0,t.kv,t.awarded,t.billed,fc,t.rest],true);y+=8;
  if(y>270){doc.addPage();y=20;}
  font(7.5);gray(1);const note=doc.splitTextToSize(closed?L("Endkosten: abgerechnete Beträge gemäss Schlussrechnungen, Regie eingeschlossen. Reserve: Kostenvoranschlag minus Endkosten.","Final cost: billed amounts per final invoices, time & materials included. Reserve: estimate minus final cost."):L("Prognose: pro Werkvertrag die Vertragssumme oder der bisher abgerechnete Betrag, je nachdem was höher ist; nach der Schlussrechnung der abgerechnete Betrag. Regie kommt dazu. Nicht vergebene Positionen mit dem Kostenvoranschlag. Reserve: Kostenvoranschlag (revidiert, falls vorhanden) minus Prognose. Abgerechnet: geprüfte und freigegebene Rechnungen, Beträge in CHF inkl. MWST.","Forecast: per contract, the contract sum or the amount billed so far, whichever is higher; after the final invoice, the billed amount. Time & materials on top. Items not awarded at their estimate. Reserve: estimate minus forecast. Billed: checked and approved invoices, CHF incl. VAT."),170);note.forEach((l,n)=>T(l,20,y+n*3.6));gray(0);
  /* two signatures from the office, as usual for letters to the client */
  y+=note.length*3.6+12;if(y+28>289){doc.addPage();y=30;}font(9);T(L("Freundliche Grüsse","Kind regards"),20,y-8);font(9,true);T(F.name||"",20,y-3);font(9);
  [0,1].forEach(n=>{const g=signer(n),x=n?118:20;doc.line(x,y+14,x+72,y+14);font(8.5,true);T(g.name||L("Name","Name"),x,y+18.5);font(7.5);gray(1);[g.title,g.role].filter(Boolean).forEach((l,k)=>T(l,x,y+22+k*3.4));gray(0);});
  doc.save(L("Kostenstand","Cost-status")+"_"+String(p.name||"").replace(/[^\w]+/g,"-")+"_"+iso(TODAY)+".pdf");
}
/* Bauabrechnung: the final account of the building per BKP, prepared by the site management and approved by the client.
   Before the project is closed it is marked provisional and uses the forecast as end cost. */
async function finalPDF(){
  const p=P();if(!p)return;const rows=budgetRows().filter(r=>r.kv||r.b.kv||r.awarded||r.billed||r.open);if(!rows.length){toast(L("Noch kein Kostenvoranschlag.","No cost estimate yet."));return;}
  await libsPDF();
  const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"mm",format:"a4"}),F=D.firm,t=totals(rows),closed=!!p.closed;
  const fc=r2(rows.reduce((a,r)=>a+r.forecast,0)),dev=r2(fc-t.kv),devP=t.kv?dev/t.kv*100:0;
  const fit=(x,w)=>{if(doc.getTextWidth(x)<=w)return x;while(x.length>3&&doc.getTextWidth(x+"…")>w)x=x.slice(0,-1);return x.trimEnd()+"…";};
  const T=(x,X,Y,o)=>doc.text(String(x),X,Y,o||{}),font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);},gray=on=>doc.setTextColor(on?110:20);
  const n0=v=>v?nf0.format(Math.round(v)):"–",sg=v=>!Math.round(v)?"–":(v>0?"+":"-")+nf0.format(Math.abs(Math.round(v)));
  let y=20;font(10,true);T(F.name||"",20,y);font(9);[F.street,[F.zip,F.city].filter(Boolean).join(" "),F.phone,F.email].filter(Boolean).forEach((l,n)=>T(l,20,y+5+n*4.5));
  font(10);[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean).forEach((l,n)=>T(l,118,52+n*5));
  font(9);T((F.city?F.city+", ":"")+fdate(iso(TODAY)),118,80);
  font(14,true);T(L("Bauabrechnung","Construction account")+(closed?"":L(" (provisorisch)"," (provisional)")),20,95);
  font(9);T(L("Projekt: ","Project: ")+[p.name,p.place].filter(Boolean).join(", ")+L(" · Stand "," · as of ")+fdate(iso(TODAY)),20,102);
  /* summary: what was planned, what it cost, the difference */
  y=114;const kvL=t.rev?L("Kostenvoranschlag revidiert","Revised estimate"):L("Kostenvoranschlag","Cost estimate");
  [[kvL,"CHF "+nf0.format(Math.round(t.kv))],[closed?L("Endkosten","Final cost"):L("Endkosten (Prognose)","Final cost (forecast)"),"CHF "+nf0.format(Math.round(fc))],
   [dev>0?L("Mehrkosten","Overrun"):L("Minderkosten","Savings"),"CHF "+sg(dev)+(t.kv?"  ("+(dev>0?"+":"-")+Math.abs(devP).toFixed(1)+" %)":"")]].forEach(([l,v],n)=>{const X=20+n*57;font(8);gray(1);T(l,X,y);gray(0);font(11,n===2);if(n===2&&dev>0)doc.setTextColor(180,40,30);T(v,X,y+5.5);gray(0);});
  y+=16;
  const RV=t.rev,C=RV?[96,114,132,150,170,190]:[104,125,146,168,190],NW=RV?48:56;
  const head=[L("Kostenvor.","Estimate")].concat(RV?[L("KV rev.","Revised")]:[],[L("Vergeben","Awarded"),L("Abgerechnet","Billed"),L("Endkosten","Final cost"),L("Abweichung","Deviation")]);
  const th=()=>{font(7.5,true);T("BKP",20,y);T(L("Arbeitsgattung","Trade"),33,y);head.forEach((h,n)=>T(h,C[n],y,{align:"right"}));y+=2;doc.setLineWidth(.2);doc.line(20,y,190,y);y+=4.5;};
  th();
  const nums=(v,b)=>{const vals=[v.kv0].concat(RV?[v.kv]:[],[v.aw,v.bi,v.fc]);font(8,b);vals.forEach((x,n)=>T(n0(x),C[n],y,{align:"right"}));const d=v.fc-v.kv;if(d>0.5)doc.setTextColor(180,40,30);T(sg(d),C[C.length-1],y,{align:"right"});gray(0);};
  const vOf=rs=>({kv0:rs.reduce((a,r)=>a+(r.b.kv||0),0),kv:rs.reduce((a,r)=>a+r.kv,0),aw:rs.reduce((a,r)=>a+r.awarded,0),bi:rs.reduce((a,r)=>a+r.billed,0),fc:rs.reduce((a,r)=>a+r.forecast,0)});
  [...new Set(rows.map(r=>bkpMain(r.b.bkp)))].sort().forEach(g=>{const rs=rows.filter(r=>bkpMain(r.b.bkp)===g);
    if(y>250){doc.addPage();y=20;th();}
    font(8,true);T(g,20,y);T(fit(String(bkpMainName(g)),NW),33,y);nums(vOf(rs),true);y+=5;
    rs.forEach(r=>{if(y>262){doc.addPage();y=20;th();}font(8);T(r.b.bkp,20,y);T(fit(String(tx(r.b)),NW),33,y);nums(vOf([r]));y+=4.1;});y+=1;});
  doc.line(20,y-2,190,y-2);y+=3;font(9,true);T("Total",20,y);nums(vOf(rows),true);y+=9;
  /* what is still open: invoices to check, retention to pay out after the warranty bond */
  if(y>235){doc.addPage();y=24;}
  const open=[[L("Rechnungen noch zu prüfen","Invoices still to check"),t.open],[L("Rückbehalte, Auszahlung gegen Garantieschein","Retention, paid against warranty bond"),t.ret]].filter(x=>x[1]>0.5);
  if(open.length){font(8.5,true);T(L("Noch offen","Still open"),20,y);y+=5;font(8.5);open.forEach(([l,v])=>{T(l,20,y);T("CHF "+nf0.format(Math.round(v)),120,y,{align:"right"});y+=4.5;});y+=3;}
  font(7.5);gray(1);const note=doc.splitTextToSize(closed?L("Endkosten: abgerechnete Beträge gemäss Schlussrechnungen der Handwerker, Regie eingeschlossen, ohne MwSt.-Korrekturen nach Abschluss. Abweichung: Endkosten minus Kostenvoranschlag.","Final cost: billed amounts per contractors' final invoices, time & materials included. Deviation: final cost minus estimate."):L("Provisorisch: Das Projekt ist noch nicht abgeschlossen. Endkosten sind die Prognose, also Werkvertrag oder bisher abgerechnet, je nachdem was höher ist, plus Regie. Abweichung: Endkosten minus Kostenvoranschlag.","Provisional: the project is not closed yet. Final cost is the forecast. Deviation: final cost minus estimate."),170);
  doc.text(note,20,y);gray(0);y+=note.length*3.6+8;
  /* prepared by the architect and site management, approved by the client */
  if(y+34>289){doc.addPage();y=30;}font(8.5);T(L("Erstellt und geprüft durch Architekt und Bauleitung, genehmigt durch die Bauherrschaft.","Prepared and checked by architect and site management, approved by the client."),20,y);y+=8;sig3(doc,y,p);
  doc.save(L("Bauabrechnung","Construction-account")+"_"+String(p.name||"").replace(/[^\w]+/g,"-")+"_"+iso(TODAY)+".pdf");
}
async function feePDF(f,level){
  await libsPDF();
  const {jsPDF}=window.jspdf, doc=new jsPDF({unit:"mm",format:"a4"}), F=D.firm, p=PJ(f.pid)||{};
  const T=(t,x,y,o)=>doc.text(String(t),x,y,o||{});
  const font=(sz,b)=>{doc.setFont("helvetica",b?"bold":"normal");doc.setFontSize(sz);};
  // letterhead
  let y=20;
  if(F.logo){try{const im=new Image();im.src=F.logo;await new Promise(r=>{im.onload=r;im.onerror=r;});const h=14,w=im.naturalWidth?Math.min(60,h*im.naturalWidth/im.naturalHeight):h;doc.addImage(F.logo,"PNG",20,y-6,w,h);y+=14;}catch(e){}}
  font(10,true);T(F.name,20,y);font(9);
  [F.street,[F.zip,F.city].join(" "),F.phone,F.email,F.vat&&F.vatNo?F.vatNo:""].filter(Boolean).forEach((l,i)=>T(l,20,y+5+i*4.5));
  // recipient (right window)
  font(10);[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean).forEach((l,i)=>T(l,118,52+i*5));
  font(9);T((F.city?F.city+", ":"")+fdate(level?iso(TODAY):f.date),118,80);
  font(14,true);T(level?remName(level)+" · "+L("Rechnung ","Invoice ")+f.no:L("Rechnung ","Invoice ")+f.no,20,95);
  font(9);T(L("Projekt: ","Project: ")+[p.name,p.place].filter(Boolean).join(", ")+(f.title?" · "+f.title:""),20,102);
  y=112;
  if(level){
    const msg=level===3?L("Trotz unserer Mahnungen ist die Rechnung vom "+fdate(f.date)+" noch offen. Bitte überweisen Sie den Betrag innert 10 Tagen. Ohne Zahlung leiten wir die Betreibung ein.","Despite our reminders the invoice dated "+fdate(f.date)+" is still unpaid. Please pay within 10 days, otherwise we will start debt collection.")
      :L("Unsere Rechnung vom "+fdate(f.date)+" ist seit "+feeAge(f)+" Tagen offen. Vielleicht ist sie untergegangen. Bitte überweisen Sie den Betrag innert 10 Tagen. Falls Sie bereits bezahlt haben, betrachten Sie dieses Schreiben als gegenstandslos.","Our invoice dated "+fdate(f.date)+" has been open for "+feeAge(f)+" days. Please pay within 10 days. If you have already paid, please disregard this letter.");
    font(10);doc.splitTextToSize(msg,170).forEach((l,i)=>T(l,20,y+i*5));y+=26;
  }
  // items
  font(8,true);T(L("Bezeichnung","Description"),20,y);T(L("Menge","Qty"),128,y,{align:"right"});T(L("Ansatz","Rate"),160,y,{align:"right"});T(L("Betrag CHF","Amount CHF"),190,y,{align:"right"});
  doc.setLineWidth(.2);doc.line(20,y+2,190,y+2);y+=7;font(9);
  f.lines.forEach(l=>{const tl=doc.splitTextToSize(l.t,95);tl.forEach((t,i)=>T(t,20,y+i*4.5));T(nfq.format(l.q)+" "+(l.u||""),128,y,{align:"right"});T(nf2.format(l.p),160,y,{align:"right"});T(nf2.format(r2(l.q*l.p)),190,y,{align:"right"});y+=Math.max(1,tl.length)*4.5+2;});
  doc.line(120,y,190,y);y+=5;
  T(L("Zwischentotal","Subtotal"),120,y);T(nf2.format(feeSub(f)),190,y,{align:"right"});y+=5;
  if(f.vat){T(L("MWST ","VAT ")+nf1(vrate(f))+" %",120,y);T(nf2.format(feeVat(f)),190,y,{align:"right"});y+=5;}
  font(10,true);T(L("Total CHF","Total CHF"),120,y+1);T(nf2.format(feeTotal(f)),190,y+1,{align:"right"});
  font(9);T(level?L("Zahlbar innert 10 Tagen.","Payable within 10 days."):L("Zahlbar innert "+(f.term||30)+" Tagen netto.","Payable within "+(f.term||30)+" days net."),20,y+1);
  if(!f.vat){font(8);T(L("Nicht MWST-pflichtig.","Not subject to VAT."),20,y+6);}
  // payment part
  const Y=192;
  font(7);T(L("Vor der Einzahlung abzutrennen","Separate before paying in"),105,Y-2,{align:"center"});
  doc.setLineDashPattern([1,1],0);doc.setLineWidth(.2);doc.line(0,Y,210,Y);doc.line(62,Y,62,297);doc.setLineDashPattern([],0);
  const [cs,cb]=splitStreet(F.street),cAddr=[F.name,[cs,cb].filter(Boolean).join(" "),[F.zip,F.city].join(" ")];
  const dAddr=p.client?[p.client,p.cstreet,[p.czip,p.ccity].filter(Boolean).join(" ")].filter(Boolean):[];
  const ref=fmtRefOut(f.refType,f.ref),amt=nf2.format(feeTotal(f)).replace(/’|'/g," ");
  // receipt
  let ry=Y+10;font(11,true);T(L("Empfangsschein","Receipt"),5,ry);ry+=7;
  const blockR=(h,lines)=>{font(6,true);T(h,5,ry);ry+=3.2;font(8);lines.forEach(l=>{T(l,5,ry);ry+=3.5;});ry+=2.5;};
  blockR(L("Konto / Zahlbar an","Account / Payable to"),[fmtIban(F.iban)].concat(cAddr));
  blockR(L("Referenz","Reference"),[ref]);
  blockR(L("Zahlbar durch","Payable by"),dAddr.length?dAddr:[" "]);
  font(6,true);T(L("Währung","Currency"),5,Y+68);T(L("Betrag","Amount"),20,Y+68);font(8);T("CHF",5,Y+72);T(amt,20,Y+72);
  font(6,true);T(L("Annahmestelle","Acceptance point"),57,Y+82,{align:"right"});
  // payment part
  font(11,true);T(L("Zahlteil","Payment part"),67,Y+10);
  qrcode.stringToBytes=qrcode.stringToBytesFuncs["UTF-8"];const q=qrcode(0,"M");q.addData(qrPayload(f),"Byte");q.make();
  const n=q.getModuleCount(),qs=46,m=qs/n,qx=67,qy=Y+17;doc.setFillColor(0,0,0);
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))doc.rect(qx+c*m,qy+r*m,m+.01,m+.01,"F");
  const cx=qx+qs/2,cy=qy+qs/2;doc.setFillColor(255,255,255);doc.rect(cx-3.5,cy-3.5,7,7,"F");doc.setFillColor(0,0,0);doc.rect(cx-3.1,cy-3.1,6.2,6.2,"F");doc.setFillColor(255,255,255);doc.rect(cx-.65,cy-2.2,1.3,4.4,"F");doc.rect(cx-2.2,cy-.65,4.4,1.3,"F");
  font(8,true);T(L("Währung","Currency"),67,Y+68);T(L("Betrag","Amount"),87,Y+68);font(10);T("CHF",67,Y+73);T(amt,87,Y+73);
  let py=Y+10;const blockP=(h,lines)=>{font(8,true);T(h,118,py);py+=4;font(10);lines.forEach(l=>{T(l,118,py);py+=4.4;});py+=2.5;};
  blockP(L("Konto / Zahlbar an","Account / Payable to"),[fmtIban(F.iban)].concat(cAddr));
  blockP(L("Referenz","Reference"),[ref]);
  blockP(L("Zusätzliche Informationen","Additional information"),[L("Rechnung ","Invoice ")+f.no]);
  blockP(L("Zahlbar durch","Payable by"),dAddr.length?dAddr:[" "]);
  const name=(level?L("Mahnung-","Reminder-")+level+"-":L("Rechnung-","Invoice-"))+String(f.no).replace(/[^\w-]/g,"_")+".pdf";
  saveBlob(name,doc.output("blob"));
}

const withP=(pid,fn)=>{const o=D.pid;D.pid=pid;try{return fn();}finally{D.pid=o;}};
/* clears only this data space's files; returns a promise so new files are written after the old ones are gone */
function clearFiles(){return FDB.keys().then(ks=>FDB.open().then(db=>new Promise(ok=>{const t=db.transaction("files","readwrite"),st=t.objectStore("files");ks.forEach(k=>st.delete(k));t.oncomplete=ok;t.onerror=ok;}))).catch(()=>{});}
/* removes stored files no document points to any more (deleted documents, purged projects) */
function sweepFiles(){FDB.keys().then(ks=>{const used=new Set(DOCS().map(d=>FDB.key(d.id)));ks.filter(k=>!used.has(k)).forEach(k=>FDB.open().then(db=>{db.transaction("files","readwrite").objectStore("files").delete(k);}));}).catch(()=>{});}
