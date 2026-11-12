/* arkitecton web app MVP
   Static, no build step. Data is kept in this browser (localStorage).
   Libraries: SheetJS (Excel), jsQR (QR codes). */
(function(){
"use strict";

/* ---------- dates ---------- */
const TODAY=(()=>{const d=new Date();d.setHours(0,0,0,0);return d;})();
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const toDate=s=>{const[y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d);};
const addDays=(s,n)=>{const d=toDate(s);d.setDate(d.getDate()+n);return iso(d);};
const fdate=s=>{if(!s)return "–";const d=toDate(s);return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."+d.getFullYear();};
const daysTo=s=>Math.round((toDate(s)-TODAY)/86400000);

/* ---------- text and numbers ---------- */
const S={lang:"de",view:"uebersicht",filter:"pruefen",drawer:null,queryOpen:false,modal:null,sheet:null,form:null,confirm:null,
  kid:null,wid:null,kOpen:null,ktab:"konto",cmpAll:false,tid:null,ttab:"verfahren",allFlags:false,done:null};
const L=(de,en)=>S.lang==="de"?de:en;
const nf2=new Intl.NumberFormat("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
const nf0=new Intl.NumberFormat("de-CH",{maximumFractionDigits:0});
const nfq=new Intl.NumberFormat("de-CH",{maximumFractionDigits:2});
const chf=(n,dec)=>"CHF "+(dec===false?nf0:nf2).format(n);
const sgn=n=>(n>0?"+":"")+nf2.format(n);
const r2=n=>Math.round(n*100)/100;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s||"").replace(/\s+/g,"").toUpperCase();
const fmtIban=s=>norm(s).replace(/(.{4})/g,"$1 ").trim();
const fmtRef=s=>{const n=norm(s);return /^\d{27}$/.test(n)?n.slice(0,2)+" "+n.slice(2).replace(/(.{5})/g,"$1 ").trim():n.replace(/(.{4})/g,"$1 ").trim();};
const num=v=>{if(typeof v==="number")return v;let s=String(v==null?"":v).replace(/[\s'’`]|chf/gi,"");if(s.includes(",")&&!s.includes("."))s=s.replace(",",".");else s=s.replace(/,/g,"");const n=parseFloat(s);return isNaN(n)?null:n;};
const tx=o=>o?(S.lang==="de"?o.de:(o.en||o.de)):"";

/* ---------- reference lists ---------- */
const STD_BKP=[["211","Baumeisterarbeiten","Building shell works"],["214","Montagebau in Holz","Timber construction"],["221","Fenster, Aussentüren","Windows, exterior doors"],["222","Spenglerarbeiten","Sheet metal works"],["224","Bedachungsarbeiten","Roofing"],["226","Fassadenputze","Facade plaster"],["230","Elektroanlagen","Electrical installations"],["240","Heizung, Lüftung, Klima","Heating, ventilation, air conditioning"],["250","Sanitäranlagen","Plumbing"],["258","Kücheneinrichtungen","Kitchens"],["271","Gipserarbeiten","Plastering"],["272","Metallbauarbeiten","Metalwork"],["273","Schreinerarbeiten","Joinery"],["281","Bodenbeläge","Floor coverings"],["285","Malerarbeiten","Painting"],["287","Baureinigung","Construction cleaning"]];
const DISC={"291":{de:"Architektur/Baumanagement",en:"Architecture/construction management"},"292":{de:"Bauingenieurwesen",en:"Structural engineering"}};
const RTYPE={schule:{de:"Schulbauten",en:"School buildings"},instandsetzung:{de:"Instandsetzung",en:"Refurbishment"},wohnen:{de:"Wohnbauten",en:"Housing"}};
const PROC={sel:{de:"Selektiv, Präqualifikation",en:"Selective, prequalification"},offen:{de:"Offenes Verfahren",en:"Open procedure"}};
const TST={neu:{de:"Neu",en:"New",c:"acc"},arbeit:{de:"In Arbeit",en:"In progress",c:"warn"},eingereicht:{de:"Eingereicht",en:"Submitted",c:"ok"},verzichtet:{de:"Verzichtet",en:"Declined",c:"n"}};
const FIT={ok:{de:"Erfüllt",en:"Eligible",c:"ok"},partner:{de:"Mit Partner",en:"With partner",c:"warn"},no:{de:"Nicht erfüllt",en:"Not eligible",c:"crit"}};
const STATUS={pruefen:{de:"Zu prüfen",en:"To check",c:"warn"},rueckfrage:{de:"Rückfrage",en:"Query open",c:"crit"},frei:{de:"Freigegeben",en:"Approved",c:"acc"},bezahlt:{de:"Bezahlt",en:"Paid",c:"ok"},ersetzt:{de:"Ersetzt",en:"Replaced",c:"n"}};

/* ---------- example data (dates relative to today) ---------- */
function seedTenders(){
  const A3={id:"d4",de:"2 A3-Blätter «Zugang zur Aufgabe»",en:"2 A3 sheets “Approach to the task”"};
  const t0=iso(TODAY);
  return {
    office:{disc:["291"],
      team:[{role:{de:"Projektleiter",en:"Project lead"},qual:"dipl. Architekt FH",years:18,tags:["pl"]},{role:{de:"Bauleiter",en:"Site manager"},qual:"Bauleiter Hochbau mit eidg. Fachausweis",years:12,tags:["bl"]},{role:{de:"Architekt",en:"Architect"},qual:"MSc ETH Architektur",years:6,tags:[]}],
      refs:[
        {id:"r1",de:"Erweiterung Schulhaus, Horgen",en:"School extension, Horgen",client:"Schulgemeinde",pub:true,type:"schule",year:2024,cost:6.8,phases:"31–53"},
        {id:"r2",de:"Instandsetzung Wohnsiedlung, Thalwil",en:"Housing estate refurbishment, Thalwil",client:"Wohnbaugenossenschaft",pub:false,type:"instandsetzung",year:2022,cost:4.2,phases:"31–53"},
        {id:"r3",de:"Neubau Doppelkindergarten, Adliswil",en:"New double kindergarten, Adliswil",client:"Schulgemeinde",pub:true,type:"schule",year:2021,cost:2.9,phases:"32–53"},
        {id:"r4",de:"Umbau Gemeindehaus, Rüschlikon",en:"Town hall conversion, Rüschlikon",client:"Politische Gemeinde",pub:true,type:"instandsetzung",year:2019,cost:1.6,phases:"41–53"}]},
    tenders:[
      {id:"t1",title:{de:"Instandsetzung Schulanlage",en:"School complex refurbishment"},client:"Stadt Zürich, Amt für Hochbauten",proc:"sel",phases:"31–53",cost:9.5,qDue:addDays(t0,9),due:addDays(t0,23),status:"neu",
        reqs:[{k:"refs",n:2,since:2016,minCost:2.5,pub:true,types:["schule","instandsetzung"]},{k:"team",tag:"bl"},{k:"disc",need:["291"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"},A3],done:{}},
      {id:"t2",title:{de:"Rahmenvertrag Kleinprojekte",en:"Framework contract, small projects"},client:"Stadt Zürich, Amt für Hochbauten",proc:"sel",phases:"31–53",cost:3,qDue:addDays(t0,-1),due:addDays(t0,16),status:"arbeit",
        reqs:[{k:"refs",n:1,since:2019,minCost:1,pub:true,types:null},{k:"team",tag:"pl"},{k:"disc",need:["291"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"},A3],done:{d3:true}},
      {id:"t3",title:{de:"Neubau Kindergarten",en:"New kindergarten"},client:"Gemeinde Kilchberg",proc:"offen",phases:"31–53",cost:7.2,qDue:addDays(t0,14),due:addDays(t0,34),status:"neu",
        reqs:[{k:"refs",n:1,since:2016,minCost:2.5,pub:true,types:["schule"]},{k:"team",tag:"bl"},{k:"disc",need:["291","292"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"},{id:"d5",de:"Partnerbüro Bauingenieurwesen",en:"Structural engineering partner"},{id:"d6",de:"Honorarangebot SIA 102",en:"Fee offer SIA 102"}],done:{}},
      {id:"t4",title:{de:"Instandsetzung Verwaltungsgebäude",en:"Office building refurbishment"},client:"Kanton Zürich, Hochbauamt",proc:"sel",phases:"31–53",cost:28,qDue:addDays(t0,13),due:addDays(t0,29),status:"neu",
        reqs:[{k:"refs",n:2,since:2014,minCost:15,pub:true,types:null},{k:"team",tag:"bl"},{k:"disc",need:["291"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"}],done:{}}
    ]};
}
function seedExample(){
  const t0=iso(TODAY), d=n=>addDays(t0,n);
  const tt=seedTenders();
  return {v:1,seq:100,events:[],pid:"p1",firm:{name:L("Beispiel Architekten GmbH","Example Architects Ltd")},
    projects:[{id:"p1",name:"MFH Seestrasse 12",place:"Wädenswil",client:"Familie Graf",desc:L("Neubau, 8 Wohnungen","New build, 8 flats"),
      budget:[["211",420000],["221",96000],["224",58000],["230",74000],["250",88000],["271",41000],["281",52000],["285",36000]].map(([b,kv])=>{const s=STD_BKP.find(x=>x[0]===b);return {bkp:b,de:s[1],en:s[2],kv};})},
      {id:"p2",name:"EFH Bergstrasse 4",place:"Horgen",client:"Herr und Frau Keller",desc:L("Umbau Einfamilienhaus","Single-family house conversion"),
      budget:[["221",28000],["285",14000]].map(([b,kv])=>{const s=STD_BKP.find(x=>x[0]===b);return {bkp:b,de:s[1],en:s[2],kv};})}],
    contractors:[
      {id:"k1",name:"Keller Bau AG",street:"Zugerstrasse 41",zip:"8810",city:"Horgen",iban:"CH93 0076 2011 6238 5295 7",email:"buchhaltung@keller-bau.example",phone:"044 725 11 20"},
      {id:"k2",name:"Fenster Frei AG",street:"Industriestrasse 7",zip:"8820",city:"Wädenswil",iban:"CH56 0483 5012 3456 7800 9",email:"info@fensterfrei.example",phone:"044 780 40 40"},
      {id:"k3",name:"Elektro Brunner AG",street:"Seestrasse 210",zip:"8800",city:"Thalwil",iban:"CH21 0900 0000 8765 4321 0",email:"rechnung@brunner-elektro.example",phone:"044 720 33 10"},
      {id:"k4",name:"Sanitär Huber & Co.",street:"Bahnhofstrasse 3",zip:"8805",city:"Richterswil",iban:"CH38 0070 0110 0012 3456 1",email:"huber@sanitaer-huber.example",phone:"044 784 22 05"},
      {id:"k5",name:"Gipserei Rossi GmbH",street:"Hohlstrasse 120",zip:"8004",city:"Zürich",iban:"",email:"office@gipserei-rossi.example",phone:"044 241 18 77"},
      {id:"k6",name:"Meier Malerei GmbH",street:"",zip:"",city:"",iban:"",email:"",phone:"079 412 66 30"}],
    contracts:[
      {id:"w1",pid:"p1",k:"k1",bkp:"211",sum:412500,ret:10},
      {id:"w2",pid:"p1",k:"k2",bkp:"221",sum:98700,ret:10,
        offer:[{pos:"1",text:"Holz-Metall-Fenster, 2-flüglig",unit:"Stk",qty:24,price:2150},{pos:"2",text:"Hebeschiebetüren Balkon",unit:"Stk",qty:8,price:3900},{pos:"3",text:"Hauseingangstür",unit:"Stk",qty:1,price:6400},{pos:"4",text:"Fensterbänke aussen, Aluminium",unit:"m",qty:62,price:85},{pos:"5",text:"Montage und Abdichtung",unit:"pauschal",qty:1,price:4230}],
        final:[{pos:"1",text:"Holz-Metall-Fenster, 2-flüglig",unit:"Stk",qty:24,price:2150},{pos:"2",text:"Hebeschiebetüren Balkon",unit:"Stk",qty:8,price:3900},{pos:"3",text:"Hauseingangstür",unit:"Stk",qty:1,price:6400},{pos:"4",text:"Fensterbänke aussen, Aluminium",unit:"m",qty:68,price:85},{pos:"5",text:"Montage und Abdichtung",unit:"pauschal",qty:1,price:4230},{pos:"6",text:"Insektenschutzrollos",unit:"Stk",qty:8,price:290}]},
      {id:"w3",pid:"p1",k:"k3",bkp:"230",sum:71200,ret:10},
      {id:"w4",pid:"p1",k:"k4",bkp:"250",sum:86400,ret:10},
      {id:"w5",pid:"p1",k:"k5",bkp:"271",sum:39800,ret:10},
      {id:"w6",pid:"p1",k:"k6",bkp:"285",sum:34600,ret:10},
      {id:"w7",pid:"p2",k:"k6",bkp:"285",sum:12300,ret:10},
      {id:"w8",pid:"p2",k:"k2",bkp:"221",sum:26400,ret:10}],
    invoices:[
      {id:"i1",no:"AK-031",w:"w1",type:"akonto",n:1,date:d(-134),due:d(-104),gross:120000,status:"bezahlt",ref:"21 00000 00001 10233 41100 00012"},
      {id:"i2",no:"AK-058",w:"w1",type:"akonto",n:2,date:d(-72),due:d(-42),gross:135000,status:"bezahlt",ref:"21 00000 00001 10233 41100 00027"},
      {id:"i3",no:"AK-077",w:"w1",type:"akonto",n:3,date:d(-11),due:d(19),gross:98000,status:"frei",ref:"21 00000 00001 10233 41100 00033"},
      {id:"i4",no:"R-4471",w:"w2",type:"akonto",n:1,date:d(-57),due:d(-27),gross:49350,status:"bezahlt",ref:"RF18 5390 0754 7034"},
      {id:"i10",no:"R-4612",w:"w2",type:"schluss",n:0,date:d(-5),due:d(25),gross:52180,status:"pruefen",ref:"RF45 5390 0754 7102"},
      {id:"i5",no:"EB-1180",w:"w3",type:"akonto",n:1,date:d(-14),due:d(7),gross:28000,status:"pruefen",ref:"21 00000 00007 77812 00450 11802"},
      {id:"i6",no:"2026/0912",w:"w4",type:"akonto",n:1,date:d(-9),due:d(21),gross:30000,status:"pruefen",ref:"21 00000 00009 31200 20260 09125"},
      {id:"i7",no:"EB-1194",w:"w3",type:"regie",n:0,date:d(-7),due:d(14),gross:3840,status:"pruefen",ref:"21 00000 00007 77812 00450 11949"},
      {id:"i11",no:"MM-2026-088",w:"w7",type:"akonto",n:1,date:d(-18),due:d(12),gross:6000,status:"frei",ref:"21 00000 00004 40021 88000 00881"},
      {id:"i12",no:"R-4590",w:"w8",type:"akonto",n:1,date:d(-30),due:d(0),gross:13200,status:"bezahlt",ref:"RF71 5390 0754 7088"},
      {id:"i8",no:"GR-0233",w:"w5",type:"akonto",n:1,date:d(-22),due:d(9),gross:15000,status:"rueckfrage",ref:""}],
    office:tt.office,tenders:tt.tenders,example:true};
}
function seedEmpty(){const tt=seedTenders();return {v:1,seq:100,events:[],pid:null,firm:{name:""},projects:[],contractors:[],contracts:[],invoices:[],office:tt.office,tenders:tt.tenders,example:false};}
const SAMPLE={name:"Meier Malerei GmbH",street:"Zürcherstrasse 88",zip:"8820",city:"Wädenswil",iban:"CH44 3199 9123 0008 8901 2",amount:12450,ref:"21 00000 00003 13947 14300 09017",no:"2026-417"};
const EX_OFFER=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1420,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:42,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410}];
const EX_FINAL=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1465,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:44,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410},{pos:"5",text:"Ausbesserungen nach Elektriker",unit:"h",qty:6,price:98}];

/* ---------- storage ---------- */
const KEY="arkitecton:data:v1";
let D=null;
function loadData(){try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(o&&o.v===1)return o;}}catch(e){}return null;}
function saveData(){if(!D)return;try{localStorage.setItem(KEY,JSON.stringify(D));}catch(e){}}
const newId=p=>p+(++D.seq);

/* ---------- accessors ---------- */
const P=()=>D.projects.find(p=>p.id===D.pid)||null;
const K=id=>D.contractors.find(c=>c.id===id);
const W=id=>D.contracts.find(c=>c.id===id);
const INV=id=>D.invoices.find(i=>i.id===id);
const T=id=>D.tenders.find(t=>t.id===id);
const PC=()=>{const p=P();return p?D.contracts.filter(w=>w.pid===p.id):[];};
const PIx=()=>{const ids=PC().map(w=>w.id);return D.invoices.filter(i=>ids.includes(i.w));};
const PI=()=>PIx().filter(live);
const CW=kid=>PC().find(w=>w.k===kid)||null;
const B=bkp=>{const p=P();return p?p.budget.find(b=>b.bkp===bkp):null;};
const bName=bkp=>{const b=B(bkp);if(b)return tx(b);const s=STD_BKP.find(x=>x[0]===bkp);return s?(S.lang==="de"?s[1]:s[2]):"";};
const projTitle=pp=>{const p=pp||P();return p?p.name+(p.place?", "+p.place:""):"";};
const PJ=id=>D.projects.find(p=>p.id===id)||null;
const KC=kid=>D.contracts.filter(w=>w.k===kid);
const counted=i=>i.status==="frei"||i.status==="bezahlt";
const sumLines=ls=>r2((ls||[]).reduce((a,l)=>a+l.qty*l.price,0));
const retPct=w=>w&&typeof w.ret==="number"?w.ret:10;
const net=i=>r2(i.gross-(i.ded&&i.ded.amt?i.ded.amt:0));
const live=i=>i.status!=="ersetzt";
function retention(i){
  const w=W(i.w);
  if(i.type==="akonto") return r2(net(i)*retPct(w)/100);
  if(i.type==="schluss") return -r2(D.invoices.filter(x=>x.w===i.w&&x.type==="akonto"&&counted(x)).reduce((a,x)=>a+r2(net(x)*retPct(w)/100),0));
  return 0;
}
const payout=i=>r2(net(i)-retention(i));
const missingOf=k=>{const m=[];if(!k.street||!k.zip||!k.city)m.push(L("Adresse","Address"));if(!k.iban)m.push("IBAN");if(!k.email)m.push(L("E-Mail","Email"));return m;};
const typeLabel=i=>i.type==="akonto"?L("Akonto ","Progress payment ")+i.n:i.type==="regie"?L("Regie","Time & materials"):L("Schlussrechnung","Final invoice");
const stLabel=st=>tx(STATUS[st]);
const billedOn=(wid,except)=>D.invoices.filter(i=>i.w===wid&&i.id!==except&&counted(i)).reduce((a,i)=>a+net(i),0);
const dot=c=>`<i class="dot d-${c}" aria-hidden="true"></i>`;
const row=o=>`<button type="button" class="row" data-act="${o.act}"${o.id?` data-id="${o.id}"`:""}${o.v?` data-v="${o.v}"`:""}>${dot(o.c)}<span class="rt">${o.title}</span>${o.meta!==undefined?`<span class="rm">${o.meta}</span>`:""}<span class="ra">${o.amt||""}</span><span class="rl l-${o.lc||o.c}">${o.label||""}</span></button>`;

function compare(w){
  if(!w||!w.offer) return null;
  const fin=w.final||null, rows=[];
  w.offer.forEach(o=>{
    const f=fin?fin.find(x=>String(x.pos)===String(o.pos)):null;
    const oa=r2(o.qty*o.price), fa=f?r2(f.qty*f.price):(fin?0:null);
    rows.push({pos:o.pos,text:o.text,unit:o.unit,oq:o.qty,fq:f?f.qty:(fin?0:null),oa,fa,diff:fa===null?null:r2(fa-oa),kind:!fin?"offer":!f?"missing":fa>oa?"more":fa<oa?"less":"same"});
  });
  if(fin) fin.filter(f=>!w.offer.some(o=>String(o.pos)===String(f.pos))).forEach(f=>{const fa=r2(f.qty*f.price);rows.push({pos:f.pos,text:f.text,unit:f.unit,oq:null,fq:f.qty,oa:0,fa,diff:fa,kind:"new"});});
  const ot=sumLines(w.offer), ft=fin?sumLines(fin):null;
  return {rows,ot,ft,diff:ft===null?null:r2(ft-ot),hasFinal:!!fin,changed:rows.filter(r=>r.kind!=="same"&&r.kind!=="offer").length,newSum:r2(rows.filter(r=>r.kind==="new").reduce((a,r)=>a+r.fa,0))};
}
function budgetRows(){
  const p=P(); if(!p) return [];
  return p.budget.map(b=>{
    const ws=PC().filter(w=>w.bkp===b.bkp), ids=ws.map(w=>w.id), inv=D.invoices.filter(i=>ids.includes(i.w));
    const awarded=ws.reduce((a,w)=>a+w.sum,0), billed=inv.filter(counted).reduce((a,i)=>a+net(i),0);
    const paid=inv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0), approved=inv.filter(i=>i.status==="frei").reduce((a,i)=>a+payout(i),0);
    const open=inv.filter(i=>!counted(i)).reduce((a,i)=>a+net(i),0), ret=inv.filter(counted).reduce((a,i)=>a+retention(i),0);
    const forecast=Math.max(awarded,billed);
    return {b,awarded,billed,paid,approved,open,ret,rest:b.kv-forecast,over:b.kv>0&&forecast>b.kv};
  });
}
function totals(rows){const t={kv:0,awarded:0,billed:0,paid:0,approved:0,open:0,ret:0,rest:0};rows.forEach(r=>{for(const k in t)t[k]+=k==="kv"?r.b.kv:r[k];});return t;}
function flags(){
  const out=[], p=P(); if(!p) return out;
  D.events.filter(e=>e.pid===p.id).forEach(e=>out.push(e));
  PI().filter(i=>!counted(i)).forEach(i=>{
    const w=W(i.w),k=K(w.k);
    if(w.sum>0){const over=r2(billedOn(w.id,i.id)+net(i)-w.sum);if(over>0)out.push({c:"warn",t:k.name,m:L("über Werkvertrag","above contract"),chf:over,act:"open-inv",id:i.id});}
    if(i.type==="regie") out.push({c:"warn",t:k.name,m:L("Regie ausserhalb Werkvertrag","time & materials outside contract"),chf:i.gross,act:"open-inv",id:i.id});
  });
  PC().forEach(w=>{const c=compare(w);if(c&&c.hasFinal&&c.newSum>0)out.push({c:"warn",t:K(w.k).name,m:L("nicht offerierte Positionen","items not in the offer"),chf:c.newSum,act:"open-cmp",id:w.id});});
  budgetRows().filter(r=>r.over).forEach(r=>out.push({c:"warn",t:"BKP "+r.b.bkp+" "+tx(r.b),m:L("über Kostenvoranschlag","over cost estimate"),chf:-r.rest,act:"nav",v:"budget"}));
  const ks=[...new Set(PC().map(w=>w.k))].map(K).filter(Boolean);
  ks.forEach(k=>{const m=missingOf(k);if(m.length)out.push({c:"crit",t:k.name,m:L("fehlt: ","missing: ")+m.join(", "),chf:null,act:"open-k",id:k.id});});
  return out;
}

/* ---------- tenders ---------- */
const mio=n=>"CHF "+nfq.format(n)+" Mio.";
const closedT=t=>t.status==="eingereicht"||t.status==="verzichtet";
const discName=d=>"BKP "+d+" "+tx(DISC[d]);
function evalReq(r){
  const O=D.office;
  if(r.k==="refs"){
    const m=O.refs.filter(x=>!x.running&&x.year>=r.since&&x.cost>=r.minCost&&(!r.pub||x.pub)&&(!r.types||r.types.includes(x.type))).sort((a,b)=>b.year-a.year);
    const best=Math.max(0,...O.refs.filter(x=>!x.running).map(x=>x.cost));
    const crit=[L("seit ","since ")+r.since,L("ab ","from ")+mio(r.minCost)].concat(r.pub?[L("öffentlich","public")]:[],r.types?[r.types.map(x=>tx(RTYPE[x])).join(L(" oder "," or "))]:[]).join(" · ");
    const ok=m.length>=r.n;
    return {k:"refs",s:ok?"ok":"crit",refs:m.slice(0,r.n),t:r.n+" "+(r.n>1?L("Referenzen","references"):L("Referenz","reference"))+" ("+crit+")",res:ok?m.slice(0,r.n).map(x=>tx(x)).join(", "):L("Nur "+m.length+" passend. Grösstes Projekt "+mio(best),"Only "+m.length+" matching. Largest project "+mio(best))};
  }
  if(r.k==="team"){
    const lab={bl:L("Bauleiter mit eidg. Fachausweis","Site manager, federal certificate"),pl:L("Projektleiter, öffentliche Bauten","Project lead, public buildings")}[r.tag];
    const has=O.team.find(x=>x.tags.includes(r.tag));
    return {k:"team",s:has?"ok":"crit",t:lab,res:has?has.qual+", "+has.years+L(" Jahre"," years"):L("Fehlt im Team","Missing in the team")};
  }
  const miss=r.need.filter(d=>!O.disc.includes(d));
  return {k:"disc",s:miss.length?"warn":"ok",t:r.need.map(discName).join(", "),res:miss.length?L("Partner nötig: ","Partner needed: ")+miss.map(discName).join(", "):L("Im eigenen Büro","In your own office")};
}
function fitOf(t){const ev=t.reqs.map(evalReq);return {ev,fit:ev.some(e=>e.s==="crit")?"no":ev.some(e=>e.s==="warn")?"partner":"ok"};}
function docsOf(t){
  const ev=fitOf(t).ev;
  return t.docs.map(d=>{
    if(d.auto==="refs"){const e=ev.find(x=>x.k==="refs"),ok=!!e&&e.s==="ok";return {id:d.id,auto:true,done:ok,t:L("Referenzblätter","Reference sheets"),sub:ok?e.refs.map(x=>tx(x)).join(", "):L("Zu wenig passende Referenzen","Not enough matching references")};}
    if(d.auto==="team"){const m=D.office.team.filter(x=>x.tags.length);return {id:d.id,auto:true,done:true,t:L("Schlüsselpersonen","Key people"),sub:m.map(x=>tx(x.role)).join(", ")};}
    if(d.auto==="self")return {id:d.id,auto:false,done:!!t.done[d.id],t:L("Selbstdeklaration","Self-declaration"),sub:L("Vorausgefüllt, unterschreiben","Pre-filled, sign it")};
    return {id:d.id,auto:false,done:!!t.done[d.id],t:tx(d),sub:""};
  });
}

/* ---------- chrome ---------- */
const VIEWS=["uebersicht","rechnungen","handwerker","budget","ausschreibungen"];
const vName=v=>({uebersicht:L("Übersicht","Overview"),rechnungen:L("Rechnungen","Invoices"),handwerker:L("Handwerker","Contractors"),budget:"Budget",ausschreibungen:L("Ausschreibungen","Tenders")})[v];
const SCAN_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 13v3"/></svg>';
function renderChrome(){
  document.documentElement.lang=S.lang;
  const p=P();
  document.getElementById("railScan").textContent=L("Rechnung scannen","Scan invoice");
  document.getElementById("railProj").innerHTML=`<span class="l">${L("Projekt","Project")}</span><span class="n">${p?esc(p.name):L("Kein Projekt","No project")}</span>`;
  document.getElementById("topProj").textContent=p?p.name:L("Kein Projekt","No project");
  document.getElementById("railData").textContent=L("Daten und Sicherung","Data and backup");
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.l===S.lang)));
  const nb=v=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${vName(v)}</button>`;
  document.getElementById("nav").innerHTML=["uebersicht","rechnungen","handwerker","budget"].map(nb).join("")+'<div class="sep"></div>'+nb("ausschreibungen");
  const tb=(v,l)=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${l}</button>`;
  document.getElementById("tabbar").innerHTML=tb("uebersicht",L("Heute","Today"))+tb("rechnungen",L("Rechnungen","Invoices"))+`<button type="button" class="fab" data-act="capture" aria-label="${L("Rechnung scannen","Scan invoice")}">${SCAN_ICON}</button>`+tb("handwerker",L("Handwerker","Contractors"))+tb("budget","Budget");
}
const ph=(eyebrow,title,lead,tools)=>`<header class="ph"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${tools?`<div class="tools">${tools}</div>`:"<span></span>"}${lead?`<p class="lead">${lead}</p>`:""}</header>`;
const ICO={
copy:'<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
share:'<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
edit:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14 7 3 3"/>',
trash:'<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
flag:'<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;
const ib=(n,label,attrs)=>`<button type="button" class="ib" title="${label}" aria-label="${label}" ${attrs||""}>${ico(n)}</button>`;
const excelBtn=key=>`<button type="button" class="btn" data-act="sheet" data-k="${key}">Excel</button>`;
const noProject=()=>`<div class="page">${ph("",L("Noch kein Projekt","No project yet"),"")}<div class="empty"><span>${L("Legen Sie Ihr erstes Projekt an.","Create your first project.")}</span><button type="button" class="btn primary" data-act="form" data-f="project">${L("Projekt anlegen","Create project")}</button></div></div>`;

/* ---------- views ---------- */
function viewWelcome(){
  return `<div class="welcome"><div class="box">
    <div class="word"><svg viewBox="0 0 30 30" aria-hidden="true" style="width:26px;height:26px"><rect class="mk-ink" x="3" y="20" width="24" height="7"/><rect class="mk-ink" x="7" y="9" width="9" height="11"/><rect class="mk-ink" x="16" y="14" width="7" height="6"/><rect class="mk-red" x="16" y="3" width="6" height="6"/></svg>arkitecton</div>
    <h1>${L("Bauadministration, die mitdenkt.","Construction admin that thinks along.")}</h1>
    <div class="acts">
      <button type="button" class="btn primary block" data-act="start-example">${L("Mit Beispielprojekt starten","Start with an example project")}</button>
      <button type="button" class="btn block" data-act="start-empty">${L("Leer starten","Start empty")}</button>
    </div>
    <span class="fine">${L("Testversion. Ihre Daten bleiben in diesem Browser auf diesem Gerät.","Test version. Your data stays in this browser on this device.")}</span>
  </div></div>`;
}

function viewOverview(){
  const p=P(); if(!p) return noProject();
  const t=totals(budgetRows());
  const toCheck=PI().filter(i=>!counted(i)).sort((a,b)=>toDate(a.due)-toDate(b.due));
  const openSum=toCheck.reduce((a,i)=>a+i.gross,0);
  const fl=flags(), flSum=fl.reduce((a,f)=>a+(f.chf||0),0);
  const used=t.paid+t.approved, pct=t.kv?Math.round(used/t.kv*100):0;
  const tTodo=D.tenders.filter(x=>!closedT(x)&&fitOf(x).fit!=="no"&&daysTo(x.due)>=0&&daysTo(x.due)<=28).sort((a,b)=>toDate(a.due)-toDate(b.due));
  const todo=toCheck.map(i=>{const k=K(W(i.w).k),dd=daysTo(i.due);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:esc(k.name),meta:typeLabel(i),amt:chf(i.gross,false),label:dd<0?L("überfällig","overdue"):L(dd+" Tage",dd+" days"),lc:dd<=7?"warn":"n"});}).join("")
    +tTodo.map(x=>row({act:"open-t",id:x.id,c:"acc",title:esc(tx(x.title)),meta:L("Ausschreibung","Tender"),amt:"",label:L("Eingabe in "+daysTo(x.due)+" T.","due in "+daysTo(x.due)+" d"),lc:"n"})).join("");
  const shown=S.allFlags?fl:fl.slice(0,3);
  const flagRows=shown.map(f=>row({act:f.act,id:f.id,v:f.v,c:f.c,title:esc(f.t),meta:esc(f.m),amt:f.chf===null?"":chf(f.chf,false),label:""})).join("");
  const today=TODAY.toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{weekday:"long",day:"numeric",month:"long"});
  return `<div class="page">
    ${ph(esc(today),esc(p.name),esc([p.place,p.desc].filter(Boolean).join(" · ")))}
    <div class="stats">
      <button type="button" class="stat" data-act="nav" data-v="rechnungen"><span class="sl">${L("Zu prüfen","To check")}</span><span class="sv">${chf(openSum,false)}</span><span class="ss">${toCheck.length} ${toCheck.length===1?L("Rechnung","invoice"):L("Rechnungen","invoices")}</span></button>
      <button type="button" class="stat" data-act="jump-flags"><span class="sl">${L("Von arkitecton gefunden","Found by arkitecton")}</span><span class="sv${fl.length?" warn":""}">${fl.length}</span><span class="ss">${L("Auffälligkeiten","issues")} · ${chf(flSum,false)}</span></button>
      <button type="button" class="stat" data-act="nav" data-v="budget"><span class="sl">${L("Kostenstand","Cost status")}</span><span class="sv">${t.kv?pct+"%":"–"}</span><span class="ss"><span class="mini"><i style="width:${Math.min(100,pct)}%"></i></span>${t.kv?L("von","of")+" "+chf(t.kv,false):L("kein Budget","no budget")}</span></button>
    </div>
    <section><div class="sh"><h2>${L("Zu erledigen","To do")}</h2><span class="cnt">${toCheck.length+tTodo.length}</span></div><div class="rows">${todo||`<div class="empty">${L("Alles erledigt.","All done.")}</div>`}</div></section>
    <section id="flags"><div class="sh"><h2>${L("Gefunden","Found")}</h2><span class="cnt">${fl.length}</span></div><div class="rows">${flagRows||`<div class="empty">${L("Nichts Auffälliges.","Nothing unusual.")}</div>`}</div>
      ${fl.length>3?`<button type="button" class="more" data-act="all-flags">${S.allFlags?L("Weniger anzeigen","Show less"):L("Alle "+fl.length+" anzeigen","Show all "+fl.length)}</button>`:""}</section>
  </div>`;
}

function viewInvoices(){
  const p=P(); if(!p) return noProject();
  const F=["pruefen","rueckfrage","frei","bezahlt","all"], all=PIx();
  const cnt=f=>f==="all"?all.length:all.filter(i=>i.status===f).length;
  const list=all.filter(i=>S.filter==="all"||i.status===S.filter).slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const rows=list.map(i=>{const w=W(i.w),k=K(w.k);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:esc(k.name),meta:typeLabel(i)+" · "+esc(i.no),amt:chf(i.gross,false),label:stLabel(i.status)});}).join("");
  return `<div class="page">
    ${ph(esc(p.name),L("Rechnungen","Invoices"),"",`<button type="button" class="btn" data-act="form" data-f="invoice">${L("+ Erfassen","+ Add")}</button>`+excelBtn("rechnungen"))}
    <div class="tabs" role="tablist">${F.map(f=>`<button type="button" role="tab" data-act="filter" data-f="${f}" aria-selected="${S.filter===f}">${f==="all"?L("Alle","All"):stLabel(f)}<span class="c">${cnt(f)}</span></button>`).join("")}</div>
    <section><div class="rows">${rows||`<div class="empty">${L("Keine Rechnungen.","No invoices.")}</div>`}</div></section>
  </div>`;
}

function viewContractors(){
  if(S.kid&&K(S.kid)) return viewContractor(K(S.kid));
  const p=P();
  const sorted=D.contractors.slice().sort((a,b)=>(!!CW(b.id))-(!!CW(a.id))||a.name.localeCompare(b.name));
  const rows=sorted.map(k=>{const m=missingOf(k),ws=PC().filter(w=>w.k===k.id),w=ws[0],sum=ws.reduce((a,x)=>a+(x.sum||0),0);
    return row({act:"open-k",id:k.id,c:m.length?"crit":"ok",title:esc(k.name),meta:ws.length>1?ws.map(x=>"BKP "+x.bkp).join(", "):w?"BKP "+w.bkp+" "+esc(bName(w.bkp)):L("nicht in diesem Projekt","not in this project"),amt:sum?chf(sum,false):"",label:m.length?L(m.length+" fehlt",m.length+" missing"):L("Vollständig","Complete")});}).join("");
  return `<div class="page">
    ${ph(p?esc(p.name):L("Büro","Office"),L("Handwerker","Contractors"),"",`<button type="button" class="btn" data-act="form" data-f="contractor">${L("+ Neu","+ New")}</button>`+excelBtn("handwerker"))}
    <section><div class="rows">${rows||`<div class="empty">${L("Noch keine Handwerker. Scannen Sie eine QR-Rechnung oder legen Sie einen an.","No contractors yet. Scan a QR-bill or add one.")}</div>`}</div></section>
  </div>`;
}

function cmpBody(w){
  const c=compare(w);
  if(!c) return `<section><div class="empty"><span>${L("Noch keine Offerte.","No offer yet.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap"><label class="btn primary">${L("Offerte aus Excel","Offer from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label>${D.example&&w.id==="w6"?`<button type="button" class="btn" data-act="ex-offer">${L("Beispiel laden","Load example")}</button>`:""}<button type="button" class="btn" data-act="x-template">${L("Leere Vorlage","Blank template")}</button></div></div></section>`;
  const list=c.rows.filter(r=>S.cmpAll||!c.hasFinal||r.kind!=="same");
  const q=r=>r.kind==="new"?L("nicht offeriert","not in offer"):r.kind==="missing"?L("nicht abgerechnet","not billed"):c.hasFinal?nfq.format(r.oq)+" → "+nfq.format(r.fq)+" "+esc(r.unit||""):nfq.format(r.oq)+" "+esc(r.unit||"");
  const rows=list.map(r=>`<div class="row static">${dot(r.kind==="new"?"crit":r.kind==="more"?"warn":r.kind==="less"?"ok":"n")}<span class="rt">${esc(r.text)}<span class="q">${q(r)}</span></span><span class="rm">Pos ${esc(r.pos)}</span><span class="ra">${c.hasFinal?`<span class="${r.diff>0?"up":r.diff<0?"down":""}">${r.diff?sgn(r.diff):"0.00"}</span>`:nf2.format(r.oa)}</span><span class="rl"></span></div>`).join("");
  return `<div class="stats">
      <div class="stat"><span class="sl">${L("Offerte","Offer")}</span><span class="sv">${chf(c.ot,false)}</span><span class="ss">${c.rows.filter(r=>r.kind!=="new").length} ${L("Positionen","items")}</span></div>
      <div class="stat"><span class="sl">${L("Schlussabrechnung","Final account")}</span><span class="sv">${c.hasFinal?chf(c.ft,false):"–"}</span><span class="ss">${c.hasFinal?c.changed+" "+L("Abweichungen","differences"):L("noch nicht geladen","not loaded yet")}</span></div>
      <div class="stat"><span class="sl">${L("Differenz","Difference")}</span><span class="sv${c.hasFinal&&c.diff>0?" warn":""}">${c.hasFinal?sgn(c.diff):"–"}</span><span class="ss">${c.hasFinal&&c.ot?(c.diff/c.ot*100>0?"+":"")+(c.diff/c.ot*100).toFixed(1)+"%":""}</span></div>
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
  const lead=(k.city?esc(k.street)+", "+esc(k.zip)+" "+esc(k.city):`<span class="neg">${L("Adresse fehlt","Address missing")}</span>`)+" · "+(k.iban?esc(k.iban):`<span class="neg">${L("IBAN fehlt","IBAN missing")}</span>`);
  const tools=ib("edit",L("Bearbeiten","Edit"),`data-act="form" data-f="contractor" data-id="${k.id}"`)+(CW(k.id)?excelBtn("k:"+k.id):"");
  const addHere=P()&&!pids.includes(cur)?`<div class="empty"><span>${L("Kein Werkvertrag in ","No contract in ")}${esc(P().name)}.</span><button type="button" class="btn primary" data-act="form" data-f="contract" data-id="${k.id}">${L("Werkvertrag erfassen","Add contract")}</button></div>`:"";
  const group=(pid,inner,count)=>{const p=PJ(pid);return `<details class="site" data-pid="${pid}"${isOpen(pid)?" open":""}><summary><span class="sn">${esc(p.name)}${p.place?`<span class="sp"> · ${esc(p.place)}</span>`:""}</span><span class="sc">${count}</span></summary><div class="in">${inner}</div></details>`;};
  let body="";
  if(S.wid&&W(S.wid)&&W(S.wid).k===k.id){
    const w=W(S.wid);
    body=`<button type="button" class="back" data-act="back-w">← ${L("Alle Verträge","All contracts")}</button>
      <div class="ctx">${esc(PJ(w.pid).name)} · BKP ${w.bkp} ${esc(bName(w.bkp))}</div>${cmpBody(w)}`;
  } else if(S.ktab==="konto"){
    const open=invOf(all).filter(i=>i.status!=="bezahlt"&&live(i)).reduce((a,i)=>a+payout(i),0);
    const top=all.length?`<div class="total"><span>${L("Offen total","Open in total")}</span><span class="tv">${chf(open,false)}</span><span class="ts">${pids.length} ${pids.length===1?L("Baustelle","site"):L("Baustellen","sites")}</span></div>`:"";
    body=top+addHere+pids.map(pid=>{
      const ws=all.filter(w=>w.pid===pid),inv=invOf(ws),multi=ws.length>1;
      const stats=ws.map(w=>{const iv=inv.filter(i=>i.w===w.id),billed=iv.filter(counted).reduce((a,i)=>a+net(i),0),paid=iv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0),ret=iv.filter(counted).reduce((a,i)=>a+retention(i),0);
        return `${multi?`<div class="ctx">BKP ${w.bkp} ${esc(bName(w.bkp))}</div>`:""}<div class="stats">
        <button type="button" class="stat" data-act="form" data-f="contract" data-id="${k.id}" data-w="${w.id}"><span class="sl">${multi?"":"BKP "+w.bkp+" · "}${L("Werkvertrag","Contract")} · ${retPct(w)}% ${L("Rückbehalt","retention")}</span><span class="sv">${w.sum?chf(w.sum,false):"–"}</span><span class="ss">${L("abgerechnet","billed")} ${chf(billed,false)}</span></button>
        <div class="stat"><span class="sl">${L("Ausbezahlt","Paid out")}</span><span class="sv">${chf(paid,false)}</span><span class="ss">${iv.filter(i=>i.status==="bezahlt").length} ${L("Zahlungen","payments")}</span></div>
        <div class="stat"><span class="sl">${L("Rückbehalt","Retention")}</span><span class="sv">${chf(ret,false)}</span><span class="ss">${L("bis Schlusszahlung","until final payment")}</span></div></div>`;}).join("");
      const rows=inv.map(i=>{const w=W(i.w);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:typeLabel(i)+(multi?` <span class="sp">· BKP ${w.bkp}</span>`:""),meta:esc(i.no)+" · "+fdate(i.date),amt:chf(i.gross,false),label:stLabel(i.status)});}).join("");
      const addInv=pid===cur?`<button type="button" class="add" data-act="form" data-f="invoice" data-id="${k.id}">${L("+ Erfassen","+ Add")}</button>`:"";
      const addW=pid===cur?`<button type="button" class="ghost" data-act="form" data-f="contract" data-id="${k.id}">${L("+ Weiterer Werkvertrag","+ Another contract")}</button>`:"";
      return group(pid,`${stats}<section><div class="sh"><h2>${L("Rechnungen","Invoices")}</h2><span class="cnt">${inv.length}</span>${addInv}</div><div class="rows">${rows||`<div class="empty">${L("Noch keine Rechnungen.","No invoices yet.")}</div>`}</div></section>${addW}`,inv.length+" "+(inv.length===1?L("Rechnung","invoice"):L("Rechnungen","invoices")));
    }).join("");
  } else {
    body=addHere+pids.map(pid=>{
      const ws=all.filter(w=>w.pid===pid);
      const rows=ws.map(w=>{const c=compare(w);return row({act:"open-w",id:w.id,c:!c?"warn":c.hasFinal?(c.diff>0?"warn":"ok"):"n",title:"BKP "+w.bkp+" "+esc(bName(w.bkp)),meta:!c?L("Offerte fehlt","No offer yet"):L("Offerte ","Offer ")+chf(c.ot,false)+" · "+(c.hasFinal?L("Schluss ","Final ")+chf(c.ft,false):L("Schluss fehlt","Final missing")),amt:c&&c.hasFinal?sgn(c.diff):"",lc:"n",label:L("Öffnen →","Open →")});}).join("");
      return group(pid,`<div class="rows">${rows}</div>`,ws.length+" "+(ws.length===1?L("Vertrag","contract"):L("Verträge","contracts")));
    }).join("");
  }
  return `<div class="page">
    <button type="button" class="back" data-act="back-k">← ${L("Handwerker","Contractors")}</button>
    ${ph("",esc(k.name),lead,tools)}
    ${all.length?`<div class="tabs" role="tablist"><button type="button" role="tab" data-act="ktab" data-t="konto" aria-selected="${S.ktab==="konto"}">${L("Konto","Account")}</button><button type="button" role="tab" data-act="ktab" data-t="vergleich" aria-selected="${S.ktab==="vergleich"}">${L("Offerte und Abrechnung","Offer and final account")}</button></div>`:""}
    ${body||addHere}
  </div>`;
}
function viewBudget(){
  const p=P(); if(!p) return noProject();
  const rows=budgetRows(), t=totals(rows);
  const br=rows.map(r=>{const base=Math.max(r.b.kv,r.awarded,r.billed,1),pc=x=>Math.max(0,x)/base*100;
    return `<button type="button" class="brow row" data-act="form" data-f="kv" data-id="${r.b.bkp}"><span class="code">${r.b.bkp}</span><div><span>${esc(tx(r.b))}</span><div class="bar"><i class="c-paid" style="width:${pc(r.paid)}%"></i><i class="c-appr" style="width:${pc(r.approved)}%"></i><i class="c-open" style="width:${pc(r.open)}%"></i>${r.b.kv?`<span class="kv" style="left:${r.b.kv/base*100}%"></span>`:""}</div></div><span class="nums">${r.awarded?chf(r.awarded,false):L("nicht vergeben","not awarded")}</span><span class="rest ${r.rest<0?"up":""}">${r.b.kv?chf(r.rest,false):"–"}</span></button>`;}).join("");
  return `<div class="page">
    ${ph(esc(p.name),"Budget","",excelBtn("budget"))}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Kostenvoranschlag","Cost estimate")}</span><span class="sv">${chf(t.kv,false)}</span><span class="ss">${p.budget.length} ${p.budget.length===1?L("Position","item"):L("Positionen","items")}</span></div>
      <div class="stat"><span class="sl">${L("Vergeben","Awarded")}</span><span class="sv">${chf(t.awarded,false)}</span><span class="ss">${t.kv?Math.round(t.awarded/t.kv*100)+"%":""}</span></div>
      <div class="stat"><span class="sl">${L("Reserve","Reserve")}</span><span class="sv${t.rest<0?" warn":""}">${chf(t.rest,false)}</span><span class="ss">${L("bis Kostenvoranschlag","to estimate")}</span></div>
    </div>
    <section><div class="sh"><h2>BKP</h2><button type="button" class="add" data-act="form" data-f="bkp">${L("+ Position","+ Item")}</button></div>${br||`<div class="empty">${L("Noch keine BKP-Positionen.","No BKP items yet.")}</div>`}
      ${rows.length?`<div class="legend"><span><i class="c-paid"></i>${L("Bezahlt","Paid")}</span><span><i class="c-appr"></i>${L("Freigegeben","Approved")}</span><span><i class="c-open"></i>${L("Zu prüfen","To check")}</span><span><i style="width:1px;height:12px;background:var(--ink)"></i>${L("Kostenvoranschlag","Estimate")}</span></div>`:""}</section>
  </div>`;
}

function viewTenders(){
  if(S.tid&&T(S.tid)) return viewTender(T(S.tid));
  const O=D.office;
  const tabs=`<div class="tabs" role="tablist"><button type="button" role="tab" data-act="ttab" data-t="verfahren" aria-selected="${S.ttab==="verfahren"}">${L("Verfahren","Procedures")}<span class="c">${D.tenders.filter(t=>!closedT(t)).length}</span></button><button type="button" role="tab" data-act="ttab" data-t="profil" aria-selected="${S.ttab==="profil"}">${L("Büroprofil","Office profile")}</button></div>`;
  if(S.ttab==="profil"){
    return `<div class="page">${ph(L("Büro · Beispieldaten","Office · example data"),L("Ausschreibungen","Tenders"),"",excelBtn("tender"))}${tabs}
      <section><div class="sh"><h2>${L("Referenzen","References")}</h2><span class="cnt">${O.refs.length}</span></div><div class="rows">${O.refs.map(r=>`<div class="row static">${dot(r.pub?"acc":"n")}<span class="rt">${esc(tx(r))}</span><span class="rm">${esc(r.client)}</span><span class="ra">${mio(r.cost)}</span><span class="rl l-n">${r.running?L("laufend","ongoing"):r.year}</span></div>`).join("")}</div></section>
      <section><div class="sh"><h2>Team</h2><span class="cnt">${O.team.length}</span></div><div class="rows">${O.team.map(m=>`<div class="row static">${dot("n")}<span class="rt">${tx(m.role)}<span class="q">${esc(m.qual)}</span></span><span class="rm"></span><span class="ra">${m.years} ${L("Jahre","yrs")}</span><span class="rl"></span></div>`).join("")}</div></section>
    </div>`;
  }
  const active=D.tenders.filter(t=>!closedT(t)), fits=active.map(t=>fitOf(t).fit);
  const next=active.filter(t=>fitOf(t).fit!=="no").sort((a,b)=>toDate(a.due)-toDate(b.due))[0];
  const list=D.tenders.slice().sort((a,b)=>(closedT(a)-closedT(b))||(toDate(a.due)-toDate(b.due)));
  const rows=list.map(t=>{const f=fitOf(t).fit,c=closedT(t),dd=daysTo(t.due);return row({act:"open-t",id:t.id,c:c?"n":FIT[f].c,title:esc(tx(t.title)),meta:esc(t.client),amt:c?tx(TST[t.status]):L(dd+" Tage",dd+" days"),label:c?"":tx(FIT[f])});}).join("");
  return `<div class="page">${ph(L("Büro · Beispieldaten","Office · example data"),L("Ausschreibungen","Tenders"),"",excelBtn("tender"))}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Offen","Open")}</span><span class="sv">${active.length}</span><span class="ss">BKP 291 · ${L("Kanton Zürich","Canton of Zurich")}</span></div>
      <div class="stat"><span class="sl">${L("Eignung erfüllt","Eligible")}</span><span class="sv ok">${fits.filter(f=>f==="ok").length}</span><span class="ss">${fits.filter(f=>f==="partner").length} ${L("mit Partner","with partner")} · ${fits.filter(f=>f==="no").length} ${L("nicht","not")}</span></div>
      <div class="stat"><span class="sl">${L("Nächste Eingabe","Next deadline")}</span><span class="sv">${next?fdate(next.due):"–"}</span><span class="ss">${next?esc(tx(next.title)):""}</span></div>
    </div>
    ${tabs}
    <section><div class="rows">${rows}</div></section>
  </div>`;
}

function viewTender(t){
  const {ev,fit}=fitOf(t), docs=docsOf(t), dd=daysTo(t.due), c=closedT(t), open=docs.filter(d=>!d.done);
  const ICON={ok:"✓",warn:"!",crit:"✕"};
  let actions="";
  if(t.status==="neu") actions=`<button type="button" class="btn" data-act="t-status" data-id="${t.id}" data-s="verzichtet">${L("Nicht teilnehmen","Skip")}</button><button type="button" class="btn primary" data-act="t-status" data-id="${t.id}" data-s="arbeit"${fit==="no"?" disabled":""}>${L("Bewerbung starten","Start bid")}</button>`;
  else if(t.status==="arbeit") actions=`<button type="button" class="btn" data-act="t-status" data-id="${t.id}" data-s="verzichtet">${L("Nicht teilnehmen","Skip")}</button><button type="button" class="btn primary" data-act="t-status" data-id="${t.id}" data-s="eingereicht"${fit!=="no"&&!open.length?"":" disabled"}>${L("Eingereicht","Submitted")}</button>`;
  else actions=`<button type="button" class="btn" data-act="t-status" data-id="${t.id}" data-s="arbeit">${L("Wieder öffnen","Reopen")}</button>`;
  return `<div class="page">
    <button type="button" class="back" data-act="back-t">← ${L("Ausschreibungen","Tenders")}</button>
    ${ph(esc(t.client)+" · "+L("Beispiel","Example"),esc(tx(t.title)),tx(PROC[t.proc])+" · SIA "+t.phases,excelBtn("t:"+t.id))}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Eingabe","Submission")}</span><span class="sv${!c&&dd<=14?" warn":""}">${c?tx(TST[t.status]):dd<0?L("vorbei","closed"):L(dd+" Tage",dd+" days")}</span><span class="ss">${fdate(t.due)} · ${L("Fragen bis","questions by")} ${fdate(t.qDue)}</span></div>
      <div class="stat"><span class="sl">${L("Eignung","Eligibility")}</span><span class="sv ${FIT[fit].c}">${tx(FIT[fit])}</span><span class="ss">${ev.filter(e=>e.s==="ok").length} ${L("von","of")} ${ev.length} ${L("Kriterien","criteria")}</span></div>
      <div class="stat"><span class="sl">${L("Baukosten","Construction cost")}</span><span class="sv">${mio(t.cost)}</span><span class="ss">BKP 291</span></div>
    </div>
    <div class="cols">
      <section><div class="sh"><h2>${L("Eignung","Eligibility")}</h2></div><ul class="checks">${ev.map(e=>`<li><span class="ic ${e.s}" aria-hidden="true">${ICON[e.s]}</span><span>${esc(e.t)}<span class="res">${esc(e.res)}</span></span></li>`).join("")}</ul></section>
      <section><div class="sh"><h2>${L("Unterlagen","Documents")}</h2><span class="cnt">${docs.length-open.length}/${docs.length}</span></div><ul class="checks">${docs.map(d=>`<li>${d.auto?`<span class="ic ${d.done?"ok":"crit"}" aria-hidden="true">${d.done?"✓":"✕"}</span>`:`<input type="checkbox" id="doc-${d.id}" data-act="t-doc" data-t="${t.id}" data-d="${d.id}"${d.done?" checked":""}${c?" disabled":""}>`}<label${d.auto?"":` for="doc-${d.id}"`}>${esc(d.t)}${d.sub?`<span class="res">${d.auto&&d.done?L("Automatisch: ","Automatic: "):""}${esc(d.sub)}</span>`:""}</label></li>`).join("")}</ul></section>
    </div>
    <div class="bar-actions">${actions}</div>
  </div>`;
}

function render(){queueMicrotask(()=>document.querySelectorAll('input[type=file]').forEach(x=>{if(!x.title)x.title=" ";}));
  saveData();
  const app=document.getElementById("app");
  if(!D){
    app.style.display="block";
    document.querySelector(".rail").style.display="none";document.querySelector(".topbar").style.display="none";document.getElementById("tabbar").style.display="none";
    document.getElementById("main").innerHTML=viewWelcome();
    return renderOverlay();
  }
  app.style.display="";document.querySelector(".rail").style.display="";document.querySelector(".topbar").style.display="";document.getElementById("tabbar").style.display="";
  renderChrome();
  document.getElementById("main").innerHTML=({uebersicht:viewOverview,rechnungen:viewInvoices,handwerker:viewContractors,budget:viewBudget,ausschreibungen:viewTenders})[S.view]();
  renderOverlay();
}

/* ---------- invoice drawer ---------- */
function checksFor(i){
  const w=W(i.w),k=K(w.k),out=[],m=missingOf(k);
  const blocking=m.filter(x=>x!==L("E-Mail","Email"));
  out.push(blocking.length?{s:"crit",t:L("Für die Zahlung fehlt: ","Missing for payment: ")+blocking.join(", "),fix:k.id}:m.length?{s:"warn",t:L("E-Mail für Rückfragen fehlt","Email for queries missing"),fix:k.id}:{s:"ok",t:L("Handwerkerdaten vollständig","Contractor details complete")});
  if(w.sum>0){const after=billedOn(w.id,i.id)+net(i);out.push({s:"ok",t:"BKP "+w.bkp+" "+bName(w.bkp)});out.push(after<=w.sum?{s:"ok",t:L("Im Werkvertrag: ","Within contract: ")+chf(after,false)+" / "+chf(w.sum,false)}:{s:"warn",t:L("Über Werkvertrag: +","Above contract: +")+chf(after-w.sum)});}
  else out.push({s:"warn",t:"BKP "+w.bkp+L(": keine Werkvertragssumme",": no contract sum")});
  if(i.type==="regie") out.push({s:"warn",t:L("Regie: Rapporte prüfen","Time & materials: check time sheets")});
  if(i.type==="schluss"){const c=compare(w);out.push(c&&c.hasFinal?{s:c.diff>0?"warn":"ok",t:L("Gegenüber Offerte: ","Against offer: ")+sgn(c.diff),link:w.id}:{s:"info",t:L("Offertvergleich: Schlussabrechnung laden","Offer comparison: load final account"),link:w.id});}
  if(i.type==="akonto"&&i.n>1){const have=new Set(D.invoices.filter(x=>x.w===w.id&&x.type==="akonto"&&x.id!==i.id).map(x=>x.n));const miss=[];for(let n=1;n<i.n;n++)if(!have.has(n))miss.push(n);if(miss.length)out.push({s:"warn",t:L("Akonto ","Progress payment ")+miss.join(", ")+L(" nicht erfasst"," not recorded")});}
  const dup=i.ref&&live(i)&&D.invoices.some(x=>x.id!==i.id&&live(x)&&norm(x.ref)===norm(i.ref));
  out.push(dup?{s:"crit",t:L("Mögliche Doppelrechnung","Possible duplicate")}:i.ref?{s:"ok",t:L("Keine Doppelrechnung","No duplicate")}:{s:"warn",t:L("Ohne QR-Referenz","No QR reference")});
  const dd=daysTo(i.due);if(dd<=7&&!counted(i))out.push({s:"warn",t:dd<0?L("Zahlungsfrist überschritten","Payment overdue"):L("Fällig in "+dd+" Tagen","Due in "+dd+" days")});
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
  const li=c=>`<li><span class="ic ${c.s}" aria-hidden="true">${ICON[c.s]}</span><span>${esc(c.t)}${c.link?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="open-cmp" data-id="${c.link}">${L("Vergleich","Comparison")}</button>`:""}${c.fix?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="form" data-f="contractor" data-id="${c.fix}">${L("Ergänzen","Complete")}</button>`:""}</span></li>`;
  const retLine=i.type==="akonto"?[L("Rückbehalt ","Retention ")+retPct(w)+"%","− "+nf2.format(ret)]:i.type==="schluss"?[L("Freigabe Rückbehalt","Retention released"),"+ "+nf2.format(-ret)]:[L("Rückbehalt","Retention"),"0.00"];
  let actions="";
  if(i.status==="rueckfrage") actions=`<button type="button" class="btn" data-act="answer" data-id="${i.id}">${L("Antwort erhalten","Reply received")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${L("Freigeben","Approve")}</button>`;
  else if(!counted(i)) actions=`<button type="button" class="btn" data-act="query">${L("Rückfrage","Query")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${L("Freigeben","Approve")}</button>`;
  else if(i.status==="frei") actions=`<button type="button" class="btn" data-act="unapprove" data-id="${i.id}">${L("Freigabe zurücknehmen","Undo approval")}</button><button type="button" class="btn primary" data-act="paid" data-id="${i.id}">${L("Als bezahlt markieren","Mark as paid")}</button>`;
  const done=S.done&&S.done.id===i.id?`<div class="done"><span class="h">${L("Für Sie erledigt","Done for you")}</span><div class="chips">${S.done.items.map(x=>`<span class="chip ok">${esc(x)}</span>`).join("")}</div></div>`:"";
  const log=i.log&&i.log.length?`<details><summary>${L("Verlauf","History")}</summary><div class="in"><dl class="kv">${i.log.map(e=>`<dt>${fdate(e.d)}</dt><dd>${esc(e.t)}</dd>`).join("")}</dl></div></details>`:"";
  const delBtn=S.confirm==="del:"+i.id?`<button type="button" class="ghost danger" data-act="del-inv" data-id="${i.id}">${L("Wirklich löschen?","Really delete?")}</button>`:ib("trash",L("Rechnung löschen","Delete invoice"),`data-act="ask" data-c="del:${i.id}"`);
  return `<div class="scrim" data-act="close"></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dT">
    <div class="ohead"><div><h2 id="dT" style="font-size:1.25rem;font-weight:500">${esc(k.name)}</h2><div class="sub">${typeLabel(i)} · ${esc(i.no)} · ${fdate(i.date)}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><span class="big">${chf(i.gross)}</span><span class="l-${STATUS[i.status].c}">${stLabel(i.status)}</span></div>
      <div class="payline"><span>${L("Auszahlung","Payout")}</span><span>${chf(payout(i))}</span></div>
      ${done}
      ${i.repl&&INV(i.repl)?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt durch Rechnung ","Replaced by invoice ")}<button type="button" class="ghost link" data-act="open-inv" data-id="${i.repl}">${esc(INV(i.repl).no)}</button>. ${L("Zählt nicht mehr.","No longer counted.")}</span></div>`:""}
      ${i.replaces&&INV(i.replaces)?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt Rechnung ","Replaces invoice ")}<button type="button" class="ghost link" data-act="open-inv" data-id="${i.replaces}">${esc(INV(i.replaces).no)}</button></span></div>`:""}
      ${issues.length?`<ul class="checks" style="border-top:1px solid var(--line)">${issues.map(li).join("")}</ul>`:`<div class="notice"><span class="ic ok" aria-hidden="true">✓</span><span>${L("Alle Prüfungen in Ordnung","All checks passed")}</span></div>`}
      <div class="calc"><span>${L("Rechnung","Invoice")}</span><span class="r">${nf2.format(i.gross)}</span>${i.ded&&i.ded.amt?`<span>${L("Abzug","Deduction")} <span class="sp">· ${esc(i.ded.why)}</span></span><span class="r">− ${nf2.format(i.ded.amt)}</span>`:""}<span>${retLine[0]}</span><span class="r">${retLine[1]}</span><span class="sum">${L("Auszahlung","Payout")}</span><span class="r sum">${chf(payout(i))}</span></div>
      <div>
        ${oks.length&&issues.length?`<details><summary>${oks.length} ${oks.length===1?L("Prüfung in Ordnung","check passed"):L("Prüfungen in Ordnung","checks passed")}</summary><div class="in"><ul class="checks">${oks.map(li).join("")}</ul></div></details>`:""}
        <details><summary>${L("Zahlungsdaten","Payment details")}</summary><div class="in"><dl class="kv"><dt>IBAN</dt><dd>${k.iban?esc(k.iban):`<span class="neg">${L("fehlt","missing")}</span>`}</dd><dt>${L("Referenz","Reference")}</dt><dd>${i.ref?esc(i.ref):"–"}</dd><dt>${L("Fällig","Due")}</dt><dd>${fdate(i.due)}</dd></dl></div></details>
        ${log}
        ${S.queryOpen?`<details open><summary>${L("Rückfrage an ","Query to ")+esc(k.name)}</summary><div class="in" style="display:flex;flex-direction:column;gap:10px"><textarea id="qtext" aria-label="${L("Nachricht","Message")}">${esc(queryText(i))}</textarea><div class="qtools">${ib("copy",L("Kopieren","Copy"),'data-act="copy-query"')}${navigator.share?ib("share",L("Teilen (Mail, WhatsApp …)","Share (Mail, WhatsApp …)"),`data-act="share-query" data-id="${i.id}"`):""}${k.email?ib("mail",L("In Gmail öffnen","Open in Gmail"),`data-act="gmail-query" data-id="${i.id}"`):""}${k.email&&!navigator.share?`<a class="ib" title="${L("Im Mailprogramm öffnen","Open in mail app")}" aria-label="${L("Im Mailprogramm öffnen","Open in mail app")}" href="mailto:${esc(k.email)}?subject=${encodeURIComponent(L("Rechnung ","Invoice ")+i.no)}" data-act="mail-query">${ico("share")}</a>`:""}<span class="qsep"></span><button type="button" class="btn" data-act="mark-query" data-id="${i.id}">${L("Rückfrage gesendet","Query sent")}</button></div>${k.email?"":`<span class="hint">${L("Keine E-Mail-Adresse hinterlegt. Text kopieren und per Telefon oder WhatsApp senden, oder die E-Mail ergänzen.","No email on file. Copy the text and send it another way, or add the email.")}</span>`}</div></details>`:""}
      </div>
      ${i.status==="ersetzt"?"":`<div class="dtools">${!counted(i)?`<button type="button" class="ghost" data-act="form" data-f="ded" data-id="${i.id}">${i.ded?L("Abzug ändern","Edit deduction"):L("Abzug","Deduction")}</button><button type="button" class="ghost" data-act="replace" data-id="${i.id}">${L("Durch neue Rechnung ersetzen","Replace with new invoice")}</button>`:""}<span class="qsep"></span>${delBtn}</div>`}
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
  return {name:(l[5]||"").trim(),street:street.trim(),zip:zip.trim(),city:city.trim(),iban:fmtIban(l[3]||""),amount:parseFloat(l[18])||0,ref:fmtRef(l[28]||""),msg:(l[29]||"").trim(),bill:(l.slice(30).find(x=>/^\/\/S1\//.test(x||""))||"").trim(),no:""};
}
function swicoNo(b){if(!b)return "";const parts=b.slice(4).replace(/\\\//g,"\u0000").split("/").map(x=>x.replace(/\u0000/g,"/"));for(let i=0;i<parts.length-1;i++)if(parts[i]==="10")return parts[i+1].trim();return "";}
function swicoField(b,tag){if(!b)return "";const parts=b.slice(4).replace(/\\\//g,"\u0000").split("/").map(x=>x.replace(/\u0000/g,"/"));for(let i=0;i<parts.length-1;i++)if(parts[i]===tag)return parts[i+1].trim();return "";}
function swicoDates(d){const r={date:"",due:""};const t=swicoField(d.bill,"11").slice(0,6);if(/^\d{6}$/.test(t))r.date="20"+t.slice(0,2)+"-"+t.slice(2,4)+"-"+t.slice(4,6);const c=swicoField(d.bill,"40");if(c){const net=c.split(";").map(x=>x.split(":")).find(x=>+x[0]===0);if(net&&/^\d+$/.test(net[1]||""))r.due=addDays(r.date||iso(TODAY),+net[1]);}return r;}
function setDates(d){const x=swicoDates(d);d.dateSrc=!!x.date;d.dueSrc=!!x.due;d.date=x.date||iso(TODAY);d.due=x.due||addDays(d.date,30);}
function guessNo(d){const sw=swicoNo(d.bill);if(sw)return sw;const m=(d.msg||"").match(/(?:rechnungs?(?:nummer|nr\.?)?|rg\.?|re\.?|invoice(?:\s*no\.?)?|nr\.?)\s*(?:nr\.?|no\.?)?\s*[:#]?\s*(\d[A-Za-z0-9\-\/\.]{2,}|[A-Za-z]{1,4}[\-\.]?\d[A-Za-z0-9\-\/\.]*)/i);return m?m[1]:"";}
function guessKind(d){const m=d.msg||"";let x=m.match(/akonto\s*(?:nr\.?|no\.?)?\s*(\d{1,2})/i);if(x)return {type:"akonto",n:+x[1]};if(/schluss/i.test(m))return {type:"schluss",n:0};if(/regie/i.test(m))return {type:"regie",n:0};if(/akonto/i.test(m))return {type:"akonto",n:0};return {type:"",n:0};}
const BKP_KEYS=[["maler","285"],["elektr","230"],["sanitä","250"],["sanita","250"],["schrein","273"],["gipser","271"],["spengl","222"],["bedach","224"],["dach","224"],["heizung","240"],["lüftung","240"],["boden","281"],["küche","258"],["fenster","221"],["reinigung","287"],["baumeister","211"],["metallbau","272"],["holzbau","214"],["fassade","226"],["putz","226"]];
function guessBkp(d){const t=((d.msg||"")+" "+(d.name||"")).toLowerCase();const h=BKP_KEYS.find(([k])=>t.includes(k));return h?h[1]:"";}
let cam=null;
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
  }catch(e){if(S.modal){S.modal.camErr=L("Kein Kamerazugriff. Erlauben Sie die Kamera oder nehmen Sie ein Foto auf.","No camera access. Allow the camera or take a photo.");renderOverlay();}}
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
  if(r&&r.data){
    const d=parseSPC(r.data);
    if(d){stopCam();try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}d.no=guessNo(d);setDates(d);S.modal.data=d;S.modal.step=2;renderOverlay();}
    else{const h=document.getElementById("camhint");if(h)h.textContent=L("QR-Code erkannt, aber keine Schweizer QR-Rechnung.","QR code found, but not a Swiss QR-bill.");}
  }
}
function stopCam(){if(!cam)return;cancelAnimationFrame(cam.raf);cam.stream.getTracks().forEach(t=>t.stop());cam=null;}
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
        if(r&&r.data) return r.data;
      }
    }
    return null;
  }finally{URL.revokeObjectURL(url);}
}
async function onScanFile(file){
  if(!file||!S.modal) return;
  stopCam();
  if(!/^image\//.test(file.type)){S.modal.err=L("Bitte ein Foto wählen (JPG, PNG).","Please choose a photo (JPG, PNG).");return renderOverlay();}
  S.modal.busy=true;S.modal.err="";renderOverlay();
  let txt=null;try{txt=await decodeQR(file);}catch(e){txt=null;}
  if(!S.modal)return;S.modal.busy=false;
  const d=txt?parseSPC(txt):null;
  if(!d){S.modal.err=txt?L("Das ist keine Schweizer QR-Rechnung.","This is not a Swiss QR-bill."):L("Kein QR-Code erkannt. Zahlteil näher fotografieren.","No QR code found. Photograph the payment part closer.");return renderOverlay();}
  d.no=guessNo(d);setDates(d);S.modal.data=d;S.modal.step=2;renderOverlay();
}
function resolveCapture(d){
  const k=D.contractors.find(c=>(c.iban&&norm(c.iban)===norm(d.iban))||c.name.trim().toLowerCase()===d.name.trim().toLowerCase())||null;
  const dup=D.invoices.find(x=>live(x)&&!(S.modal&&S.modal.rep===x.id)&&((d.ref&&x.ref&&norm(x.ref)===norm(d.ref))||(k&&d.no&&W(x.w).k===k.id&&x.no===d.no&&x.gross===d.amount)))||null;
  return {k,dup,w:k?CW(k.id):null};
}
const bkpOptions=sel=>{const p=P();const own=p?p.budget.map(b=>[b.bkp,tx(b)]):[];const rest=STD_BKP.filter(s=>!own.some(o=>o[0]===s[0])).map(s=>[s[0],S.lang==="de"?s[1]:s[2]]);return own.concat(rest).map(([c,n])=>`<option value="${c}"${c===sel?" selected":""}>${c} ${esc(n)}</option>`).join("");};
function wrapCapture(title,body,foot){
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mT">
    <div class="ohead"><h2 id="mT" style="font-size:1.25rem;font-weight:500">${title}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody">${body}</div>${foot?`<div class="ofoot">${foot}</div>`:""}</div>`;
}
function captureHTML(){
  const M=S.modal,d=M.data;let body="",foot="",title=L("Rechnung scannen","Scan invoice");
  const RO=M.rep&&INV(M.rep),RK=RO&&K(W(RO.w).k);
  const repNote=RO?`<div class="notice"><span class="ic info" aria-hidden="true">i</span><span>${L("Ersetzt ","Replaces ")}${esc(RO.no)} · ${esc(RK.name)} · ${typeLabel(RO)}</span></div>`:"";
  if(!P()){
    body=`<div class="empty">${L("Bitte zuerst ein Projekt anlegen.","Please create a project first.")}<button type="button" class="btn primary" data-act="form" data-f="project">${L("Projekt anlegen","Create project")}</button></div>`;
  } else if(M.step===1){
    body=repNote+`<div class="scanbox">
      ${M.camErr?`<span class="err">${esc(M.camErr)}</span>`:`<div class="cam"><video id="camv" playsinline muted autoplay></video><div class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div><span class="camhint" id="camhint">${M.busy?L("Foto wird gelesen …","Reading photo …"):L("QR-Code des Zahlteils in den Rahmen halten","Hold the payment part's QR code in the frame")}</span>`}
      ${M.err?`<span class="err">${esc(M.err)}</span>`:""}
      <label class="btn${M.camErr?" primary":""} block">${L("Foto aufnehmen oder wählen","Take or choose a photo")}<input type="file" id="scanIn" accept="image/*" aria-label="${L("Foto der QR-Rechnung","Photo of the QR-bill")}"></label>
      <div style="display:flex;gap:18px;flex-wrap:wrap;justify-content:center"><button type="button" class="ghost" data-act="manual">${L("Ohne QR erfassen","Add without QR")}</button>${D.example&&!M.rep?`<button type="button" class="ghost" data-act="use-sample">${L("Beispielrechnung","Example invoice")}</button>`:""}</div></div>`;
  } else if(M.step===2){
    title=L("Gelesen","Read");
    body=repNote+`<div class="fields">
      <div class="f wide"><span class="l">${L("Empfänger","Payee")}</span><span class="v">${esc(d.name)}${d.city?", "+esc(d.zip)+" "+esc(d.city):""}</span></div>
      <div class="f wide"><span class="l">IBAN</span><span class="v">${esc(d.iban)}</span></div>
      <div class="f"><label for="capAmt">${L("Betrag CHF","Amount CHF")}</label><input id="capAmt" inputmode="decimal" value="${d.amount?d.amount.toFixed(2):""}"></div>
      <div class="f"><label for="capNo">${L("Rechnungsnummer","Invoice number")}</label><input id="capNo" value="${esc(d.no||"")}" placeholder="${L("Von der Rechnung abtippen","Type from the invoice")}">${d.no?"":`<span class="hint">${L("Diese Rechnung hat keine Nummer im QR-Code.","This invoice has no number in its QR code.")}</span>`}</div>
      <div class="f"><span class="l">${L("Rechnungsdatum","Invoice date")}</span><span class="v">${fdate(d.date)}</span>${d.dateSrc?"":`<span class="hint">${L("Heute, nicht im QR-Code","Today, not in QR code")}</span>`}</div>
      <div class="f"><span class="l">${L("Zahlbar bis","Due")}</span><span class="v">${fdate(d.due)}</span>${d.dueSrc?"":`<span class="hint">${L("30 Tage angenommen","30 days assumed")}</span>`}</div>
      ${M.err?`<span class="err f wide">${esc(M.err)}</span>`:""}</div>`;
    foot=`<button type="button" class="btn primary" data-act="to-step3">${L("Weiter","Next")}</button>`;
  } else {
    const R=resolveCapture(d);
    if(R.dup){
      title=L("Bereits erfasst","Already recorded");
      body=`<div class="notice"><span class="ic crit" aria-hidden="true">✕</span><span>${L("Doppelrechnung verhindert","Duplicate prevented")} · ${esc(R.dup.no)} · ${chf(R.dup.gross)}</span></div>`;
      foot=`<button type="button" class="btn" data-act="open-inv" data-id="${R.dup.id}">${L("Öffnen","Open")}</button><button type="button" class="btn primary" data-act="close">OK</button>`;
    } else {
      title=esc(R.k?R.k.name:d.name);
      if(RO&&(!R.k||R.k.id!==RK.id)){
        body=repNote+`<div class="notice"><span class="ic crit" aria-hidden="true">✕</span><span>${L("Diese Rechnung ist von ","This invoice is from ")}${esc(d.name)}. ${L("Ersetzen geht nur mit einer Rechnung von ","Replacing only works with an invoice from ")}${esc(RK.name)}.</span></div>`;
        foot=`<button type="button" class="btn" data-act="replace" data-id="${RO.id}">${L("Andere Rechnung scannen","Scan another invoice")}</button><button type="button" class="btn primary" data-act="close">OK</button>`;
        return wrapCapture(title,body,foot);
      }
      const G=RO&&R.w&&R.w.id===RO.w?{type:RO.type,n:RO.n}:guessKind(d),nAk=G.n||(R.w?D.invoices.filter(x=>x.w===R.w.id&&x.type==="akonto").length+1:1);d.akN=nAk;const so=v=>G.type===v?" selected":"";
      body=repNote+`<div class="fields">
        ${(()=>{const src=R.k||d,adr=[src.street,[src.zip,src.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");return `<div class="f wide"><span class="l">${L("Adresse","Address")}</span><span class="v">${adr?esc(adr):"–"}</span>${R.k?"":`<span class="hint">${L("Wird neu angelegt","Will be added as new contractor")}</span>`}</div>`;})()}
        ${R.w?`<div class="f wide"><span class="l">${L("Werkvertrag","Contract")}</span><span class="v">BKP ${R.w.bkp} ${esc(bName(R.w.bkp))}${R.w.sum?" · "+chf(R.w.sum,false):""}</span></div>`
          :`<div class="f wide"><label for="capBkp">BKP</label><select id="capBkp">${bkpOptions(guessBkp(d))}</select><span class="hint">${L("Werkvertragssumme können Sie später ergänzen.","You can add the contract sum later.")}</span></div>`}
        <div class="f"><label for="capType">${L("Art","Type")}</label><select id="capType"><option value="akonto"${so("akonto")}>${L("Akonto ","Progress payment ")+nAk}</option><option value="schluss"${so("schluss")}>${L("Schlussrechnung","Final invoice")}</option><option value="regie"${so("regie")}>${L("Regie","Time & materials")}</option></select></div>
        <div class="f"><span class="l">${L("Betrag","Amount")}</span><span class="v">${chf(d.amount)}</span></div></div>`;
      foot=`<button type="button" class="btn primary" data-act="confirm-capture">${L("Übernehmen","Add invoice")}</button>`;
    }
  }
  return wrapCapture(title,body,foot);
}
function ensureBkp(bkp){const p=P();if(!p.budget.some(b=>b.bkp===bkp)){const s=STD_BKP.find(x=>x[0]===bkp);p.budget.push({bkp,de:s?s[1]:bkp,en:s?s[2]:bkp,kv:0});p.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));}}
function confirmCapture(){
  const d=S.modal.data,R=resolveCapture(d);if(R.dup)return;
  const items=[L("QR gelesen","QR read")],type=(document.getElementById("capType")||{}).value||"akonto";
  let k=R.k,w=R.w;
  if(!k){k={id:newId("k"),name:d.name,street:d.street,zip:d.zip,city:d.city,iban:d.iban,email:"",phone:""};D.contractors.push(k);items.push(L("Handwerker angelegt","Contractor added"));}
  else{const add=[];if(!k.street&&d.street){k.street=d.street;k.zip=d.zip;k.city=d.city;add.push(L("Adresse","address"));}if(!k.iban&&d.iban){k.iban=d.iban;add.push("IBAN");}if(add.length)items.push(add.join(L(" und "," and "))+L(" ergänzt"," added"));}
  if(!w){const bkp=(document.getElementById("capBkp")||{}).value||"211";ensureBkp(bkp);w={id:newId("w"),pid:D.pid,k:k.id,bkp,sum:0,ret:10};D.contracts.push(w);}
  items.push("BKP "+w.bkp);
  const n=type==="akonto"?(d.akN||D.invoices.filter(x=>x.w===w.id&&x.type==="akonto").length+1):0;
  const ni={id:newId("i"),no:d.no||L("ohne Nr.","no number"),w:w.id,type,n,date:d.date||iso(TODAY),due:d.due||addDays(d.date||iso(TODAY),30),gross:r2(d.amount),status:"pruefen",ref:d.ref||""};
  logInv(ni,L("Per QR erfasst","Captured via QR"));
  D.invoices.push(ni);if(S.modal&&S.modal.rep)linkReplace(S.modal.rep,ni);
  if(type==="akonto")items.push(L("Rückbehalt ","Retention ")+nf2.format(retention(ni)));
  if(d.ref)items.push(L("Keine Doppelrechnung","No duplicate"));
  S.done={id:ni.id,items};S.modal=null;S.drawer=ni.id;S.queryOpen=false;render();
}
function logDup(){const M=S.modal;if(!M||M.logged||!M.data)return;M.logged=true;D.events.unshift({pid:D.pid,c:"crit",t:M.data.name,m:L("Doppelrechnung verhindert","duplicate prevented"),chf:M.data.amount,act:"nav",v:"rechnungen"});}

/* ---------- forms ---------- */
const fld=(id,label,val,o={})=>`<div class="f${o.wide?" wide":""}"><label for="${id}">${label}</label><input id="${id}" name="${id}" value="${esc(val==null?"":val)}"${o.type?` type="${o.type}"`:""}${o.mode?` inputmode="${o.mode}"`:""}${o.req?" required":""}${o.ph?` placeholder="${esc(o.ph)}"`:""}>${o.hint?`<span class="hint">${o.hint}</span>`:""}</div>`;
function formDef(){
  const F=S.form, p=P();
  if(F.f==="project"){const x=F.id?D.projects.find(q=>q.id===F.id):{};return {title:F.id?L("Projekt bearbeiten","Edit project"):L("Neues Projekt","New project"),body:fld("fName",L("Projektname","Project name"),x.name,{wide:true,req:true,ph:"MFH Seestrasse 12"})+fld("fPlace",L("Ort","Place"),x.place)+fld("fClient",L("Bauherrschaft","Client"),x.client)+fld("fDesc",L("Beschreibung","Description"),x.desc,{wide:true,ph:L("Neubau, 8 Wohnungen","New build, 8 flats")})};}
  if(F.f==="contractor"){const x=F.id?K(F.id):{};return {title:F.id?L("Handwerker bearbeiten","Edit contractor"):L("Neuer Handwerker","New contractor"),body:fld("fName",L("Firma","Company"),x.name,{wide:true,req:true})+fld("fStreet",L("Strasse","Street"),x.street,{wide:true})+fld("fZip",L("PLZ","ZIP"),x.zip,{mode:"numeric"})+fld("fCity",L("Ort","City"),x.city)+fld("fIban","IBAN",x.iban,{wide:true})+fld("fEmail",L("E-Mail","Email"),x.email,{type:"email"})+fld("fPhone",L("Telefon","Phone"),x.phone,{type:"tel"}),del:F.id&&!D.contracts.some(w=>w.k===F.id)};}
  if(F.f==="contract"){const k=K(F.id),w=(F.w&&W(F.w))||{};return {title:L("Werkvertrag · ","Contract · ")+k.name,body:`<div class="f wide"><label for="fBkp">BKP</label><select id="fBkp">${bkpOptions(w.bkp)}</select></div>`+fld("fSum",L("Werkvertragssumme CHF","Contract sum CHF"),w.sum||"",{mode:"decimal",req:true})+fld("fRet",L("Rückbehalt %","Retention %"),w.ret!=null?w.ret:10,{mode:"decimal"}),del:w.id&&!D.invoices.some(i=>i.w===w.id)};}
  if(F.f==="invoice"){
    const ks=PC().map(w=>K(w.k)).filter(Boolean);
    const sel=F.id||"";
    return {title:L("Rechnung erfassen","Add invoice"),body:(ks.length?`<div class="f wide"><label for="fK">${L("Handwerker","Contractor")}</label><select id="fK">${ks.map(k=>`<option value="${k.id}"${k.id===sel?" selected":""}>${esc(k.name)}</option>`).join("")}</select><span class="hint">${L("Nur Handwerker mit Werkvertrag in diesem Projekt.","Only contractors with a contract in this project.")}</span></div>`:`<div class="f wide"><span class="err">${L("Zuerst bei einem Handwerker einen Werkvertrag erfassen.","First add a contract for a contractor.")}</span></div>`)
      +`<div class="f"><label for="fType">${L("Art","Type")}</label><select id="fType"><option value="akonto">Akonto</option><option value="schluss">${L("Schlussrechnung","Final invoice")}</option><option value="regie">${L("Regie","Time & materials")}</option></select></div>`
      +fld("fNo",L("Rechnungsnummer","Invoice number"),"")+fld("fAmt",L("Betrag CHF","Amount CHF"),"",{mode:"decimal",req:true})+fld("fDate",L("Datum","Date"),iso(TODAY),{type:"date"})+fld("fDue",L("Fällig am","Due"),addDays(iso(TODAY),30),{type:"date"})+fld("fRef",L("Referenz (optional)","Reference (optional)"),"",{wide:true}),noSubmit:!ks.length};}
  if(F.f==="bkp"){return {title:L("BKP-Position hinzufügen","Add BKP item"),body:`<div class="f wide"><label for="fStd">${L("Position","Item")}</label><select id="fStd">${STD_BKP.filter(s=>!p.budget.some(b=>b.bkp===s[0])).map(s=>`<option value="${s[0]}">${s[0]} ${esc(S.lang==="de"?s[1]:s[2])}</option>`).join("")}<option value="_">${L("Eigene Position …","Custom item …")}</option></select></div>`+fld("fCode",L("Eigene: BKP-Nummer","Custom: BKP number"),"",{mode:"numeric"})+fld("fLabel",L("Eigene: Bezeichnung","Custom: name"),"")+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),"",{mode:"decimal",wide:true})};}
  if(F.f==="kv"){const b=B(F.id);return {title:"BKP "+b.bkp+" "+tx(b),body:fld("fLabel",L("Bezeichnung","Name"),tx(b),{wide:true})+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),b.kv||"",{mode:"decimal",wide:true}),del:!PC().some(w=>w.bkp===b.bkp)};}
  if(F.f==="answer"){const i=INV(F.id);return {title:L("Antwort erhalten","Reply received"),body:`<div class="f wide"><label for="fNote">${L("Was war die Antwort?","What was the reply?")}</label><textarea id="fNote" rows="3" placeholder="${L("z. B. Rapporte erhalten, 6 h bestätigt","e.g. time sheets received, 6 h confirmed")}"></textarea><span class="hint">${L("Wird im Verlauf gespeichert. Die Rechnung ist danach wieder zu prüfen.","Saved in the history. The invoice goes back to review.")}</span></div>`};}
  if(F.f==="ded"){const i=INV(F.id),d=i.ded||{};return {title:L("Abzug · ","Deduction · ")+i.no,body:fld("fDedAmt",L("Abzug CHF","Deduction CHF"),d.amt||"",{mode:"decimal",req:true})+`<div class="f wide"><label for="fDedWhy">${L("Begründung","Reason")}</label><textarea id="fDedWhy" rows="2" placeholder="${L("z. B. 2 h Regie nicht belegt","e.g. 2 h not supported by time sheets")}">${esc(d.why||"")}</textarea><span class="hint">${L("Rechnung ","Invoice ")}${nf2.format(i.gross)} · ${L("0 eingeben, um den Abzug zu entfernen.","Enter 0 to remove the deduction.")}</span></div>`};}
  if(F.f==="firm"){return {title:L("Büro","Office"),body:fld("fName",L("Firmenname","Company name"),D.firm.name,{wide:true,hint:L("Erscheint in Rückfragen an Handwerker.","Used in queries to contractors.")})};}
  return null;
}
function formHTML(){
  const d=formDef(); if(!d) return "";
  const delKey="delform";
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="fT">
    <div class="ohead"><h2 id="fT" style="font-size:1.25rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <form id="frm" class="obody" novalidate><div class="fields">${d.body}</div><span class="err" id="formErr" role="alert"></span>
    ${d.del?(S.confirm===delKey?`<button type="button" class="ghost danger" data-act="form-del">${L("Wirklich löschen?","Really delete?")}</button>`:`<button type="button" class="ghost" data-act="ask" data-c="${delKey}">${L("Löschen","Delete")}</button>`):""}</form>
    ${d.noSubmit?"":`<div class="ofoot"><button type="submit" form="frm" class="btn primary">${L("Speichern","Save")}</button></div>`}</div>`;
}
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():"";};
function submitForm(){
  const F=S.form,p=P();S.formErr="";
  const fail=m=>{const e=document.getElementById("formErr");if(e)e.textContent=m;};
  if(F.f==="project"){
    if(!val("fName")) return fail(L("Projektname fehlt.","Project name missing."));
    if(F.id){const x=D.projects.find(q=>q.id===F.id);Object.assign(x,{name:val("fName"),place:val("fPlace"),client:val("fClient"),desc:val("fDesc")});}
    else{const x={id:newId("p"),name:val("fName"),place:val("fPlace"),client:val("fClient"),desc:val("fDesc"),budget:[]};D.projects.push(x);D.pid=x.id;S.view="budget";}
    closeAll();render();return toast(L("Projekt gespeichert","Project saved"));
  }
  if(F.f==="contractor"){
    if(!val("fName")) return fail(L("Firma fehlt.","Company missing."));
    const iban=val("fIban");
    if(iban&&!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(norm(iban))) return fail(L("IBAN prüfen: Schweizer IBAN hat 21 Zeichen (CH…).","Check the IBAN: Swiss IBANs have 21 characters (CH…)."));
    const rec={name:val("fName"),street:val("fStreet"),zip:val("fZip"),city:val("fCity"),iban:iban?fmtIban(iban):"",email:val("fEmail"),phone:val("fPhone")};
    if(F.id) Object.assign(K(F.id),rec); else{const k=Object.assign({id:newId("k")},rec);D.contractors.push(k);S.kid=k.id;S.view="handwerker";}
    closeAll();render();return toast(L("Handwerker gespeichert","Contractor saved"));
  }
  if(F.f==="contract"){
    const sum=num(val("fSum")),ret=num(val("fRet"));
    if(sum===null||sum<0) return fail(L("Werkvertragssumme eingeben.","Enter the contract sum."));
    if(ret===null||ret<0||ret>30) return fail(L("Rückbehalt zwischen 0 und 30 %.","Retention between 0 and 30 %."));
    const bkp=document.getElementById("fBkp").value;ensureBkp(bkp);
    let w=F.w&&W(F.w); if(w) Object.assign(w,{bkp,sum:r2(sum),ret}); else{w={id:newId("w"),pid:D.pid,k:F.id,bkp,sum:r2(sum),ret};D.contracts.push(w);}
    closeAll();render();return toast(L("Werkvertrag gespeichert","Contract saved"));
  }
  if(F.f==="invoice"){
    const kid=val("fK"),amt=num(val("fAmt"));const w=CW(kid);
    if(!w) return fail(L("Handwerker wählen.","Choose a contractor."));
    if(F.rep&&INV(F.rep)&&W(INV(F.rep).w).k!==kid) return fail(L("Ersetzen geht nur mit einer Rechnung vom selben Handwerker: ","Replacing only works with an invoice from the same contractor: ")+K(W(INV(F.rep).w).k).name);
    if(!amt||amt<=0) return fail(L("Betrag eingeben.","Enter the amount."));
    const type=val("fType"),ref=val("fRef");
    if(ref&&D.invoices.some(x=>x.ref&&live(x)&&x.id!==F.rep&&norm(x.ref)===norm(ref))) return fail(L("Diese Referenz ist bereits erfasst (Doppelrechnung).","This reference is already recorded (duplicate)."));
    const ni={id:newId("i"),no:val("fNo")||L("ohne Nr.","no number"),w:w.id,type,n:type==="akonto"?D.invoices.filter(x=>x.w===w.id&&x.type==="akonto").length+1:0,date:val("fDate")||iso(TODAY),due:val("fDue")||addDays(iso(TODAY),30),gross:r2(amt),status:"pruefen",ref:ref?fmtRef(ref):""};
    logInv(ni,L("Von Hand erfasst","Entered by hand"));D.invoices.push(ni);if(F.rep)linkReplace(F.rep,ni);
    closeAll();S.drawer=ni.id;render();return toast(L("Rechnung erfasst","Invoice added"));
  }
  if(F.f==="bkp"){
    let code=val("fStd"),label;
    if(code==="_"){code=val("fCode");label=val("fLabel");if(!/^\d{2,4}(\.\d+)?$/.test(code)||!label) return fail(L("BKP-Nummer und Bezeichnung eingeben.","Enter BKP number and name."));}
    if(p.budget.some(b=>b.bkp===code)) return fail(L("Diese Position gibt es schon.","This item already exists."));
    const s=STD_BKP.find(x=>x[0]===code);
    p.budget.push({bkp:code,de:label||(s?s[1]:code),en:label||(s?s[2]:code),kv:r2(num(val("fKv"))||0)});p.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));
    closeAll();render();return toast("BKP "+code);
  }
  if(F.f==="kv"){
    const b=B(F.id),kv=num(val("fKv"));
    if(kv===null||kv<0) return fail(L("Betrag eingeben.","Enter an amount."));
    b.kv=r2(kv);const lab=val("fLabel");if(lab){if(S.lang==="de")b.de=lab;else b.en=lab;}
    closeAll();render();return toast(L("Gespeichert","Saved"));
  }
  if(F.f==="answer"){const i=INV(F.id),note=(document.getElementById("fNote").value||"").trim();i.status="pruefen";logInv(i,L("Antwort erhalten","Reply received")+(note?": "+note:""));const id=i.id;closeAll();S.drawer=id;render();return toast(L("Wieder zu prüfen","Back to review"));}
  if(F.f==="ded"){const i=INV(F.id),amt=num(val("fDedAmt")),why=(document.getElementById("fDedWhy").value||"").trim();
    if(amt===null||amt<0) return fail(L("Betrag eingeben.","Enter an amount."));
    if(amt>=i.gross) return fail(L("Der Abzug muss kleiner als die Rechnung sein.","The deduction must be less than the invoice."));
    if(amt>0&&!why) return fail(L("Bitte kurz begründen.","Please give a short reason."));
    if(amt>0){i.ded={amt:r2(amt),why};logInv(i,L("Abzug CHF ","Deduction CHF ")+nf2.format(r2(amt))+": "+why);}else if(i.ded){delete i.ded;logInv(i,L("Abzug entfernt","Deduction removed"));}
    const id=i.id;closeAll();S.drawer=id;render();return toast(amt>0?L("Abzug gespeichert","Deduction saved"):L("Abzug entfernt","Deduction removed"));}
  if(F.f==="firm"){D.firm.name=val("fName");closeAll();render();return toast(L("Gespeichert","Saved"));}
}
function formDelete(){
  const F=S.form;
  if(F.f==="contractor"){D.contractors=D.contractors.filter(k=>k.id!==F.id);S.kid=null;}
  if(F.f==="contract"){const w=W(F.w);D.contracts=D.contracts.filter(x=>x!==w);S.wid=null;}
  if(F.f==="kv"){const p=P();p.budget=p.budget.filter(b=>b.bkp!==F.id);}
  closeAll();render();toast(L("Gelöscht","Deleted"));
}

/* ---------- sheets: Excel, projects, data ---------- */
function sheetDef(key){
  const ex=(label,act,id)=>({label,act,id}),im=(label,imp,id,acc)=>({label,imp,id,acc}),bt=(label,act,id,cls)=>({label,act,id,btn:true,cls});
  if(key==="projects") return {title:L("Projekte","Projects"),groups:[["",D.projects.map(p=>bt((p.id===D.pid?"● ":"")+p.name+(p.place?" · "+p.place:""),"pick-project",p.id))],["",[bt(L("+ Neues Projekt","+ New project"),"form-project"),...(P()?[bt(L("Aktuelles Projekt bearbeiten","Edit current project"),"form-project-edit",D.pid)]:[])]]]};
  if(key==="daten"){
    const c=S.confirm;
    return {title:L("Daten und Sicherung","Data and backup"),groups:[
      [L("Sicherung","Backup"),[ex(L("Sicherung herunterladen","Download backup"),"backup"),im(L("Sicherung laden","Restore backup"),"backup",null,".json")]],
      [L("Büro","Office"),[bt(L("Firmenname: ","Company name: ")+(D.firm.name||"–"),"form-firm")]],
      [L("Neu beginnen","Start over"),[bt(c==="reset-ex"?L("Wirklich alles durch Beispieldaten ersetzen?","Really replace everything with example data?"):L("Beispieldaten laden","Load example data"),c==="reset-ex"?"reset-ex":"ask",c==="reset-ex"?null:"reset-ex",c==="reset-ex"?"danger":""),
        bt(c==="reset-all"?L("Wirklich alle Daten löschen?","Really delete all data?"):L("Alle Daten löschen","Delete all data"),c==="reset-all"?"reset-all":"ask",c==="reset-all"?null:"reset-all","danger")]]],
      note:L("Die Daten liegen nur in diesem Browser. Laden Sie regelmässig eine Sicherung herunter.","Data lives only in this browser. Download a backup regularly.")};
  }
  if(key==="rechnungen") return {title:"Excel",groups:[[L("Herunterladen","Download"),[ex(L("Rechnungsliste","Invoice list"),"x-invoices")]]]};
  if(key==="handwerker") return {title:"Excel",groups:[[L("Hochladen","Upload"),[im(L("Handwerkerliste importieren","Import contractor list"),"contractors")]],[L("Herunterladen","Download"),[ex(L("Handwerkerliste","Contractor list"),"x-contractors")]]]};
  if(key==="budget") return {title:"Excel",groups:[[L("Herunterladen","Download"),[ex(L("Kostenübersicht für die Bauherrschaft","Cost overview for the client"),"x-report"),ex(L("Budget nach BKP","Budget by BKP"),"x-budget")]]]};
  if(key==="tender") return {title:"Excel",groups:[[L("Herunterladen","Download"),[ex(L("Verfahrensliste","Procedure list"),"x-tenders"),ex(L("Referenzliste","Reference list"),"x-refs")]]]};
  if(key.startsWith("t:")) return {title:"Excel",groups:[[L("Herunterladen","Download"),[ex(L("Referenzen für diese Bewerbung","References for this bid"),"x-refs",key.slice(2))]]]};
  if(key.startsWith("k:")){const id=key.slice(2),w=CW(id);
    return {title:"Excel",groups:[[L("Hochladen","Upload"),w?[im(L("Offerte","Offer"),"offer",w.id),im(L("Schlussabrechnung","Final account"),"final",w.id)]:[]],[L("Herunterladen","Download"),[ex(L("Dossier für Sie","File for you"),"x-dossier",id),ex(L("Kontoauszug für den Handwerker","Statement for the contractor"),"x-statement",id),ex(L("Leere Offertvorlage","Blank offer template"),"x-template")]]]};}
  return null;
}
function sheetHTML(){
  const d=sheetDef(S.sheet);if(!d)return "";
  const items=d.groups.filter(g=>g[1].length).map(([g,list])=>(g?`<div class="grp">${g}</div>`:"")+list.map(x=>x.imp
    ?`<label class="mi"><span>${esc(x.label)}</span><span class="k">${x.acc===".json"?".json ↑":".xlsx ↑"}</span><input type="file" accept="${x.acc||".xlsx,.xls,.csv"}" data-imp="${x.imp}"${x.id?` data-id="${x.id}"`:""} aria-label="${esc(x.label)}"></label>`
    :x.btn?`<button type="button" class="mi ${x.cls||""}" data-act="${x.act}"${x.id?` data-id="${x.id}" data-c="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k"></span></button>`
    :`<button type="button" class="mi" data-act="${x.act}"${x.id?` data-id="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k">${x.act==="backup"?".json ↓":".xlsx ↓"}</span></button>`).join("")).join("");
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sT">
    <div class="ohead"><h2 id="sT" style="font-size:1.25rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody"><div class="menu">${items}</div>${d.note?`<span class="fine" style="color:var(--faint);font-size:.82rem">${esc(d.note)}</span>`:""}</div></div>`;
}

function renderOverlay(){queueMicrotask(()=>{const q=document.getElementById("qtext");if(q&&!q.dataset.top){q.scrollTop=0;q.dataset.top="1";}});queueMicrotask(()=>document.querySelectorAll('input[type=file]').forEach(x=>{if(!x.title)x.title=" ";}));
  const o=document.getElementById("overlay");let h="";
  if(S.form) h=formHTML(); else if(S.modal) h=captureHTML(); else if(S.sheet) h=sheetHTML(); else if(S.drawer&&INV(S.drawer)) h=drawerHTML(INV(S.drawer));
  o.innerHTML=h;o.classList.toggle("on",!!h);
  if(S.modal&&S.modal.step===1&&P()&&!S.modal.camErr){if(cam)attachCam();else startCam();}
  const f=document.getElementById("frm");if(f)f.addEventListener("submit",e=>{e.preventDefault();submitForm();});
}

/* ---------- Excel in ---------- */
function mapSheet(rows,spec,need){
  for(let r=0;r<Math.min(rows.length,25);r++){
    const hdr=(rows[r]||[]).map(c=>String(c).trim().toLowerCase()),m={};
    Object.keys(spec).forEach(key=>{m[key]=hdr.findIndex(h=>h&&spec[key](h));});
    if(need.every(key=>m[key]>=0)) return {r,m};
  }
  return null;
}
async function readRows(file){
  if(typeof XLSX==="undefined") throw new Error("lib");
  const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:"",raw:true});
}
const LINE_SPEC={pos:h=>/^(pos\.?|position|nr\.?|no\.?|#)$/.test(h),text:h=>/beschr|bezeich|text|leistung|descr|arbeit|item/.test(h),unit:h=>/einheit|^unit|^eh$|^me$/.test(h),qty:h=>/menge|qty|quantity|anzahl/.test(h),price:h=>/einheitspreis|^ep$|e\.p\.|preis|price|ansatz|rate/.test(h)&&!/total|gesamt|betrag|summe|amount/.test(h)};
function parseLines(rows){
  const hm=mapSheet(rows,LINE_SPEC,["text","qty","price"]);if(!hm)return null;
  const out=[];
  for(let r=hm.r+1;r<rows.length;r++){
    const row=rows[r]||[],text=String(row[hm.m.text]||"").trim(),q=num(row[hm.m.qty]),pr=num(row[hm.m.price]);
    if(!text||q===null||pr===null)continue;
    out.push({pos:hm.m.pos>=0&&String(row[hm.m.pos]).trim()!==""?String(row[hm.m.pos]).trim():String(out.length+1),text,unit:hm.m.unit>=0?String(row[hm.m.unit]).trim():"",qty:q,price:pr});
  }
  return out.length?out:null;
}
const K_SPEC={name:h=>/firma|name|unternehm|company|handwerker|contractor/.test(h),street:h=>/strasse|straße|street|adresse|address/.test(h),zip:h=>/plz|zip|postleit|postcode/.test(h),city:h=>/^ort|city|stadt|town/.test(h),iban:h=>/iban/.test(h),email:h=>/mail/.test(h),phone:h=>/tel|phone|mobil|natel/.test(h)};
async function handleImport(kind,file,id){
  if(!file)return;
  S.sheet=null;S.confirm=null;
  if(kind==="backup"){
    try{const o=JSON.parse(await file.text());if(!o||o.v!==1||!Array.isArray(o.projects))throw new Error("format");D=o;S.kid=null;S.tid=null;S.view="uebersicht";render();return toast(L("Sicherung geladen","Backup restored"));}
    catch(e){render();return toast(L("Keine gültige arkitecton-Sicherung","Not a valid arkitecton backup"));}
  }
  let rows;try{rows=await readRows(file);}catch(e){render();return toast(L("Datei nicht lesbar","File could not be read"));}
  if(kind==="contractors"){
    const hm=mapSheet(rows,K_SPEC,["name"]);if(!hm){render();return toast(L("Keine Spalte «Firma» gefunden","No “Company” column found"));}
    let added=0,filled=0;
    for(let r=hm.r+1;r<rows.length;r++){
      const row=rows[r]||[],g=key=>hm.m[key]>=0?String(row[hm.m[key]]).trim():"",name=g("name");if(!name)continue;
      const rec={street:g("street"),zip:g("zip"),city:g("city"),iban:g("iban")?fmtIban(g("iban")):"",email:g("email"),phone:g("phone")};
      const k=D.contractors.find(c=>c.name.trim().toLowerCase()===name.toLowerCase());
      if(k){let ch=false;Object.keys(rec).forEach(f=>{if(!k[f]&&rec[f]){k[f]=rec[f];ch=true;}});if(ch)filled++;}
      else{D.contractors.push(Object.assign({id:newId("k"),name},rec));added++;}
    }
    render();if(!added&&!filled)return toast(L("Keine neuen Angaben in der Datei. Mit Numbers bearbeitet? Ablage › Exportieren › Excel, dann diese Datei hochladen.","No new details in the file. Edited in Numbers? File › Export To › Excel, then upload that file."),7000);
    return toast(L(`${added} neu · ${filled} ergänzt`,`${added} new · ${filled} completed`));
  }
  const lines=parseLines(rows),w=W(id);
  if(!lines||!w){render();return toast(L("Keine Positionen gefunden","No items found"));}
  if(kind==="offer"){w.offer=lines;if(!w.sum)w.sum=sumLines(lines);}
  else{if(!w.offer){render();return toast(L("Zuerst die Offerte laden","Load the offer first"));}w.final=lines;}
  S.ktab="vergleich";render();
  const c=compare(w);
  toast(kind==="offer"?L(`${lines.length} Positionen · ${chf(c.ot,false)}`,`${lines.length} items · ${chf(c.ot,false)}`):L(`Verglichen · ${sgn(c.diff)}`,`Compared · ${sgn(c.diff)}`));
}

/* ---------- Excel and backup out ---------- */
function saveBlob(filename,blob){
  try{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast(L("Erstellt · ","Created · ")+filename);}
  catch(e){toast(L("Datei nicht erstellt","File not created"));}
}
function wbSave(filename,sheets){
  S.sheet=null;renderOverlay();
  if(typeof XLSX==="undefined") return toast(L("Excel-Modul nicht geladen","Excel module not loaded"));
  const wb=XLSX.utils.book_new();
  sheets.forEach(s=>{const ws=XLSX.utils.aoa_to_sheet(s.rows);ws["!cols"]=s.widths.map(wch=>({wch}));Object.keys(ws).forEach(a=>{if(a[0]!=="!"&&ws[a].t==="n")ws[a].z="#,##0.00";});XLSX.utils.book_append_sheet(wb,ws,s.name.slice(0,31));});
  saveBlob(filename,new Blob([XLSX.write(wb,{bookType:"xlsx",type:"array"})],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
}
const slug=s=>String(s).replace(/[^A-Za-z0-9äöüÄÖÜ]+/g,"-").replace(/^-|-$/g,"");
const headRows=title=>[[title],[projTitle()],[L("Stand","As of")+" "+fdate(iso(TODAY))],[]];
function invRows(list,withK){
  const h=[L("Rechnung","Invoice")].concat(withK?[L("Handwerker","Contractor"),"BKP"]:[],[L("Art","Type"),L("Datum","Date"),L("Fällig","Due"),L("Betrag CHF","Amount CHF"),L("Rückbehalt CHF","Retention CHF"),L("Auszahlung CHF","Payout CHF"),"Status",L("Referenz","Reference")]);
  return [h].concat(list.map(i=>{const w=W(i.w);return [i.no].concat(withK?[K(w.k).name,w.bkp]:[],[typeLabel(i),fdate(i.date),fdate(i.due),i.gross,retention(i),payout(i),stLabel(i.status),i.ref]);}));
}
function cmpRows(c){
  const h=["Pos",L("Beschreibung","Description"),L("Einheit","Unit"),L("Menge Offerte","Qty offer"),L("Menge abgerechnet","Qty billed"),L("Offerte CHF","Offer CHF"),L("Abgerechnet CHF","Billed CHF"),L("Differenz CHF","Difference CHF"),L("Hinweis","Note")];
  const rows=c.rows.map(r=>[r.pos,r.text,r.unit||"",r.oq===null?"":r.oq,r.fq===null?"":r.fq,r.kind==="new"?"":r.oa,r.fa===null?"":r.fa,r.diff===null?"":r.diff,r.kind==="new"?L("nicht offeriert","not in offer"):r.kind==="missing"?L("nicht abgerechnet","not billed"):r.kind==="more"?L("über Offerte","above offer"):""]);
  rows.push(["","Total","","","",c.ot,c.ft===null?"":c.ft,c.diff===null?"":c.diff,""]);
  return [h].concat(rows);
}
const pslug=()=>slug(P()?P().name:"Projekt");
const EXPORT={
  "backup"(){S.sheet=null;renderOverlay();saveBlob("arkitecton-sicherung-"+iso(TODAY)+".json",new Blob([JSON.stringify(D,null,1)],{type:"application/json"}));},
  "x-report"(){const rows=budgetRows(),t=totals(rows),body=rows.map(r=>[r.b.bkp,tx(r.b),r.b.kv,r.awarded,r.billed,r.rest]);body.push(["","Total",t.kv,t.awarded,t.billed,t.rest]);
    wbSave("Kostenuebersicht-"+pslug()+".xlsx",[{name:L("Kostenübersicht","Cost overview"),widths:[8,30,18,16,16,16],rows:headRows(L("Kostenübersicht für die Bauherrschaft","Cost overview for the client")).concat([["BKP",L("Arbeitsgattung","Trade"),L("Kostenvoranschlag CHF","Estimate CHF"),L("Vergeben CHF","Awarded CHF"),L("Abgerechnet CHF","Billed CHF"),L("Rest CHF","Remaining CHF")]],body)}]);},
  "x-budget"(){const rows=budgetRows(),t=totals(rows),body=rows.map(r=>[r.b.bkp,tx(r.b),r.b.kv,r.awarded,r.billed,r.paid,r.ret,r.open,r.rest]);body.push(["","Total",t.kv,t.awarded,t.billed,t.paid,t.ret,t.open,t.rest]);
    wbSave("Budget-BKP-"+pslug()+".xlsx",[{name:"Budget BKP",widths:[8,30,18,14,14,14,14,14,14],rows:headRows(L("Budget nach BKP","Budget by BKP")).concat([["BKP",L("Arbeitsgattung","Trade"),L("Kostenvoranschlag","Estimate"),L("Vergeben","Awarded"),L("Abgerechnet","Billed"),L("Ausbezahlt","Paid out"),L("Rückbehalt","Retention"),L("Zu prüfen","To check"),L("Rest","Remaining")]],body)}]);},
  "x-invoices"(){wbSave("Rechnungen-"+pslug()+".xlsx",[{name:L("Rechnungen","Invoices"),widths:[16,26,7,18,12,12,14,14,14,14,34],rows:headRows(L("Rechnungsliste","Invoice list")).concat(invRows(PI().slice().sort((a,b)=>toDate(a.date)-toDate(b.date)),true))}]);},
  "x-contractors"(){wbSave("Handwerkerliste.xlsx",[{name:L("Handwerker","Contractors"),widths:[28,26,8,18,30,34,16],rows:[[L("Firma","Company"),L("Strasse","Street"),L("PLZ","ZIP"),L("Ort","City"),"IBAN",L("E-Mail","Email"),L("Telefon","Phone")]].concat(D.contractors.map(k=>[k.name,k.street,k.zip,k.city,k.iban,k.email,k.phone]))}]);},
  "x-template"(){wbSave("Vorlage-Offerte.xlsx",[{name:L("Offerte","Offer"),widths:[6,40,10,10,14],rows:[["Pos",L("Beschreibung","Description"),L("Einheit","Unit"),L("Menge","Quantity"),L("Einheitspreis","Unit price")]]}]);},
  "x-dossier"(id){const k=K(id),w=CW(id);if(!w)return toast(L("Kein Werkvertrag","No contract"));
    const inv=D.invoices.filter(i=>i.w===w.id).sort((a,b)=>toDate(a.date)-toDate(b.date)),c=compare(w);
    const info=headRows(L("Dossier ","File ")+k.name).concat([[L("Adresse","Address"),[k.street,k.zip,k.city].filter(Boolean).join(", ")],["IBAN",k.iban],[L("E-Mail","Email"),k.email],[L("Werkvertrag","Contract"),"BKP "+w.bkp+" "+bName(w.bkp)],[L("Werkvertragssumme CHF","Contract sum CHF"),w.sum],[L("Rückbehalt %","Retention %"),retPct(w)],[]]);
    const sh=[{name:L("Konto","Account"),widths:[24,18,12,12,14,14,14,14,34],rows:info.concat(invRows(inv,false))}];
    if(c)sh.push({name:L("Offerte und Abrechnung","Offer and final account"),widths:[6,38,10,14,16,14,16,14,18],rows:cmpRows(c)});
    wbSave("Dossier-"+slug(k.name)+".xlsx",sh);},
  "x-statement"(id){const k=K(id),w=CW(id);if(!w)return toast(L("Kein Werkvertrag","No contract"));
    const inv=D.invoices.filter(i=>i.w===w.id).sort((a,b)=>toDate(a.date)-toDate(b.date)),tot=inv.filter(counted);
    wbSave("Kontoauszug-"+slug(k.name)+".xlsx",[{name:L("Kontoauszug","Statement"),widths:[34,18,12,12,14,14,14,14,34],rows:headRows(L("Kontoauszug für ","Statement for ")+k.name).concat(invRows(inv,false),[[],[L("Total freigegeben CHF","Total approved CHF"),"","","",tot.reduce((a,i)=>a+i.gross,0),tot.reduce((a,i)=>a+retention(i),0),tot.reduce((a,i)=>a+payout(i),0)]])}]);},
  "x-tenders"(){wbSave("Ausschreibungen.xlsx",[{name:L("Ausschreibungen","Tenders"),widths:[40,34,28,14,12,12,14,14],rows:[[L("Ausschreibungen","Tenders")],[L("Stand","As of")+" "+fdate(iso(TODAY))],[],[L("Verfahren","Procedure"),L("Auftraggeber","Contracting authority"),L("Verfahrensart","Procedure type"),L("Baukosten Mio. CHF","Cost CHF m"),L("Fragen bis","Questions by"),L("Eingabe bis","Submit by"),L("Eignung","Eligibility"),"Status"]].concat(D.tenders.map(t=>[tx(t.title),t.client,tx(PROC[t.proc]),t.cost,fdate(t.qDue),fdate(t.due),tx(FIT[fitOf(t).fit]),tx(TST[t.status])]))}]);},
  "x-refs"(id){const t=id?T(id):null,e=t?fitOf(t).ev.find(x=>x.k==="refs"):null,list=t?(e?e.refs:[]):D.office.refs;
    if(!list.length){S.sheet=null;renderOverlay();return toast(L("Keine passenden Referenzen","No matching references"));}
    const head=t?[[L("Referenzen: ","References: ")+tx(t.title)],[t.client],[]]:[[L("Referenzliste","Reference list")],[]];
    wbSave(t?"Referenzen-"+slug(tx(t.title))+".xlsx":"Referenzliste.xlsx",[{name:L("Referenzen","References"),widths:[44,26,10,16,8,16,12],rows:head.concat([[L("Projekt","Project"),L("Bauherrschaft","Client"),L("Öffentlich","Public"),L("Art","Type"),L("Jahr","Year"),L("Baukosten Mio. CHF","Cost CHF m"),L("SIA-Phasen","SIA phases")]],list.map(r=>[tx(r),r.client,r.pub?L("ja","yes"):L("nein","no"),tx(RTYPE[r.type]),r.running?L("laufend","ongoing"):r.year,r.cost,r.phases]))}]);}
};

/* ---------- events ---------- */
let toastT;
function toast(msg,ms){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),ms||3000);}
async function copy(text,ok){try{await navigator.clipboard.writeText(text);toast(ok);}catch(e){toast(L("Kopieren nicht möglich","Copy failed"));}}
function closeAll(){stopCam();S.drawer=null;S.modal=null;S.sheet=null;S.form=null;S.formErr="";S.confirm=null;S.queryOpen=false;S.done=null;}
function go(v){if(!VIEWS.includes(v))v="uebersicht";closeAll();S.view=v;if(v!=="handwerker")S.kid=null;if(v!=="ausschreibungen")S.tid=null;try{history.replaceState(null,"","#"+v);}catch(e){}render();document.getElementById("main").scrollTop=0;}
const openForm=(f,id,w)=>{const keepDrawer=S.drawer;closeAll();S.form={f,id:id||null,w:w||null,back:keepDrawer};renderOverlay();};

document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("site")&&S.kOpen)S.kOpen.ids[d.dataset.pid]=d.open;},true);
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  if(EXPORT[a])return void EXPORT[a](id);
  switch(a){
    case "start-example":D=seedExample();S.view="uebersicht";render();break;
    case "start-empty":D=seedEmpty();render();openForm("project");break;
    case "nav":S.kid=null;S.tid=null;go(el.dataset.v);break;
    case "lang":S.lang=el.dataset.l;try{localStorage.setItem("arkitecton:lang",S.lang);}catch(err){}render();break;
    case "filter":S.filter=el.dataset.f;render();break;
    case "jump-flags":{const f=document.getElementById("flags");if(f)f.scrollIntoView({behavior:"smooth",block:"start"});break;}
    case "all-flags":S.allFlags=!S.allFlags;render();break;
    case "open-inv":closeAll();S.drawer=id;renderOverlay();break;
    case "open-k":S.wid=null;S.kid=id;S.ktab="konto";go("handwerker");S.kid=id;render();break;
    case "open-cmp":{const w=W(id);if(!w)break;S.kid=w.k;S.ktab="vergleich";S.wid=w.id;go("handwerker");S.kid=w.k;S.wid=w.id;render();break;}
    case "open-w":S.wid=id;render();break;
    case "back-w":S.wid=null;render();break;
    case "back-k":S.kid=null;S.wid=null;render();break;
    case "ktab":S.ktab=el.dataset.t;S.wid=null;render();break;
    case "to-cmp":S.ktab="vergleich";render();break;
    case "cmp-all":S.cmpAll=!S.cmpAll;render();break;
    case "open-t":go("ausschreibungen");S.tid=id;render();break;
    case "back-t":S.tid=null;render();break;
    case "ttab":S.ttab=el.dataset.t;render();break;
    case "t-status":{const t=T(id);t.status=el.dataset.s;render();toast(tx(TST[t.status]));break;}
    case "t-doc":{const t=T(el.dataset.t);t.done[el.dataset.d]=!t.done[el.dataset.d];render();break;}
    case "sheet":closeAll();S.sheet=el.dataset.k;renderOverlay();break;
    case "form":openForm(el.dataset.f,id,el.dataset.w);break;
    case "form-project":openForm("project");break;
    case "form-project-edit":openForm("project",id);break;
    case "form-firm":openForm("firm");break;
    case "form-del":formDelete();break;
    case "pick-project":D.pid=id;closeAll();S.kid=null;render();toast(P().name);break;
    case "ask":S.confirm=el.dataset.c;renderOverlay();break;
    case "reset-ex":D=seedExample();closeAll();S.view="uebersicht";S.kid=null;S.tid=null;render();toast(L("Beispieldaten geladen","Example data loaded"));break;
    case "reset-all":try{localStorage.removeItem(KEY);}catch(err){}D=null;closeAll();render();break;
    case "close":{const back=S.form&&S.form.back;closeAll();if(back&&INV(back))S.drawer=back;render();break;}
    case "approve":{const i=INV(id);i.status="frei";logInv(i,L("Freigegeben","Approved"));S.done=null;S.queryOpen=false;render();toast(L("Freigegeben · ","Approved · ")+chf(payout(i)));break;}
    case "unapprove":{const i=INV(id);i.status="pruefen";logInv(i,L("Freigabe zurückgenommen","Approval undone"));render();break;}
    case "paid":{const i=INV(id);i.status="bezahlt";logInv(i,L("Bezahlt","Paid"));render();toast(L("Bezahlt","Paid"));break;}
    case "del-inv":D.invoices=D.invoices.filter(x=>x.id!==id);closeAll();render();toast(L("Rechnung gelöscht","Invoice deleted"));break;
    case "query":S.queryOpen=true;renderOverlay();{const q=document.getElementById("qtext");if(q)q.scrollIntoView({block:"nearest"});}break;
    case "copy-query":{const q=document.getElementById("qtext");copy(q?q.value:"",L("Kopiert","Copied"));break;}
    case "share-query":{const q=document.getElementById("qtext"),inv=D.invoices.find(x=>x.id===id);navigator.share({title:L("Rechnung ","Invoice ")+(inv?inv.no:""),text:q?q.value:""}).catch(()=>{});break;}
    case "gmail-query":{const q=document.getElementById("qtext"),inv=D.invoices.find(x=>x.id===id),k=inv&&K(W(inv.w).k);if(!k)break;window.open("https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(k.email)+"&su="+encodeURIComponent(L("Rechnung ","Invoice ")+inv.no)+"&body="+encodeURIComponent(q?q.value:""),"_blank","noopener");break;}
    case "mail-query":{const q=document.getElementById("qtext");if(q)el.href=el.href.split("&body=")[0]+"&body="+encodeURIComponent(q.value);break;}
    case "mark-query":{const i=INV(id);i.status="rueckfrage";logInv(i,L("Rückfrage gesendet","Query sent"));S.queryOpen=false;render();toast(L("Rückfrage gesendet · wartet auf Antwort","Query sent · waiting for reply"));break;}
    case "answer":openForm("answer",id);break;
    case "capture":closeAll();S.modal={step:1,data:null,err:"",busy:false};renderOverlay();break;
    case "manual":{const rep=S.modal&&S.modal.rep,ro=rep&&INV(rep);closeAll();openForm("invoice",ro?W(ro.w).k:null);S.form.rep=rep||null;break;}
    case "replace":{closeAll();S.modal={step:1,data:null,err:"",busy:false,rep:id};renderOverlay();break;}
    case "use-sample":stopCam();S.modal.data=Object.assign({},SAMPLE);setDates(S.modal.data);S.modal.err="";S.modal.step=2;renderOverlay();break;
    case "to-step3":{const amt=num(document.getElementById("capAmt").value);if(!amt||amt<=0){S.modal.err=L("Betrag eingeben","Enter the amount");return renderOverlay();}
      S.modal.data.amount=r2(amt);S.modal.data.no=document.getElementById("capNo").value.trim();S.modal.err="";S.modal.step=3;if(resolveCapture(S.modal.data).dup)logDup();renderOverlay();break;}
    case "confirm-capture":confirmCapture();break;
    case "ex-offer":{const w=W("w6");if(w){w.offer=EX_OFFER.map(x=>Object.assign({},x));render();toast(L("4 Positionen · CHF 34'600","4 items · CHF 34'600"));}break;}
    case "ex-final":{const w=W("w6");if(w){w.final=EX_FINAL.map(x=>Object.assign({},x));render();toast(L("Verglichen · ","Compared · ")+sgn(compare(w).diff));}break;}
  }
});
document.addEventListener("change",e=>{
  const t=e.target;if(!t.matches||!t.matches("input[type=file]"))return;
  const f=t.files&&t.files[0];if(!f)return;
  if(t.id==="scanIn")onScanFile(f);else if(t.dataset.imp){handleImport(t.dataset.imp,f,t.dataset.id);t.value="";}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&(S.drawer||S.modal||S.sheet||S.form)){closeAll();render();}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCam();});
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(D&&v!==S.view&&VIEWS.includes(v))go(v);});

try{const l=localStorage.getItem("arkitecton:lang");if(l==="de"||l==="en")S.lang=l;}catch(e){}
D=loadData();
const h0=location.hash.slice(1);if(VIEWS.includes(h0))S.view=h0;
render();
window.__ark={get D(){return D;},S,compare,budgetRows,totals,retention,payout,parseSPC,parseLines,flags};
})();
