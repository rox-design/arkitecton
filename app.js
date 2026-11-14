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
const S={lang:"de",view:"buero",filter:"pruefen",drawer:null,queryOpen:false,modal:null,sheet:null,form:null,confirm:null,
  kid:null,wid:null,kOpen:null,ktab:"konto",cmpAll:false,tid:null,ttab:"verfahren",allFlags:false,done:null};
const L=(de,en)=>S.lang==="de"?de:en;
const nf2=new Intl.NumberFormat("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
const nf0=new Intl.NumberFormat("de-CH",{maximumFractionDigits:0});
const nfq=new Intl.NumberFormat("de-CH",{maximumFractionDigits:2});
const chf=(n,dec)=>"CHF\u00a0"+(dec===false?nf0:nf2).format(n);
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
const FIT={ok:{de:"Erfüllt",en:"Eligible",c:"ok"},partner:{de:"Nur mit Partner",en:"Only with partner",c:"warn"},no:{de:"Nicht erfüllt",en:"Not eligible",c:"crit"}};
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
  return {v:1,seq:100,events:[],pid:"p1",firm:{name:L("Beispiel Architekten GmbH","Example Architects Ltd"),street:"Zugerstrasse 18",zip:"8820",city:"Wädenswil",iban:"CH6700700110004357712",email:"info@beispiel-architekten.example",phone:"044 780 12 34",vat:true,vatNo:"CHE-123.456.788 MWST"},
    projects:[{id:"p1",name:"MFH Seestrasse 12",place:"Wädenswil",client:"Familie Graf",cstreet:"Rebhalde 5",czip:"8820",ccity:"Wädenswil",desc:L("Neubau, 8 Wohnungen","New build, 8 flats"),
      budget:[["211",420000],["221",96000],["224",58000],["230",74000],["250",88000],["271",41000],["281",52000],["285",36000]].map(([b,kv])=>{const s=STD_BKP.find(x=>x[0]===b);return {bkp:b,de:s[1],en:s[2],kv};})},
      {id:"p2",name:"EFH Bergstrasse 4",place:"Horgen",client:"Herr und Frau Keller",cstreet:"Bergstrasse 4",czip:"8810",ccity:"Horgen",desc:L("Umbau Einfamilienhaus","Single-family house conversion"),
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
    fees:[
      {id:"h1",pid:"p1",no:"2026-011",date:d(-150),title:L("Honorar Akonto 1, Vorprojekt","Fee progress payment 1"),lines:[{t:L("Akonto 1, Phase Vorprojekt","Progress payment 1, preliminary design"),q:1,u:L("pauschal","lump sum"),p:24000}],vat:true,refType:"SCOR",ref:"RF812026011",rem:[],paid:d(-122),log:[{d:d(-150),t:L("Erstellt","Created")},{d:d(-122),t:L("Zahlung eingegangen","Payment received")}]},
      {id:"h2",pid:"p1",no:"2026-014",date:d(-66),title:L("Honorar Akonto 2, Bauprojekt","Fee progress payment 2"),lines:[{t:L("Akonto 2, Phase Bauprojekt","Progress payment 2, design"),q:1,u:L("pauschal","lump sum"),p:31000}],vat:true,refType:"SCOR",ref:"RF972026014",rem:[],paid:null,log:[{d:d(-66),t:L("Erstellt","Created")}]},
      {id:"h3",pid:"p1",no:"2026-017",date:d(-12),title:L("Honorar Bauleitung Oktober","Site supervision October"),lines:[{t:L("Bauleitung","Site supervision"),q:38,u:"h",p:145},{t:L("Nebenkosten, Fahrten","Expenses, travel"),q:1,u:L("pauschal","lump sum"),p:240}],vat:true,refType:"SCOR",ref:"RF162026017",rem:[],paid:null,log:[{d:d(-12),t:L("Erstellt","Created")}]}],
    office:tt.office,tenders:tt.tenders,example:true};
}
/* example data is written in the language active at start; on a language switch,
   swap the example texts that still match the other language */
function exampleSwap(to){
  if(!D)return;const keep=S.lang,pairs=new Map();
  S.lang="de";const de=seedExample();S.lang="en";const en=seedExample();S.lang=keep;
  const walk=(a,b)=>{if(typeof a==="string"&&typeof b==="string"){if(a!==b){if(to==="en")pairs.set(a,b);else pairs.set(b,a);}return;}
    if(a&&b&&typeof a==="object")Object.keys(a).forEach(k=>walk(a[k],b[k]));};
  walk(de,en);
  [["Honorar Akonto","Fee progress payment"],["Honorar Bauleitung","Site supervision"],["Akonto, Teilleistung","Progress payment"],["Akonto 1, Phase Vorprojekt","Progress payment 1"],["Akonto 2, Phase Bauprojekt","Progress payment 2"]].forEach(([d,e])=>{if(to==="en")pairs.set(d,e);else if(!pairs.has(e))pairs.set(e,d);});
  const fix=o=>{if(!o||typeof o!=="object")return;Object.keys(o).forEach(k=>{const v=o[k];if(typeof v==="string"&&pairs.has(v))o[k]=pairs.get(v);else if(v&&typeof v==="object")fix(v);});};
  fix(D.firm);fix(D.projects);fix(D.fees);
}
function seedEmpty(){const tt=seedTenders();return {v:1,seq:100,events:[],pid:null,firm:{name:""},projects:[],contractors:[],contracts:[],invoices:[],fees:[],office:tt.office,tenders:tt.tenders,example:false};}
const SAMPLE={name:"Meier Malerei GmbH",street:"Zürcherstrasse 88",zip:"8820",city:"Wädenswil",iban:"CH44 3199 9123 0008 8901 2",amount:12450,ref:"21 00000 00003 13947 14300 09017",no:"2026-417"};
const EX_OFFER=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1420,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:42,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410}];
const EX_FINAL=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1465,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:44,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410},{pos:"5",text:"Ausbesserungen nach Elektriker",unit:"h",qty:6,price:98}];

/* ---------- storage ---------- */
const KEY="arkitecton:data:v1";
let D=null;
function loadData(){try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(o&&o.v===1){o.fees=o.fees||[];o.firm=o.firm||{name:""};return o;}}}catch(e){}return null;}
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
const openSub=list=>{const n=st=>list.filter(i=>i.status===st).length,c=n("pruefen"),q=n("rueckfrage"),f=n("frei");return [c?c+" "+L("zu prüfen","to check"):"",q?q+" "+L("Rückfrage","queried"):"",f?f+" "+L("freigegeben","approved"):""].filter(Boolean).join(" · ")||L("nichts offen","nothing open");};
/* "Zu zahlen" means the same everywhere: every unpaid invoice, as the amount actually paid out */
const unpaid=list=>list.filter(i=>live(i)&&i.status!=="bezahlt");
const toPay=list=>r2(unpaid(list).reduce((a,i)=>a+payout(i),0));
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
/* one wording for time everywhere, always written out */
const dayWord=n=>n===1?L("Tag","day"):L("Tagen","days");
const dueText=dd=>dd<0?L("seit "+(-dd)+" "+dayWord(-dd)+" überfällig","overdue by "+(-dd)+" "+(-dd===1?"day":"days")):dd===0?L("heute fällig","due today"):L("fällig in "+dd+" "+dayWord(dd),"due in "+dd+" "+(dd===1?"day":"days"));
const dueTone=dd=>dd<0?"crit":dd<=7?"warn":"n";
const subTitle=t=>`<h3 class="subh">${t}</h3>`;
const row=o=>`<button type="button" class="row" data-act="${o.act}"${o.id?` data-id="${o.id}"`:""}${o.v?` data-v="${o.v}"`:""}>${dot(o.c)}<span class="rt">${o.title}</span><span class="rm">${o.meta||""}</span><span class="ra">${o.amt||""}</span><span class="rl l-${o.lc||o.c}">${o.label||""}</span></button>`;

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
    const open=inv.filter(i=>!counted(i)&&live(i)).reduce((a,i)=>a+net(i),0), ret=inv.filter(counted).reduce((a,i)=>a+retention(i),0);
    /* forecast: the contract, or what is billed incl. invoices still to check, whichever is higher */
    const forecast=Math.max(awarded,billed+open);
    return {b,awarded,billed,paid,approved,open,ret,forecast,rest:b.kv-forecast,over:b.kv>0&&forecast>b.kv};
  });
}
function totals(rows){const t={kv:0,awarded:0,billed:0,paid:0,approved:0,open:0,ret:0,rest:0};rows.forEach(r=>{for(const k in t)t[k]+=k==="kv"?r.b.kv:r[k];});return t;}
function flags(){
  const out=[], p=P(); if(!p) return out;
  PI().filter(i=>!counted(i)).forEach(i=>{
    const w=W(i.w),k=K(w.k);
    if(w.sum>0){const over=r2(billedOn(w.id,i.id)+net(i)-w.sum);if(over>0)out.push({c:"warn",t:k.name,m:L("über Werkvertrag","above contract"),chf:over,act:"open-inv",id:i.id});}
    if(i.type==="regie") out.push({c:"warn",t:k.name,m:L("Regie ausserhalb Werkvertrag","time & materials outside contract"),chf:i.gross,act:"open-inv",id:i.id});
  });
  PC().forEach(w=>{const c=compare(w);if(c&&c.hasFinal&&c.newSum>0)out.push({c:"warn",t:K(w.k).name,m:L("nicht offerierte Positionen","items not in the offer"),chf:c.newSum,act:"open-cmp",id:w.id});});
  budgetRows().filter(r=>r.over).forEach(r=>out.push({c:"warn",t:"BKP "+r.b.bkp+" "+tx(r.b),m:L("über Kostenvoranschlag","over cost estimate"),chf:-r.rest,act:"kv-explain",id:r.b.bkp}));
  return out;
}
/* total extra cost without counting the same money twice:
   per contract the larger of "above contract" and "not in offer", each time & materials invoice once,
   and a budget overrun only for the part the contracts above do not already explain */
function flagSum(fl){
  const g={},bud={};
  fl.forEach(f=>{
    if(f.act==="kv-explain"){bud[f.id]=f.chf||0;return;}
    const i=f.act==="open-inv"?INV(f.id):null, w=f.act==="open-cmp"?f.id:(i?i.w:null);
    const key=i&&i.type==="regie"&&/Regie|materials/.test(f.m)?"r:"+i.id:"w:"+w;
    g[key]={v:Math.max((g[key]||{}).v||0,f.chf||0),bkp:(W(w)||{}).bkp};
  });
  let t=Object.values(g).reduce((a,x)=>a+x.v,0);
  Object.keys(bud).forEach(b=>{const known=Object.values(g).filter(x=>x.bkp===b).reduce((a,x)=>a+x.v,0);t+=Math.max(0,bud[b]-known);});
  return r2(t);
}
function missingTasks(){
  if(!P())return [];
  return [...new Set(PC().map(w=>w.k))].map(K).filter(Boolean).map(k=>({k,m:missingOf(k)})).filter(x=>x.m.length);
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
const VIEWS=["buero","uebersicht","rechnungen","handwerker","budget","ausschreibungen"];
const NAV_ICO={
buero:'<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M10 20v-5h4v5"/>',
uebersicht:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
rechnungen:'<path d="M6.5 3h8l3.5 3.5V21h-11.5Z"/><path d="M14 3v4h4"/><path d="M9.5 11.5h5"/><path d="M9.5 15h5"/>',
handwerker:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
budget:'<path d="M4 20h16"/><path d="M7 20v-6"/><path d="M12 20V8"/><path d="M17 20v-9"/>',
ausschreibungen:'<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>'};
const navIco=v=>`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICO[v]}</svg>`;
const vName=v=>({buero:"Home",uebersicht:L("Projekt","Project"),rechnungen:L("Rechnungen","Invoices"),handwerker:L("Handwerker","Contractors"),budget:"Budget",ausschreibungen:L("Ausschreibungen","Tenders")})[v];
const SCAN_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 8h3v3H8zM13 13h3v3h-3zM13 8h3M8 13v3"/></svg>';
function renderChrome(){
  document.documentElement.lang=S.lang;
  const p=P();
  document.getElementById("railScan").textContent=L("Rechnung scannen","Scan invoice");
  const firmLvl=S.view==="buero"||S.view==="ausschreibungen",tp=document.getElementById("topProj");tp.innerHTML=esc(firmLvl?(S.view==="ausschreibungen"?L("Ausschreibungen","Tenders"):((D.firm&&D.firm.name)||L("Büroname ergänzen","Add firm name"))):(p?p.name:L("Kein Projekt","No project")))+'<span class="cv" aria-hidden="true">⌄</span>';tp.title=L("Büro und Projekte","Firm and projects");tp.setAttribute("aria-haspopup","dialog");
  document.querySelector(".topbar").classList.toggle("home",firmLvl);
  const fn=(D.firm&&D.firm.name)||L("Büroname ergänzen","Add firm name");["railFirm","topFirm"].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent=fn;e.title=L("Alle Projekte","All projects");e.setAttribute("aria-current",S.view==="buero"?"page":"false");}});
  document.getElementById("railData").textContent=L("Daten und Sicherung","Data and backup");
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.l===S.lang)));
  const nb=v=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${navIco(v)}<span>${vName(v)}</span></button>`;
  document.getElementById("nav").innerHTML=["uebersicht","rechnungen","handwerker","budget"].map(nb).join("");
  const fnv=document.getElementById("firmNav");if(fnv)fnv.innerHTML=nb("buero")+nb("ausschreibungen");
  const tb=(v,l)=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${navIco(v)}<span>${l}</span></button>`;
  document.getElementById("tabbar").innerHTML=tb("uebersicht",L("Projekt","Project"))+tb("rechnungen",L("Rechnungen","Invoices"))+`<button type="button" class="fab" data-act="capture" aria-label="${L("Rechnung scannen","Scan invoice")}">${SCAN_ICON}</button>`+tb("handwerker",L("Handwerker","Contractors"))+tb("budget","Budget");
}
const ph=(eyebrow,title,lead,tools)=>`<header class="ph"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${tools?`<div class="tools">${tools}</div>`:"<span></span>"}${lead?`<p class="lead">${lead}</p>`:""}</header>`;
const ICO={
copy:'<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
share:'<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
edit:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14 7 3 3"/>',
trash:'<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
flag:'<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
download:'<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;
const ibl=(n,label,attrs,short)=>`<button type="button" class="ibl" title="${label}" ${attrs||""}>${ico(n)}<span>${short||label}</span></button>`;
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

/* ---------- fee invoices (Debitoren) ---------- */
const VAT_RATE=8.1;
const r05=n=>Math.round(n*20)/20;
const FEES=()=>D.fees||(D.fees=[]);
const FE=id=>FEES().find(f=>f.id===id);
const PF=()=>FEES().filter(f=>f.pid===D.pid);
const mod97=s=>{let r=0;for(const ch of s){const v=parseInt(ch,36);const t=String(v);for(const d of t)r=(r*10+ +d)%97;}return r;};
const ibanValid=s=>{const x=norm(s);if(!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(x))return false;return mod97(x.slice(4)+x.slice(0,4))===1;};
const isQrIban=s=>{const x=norm(s),iid=+x.slice(4,9);return iid>=30000&&iid<=31999;};
const mod10r=s=>{const t=[0,9,4,6,8,2,7,1,3,5];let c=0;for(const d of s)c=t[(c+ +d)%10];return String((10-c)%10);};
function makeRef(no){
  if(isQrIban(D.firm.iban)){const digits=(String(no).replace(/\D/g,"")+String(Date.now()).slice(-6)).slice(-26).padStart(26,"0");return {type:"QRR",ref:digits+mod10r(digits)};}
  const body=String(no).replace(/[^0-9A-Za-z]/g,"").toUpperCase().slice(0,21)||"1";
  const chk=98-mod97(body+"RF00");return {type:"SCOR",ref:"RF"+String(chk).padStart(2,"0")+body};
}
const fmtRefOut=(t,r)=>t==="QRR"?r.slice(0,2)+" "+r.slice(2).replace(/(.{5})/g,"$1 ").trim():r.replace(/(.{4})/g,"$1 ").trim();
const feeSub=f=>r2(f.lines.reduce((a,l)=>a+r2((+l.q||0)*(+l.p||0)),0));
const feeVat=f=>f.vat?r2(feeSub(f)*VAT_RATE/100):0;
const feeTotal=f=>r05(feeSub(f)+feeVat(f));
const feeDue=f=>addDays(f.date,30);
const feeAge=f=>-daysTo(f.date);
const remDue=f=>{if(f.paid)return 0;const a=feeAge(f),lvl=a>=120?3:a>=90?2:a>=60?1:0,sent=(f.rem||[]).length;return lvl>sent&&sent<3?sent+1:0;};
const remName=n=>[L("1. Mahnung","1st reminder"),L("2. Mahnung","2nd reminder"),L("Letzte Mahnung","Final reminder")][n-1];
function feeState(f){
  if(f.paid) return {c:"ok",t:L("Bezahlt","Paid")};
  const r=remDue(f); if(r) return {c:"crit",t:remName(r)+L(" fällig"," due")};
  const sent=(f.rem||[]).length; if(sent) return {c:"warn",t:remName(sent)+L(" gesendet"," sent")};
  const d=daysTo(feeDue(f)); return {c:d<0?"warn":"n",t:dueText(d)};
}
const firmMissing=()=>{const f=D.firm||{},m=[];if(!f.name)m.push(L("Name","name"));if(!f.street||!f.zip||!f.city)m.push(L("Adresse","address"));if(!ibanValid(f.iban||""))m.push("IBAN");if(f.vat&&!f.vatNo)m.push(L("MWST-Nummer","VAT number"));return m;};
const nextFeeNo=()=>{const y=TODAY.getFullYear(),n=FEES().filter(f=>String(f.no).startsWith(y+"-")).reduce((a,f)=>Math.max(a,parseInt(String(f.no).slice(5),10)||0),0)+1;return y+"-"+String(n).padStart(3,"0");};
const splitStreet=s=>{const m=String(s||"").trim().match(/^(.*?)\s+(\d+\s?[a-zA-Z]?)$/);return m?[m[1],m[2].replace(/\s/g,"")]:[String(s||"").trim(),""];};

function addDemoFees(){const pidKeep=D.pid;if(!D.projects.some(p=>p.id===D.pid)&&D.projects[0])D.pid=D.projects[0].id;

      const F=D.firm;if(!F.street){Object.assign(F,{street:"Zugerstrasse 18",zip:"8820",city:"Wädenswil"});}if(!ibanValid(F.iban||"")){F.iban="CH6700700110004357712";}if(!F.email)F.email="info@beispiel-architekten.example";if(!F.phone)F.phone="044 780 12 34";if(F.vat===undefined){F.vat=true;F.vatNo="CHE-123.456.788 MWST";}
      const p=P();if(p&&!p.ccity){Object.assign(p,{cstreet:p.cstreet||"Rebhalde 5",czip:"8820",ccity:p.place||"Wädenswil",client:p.client||"Familie Graf"});}
      const ad=n=>iso(new Date(TODAY.getTime()+n*864e5));
      const mk=(no,days,title,lines,paid)=>{const r=makeRef(no),f={id:newId("h"),pid:D.pid,no,date:ad(days),title,lines,vat:!!F.vat,refType:r.type,ref:r.ref,rem:[],paid:paid?ad(paid):null,log:[{d:ad(days),t:L("Erstellt","Created")}]};if(paid)f.log.push({d:ad(paid),t:L("Zahlung eingegangen","Payment received")});FEES().push(f);};
      mk("2026-011",-150,L("Honorar Akonto 1, Vorprojekt","Fee progress payment 1"),[{t:L("Akonto 1, Phase Vorprojekt","Progress payment 1"),q:1,u:L("pauschal","lump sum"),p:24000}],-122);
      mk("2026-014",-66,L("Honorar Akonto 2, Bauprojekt","Fee progress payment 2"),[{t:L("Akonto 2, Phase Bauprojekt","Progress payment 2"),q:1,u:L("pauschal","lump sum"),p:31000}],0);
      mk("2026-017",-12,L("Honorar Bauleitung Oktober","Site supervision October"),[{t:L("Bauleitung","Site supervision"),q:38,u:"h",p:145},{t:L("Nebenkosten, Fahrten","Expenses, travel"),q:1,u:L("pauschal","lump sum"),p:240}],0);
      D.pid=pidKeep;}
/* ---------- income picture ---------- */
function addIncomeHistory(){
  const ps=D.projects.slice(0,2);if(!ps.length)return;
  const ad=n=>iso(new Date(TODAY.getTime()+n*864e5));
  const plan=[[-340,14500,28],[-312,9800,35],[-280,21000,24],[-255,6400,41],[-226,18200,30],[-198,12600,27],[-170,24500,33],[-140,8900,45],[-110,16700,29],[-84,11200,38],[-48,19400,26],[-36,7300,0]];
  plan.forEach(([d,amt,pay],k)=>{const p=ps[k%ps.length],no="2026-H"+String(k+1).padStart(2,"0");if(FEES().some(f=>f.no===no))return;const r=makeRef(no);
    const f={id:newId("h"),pid:p.id,no,date:ad(d),title:k%3===2?L("Honorar Bauleitung","Site supervision"):L("Honorar Akonto","Fee progress payment"),lines:[{t:k%3===2?L("Bauleitung","Site supervision"):L("Akonto, Teilleistung","Progress payment"),q:1,u:L("pauschal","lump sum"),p:amt}],vat:!!D.firm.vat,refType:r.type,ref:r.ref,rem:[],paid:pay?ad(d+pay):null,log:[{d:ad(d),t:L("Erstellt","Created")}]};
    if(pay)f.log.push({d:ad(d+pay),t:L("Zahlung eingegangen","Payment received")});FEES().push(f);});
}
/* ---------- document storage (IndexedDB, this device) ---------- */
const FDB={db:null,open(){return this.db?Promise.resolve(this.db):new Promise((ok,no)=>{const r=indexedDB.open("arkitecton-files",1);r.onupgradeneeded=()=>r.result.createObjectStore("files");r.onsuccess=()=>{this.db=r.result;ok(r.result);};r.onerror=()=>no(r.error);});},
  async put(id,blob){const db=await this.open();return new Promise((ok,no)=>{const t=db.transaction("files","readwrite");t.objectStore("files").put(blob,id);t.oncomplete=ok;t.onerror=()=>no(t.error);});},
  async get(id){const db=await this.open();return new Promise((ok,no)=>{const r=db.transaction("files").objectStore("files").get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});},
  async del(id){const db=await this.open();return new Promise(ok=>{const t=db.transaction("files","readwrite");t.objectStore("files").delete(id);t.oncomplete=ok;t.onerror=ok;});}};
const DOCS=()=>D.docs||(D.docs=[]);
const docsFor=(scope,ref)=>DOCS().filter(d=>d.scope===scope&&d.ref===ref).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
const kindOf=n=>{const e=(String(n).split(".").pop()||"").toLowerCase();return e==="pdf"?"PDF":["doc","docx"].includes(e)?"Word":["xls","xlsx","csv"].includes(e)?"Excel":["jpg","jpeg","png","heic"].includes(e)?L("Bild","Image"):e.toUpperCase();};
const fsize=b=>b>=1048576?(b/1048576).toFixed(1).replace(".0","")+" MB":Math.max(1,Math.round(b/1024))+" KB";
function docValid(d){if(!d.until)return null;const n=daysTo(d.until);return n<0?{c:"crit",t:L("abgelaufen","expired")}:n<=30?{c:"warn",t:L("läuft ab in "+n+" "+dayWord(n),"expires in "+n+" "+(n===1?"day":"days"))}:{c:"ok",t:L("gültig bis ","valid until ")+fdate(d.until)};}
function docsBlock(scope,ref,title,hint){
  const rk=d=>{const v=docValid(d);return v?{crit:0,warn:1,ok:2}[v.c]:3;};
  const list=docsFor(scope,ref).sort((a,b)=>scope==="firm"?rk(a)-rk(b):0);
  const rows=list.map(d=>{const v=docValid(d);return `<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${fsize(d.size||0)} · ${fdate(d.date)}${v?` · <span class="l-${v.c}">${v.t}</span>`:""}</span></button>${scope==="firm"?ib("edit",L("Gültigkeit","Validity"),`data-act="form" data-f="docvalid" data-id="${d.id}"`):""}${S.confirm==="ddel:"+d.id?`<button type="button" class="ghost danger" data-act="doc-del" data-id="${d.id}">${L("Löschen?","Delete?")}</button>`:ib("trash",L("Dokument löschen","Delete document"),`data-act="ask" data-c="ddel:${d.id}"`)}</div>`;}).join("");
  return `<section class="docs"><div class="sh"><h2>${title}</h2><span class="cnt">${list.length}</span><span class="right"><label class="ib" title="${L("Dokument hinzufügen","Add document")}" aria-label="${L("Dokument hinzufügen","Add document")}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" data-imp="doc" data-id="${scope}|${ref}"></label></span></div>
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
const firmDocAlerts=()=>docsFor("firm","firm").map(d=>({d,v:docValid(d)})).filter(x=>x.v&&x.v.c!=="ok");
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
  const ad=n=>iso(new Date(TODAY.getTime()+n*864e5)),F=D.firm.name||"Beispiel Architekten GmbH";
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
  if(!D||!D.example)return;D.mig=D.mig||{};
  if(!D.mig.docs){D.mig.docs=1;if(!DOCS().length&&window.indexedDB)addDemoDocs().then(render).catch(()=>{});}
  if(!D.mig.fees){if(!(D.fees||[]).length)addDemoFees();D.mig.fees=1;}
  if(!D.mig.income){addIncomeHistory();D.mig.income=1;}
  if(!D.mig.projs){D.mig.projs=1;[["Umbau Villa Seeblick","Küsnacht","Bauherrschaft Keller","Sanierung Gebäudehülle"],["Anbau Schulhaus Au","Wädenswil","Gemeinde Wädenswil","Erweiterung um 2 Klassenzimmer"]].forEach(([n,pl,cl,de])=>{if(!D.projects.some(p=>p.name===n))D.projects.push({id:newId("p"),name:n,place:pl,client:cl,desc:de,closed:true,budget:[]});});}
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
  const open=list.filter(f=>!f.paid),sum=open.reduce((a,f)=>a+feeTotal(f),0),due=list.filter(f=>remDue(f)).length;
  const rows=list.map(f=>{const st=feeState(f);return row({act:"open-fee",id:f.id,c:st.c,title:esc(f.title||L("Honorar","Fee")),meta:esc(f.no)+" · "+fdate(f.date),amt:chf(feeTotal(f),false),label:st.t,lc:st.c});}).join("");
  const miss=firmMissing();
  return `${miss.length?`<div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Für Rechnungen mit QR-Code fehlen Büro-Angaben: ","Firm details missing for QR invoices: ")}${miss.join(", ")}. <button type="button" class="ghost link" data-act="form" data-f="firm">${L("Ergänzen","Add")}</button></span></div>`:""}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Zu erhalten","To receive")}</span><span class="sv">${chf(sum,false)}</span><span class="ss">${open.length} ${open.length===1?L("Rechnung","invoice"):L("Rechnungen","invoices")}</span></div>
      <div class="stat"><span class="sl">${L("Mahnungen fällig","Reminders due")}</span><span class="sv${due?" warn":""}">${due}</span><span class="ss">${L("nach 60, 90, 120 Tagen","after 60, 90, 120 days")}</span></div>
      <div class="stat"><span class="sl">${L("Bezahlt","Paid")}</span><span class="sv">${chf(list.filter(f=>f.paid).reduce((a,f)=>a+feeTotal(f),0),false)}</span><span class="ss">${list.filter(f=>f.paid).length} ${L("Rechnungen","invoices")}</span></div>
    </div>
    <section><div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Honorarrechnungen.","No fee invoices yet.")}</span>${D.example?`<button type="button" class="btn" data-act="fee-demo">${L("Beispielrechnungen anzeigen","Show example invoices")}</button>`:""}</div>`}</div></section>`;
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
    <div class="f wide"><label class="chk"><input type="checkbox" id="fVatOn"${vat?" checked":""}> ${L("MWST "+VAT_RATE+" %","VAT "+VAT_RATE+" %")}</label></div>
    <div class="f wide"><div class="calc" id="feeCalc"></div><span class="hint">${L("An: ","To: ")}${esc(p&&p.client||L("Bauherrschaft im Projekt ergänzen","add the client in the project"))}${p&&p.ccity?" · "+esc([p.cstreet,[p.czip,p.ccity].join(" ")].filter(Boolean).join(", ")):""}</span></div>`;
  return {title:f?L("Honorarrechnung bearbeiten","Edit fee invoice"):L("Neue Honorarrechnung","New fee invoice"),body};
}
function keepFeeFields(fn){const keep=["fNo","fDate","fTitle"].map(i=>[i,val(i)]),vat=(document.getElementById("fVatOn")||{}).checked;fn();keep.forEach(([i,v])=>{const e=document.getElementById(i);if(e)e.value=v;});const c=document.getElementById("fVatOn");if(c)c.checked=vat;feeCalcUpdate();}
function readFirmForm(){if(!S.form||S.form.f!=="firm")return;const g=i=>val(i);Object.assign(S.form,{tmp:{fName:g("fName"),fStreet:g("fStreet"),fZip:g("fZip"),fCity:g("fCity"),fIban:g("fIban"),fEmail:g("fEmail"),fPhone:g("fPhone"),fVatNo:g("fVatNo"),fVat:(document.getElementById("fVat")||{}).checked}});}
function readFeeLines(){const F=S.form;if(!F||!F.lines)return;F.lines=F.lines.map((l,i)=>({t:val("lt"+i),q:val("lq"+i),u:val("lu"+i),p:val("lp"+i)}));}
function feeCalcUpdate(){
  const F=S.form;if(!F||F.f!=="fee")return;readFeeLines();
  const tmp={lines:F.lines.map(l=>({q:num(l.q)||0,p:num(l.p)||0})),vat:!!(document.getElementById("fVatOn")||{}).checked};
  const e=document.getElementById("feeCalc");if(!e)return;
  e.innerHTML=`<span>${L("Zwischentotal","Subtotal")}</span><span class="r">${nf2.format(feeSub(tmp))}</span>${tmp.vat?`<span>${L("MWST ","VAT ")+VAT_RATE} %</span><span class="r">${nf2.format(feeVat(tmp))}</span>`:""}<span class="sum">${L("Total","Total")}</span><span class="r sum">CHF ${nf2.format(feeTotal(tmp))}</span>`;
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
  const vat=document.getElementById("fVatOn").checked;
  let f=F.id&&FE(F.id);
  if(f){Object.assign(f,{no,date:val("fDate"),title:val("fTitle"),lines,vat});logInv(f,L("Bearbeitet","Edited"));}
  else{const r=makeRef(no);f={id:newId("h"),pid:D.pid,no,date:val("fDate"),title:val("fTitle"),lines,vat,refType:r.type,ref:r.ref,rem:[],paid:null,log:[]};logInv(f,L("Erstellt","Created"));FEES().push(f);}
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
      <div class="payline"><span class="l-${st.c}">${st.t}</span><span>${f.paid?L("am ","on ")+fdate(f.paid):fdate(feeDue(f))}</span></div>
      ${r?`<div class="notice"><span class="ic crit" aria-hidden="true">!</span><span>${L("Seit ","Open for ")}${feeAge(f)}${L(" Tagen offen. "," days. ")}${remName(r)}${L(" ist fällig."," is due.")}</span></div>`:""}
      <div class="calc">${lines}<span>${L("Zwischentotal","Subtotal")}</span><span class="r">${nf2.format(feeSub(f))}</span>${f.vat?`<span>${L("MWST ","VAT ")+VAT_RATE} %</span><span class="r">${nf2.format(feeVat(f))}</span>`:""}<span class="sum">${L("Total","Total")}</span><span class="r sum">CHF ${nf2.format(feeTotal(f))}</span></div>
      <details><summary>${L("Zahlungsdaten","Payment details")}</summary><div class="in"><dl class="kv"><dt>IBAN</dt><dd>${esc(fmtIban(D.firm.iban||""))}</dd><dt>${L("Referenz","Reference")}</dt><dd>${esc(fmtRefOut(f.refType,f.ref))}</dd></dl></div></details>
      <details><summary>${L("Verlauf","History")}</summary><div class="in"><dl class="kv">${log}</dl></div></details>
      <div class="dtools">${ibl("download",L("PDF herunterladen","Download PDF"),`data-act="fee-pdf" data-id="${f.id}"`,"PDF")}${f.paid?"":ibl("edit",L("Bearbeiten","Edit"),`data-act="form" data-f="fee" data-id="${f.id}"`)}<span class="qsep"></span>${S.confirm==="fdel:"+f.id?`<button type="button" class="ghost danger" data-act="fee-del" data-id="${f.id}">${L("Wirklich löschen?","Really delete?")}</button>`:ib("trash",L("Rechnung löschen","Delete invoice"),`data-act="ask" data-c="fdel:${f.id}"`)}</div>
    </div>
    <div class="ofoot">${actions}</div></aside>`;
}

/* ---------- PDF with Swiss QR-bill ---------- */
const loadScript=src=>new Promise((ok,no)=>{if(document.querySelector('script[src="'+src+'"]'))return ok();const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});
async function libsPDF(){await loadScript("vendor/jspdf.umd.min.js");await loadScript("vendor/qrcode-gen.js");}
function qrPayload(f){
  const F=D.firm,p=PJ(f.pid)||{},[cs,cb]=splitStreet(F.street),[ds,db]=splitStreet(p.cstreet);
  const hasD=!!(p.client&&p.czip&&p.ccity);
  const d=f.date.replace(/-/g,"").slice(2);
  let bill="//S1/10/"+String(f.no).replace(/\//g,"\\/")+"/11/"+d;
  if(f.vat&&F.vatNo) bill+="/30/"+String(F.vatNo).replace(/\D/g,"")+"/32/"+VAT_RATE;
  bill+="/40/0:30";
  const cut=(s,n)=>String(s||"").slice(0,n);
  return ["SPC","0200","1",norm(F.iban),"S",cut(F.name,70),cut(cs,70),cut(cb,16),cut(F.zip,16),cut(F.city,35),"CH",
    "","","","","","","",
    feeTotal(f).toFixed(2),"CHF",
    hasD?"S":"",hasD?cut(p.client,70):"",hasD?cut(ds,70):"",hasD?cut(db,16):"",hasD?cut(p.czip,16):"",hasD?cut(p.ccity,35):"",hasD?"CH":"",
    f.refType,f.ref,cut(L("Rechnung ","Invoice ")+f.no,140),"EPD",bill].join("\n");
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
  if(f.vat){T(L("MWST ","VAT ")+VAT_RATE+" %",120,y);T(nf2.format(feeVat(f)),190,y,{align:"right"});y+=5;}
  font(10,true);T(L("Total CHF","Total CHF"),120,y+1);T(nf2.format(feeTotal(f)),190,y+1,{align:"right"});
  font(9);T(level?L("Zahlbar innert 10 Tagen.","Payable within 10 days."):L("Zahlbar innert 30 Tagen netto.","Payable within 30 days net."),20,y+1);
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
function clearFiles(){try{FDB.open().then(db=>{const t=db.transaction("files","readwrite");t.objectStore("files").clear();}).catch(()=>{});}catch(e){}}
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
  const feeOpen=ps.reduce((a,x)=>a+x.fees,0),remN=ps.reduce((a,x)=>a+x.rem,0),tot=ps.reduce((a,x)=>a+x.sum,0),nChk=ps.reduce((a,x)=>a+x.n,0),nFl=ps.reduce((a,x)=>a+x.fl,0),flc=ps.reduce((a,x)=>a+x.flc,0);
  const tOpen=D.tenders.filter(x=>!closedT(x)&&fitOf(x).fit!=="no"&&daysTo(x.due)>=0).length;
  const parts=x=>[x.n?x.n+" "+(x.n===1?L("Rechnung offen","invoice open"):L("Rechnungen offen","invoices open")):"",x.fl?x.fl+" "+L("mit Mehrkosten","with extra costs"):"",x.rem?x.rem+" "+(x.rem===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):""].filter(Boolean).join(" · ")||L("nichts offen","nothing open");
  const rows=ps.filter(x=>!x.p.closed).map(x=>row({act:"open-project",id:x.p.id,c:x.rem?"crit":x.fl?"warn":x.n?"n":"ok",title:esc(x.p.name),meta:(x.p.place?esc(x.p.place)+" · ":"")+parts(x),amt:x.sum?chf(x.sum,false):"",label:""})).join("");
  const name=(D.firm&&D.firm.name)||L("Ihr Büro","Your firm");
  const tl=D.tenders.filter(x=>!closedT(x)&&daysTo(x.due)>=0).sort((a,b)=>toDate(a.due)-toDate(b.due));
  const tRows=tl.slice(0,4).map(t=>{const f=fitOf(t).fit,dd=daysTo(t.due);return row({act:"open-t",id:t.id,c:FIT[f].c,title:esc(tx(t.title)),meta:tx(FIT[f])+" · "+esc(t.client),amt:"",label:L("Eingabe in "+dd+" "+dayWord(dd),"due in "+dd+" "+(dd===1?"day":"days")),lc:dd<=14?"warn":"n"});}).join("");
  const tSec=`<section><div class="sh"><h2>${L("Ausschreibungen","Tenders")}</h2><span class="cnt">${tl.length}${D.example?"":" · "+L("Beispiele","examples")}</span><span class="right">${tl.length>4?`<button type="button" class="ghost" data-act="nav" data-v="ausschreibungen">${L("Alle anzeigen","Show all")}</button>`:""}</span></div><div class="rows">${tRows||`<div class="empty">${L("Keine offenen Ausschreibungen.","No open tenders.")}</div>`}</div></section>`;
  return `<div class="page">
    ${ph(esc(today),esc(name),"",ib("edit",L("Büro bearbeiten","Edit firm"),'data-act="form" data-f="firm"'))}
    ${dataNotice()}${startSteps()}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Zu zahlen","To pay")}</span><span class="sv">${chf(tot,false)}</span><span class="ss">${L("Handwerker","Contractors")} · ${openSub(ps.flatMap(x=>x.chk))}</span></div>
      <div class="stat"><span class="sl">${L("Mehrkosten","Extra costs")}</span><span class="sv${nFl?" warn":""}">${chf(flc,false)}</span><span class="ss">${nFl?nFl+" "+(nFl===1?L("Hinweis","finding"):L("Hinweise","findings")):L("keine","none")}</span></div>
      <div class="stat"><span class="sl">${L("Zu erhalten","To receive")}</span><span class="sv">${chf(feeOpen,false)}</span><span class="ss${remN?" l-crit":""}">${remN?remN+" "+(remN===1?L("Mahnung fällig","reminder due"):L("Mahnungen fällig","reminders due")):L("keine Mahnung fällig","no reminder due")}</span></div>
      <button type="button" class="stat" data-act="nav" data-v="ausschreibungen"><span class="sl">${L("Ausschreibungen","Tenders")}</span><span class="sv">${tl.length}</span><span class="ss">${tOpen} ${L("mit Eignung","eligible")}</span></button>
    </div>
    ${FEES().length?incomeSection():""}
    <section><div class="sh"><h2>${L("Projekte","Projects")}</h2><span class="cnt">${ps.length}</span><span class="right">${ib("plus",L("Neues Projekt","New project"),'data-act="form-project"')}</span></div><div class="rows">${rows||`<div class="empty">${L("Noch keine Projekte.","No projects yet.")}</div>`}</div></section>
    ${tSec}
    ${docsBlock("firm","firm",L("Unterlagen des Büros","Firm documents"),L("Handelsregister, Versicherung, AHV, Referenzen: einmal ablegen, für jede Bewerbung bereit. Mit Gültigkeit warnt arkitecton vor Ablauf.","Register extract, insurance, references: store once, ready for every bid."))}
  </div>`;
}
function viewOverview(){
  const p=P(); if(!p) return noProject();
  const t=totals(budgetRows());
  const toCheck=PI().filter(i=>!counted(i)).sort((a,b)=>toDate(a.due)-toDate(b.due));
  const openSum=toPay(PI()),upl=unpaid(PI());
  const mt=missingTasks(),fl=flags(), flSum=flagSum(fl);
  const used=t.paid+t.approved, pct=t.kv?Math.round(used/t.kv*100):0;
  const invRows=toCheck.map(i=>{const k=K(W(i.w).k),dd=daysTo(i.due),q=i.status==="rueckfrage",tone=q?"crit":dueTone(dd);return row({act:"open-inv",id:i.id,c:tone,title:esc(k.name),meta:typeLabel(i)+(q?" · "+L("Rückfrage offen","query open"):""),amt:chf(i.gross,false),label:dueText(dd),lc:tone});}).join("");
  const feeRows=PF().filter(f=>remDue(f)).map(f=>row({act:"open-fee",id:f.id,c:"crit",title:esc(L("Honorar ","Fee ")+f.no),meta:remName(remDue(f))+L(" senden"," to send"),amt:chf(feeTotal(f),false),label:L("seit "+feeAge(f)+" Tagen offen","open for "+feeAge(f)+" days"),lc:"crit"})).join("");
  const mtRows=mt.map(x=>row({act:"open-k",id:x.k.id,c:"crit",title:esc(x.k.name),meta:L("Fehlt: ","Missing: ")+x.m.join(", "),amt:"",label:L("Angaben fehlen","details missing"),lc:"crit"})).join("");
  const nTodo=toCheck.length+mt.length+PF().filter(f=>remDue(f)).length;
  const todo=(invRows?subTitle(L("Rechnungen prüfen","Check invoices"))+`<div class="rows">${invRows}</div>`:"")
    +(feeRows?subTitle(L("Mahnen","Send reminders"))+`<div class="rows">${feeRows}</div>`:"")
    +(mtRows?subTitle(L("Angaben ergänzen","Complete details"))+`<div class="rows">${mtRows}</div>`:"");
  const shown=S.allFlags?fl:fl.slice(0,3);
  const flagRows=shown.map(f=>row({act:f.act,id:f.id,v:f.v,c:f.c,title:esc(f.t),meta:esc(f.m),amt:f.chf===null?"":chf(f.chf,false),label:""})).join("");
  const today=TODAY.toLocaleDateString(S.lang==="de"?"de-CH":"en-GB",{weekday:"long",day:"numeric",month:"long"});
  return `<div class="page">
    <header class="ph"><span class="eyebrow">${esc(today)}</span><h1><button type="button" class="pswitch" data-act="sheet" data-k="projects" aria-haspopup="dialog" title="${L("Projekt wechseln","Switch project")}">${esc(p.name)}<span class="cv" aria-hidden="true">⌄</span></button></h1><div class="tools">${ib("edit",L("Projekt bearbeiten","Edit project"),'data-act="form-project-edit" data-id="'+p.id+'"')}</div>${[p.place,p.desc].filter(Boolean).length?`<p class="lead">${esc([p.place,p.desc].filter(Boolean).join(" · "))}</p>`:""}</header>
    ${startSteps()}
    <div class="stats">
      <button type="button" class="stat" data-act="nav" data-v="rechnungen"><span class="sl">${L("Zu zahlen","To pay")}</span><span class="sv">${chf(openSum,false)}</span><span class="ss">${L("Handwerker","Contractors")} · ${openSub(upl)}</span></button>
      <button type="button" class="stat" data-act="jump-flags"><span class="sl">${L("Mehrkosten","Extra costs")}</span><span class="sv${fl.length?" warn":""}">${chf(flSum,false)}</span><span class="ss">${fl.length?fl.length+" "+(fl.length===1?L("Hinweis","finding"):L("Hinweise","findings"))+L(" · über Vertrag, Offerte oder Budget"," · above contract, offer or budget"):L("keine","none")}</span></button>
      <button type="button" class="stat" data-act="nav" data-v="budget"><span class="sl">${L("Bezahlt und freigegeben","Paid and approved")}</span><span class="sv">${t.kv?pct+"%":"–"}</span><span class="ss"><span class="mini"><i style="width:${Math.min(100,pct)}%"></i></span>${t.kv?L("von ","of ")+chf(t.kv,false)+L(" Kostenvoranschlag"," estimate"):L("kein Budget","no budget")}</span></button>
    </div>
    ${PF().length?(()=>{const fs=PF(),b=fs.reduce((a,f)=>a+feeTotal(f),0),pd=fs.filter(f=>f.paid).reduce((a,f)=>a+feeTotal(f),0);return `<button type="button" class="feesum" data-act="to-fees"><span class="fh"><span class="sl">${L("Honorar","Fees")}</span><span class="go">→</span></span><span class="fv"><small>${L("Gestellt","Billed")}</small><b>CHF ${nfq.format(Math.round(b))}</b></span><span class="fv"><small>${L("Eingegangen","Received")}</small><b>CHF ${nfq.format(Math.round(pd))}</b></span><span class="fv"><small>${L("Zu erhalten","To receive")}</small><b>CHF ${nfq.format(Math.round(b-pd))}</b></span></button>`;})():""}
    <section><div class="sh"><h2>${L("Zu erledigen","To do")}</h2><span class="cnt">${nTodo}</span></div>${todo||`<div class="rows"><div class="empty">${L("Alles erledigt.","All done.")}</div></div>`}</section>
    <section id="flags"><div class="sh"><h2>${L("Mehrkosten","Extra costs")}</h2><span class="cnt">${fl.length}</span>${fl.length>1?`<span class="legend-s">${L("Total ","Total ")+chf(flSum,false)+L(", Überschneidungen einmal gezählt",", overlaps counted once")}</span>`:""}</div><div class="rows">${flagRows||`<div class="empty">${L("Keine Mehrkosten.","No extra costs.")}</div>`}</div>
      ${fl.length>3?`<button type="button" class="more" data-act="all-flags">${S.allFlags?L("Weniger anzeigen","Show less"):L("Alle anzeigen","Show all")}</button>`:""}</section>
    ${docsBlock("project",p.id,L("Projektdokumente","Project documents"),L("Pläne, Bewilligungen, Kostenvoranschlag mit ＋ ablegen.","Store plans, permits and estimates with ＋."))}
  </div>`;
}

function viewInvoices(){
  const p=P(); if(!p) return noProject();
  const sw=`<div class="seg" role="tablist"><button type="button" role="tab" data-act="rtab" data-t="kred" aria-selected="${S.rtab!=="deb"}">${L("Handwerker","Contractors")}</button><button type="button" role="tab" data-act="rtab" data-t="deb" aria-selected="${S.rtab==="deb"}">${L("Honorar","Fees")}</button></div>`;
  if(S.rtab==="deb") return `<div class="page">${ph(esc(p.name),L("Rechnungen","Invoices"),"",ib("plus",L("Honorarrechnung erstellen","New fee invoice"),'data-act="form" data-f="fee"'))}${sw}${viewFees()}</div>`;
  const F=["pruefen","rueckfrage","frei","bezahlt","all"], all=PIx();
  const cnt=f=>f==="all"?all.length:all.filter(i=>i.status===f).length;
  const list=all.filter(i=>S.filter==="all"||i.status===S.filter).slice().sort((a,b)=>toDate(b.date)-toDate(a.date));
  const byDue=S.filter!=="all"&&S.filter!=="bezahlt";
  const rows=list.map(i=>{const w=W(i.w),k=K(w.k),dd=daysTo(i.due);return row({act:"open-inv",id:i.id,c:STATUS[i.status].c,title:esc(k.name),meta:typeLabel(i)+" · "+esc(i.no),amt:chf(i.gross,false),label:byDue?dueText(dd):stLabel(i.status),lc:byDue?dueTone(dd):STATUS[i.status].c});}).join("");
  return `<div class="page">
    ${ph(esc(p.name),L("Rechnungen","Invoices"),"",ib("plus",L("Rechnung ohne QR erfassen","Add invoice without QR"),'data-act="form" data-f="invoice"')+excelBtn("rechnungen"))}
    ${sw}<div class="tabs chips" role="tablist">${F.map(f=>`<button type="button" role="tab" data-act="filter" data-f="${f}" aria-selected="${S.filter===f}">${f==="all"?L("Alle","All"):stLabel(f)}<span class="c">${cnt(f)}</span></button>`).join("")}</div>
    <section><div class="rows">${rows||(all.length?`<div class="empty">${L("Keine Rechnungen mit diesem Status.","No invoices with this status.")}</div>`:`<div class="empty"><span>${L("Noch keine Rechnungen. Scannen Sie den QR-Zahlteil einer Handwerker-Rechnung.","No invoices yet. Scan the QR payment part of a contractor invoice.")}</span><div class="eb"><button type="button" class="btn primary" data-act="capture">${L("Rechnung scannen","Scan invoice")}</button><button type="button" class="btn" data-act="form" data-f="invoice">${L("Ohne QR erfassen","Add without QR")}</button></div></div>`)}</div></section>
  </div>`;
}

function viewContractors(){
  if(S.kid&&K(S.kid)) return viewContractor(K(S.kid));
  const p=P();
  const sorted=D.contractors.slice().sort((a,b)=>(!!CW(b.id))-(!!CW(a.id))||a.name.localeCompare(b.name));
  const rows=sorted.map(k=>{const m=missingOf(k),ws=PC().filter(w=>w.k===k.id),w=ws[0],sum=ws.reduce((a,x)=>a+(x.sum||0),0);
    return row({act:"open-k",id:k.id,c:m.length?"crit":"ok",title:esc(k.name),meta:ws.length>1?ws.map(x=>"BKP "+x.bkp).join(", "):w?"BKP "+w.bkp+" "+esc(bName(w.bkp)):L("nicht in diesem Projekt","not in this project"),amt:sum?chf(sum,false):"",label:m.length===1?L(m[0]+" fehlt",m[0]+" missing"):m.length?L(m.length+" Angaben fehlen",m.length+" details missing"):"",lc:"crit"});}).join("");
  return `<div class="page">
    ${ph(p?esc(p.name):L("Büro","Office"),L("Handwerker","Contractors"),"",ib("plus",L("Handwerker erfassen","Add contractor"),'data-act="form" data-f="contractor"')+excelBtn("handwerker"))}
    <section>${rows?`<div class="rhead"><span></span><span>${L("Handwerker","Contractor")}</span><span>${L("Arbeitsgattung","Trade")}</span><span class="r">${L("Werkvertrag","Contract")}</span><span class="r">${L("Angaben","Details")}</span></div>`:""}<div class="rows">${rows||`<div class="empty"><span>${L("Noch keine Handwerker. Beim Scannen einer QR-Rechnung legt arkitecton den Handwerker selbst an.","No contractors yet. Scanning a QR-bill adds the contractor for you.")}</span><div class="eb"><button type="button" class="btn primary" data-act="capture">${L("Rechnung scannen","Scan invoice")}</button><button type="button" class="btn" data-act="form" data-f="contractor">${L("Handwerker erfassen","Add contractor")}</button></div></div>`}</div></section>
  </div>`;
}

function cmpBody(w){
  const c=compare(w);
  if(!c) return `<section><div class="empty"><span>${L("Noch keine Offerte.","No offer yet.")}</span><div style="display:flex;gap:10px;flex-wrap:wrap"><label class="btn primary">${L("Offerte aus Excel","Offer from Excel")}<input type="file" accept=".xlsx,.xls,.csv" data-imp="offer" data-id="${w.id}"></label>${D.example&&w.id==="w6"?`<button type="button" class="btn" data-act="ex-offer">${L("Beispiel laden","Load example")}</button>`:""}<button type="button" class="btn" data-act="x-template">${L("Leere Vorlage","Blank template")}</button></div></div></section>`;
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
  const lead=(k.city?esc(k.street)+", "+esc(k.zip)+" "+esc(k.city):`<span class="neg">${L("Adresse fehlt","Address missing")}</span>`)+" · "+(k.iban?esc(k.iban):`<span class="neg">${L("IBAN fehlt","IBAN missing")}</span>`);
  const tools=ib("edit",L("Bearbeiten","Edit"),`data-act="form" data-f="contractor" data-id="${k.id}"`)+(CW(k.id)?excelBtn("k:"+k.id):"");
  const addHere=P()&&!pids.includes(cur)?`<div class="empty"><span>${L("Kein Werkvertrag in ","No contract in ")}${esc(P().name)}.</span><button type="button" class="btn primary" data-act="form" data-f="contract" data-id="${k.id}">${L("Werkvertrag erfassen","Add contract")}</button></div>`:"";
  const group=(pid,inner,count)=>{const p=PJ(pid);return `<details class="site" data-pid="${pid}"${isOpen(pid)?" open":""}><summary><span class="sn">${esc(p.name)}${p.place?`<span class="sp"> · ${esc(p.place)}</span>`:""}</span><span class="sc">${count}</span></summary><div class="in">${inner}</div></details>`;};
  let body="";
  if(S.wid&&W(S.wid)&&W(S.wid).k===k.id){
    const w=W(S.wid);
    const bi=S.cmpBack&&INV(S.cmpBack.inv);
    body=`${bi?`<button type="button" class="back" data-act="back-inv">← ${L("Zurück zur Rechnung ","Back to invoice ")}${esc(bi.no)}</button>`:`<button type="button" class="back" data-act="back-w">← ${L("Alle Verträge","All contracts")}</button>`}
      <div class="ctx">${esc(PJ(w.pid).name)} · BKP ${w.bkp} ${esc(bName(w.bkp))}</div>${cmpBody(w)}`;
  } else if(S.ktab==="konto"){
    const oi=invOf(all).filter(i=>i.status!=="bezahlt"&&live(i)),open=oi.reduce((a,i)=>a+payout(i),0),gross=oi.reduce((a,i)=>a+net(i),0),oret=r2(gross-open);
    const top=all.length?`<div class="total"><span>${L("Zu zahlen","To pay")}</span><span class="tv">${chf(open,false)}</span><span class="ts">${oi.length?L("Rechnungen ","Invoices ")+chf(gross,false)+(oret>0?L(" minus Rückbehalt "," minus retention ")+chf(oret,false):oret<0?L(" plus freigegebener Rückbehalt "," plus released retention ")+chf(-oret,false):""):L("nichts offen","nothing open")} · ${pids.length} ${pids.length===1?L("Projekt","project"):L("Projekte","projects")}</span></div>`:"";
    body=top+addHere+pids.map(pid=>{
      const ws=all.filter(w=>w.pid===pid),inv=invOf(ws),multi=ws.length>1;
      const stats=ws.map(w=>{const iv=inv.filter(i=>i.w===w.id),billed=iv.filter(counted).reduce((a,i)=>a+net(i),0),paid=iv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0),ret=iv.filter(counted).reduce((a,i)=>a+retention(i),0);
        return `${multi?`<div class="ctx">BKP ${w.bkp} ${esc(bName(w.bkp))}</div>`:""}<div class="stats">
        <button type="button" class="stat" data-act="form" data-f="contract" data-id="${k.id}" data-w="${w.id}"><span class="sl">${multi?"":"BKP "+w.bkp+" · "}${L("Werkvertrag","Contract")} · ${retPct(w)}% ${L("Rückbehalt","retention")}</span><span class="sv">${w.sum?chf(w.sum,false):"–"}</span><span class="ss">${L("abgerechnet","billed")} ${chf(billed,false)}</span></button>
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
      const rows=ws.map(w=>{const c=compare(w);return row({act:"open-w",id:w.id,c:!c?"warn":c.hasFinal?(c.diff>0?"warn":"ok"):"n",title:"BKP "+w.bkp+" "+esc(bName(w.bkp)),meta:!c?L("Offerte fehlt","No offer yet"):L("Offerte ","Offer ")+chf(c.ot,false)+" · "+(c.hasFinal?L("Schluss ","Final ")+chf(c.ft,false):L("Schluss fehlt","Final missing")),amt:c&&c.hasFinal?sgn(c.diff):"",lc:"n",label:L("Öffnen →","Open →")});}).join("");
      return group(pid,`<div class="rows">${rows}</div>`,ws.length+" "+(ws.length===1?L("Vertrag","contract"):L("Verträge","contracts")));
    }).join("");
  }
  const inW=S.wid&&W(S.wid)&&W(S.wid).k===k.id;
  return `<div class="page">
    ${inW?"":`<button type="button" class="back" data-act="back-k">← ${L("Handwerker","Contractors")}</button>`}
    ${ph("",esc(k.name),lead,tools)}
    ${all.length?`<div class="tabs" role="tablist"><button type="button" role="tab" data-act="ktab" data-t="konto" aria-selected="${S.ktab==="konto"}">${L("Konto","Account")}</button><button type="button" role="tab" data-act="ktab" data-t="vergleich" aria-selected="${S.ktab==="vergleich"}">${L("Offerte und Abrechnung","Offer and final account")}</button></div>`:""}
    ${body||addHere}
    ${S.wid&&W(S.wid)&&W(S.wid).k===k.id?"":docsBlock("contractor",k.id,L("Dokumente","Documents"),L("Offerten, Werkverträge, Versicherungsnachweise mit ＋ ablegen.","Store offers, contracts and certificates with ＋."))}
  </div>`;
}
function viewBudget(){
  const p=P(); if(!p) return noProject();
  const rows=budgetRows(), t=totals(rows);
  const br=rows.map(r=>{const base=Math.max(r.b.kv,r.awarded,r.billed+r.open,1),pc=x=>Math.max(0,x)/base*100,aw=r.awarded?chf(r.awarded,false):L("nicht vergeben","not awarded");
    const act=r.over?`data-act="kv-explain" data-id="${r.b.bkp}"`:`data-act="form" data-f="kv" data-id="${r.b.bkp}"`;
    return `<button type="button" class="brow row${S.hl===r.b.bkp?" hl":""}" ${act}><span class="code">${r.b.bkp}</span><div><span>${esc(tx(r.b))}</span><div class="bar"><i class="c-paid" style="width:${pc(r.paid)}%"></i><i class="c-appr" style="width:${pc(r.approved)}%"></i><i class="c-open" style="width:${pc(r.open)}%"></i>${r.b.kv?`<span class="kv" style="left:${r.b.kv/base*100}%"></span>`:""}</div><span class="bsub">KV ${r.b.kv?nf0.format(r.b.kv):"–"} · ${r.awarded?L("vergeben ","awarded ")+nf0.format(r.awarded):L("nicht vergeben","not awarded")}</span></div><span class="kvc">${r.b.kv?chf(r.b.kv,false):"–"}</span><span class="nums">${aw}</span><span class="rest ${r.rest<0?"up":r.awarded?"":"mute"}">${r.b.kv?chf(r.rest,false):"–"}</span></button>`;}).join("");
  return `<div class="page">
    ${ph(esc(p.name),"Budget","",ib("plus",L("BKP-Position erfassen","Add BKP item"),'data-act="form" data-f="bkp"')+excelBtn("budget"))}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Kostenvoranschlag","Cost estimate")}</span><span class="sv">${chf(t.kv,false)}</span><span class="ss">${p.budget.length} ${p.budget.length===1?L("Position","item"):L("Positionen","items")}</span></div>
      <div class="stat"><span class="sl">${L("Vergeben","Awarded")}</span><span class="sv">${chf(t.awarded,false)}</span><span class="ss">${t.kv?Math.round(t.awarded/t.kv*100)+"% "+L("des Kostenvoranschlags","of the estimate"):""}</span></div>
      <div class="stat"><span class="sl">${L("Reserve","Reserve")}</span><span class="sv${t.rest<0?" warn":""}">${chf(t.rest,false)}</span><span class="ss">${L("nach Verträgen und offenen Rechnungen","after contracts and open invoices")}</span></div>
    </div>
    <section>${br?`<div class="bhead"><span>BKP</span><span>${L("Arbeitsgattung","Trade")}</span><span class="kvc">${L("Kostenvoranschlag","Estimate")}</span><span class="nums">${L("Vergeben","Awarded")}</span><span class="rest">${L("Reserve","Reserve")}</span></div>`:""}${br||`<div class="empty"><span>${L("Noch kein Kostenvoranschlag. Erfassen Sie die BKP-Positionen mit Betrag, daran misst arkitecton alle Rechnungen.","No cost estimate yet. Add the BKP items with amounts; arkitecton measures every invoice against them.")}</span><div class="eb"><button type="button" class="btn primary" data-act="form" data-f="bkp">${L("BKP-Position erfassen","Add BKP item")}</button></div></div>`}
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
  const rows=list.map(t=>{const f=fitOf(t).fit,c=closedT(t),dd=daysTo(t.due);return row({act:"open-t",id:t.id,c:c?"n":FIT[f].c,title:esc(tx(t.title)),meta:(c?"":(dd<0?L("vorbei","closed"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days")))+" · ")+esc(t.client),amt:c?tx(TST[t.status]):fdate(t.due),label:c?"":tx(FIT[f])});}).join("");
  return `<div class="page">${ph(L("Büro · Beispieldaten","Office · example data"),L("Ausschreibungen","Tenders"),"",excelBtn("tender"))}
    <div class="stats">
      <div class="stat"><span class="sl">${L("Offene Verfahren","Open procedures")}</span><span class="sv">${active.length}</span><span class="ss">${L("Architektur, Kanton Zürich","Architecture, Canton of Zurich")}</span></div>
      <div class="stat"><span class="sl">${L("Eignung erfüllt","Eligible")}</span><span class="sv ok">${fits.filter(f=>f==="ok").length}</span><span class="ss">${fits.filter(f=>f==="partner").length} ${L("nur mit Partner","only with partner")} · ${fits.filter(f=>f==="no").length} ${L("nicht","not")}</span></div>
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
      <div class="stat"><span class="sl">${L("Eingabe","Submission")}</span><span class="sv${!c&&dd<=14?" warn":""}">${c?tx(TST[t.status]):dd<0?L("vorbei","closed"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days"))}</span><span class="ss">${fdate(t.due)} · ${daysTo(t.qDue)<0?L("Fragefrist abgelaufen","question period over"):L("Fragen bis","questions by")+" "+fdate(t.qDue)}</span></div>
      <div class="stat"><span class="sl">${L("Eignung","Eligibility")}</span><span class="sv ${FIT[fit].c}">${tx(FIT[fit])}</span><span class="ss">${ev.filter(e=>e.s==="ok").length} ${L("von","of")} ${ev.length} ${L("Kriterien","criteria")}</span></div>
      <div class="stat"><span class="sl">${L("Baukosten","Construction cost")}</span><span class="sv">${mio(t.cost)}</span><span class="ss">BKP 291</span></div>
    </div>
    <div class="cols">
      <section><div class="sh"><h2>${L("Eignung","Eligibility")}</h2></div><ul class="checks">${ev.map(e=>`<li><span class="ic ${e.s}" aria-hidden="true">${ICON[e.s]}</span><span>${esc(e.t)}<span class="res">${esc(e.res)}</span></span></li>`).join("")}</ul></section>
      <section><div class="sh"><h2>${L("Unterlagen","Documents")}</h2><span class="cnt">${docs.length-open.length}/${docs.length}</span>${docs.some(d=>!d.auto)?`<span class="legend-s">${L("Kästchen selbst abhaken","Tick the boxes yourself")}</span>`:""}</div><ul class="checks">${docs.map(d=>`<li>${d.auto?`<span class="ic ${d.done?"ok":"crit"}" aria-hidden="true">${d.done?"✓":"✕"}</span>`:`<input type="checkbox" id="doc-${d.id}" data-act="t-doc" data-t="${t.id}" data-d="${d.id}"${d.done?" checked":""}${c?" disabled":""}>`}<label${d.auto?"":` for="doc-${d.id}"`}>${esc(d.t)}${d.sub?`<span class="res">${d.auto&&d.done?L("Automatisch: ","Automatic: "):""}${esc(d.sub)}</span>`:""}</label></li>`).join("")}</ul></section>
    </div>
    ${docsBlock("tender",t.id,L("Dateien","Files"),L("Ausschreibungsunterlagen, Fragen und Antworten, eigene Entwürfe mit ＋ ablegen.","Store tender documents and drafts with ＋."))}
    <div class="bar-actions">${t.status==="arbeit"&&!c?(fit==="no"?`<span class="act-hint">${L("Eignung nicht erfüllt","Not eligible")}</span>`:open.length?`<span class="act-hint">${L("Noch ","Still ")+open.length+" "+(open.length===1?L("Unterlage offen","document open"):L("Unterlagen offen","documents open"))}</span>`:""):""}${actions}</div>
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
  renderChrome();swipeHint();
  document.getElementById("main").innerHTML=({buero:viewFirm,uebersicht:viewOverview,rechnungen:viewInvoices,handwerker:viewContractors,budget:viewBudget,ausschreibungen:viewTenders})[S.view]();
  renderOverlay();
}

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
  const li=c=>`<li><span class="ic ${c.s}" aria-hidden="true">${ICON[c.s]}</span><span>${esc(c.t)}${c.link?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="open-cmp" data-id="${c.link}">${L("Vergleich","Comparison")}</button>`:""}${c.fix?` <button type="button" class="ghost" style="padding:0;margin-left:6px;text-decoration:underline" data-act="form" data-f="contractor" data-id="${c.fix}">${L("Ergänzen","Complete")}</button>`:""}</span></li>`;
  const retLine=i.type==="akonto"?[L("Rückbehalt ","Retention ")+retPct(w)+"%","− "+nf2.format(ret)]:i.type==="schluss"?[L("Freigabe Rückbehalt","Retention released"),"+ "+nf2.format(-ret)]:[L("Rückbehalt","Retention"),"0.00"];
  const cr=cs.find(c=>c.s==="crit"),why=cr?`<span class="act-hint">${cr.need?L("Erst ergänzen: ","First add: ")+esc(cr.need):L("Erst Doppelrechnung klären","Resolve the duplicate first")}</span>`:"";
  const money=cs.some(c=>c.money&&c.s==="warn"),apLbl=money?L("Trotzdem freigeben","Approve anyway"):L("Freigeben","Approve");
  let actions="";
  if(i.status==="rueckfrage") actions=why+`<button type="button" class="btn" data-act="answer" data-id="${i.id}">${L("Antwort erhalten","Reply received")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${apLbl}</button>`;
  else if(!counted(i)) actions=why+`<button type="button" class="btn" data-act="query">${L("Rückfrage","Query")}</button><button type="button" class="btn primary" data-act="approve" data-id="${i.id}"${crit?" disabled":""}>${apLbl}</button>`;
  else if(i.status==="frei") actions=`<button type="button" class="btn" data-act="unapprove" data-id="${i.id}">${L("Freigabe zurücknehmen","Undo approval")}</button><button type="button" class="btn primary" data-act="paid" data-id="${i.id}">${L("Als bezahlt markieren","Mark as paid")}</button>`;
  const done=S.done&&S.done.id===i.id?`<div class="done"><span class="h">${L("Für Sie erledigt","Done for you")}</span><div class="chips">${S.done.items.map(x=>`<span class="chip ok">${esc(x)}</span>`).join("")}</div></div>`:"";
  const log=i.log&&i.log.length?`<details><summary>${L("Verlauf","History")}</summary><div class="in"><dl class="kv">${i.log.map(e=>`<dt>${fdate(e.d)}</dt><dd>${esc(e.t)}</dd>`).join("")}</dl></div></details>`:"";
  const delBtn=S.confirm==="del:"+i.id?`<button type="button" class="ghost danger" data-act="del-inv" data-id="${i.id}">${L("Wirklich löschen?","Really delete?")}</button>`:ib("trash",L("Rechnung löschen","Delete invoice"),`data-act="ask" data-c="del:${i.id}"`);
  return `<div class="scrim" data-act="close"></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dT">
    <div class="ohead"><div><h2 id="dT" style="font-size:1.25rem;font-weight:500">${esc(k.name)}</h2><div class="sub">${typeLabel(i)} · ${esc(i.no)} · ${fdate(i.date)}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
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
      ${i.status==="ersetzt"?"":`<div class="dtools">${!counted(i)?`<button type="button" class="ghost" data-act="form" data-f="ded" data-id="${i.id}">${i.ded?L("Abzug ändern","Edit deduction"):L("Abzug erfassen","Add deduction")}</button><button type="button" class="ghost" data-act="replace" data-id="${i.id}">${L("Durch neue Rechnung ersetzen","Replace with new invoice")}</button>`:""}<span class="qsep"></span>${delBtn}</div>`}
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
  if(r&&qrText(r)){
    const d=parseSPC(qrText(r));
    if(d){stopCam();try{navigator.vibrate&&navigator.vibrate(40);}catch(e){}d.no=guessNo(d);setDates(d);S.modal.data=d;S.modal.step=2;renderOverlay();}
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
        <div class="f wide"><label for="capProj">${L("Projekt","Project")}</label>${projs.length>1?`<select id="capProj">${projs.map(p=>`<option value="${p.id}"${p.id===M.pid?" selected":""}>${esc(p.name)}${p.place?" · "+esc(p.place):""}</option>`).join("")}</select>`:`<span class="v">${esc(P().name)}</span>`}</div>
        ${R.w?`<div class="f wide"><span class="l">${L("Werkvertrag","Contract")}</span><span class="v">BKP ${R.w.bkp} ${esc(bName(R.w.bkp))}${R.w.sum?" · "+chf(R.w.sum,false):""}</span></div>`
          :`<div class="f wide"><label for="capBkp">BKP</label><select id="capBkp">${bkpOptions(d.bkpSel||guessBkp(d))}</select><span class="hint">${L("Noch kein Werkvertrag in diesem Projekt. Die Summe können Sie später ergänzen.","No contract in this project yet. You can add the sum later.")}</span></div>`}
        <div class="f"><label for="capType">${L("Art","Type")}</label><select id="capType"><option value="akonto"${so("akonto")}>${L("Akonto ","Progress payment ")+nAk}</option><option value="schluss"${so("schluss")}>${L("Schlussrechnung","Final invoice")}</option><option value="regie"${so("regie")}>${L("Regie","Time & materials")}</option></select></div>
        <div class="f"><label for="capAmt">${L("Betrag CHF","Amount CHF")}</label><input id="capAmt" class="amt" inputmode="decimal" value="${d.amount?nf2.format(d.amount):""}"></div>
        <div class="f wide"><label for="capNo">${L("Rechnungsnummer","Invoice number")}</label><input id="capNo" value="${esc(d.no||"")}" placeholder="${L("Von der Rechnung abtippen","Type from the invoice")}">${d.no?"":`<span class="hint">${L("Diese Rechnung hat keine Nummer im QR-Code.","This invoice has no number in its QR code.")}</span>`}</div>
        <div class="f"><span class="l">${L("Rechnungsdatum","Invoice date")}</span><span class="v">${fdate(d.date)}</span>${d.dateSrc?"":`<span class="hint">${L("Heute, nicht im QR-Code","Today, not in QR code")}</span>`}</div>
        <div class="f"><span class="l">${L("Zahlbar bis","Due")}</span><span class="v">${fdate(d.due)}</span>${d.dueSrc?"":`<span class="hint">${L("30 Tage angenommen","30 days assumed")}</span>`}</div>
        ${M.err?`<span class="err f wide">${esc(M.err)}</span>`:""}</div>`;});
      foot=`<button type="button" class="btn primary" data-act="confirm-capture">${L("Übernehmen","Add invoice")}</button>`;
    }
  }
  return wrapCapture(title,body,foot);
}
function defaultPid(d){
  const M=S.modal,RO=M&&M.rep&&INV(M.rep);if(RO)return W(RO.w).pid;
  const k=D.contractors.find(c=>(c.iban&&norm(c.iban)===norm(d.iban))||c.name.trim().toLowerCase()===d.name.trim().toLowerCase());
  if(k&&!D.contracts.some(w=>w.k===k.id&&w.pid===D.pid)){const ps=[...new Set(D.contracts.filter(w=>w.k===k.id).map(w=>w.pid))].filter(id=>{const p=PJ(id);return p&&!p.closed;});if(ps.length===1)return ps[0];}
  return D.pid;
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
  if(!w){const bkp=(document.getElementById("capBkp")||{}).value||"211";ensureBkp(bkp);w={id:newId("w"),pid:D.pid,k:k.id,bkp,sum:0,ret:10};D.contracts.push(w);}
  items.push("BKP "+w.bkp);
  const n=type==="akonto"?(d.akN||D.invoices.filter(x=>x.w===w.id&&x.type==="akonto").length+1):0;
  const ni={id:newId("i"),no:d.no||L("ohne Nr.","no number"),w:w.id,type,n,date:d.date||iso(TODAY),due:d.due||addDays(d.date||iso(TODAY),30),gross:r2(d.amount),status:"pruefen",ref:d.ref||""};
  logInv(ni,L("Per QR erfasst","Captured via QR"));
  D.invoices.push(ni);if(S.modal&&S.modal.rep)linkReplace(S.modal.rep,ni);
  if(type==="akonto")items.push(L("Rückbehalt ","Retention ")+nf2.format(retention(ni)));
  if(d.ref)items.push(L("Keine Doppelrechnung","No duplicate"));
  S.done={id:ni.id,items};S.modal=null;S.drawer=ni.id;S.queryOpen=false;render();
  if(moved)toast(L("Im Projekt ","Filed in ")+P().name);
}
function logDup(){const M=S.modal;if(!M||M.logged||!M.data)return;M.logged=true;D.events.unshift({pid:D.pid,c:"crit",t:M.data.name,m:L("Doppelrechnung verhindert","duplicate prevented"),chf:M.data.amount,act:"nav",v:"rechnungen"});}

/* ---------- forms ---------- */
const fld=(id,label,val,o={})=>`<div class="f${o.wide?" wide":""}"><label for="${id}">${label}</label><input id="${id}" name="${id}" value="${esc(val==null?"":val)}"${o.type?` type="${o.type}"`:""}${o.mode?` inputmode="${o.mode}"`:""}${o.req?" required":""}${o.ph?` placeholder="${esc(o.ph)}"`:""}>${o.hint?`<span class="hint">${o.hint}</span>`:""}</div>`;
function formDef(){
  if(S.form&&S.form.f==="fee") return feeFormDef(S.form);
  const F=S.form, p=P();
  if(F.f==="docvalid"){const d=DOCS().find(x=>x.id===F.id)||{};return {title:esc(d.name||""),body:fld("fUntil",L("Gültig bis","Valid until"),d.until||"",{type:"date",wide:true,hint:L("Leer lassen, wenn das Dokument nicht abläuft. 30 Tage vor Ablauf erscheint eine Warnung.","Leave empty if it does not expire. A warning appears 30 days before.")})};}
  if(F.f==="project"){const x=F.id?D.projects.find(q=>q.id===F.id):{};return {title:F.id?L("Projekt bearbeiten","Edit project"):L("Neues Projekt","New project"),body:fld("fName",L("Projektname","Project name"),x.name,{wide:true,req:true,ph:L("z. B. EFH Bergstrasse 4","e.g. Bergstrasse 4 house")})+fld("fPlace",L("Ort","Place"),x.place,{ph:L("z. B. Horgen","e.g. Horgen")})+fld("fClient",L("Bauherrschaft","Client"),x.client)+fld("fCStreet",L("Adresse Bauherrschaft","Client address"),x.cstreet,{wide:true,ph:L("Strasse und Nr.","Street and no.")})+fld("fCZip",L("PLZ","Postcode"),x.czip,{mode:"numeric"})+fld("fCCity",L("Ort","Town"),x.ccity)+fld("fDesc",L("Beschreibung","Description"),x.desc,{wide:true,ph:L("z. B. Umbau Einfamilienhaus","e.g. house conversion")})+(F.id?`<div class="f wide"><label class="chk"><input type="checkbox" id="fClosed"${x.closed?" checked":""}> ${L("Projekt abgeschlossen","Project completed")}</label><span class="hint">${L("Abgeschlossene Projekte erscheinen in der Auswahl eingeklappt.","Completed projects are collapsed in the project switcher.")}</span></div>`:"")};}
  if(F.f==="contractor"){const x=F.id?K(F.id):{};return {title:F.id?L("Handwerker bearbeiten","Edit contractor"):L("Neuer Handwerker","New contractor"),body:fld("fName",L("Firma","Company"),x.name,{wide:true,req:true})+fld("fStreet",L("Strasse","Street"),x.street,{wide:true})+fld("fZip",L("PLZ","ZIP"),x.zip,{mode:"numeric"})+fld("fCity",L("Ort","City"),x.city)+fld("fIban","IBAN",x.iban,{wide:true})+fld("fEmail",L("E-Mail","Email"),x.email,{type:"email"})+fld("fPhone",L("Telefon","Phone"),x.phone,{type:"tel"}),del:F.id&&!D.contracts.some(w=>w.k===F.id)};}
  if(F.f==="contract"){const k=K(F.id),w=(F.w&&W(F.w))||{};return {title:L("Werkvertrag · ","Contract · ")+k.name,body:`<div class="f wide"><label for="fBkp">BKP</label><select id="fBkp">${bkpOptions(w.bkp)}</select></div>`+fld("fSum",L("Werkvertragssumme CHF","Contract sum CHF"),w.sum||"",{mode:"decimal",req:true})+fld("fRet",L("Rückbehalt %","Retention %"),w.ret!=null?w.ret:10,{mode:"decimal"}),del:w.id&&!D.invoices.some(i=>i.w===w.id)};}
  if(F.f==="invoice"){
    const ks=PC().map(w=>K(w.k)).filter(Boolean);
    const sel=F.id||"";
    return {title:L("Rechnung erfassen","Add invoice"),body:(ks.length?`<div class="f wide"><label for="fK">${L("Handwerker","Contractor")}</label><select id="fK">${ks.map(k=>`<option value="${k.id}"${k.id===sel?" selected":""}>${esc(k.name)}</option>`).join("")}</select><span class="hint">${L("Nur Handwerker mit Werkvertrag in diesem Projekt.","Only contractors with a contract in this project.")}</span></div>`:"")+(ks.length?`<div class="f"><label for="fType">${L("Art","Type")}</label><select id="fType"><option value="akonto">Akonto</option><option value="schluss">${L("Schlussrechnung","Final invoice")}</option><option value="regie">${L("Regie","Time & materials")}</option></select></div>`
      +fld("fNo",L("Rechnungsnummer","Invoice number"),"")+fld("fAmt",L("Betrag CHF","Amount CHF"),"",{mode:"decimal",req:true})+fld("fDate",L("Datum","Date"),iso(TODAY),{type:"date"})+fld("fDue",L("Fällig am","Due"),addDays(iso(TODAY),30),{type:"date"})+fld("fRef",L("Referenz (optional)","Reference (optional)"),"",{wide:true}):`<div class="f wide nok"><p>${L("In diesem Projekt gibt es noch keinen Handwerker mit Werkvertrag.","This project has no contractor with a contract yet.")}</p><p class="sp">${L("Am schnellsten: QR-Rechnung scannen. arkitecton legt Handwerker und Werkvertrag dabei selbst an.","Fastest: scan the QR-bill. arkitecton adds the contractor and contract for you.")}</p><div class="nokb"><button type="button" class="btn primary" data-act="capture">${L("Rechnung scannen","Scan invoice")}</button><button type="button" class="btn" data-act="form" data-f="contractor">${L("Handwerker erfassen","Add contractor")}</button></div></div>`),noSubmit:!ks.length};}
  if(F.f==="bkp"){return {title:L("BKP-Position hinzufügen","Add BKP item"),body:`<div class="f wide"><label for="fStd">${L("Position","Item")}</label><select id="fStd">${STD_BKP.filter(s=>!p.budget.some(b=>b.bkp===s[0])).map(s=>`<option value="${s[0]}">${s[0]} ${esc(S.lang==="de"?s[1]:s[2])}</option>`).join("")}<option value="_">${L("Eigene Position …","Custom item …")}</option></select></div>`+fld("fCode",L("Eigene: BKP-Nummer","Custom: BKP number"),"",{mode:"numeric"})+fld("fLabel",L("Eigene: Bezeichnung","Custom: name"),"")+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),"",{mode:"decimal",wide:true})};}
  if(F.f==="kv"){const b=B(F.id);return {title:"BKP "+b.bkp+" "+tx(b),body:fld("fLabel",L("Bezeichnung","Name"),tx(b),{wide:true})+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),b.kv||"",{mode:"decimal",wide:true}),del:!PC().some(w=>w.bkp===b.bkp)};}
  if(F.f==="answer"){const i=INV(F.id);return {title:L("Antwort erhalten","Reply received"),body:`<div class="f wide"><label for="fNote">${L("Was war die Antwort?","What was the reply?")}</label><textarea id="fNote" rows="3" placeholder="${L("z. B. Rapporte erhalten, 6 h bestätigt","e.g. time sheets received, 6 h confirmed")}"></textarea><span class="hint">${L("Wird im Verlauf gespeichert. Die Rechnung ist danach wieder zu prüfen.","Saved in the history. The invoice goes back to review.")}</span></div>`};}
  if(F.f==="ded"){const i=INV(F.id),d=i.ded||{};return {title:L("Abzug · ","Deduction · ")+i.no,body:fld("fDedAmt",L("Abzug CHF","Deduction CHF"),d.amt||"",{mode:"decimal",req:true})+`<div class="f wide"><label for="fDedWhy">${L("Begründung","Reason")}</label><textarea id="fDedWhy" rows="2" placeholder="${L("z. B. 2 h Regie nicht belegt","e.g. 2 h not supported by time sheets")}">${esc(d.why||"")}</textarea><span class="hint">${L("Rechnung ","Invoice ")}${nf2.format(i.gross)} · ${L("0 eingeben, um den Abzug zu entfernen.","Enter 0 to remove the deduction.")}</span></div>`};}
  if(F.f==="firm"){const t=F.tmp,B=t?Object.assign({},D.firm,{name:t.fName,street:t.fStreet,zip:t.fZip,city:t.fCity,iban:t.fIban,email:t.fEmail,phone:t.fPhone,vatNo:t.fVatNo,vat:t.fVat}):D.firm;return {title:L("Büro","Office"),body:fld("fName",L("Firmenname","Company name"),B.name,{wide:true,req:true})
    +fld("fStreet",L("Strasse und Nr.","Street and no."),B.street,{wide:true,ph:L("z. B. Seestrasse 40","e.g. Seestrasse 40")})+fld("fZip",L("PLZ","Postcode"),B.zip,{mode:"numeric"})+fld("fCity",L("Ort","Town"),B.city)
    +fld("fIban","IBAN",B.iban?fmtIban(B.iban):"",{wide:true,hint:L("Für den QR-Code auf Ihren Rechnungen.","For the QR code on your invoices.")})
    +fld("fEmail",L("E-Mail","Email"),B.email,{type:"email"})+fld("fPhone",L("Telefon","Phone"),B.phone,{type:"tel"})
    +`<div class="f wide"><label class="chk"><input type="checkbox" id="fVat"${B.vat?" checked":""}> ${L("MWST-pflichtig ("+VAT_RATE+" %)","Subject to VAT ("+VAT_RATE+" %)")}</label><span class="hint">${L("Pflichtig ab CHF 100'000 Umsatz im Jahr.","Required from CHF 100,000 turnover a year.")}</span></div>`
    +fld("fVatNo",L("MWST-Nummer","VAT number"),B.vatNo,{wide:true,ph:"CHE-123.456.789 MWST"})
    +`<div class="f wide"><span class="l">Logo</span><div class="logo-row">${B.logo?`<img src="${B.logo}" alt="" class="logo-prev">`:""}<label class="btn">${B.logo?L("Ersetzen","Replace"):L("Logo wählen","Choose logo")}<input type="file" accept="image/png,image/jpeg" data-imp="logo"></label>${B.logo?`<button type="button" class="ghost" data-act="logo-del">${L("Entfernen","Remove")}</button>`:""}</div><span class="hint">${L("Erscheint oben auf Ihren Rechnungen. PNG oder JPG.","Shown at the top of your invoices. PNG or JPG.")}</span></div>`};}
  return null;
}
function formHTML(){
  const d=formDef(); if(!d) return "";
  const delKey="delform";
  return `<div class="scrim" data-act="close"></div><div class="sheet${S.form.f==="fee"?" wide":""}" role="dialog" aria-modal="true" aria-labelledby="fT">
    <div class="ohead"><h2 id="fT" style="font-size:1.25rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <form id="frm" class="obody" novalidate><div class="fields">${d.body}</div><span class="err" id="formErr" role="alert"></span>
    ${d.del?(S.confirm===delKey?`<button type="button" class="ghost danger" data-act="form-del">${L("Wirklich löschen?","Really delete?")}</button>`:`<button type="button" class="ghost" data-act="ask" data-c="${delKey}">${L("Löschen","Delete")}</button>`):""}</form>
    ${d.noSubmit?"":`<div class="ofoot"><button type="submit" form="frm" class="btn primary">${L("Speichern","Save")}</button></div>`}</div>`;
}
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():"";};
function submitForm(){
  const F=S.form,p=P();S.formErr="";
  const fail=(m,id)=>{const e=document.getElementById("formErr"),frm=document.getElementById("frm");
    document.querySelectorAll("#frm [aria-invalid]").forEach(x=>x.removeAttribute("aria-invalid"));document.querySelectorAll("#frm .ferr").forEach(x=>x.remove());
    const fe=id?document.getElementById(id):frm?[...frm.querySelectorAll("input[required]")].find(x=>!x.value.trim()):null;
    if(fe&&fe.closest(".f")){if(e)e.textContent="";fe.setAttribute("aria-invalid","true");const s=document.createElement("span");s.className="ferr";s.setAttribute("role","alert");s.textContent=m;fe.closest(".f").appendChild(s);fe.scrollIntoView({block:"center",behavior:"smooth"});fe.focus({preventScroll:true});}
    else if(e){e.textContent=m;e.scrollIntoView({block:"nearest",behavior:"smooth"});}};
  if(F.f==="project"){
    if(!val("fName")) return fail(L("Projektname fehlt.","Project name missing."));
    if(F.id){const x=D.projects.find(q=>q.id===F.id);Object.assign(x,{name:val("fName"),place:val("fPlace"),client:val("fClient"),cstreet:val("fCStreet"),czip:val("fCZip"),ccity:val("fCCity"),desc:val("fDesc"),closed:!!(document.getElementById("fClosed")||{}).checked});}
    else{const x={id:newId("p"),name:val("fName"),place:val("fPlace"),client:val("fClient"),cstreet:val("fCStreet"),czip:val("fCZip"),ccity:val("fCCity"),desc:val("fDesc"),budget:[]};D.projects.push(x);D.pid=x.id;S.view="uebersicht";}
    closeAll();render();return toast(L("Projekt gespeichert","Project saved"));
  }
  if(F.f==="contractor"){
    if(!val("fName")) return fail(L("Firma fehlt.","Company missing."));
    const iban=val("fIban");
    if(iban&&!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(norm(iban))) return fail(L("IBAN prüfen: Schweizer IBAN hat 21 Zeichen (CH…).","Check the IBAN: Swiss IBANs have 21 characters (CH…)."),"fIban");
    const rec={name:val("fName"),street:val("fStreet"),zip:val("fZip"),city:val("fCity"),iban:iban?fmtIban(iban):"",email:val("fEmail"),phone:val("fPhone")};
    if(F.id) Object.assign(K(F.id),rec); else{const k=Object.assign({id:newId("k")},rec);D.contractors.push(k);S.kid=k.id;S.view="handwerker";}
    closeAll();render();return toast(L("Handwerker gespeichert","Contractor saved"));
  }
  if(F.f==="contract"){
    const sum=num(val("fSum")),ret=num(val("fRet"));
    if(sum===null||sum<0) return fail(L("Werkvertragssumme eingeben.","Enter the contract sum."),"fSum");
    if(ret===null||ret<0||ret>30) return fail(L("Rückbehalt zwischen 0 und 30 %.","Retention between 0 and 30 %."),"fRet");
    const bkp=document.getElementById("fBkp").value;ensureBkp(bkp);
    let w=F.w&&W(F.w); if(w) Object.assign(w,{bkp,sum:r2(sum),ret}); else{w={id:newId("w"),pid:D.pid,k:F.id,bkp,sum:r2(sum),ret};D.contracts.push(w);}
    closeAll();render();return toast(L("Werkvertrag gespeichert","Contract saved"));
  }
  if(F.f==="invoice"){
    const kid=val("fK"),amt=num(val("fAmt"));const w=CW(kid);
    if(!w) return fail(L("Handwerker wählen.","Choose a contractor."));
    if(F.rep&&INV(F.rep)&&W(INV(F.rep).w).k!==kid) return fail(L("Ersetzen geht nur mit einer Rechnung vom selben Handwerker: ","Replacing only works with an invoice from the same contractor: ")+K(W(INV(F.rep).w).k).name);
    if(!amt||amt<=0) return fail(L("Betrag eingeben.","Enter the amount."),"fAmt");
    const type=val("fType"),ref=val("fRef");
    if(ref&&D.invoices.some(x=>x.ref&&live(x)&&x.id!==F.rep&&norm(x.ref)===norm(ref))) return fail(L("Diese Referenz ist bereits erfasst (Doppelrechnung).","This reference is already recorded (duplicate)."),"fRef");
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
    if(kv===null||kv<0) return fail(L("Betrag eingeben.","Enter an amount."),"fKv");
    b.kv=r2(kv);const lab=val("fLabel");if(lab){if(S.lang==="de")b.de=lab;else b.en=lab;}
    closeAll();render();return toast(L("Gespeichert","Saved"));
  }
  if(F.f==="fee") return saveFee(F,fail);
  if(F.f==="docvalid"){const d=DOCS().find(x=>x.id===F.id);if(d)d.until=val("fUntil")||null;closeAll();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="answer"){const i=INV(F.id),note=(document.getElementById("fNote").value||"").trim();i.status="pruefen";logInv(i,L("Antwort erhalten","Reply received")+(note?": "+note:""));const id=i.id;closeAll();S.drawer=id;render();return toast(L("Wieder zu prüfen","Back to review"));}
  if(F.f==="ded"){const i=INV(F.id),amt=num(val("fDedAmt")),why=(document.getElementById("fDedWhy").value||"").trim();
    if(amt===null||amt<0) return fail(L("Betrag eingeben.","Enter an amount."),"fDedAmt");
    if(amt>=i.gross) return fail(L("Der Abzug muss kleiner als die Rechnung sein.","The deduction must be less than the invoice."),"fDedAmt");
    if(amt>0&&!why) return fail(L("Bitte kurz begründen.","Please give a short reason."));
    if(amt>0){i.ded={amt:r2(amt),why};logInv(i,L("Abzug CHF ","Deduction CHF ")+nf2.format(r2(amt))+": "+why);}else if(i.ded){delete i.ded;logInv(i,L("Abzug entfernt","Deduction removed"));}
    const id=i.id;closeAll();S.drawer=id;render();return toast(amt>0?L("Abzug gespeichert","Deduction saved"):L("Abzug entfernt","Deduction removed"));}
  if(F.f==="firm"){
    if(!val("fName")) return fail(L("Firmenname fehlt.","Company name missing."));
    const ib_=norm(val("fIban"));if(ib_&&!ibanValid(ib_)) return fail(L("IBAN prüfen: Die Prüfziffer stimmt nicht.","Check the IBAN: the check digits do not match."),"fIban");
    const vat=document.getElementById("fVat").checked,vno=val("fVatNo");
    if(vat&&!/^CHE-?\d{3}\.?\d{3}\.?\d{3}/i.test(vno)) return fail(L("MWST-Nummer im Format CHE-123.456.789 MWST eingeben.","Enter the VAT number as CHE-123.456.789 MWST."),"fVatNo");
    Object.assign(D.firm,{name:val("fName"),street:val("fStreet"),zip:val("fZip"),city:val("fCity"),iban:ib_,email:val("fEmail"),phone:val("fPhone"),vat,vatNo:vno});
    closeAll();render();return toast(L("Gespeichert","Saved"));}
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
      note:L("Testversion: Alle Daten und Dokumente liegen nur in diesem Browser auf diesem Gerät. Es wird nichts an einen Server gesendet. Die Sicherung enthält die Daten, aber nicht die Dokumente. Safari kann Daten löschen, wenn arkitecton länger als 7 Tage nicht geöffnet wird: Auf dem iPhone deshalb über Teilen → «Zum Home-Bildschirm» hinzufügen und regelmässig sichern.","Test version: all data and documents stay in this browser on this device. Nothing is sent to a server. The backup contains the data but not the documents. Safari may delete data if arkitecton is not opened for more than 7 days: on iPhone add it via Share → Add to Home Screen and back up regularly.")};
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
function kvHTML(){
  const r=budgetRows().find(x=>x.b.bkp===S.kvx);if(!r)return "";
  const ws=PC().filter(w=>w.bkp===r.b.bkp),kv=r.b.kv,sg=v=>v>0?"+"+nf2.format(v).replace(/\.00$/,""):v<0?"−"+nf2.format(-v).replace(/\.00$/,""):"0";
  const line=(a,b,c,cls)=>`<span${cls?` class="${cls}"`:""}>${a}</span><span class="r${cls?" "+cls:""}">${b}</span><span class="r d${cls?" "+cls:""}">${c||""}</span>`;
  let rows=line(L("Kostenvoranschlag","Cost estimate"),nfq.format(kv),"");
  if(ws.length===1){const w=ws[0];rows+=line(L("Werkvertrag ","Contract ")+esc(K(w.k).name),nfq.format(w.sum),"("+sg(w.sum-kv)+")");}
  else{ws.forEach(w=>{rows+=line(L("Werkvertrag ","Contract ")+esc(K(w.k).name),nfq.format(w.sum),"");});rows+=line(L("Vergeben total","Awarded total"),nfq.format(r.awarded),"("+sg(r.awarded-kv)+")");}
  if(r.billed+r.open>r.awarded) rows+=line(r.open?L("Abgerechnet inkl. offene Rechnungen","Billed incl. open invoices"):L("Abgerechnet (freigegeben)","Billed (approved)"),nfq.format(r.billed+r.open),"("+sg(r.billed+r.open-r.awarded)+")");
  rows+=line(L("Über Kostenvoranschlag","Over cost estimate"),nfq.format(-r.rest),"","sum");
  const cmpBtns=ws.filter(w=>compare(w)).map(w=>`<button type="button" class="btn primary" data-act="open-cmp" data-id="${w.id}">${L("Abweichungen","Differences")}${ws.length>1?" · "+esc(K(w.k).name):""}</button>`).join("");
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="kT">
    <div class="ohead"><div><h2 id="kT" style="font-size:1.25rem;font-weight:500">BKP ${esc(r.b.bkp)} ${esc(tx(r.b))}</h2><div class="sub">CHF ${nfq.format(-r.rest)} ${L("über Kostenvoranschlag","over cost estimate")}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody"><div class="calc kvx">${rows}</div></div>
    <div class="ofoot"><button type="button" class="btn" data-act="form" data-f="kv" data-id="${esc(r.b.bkp)}">${L("Kostenvoranschlag ändern","Edit estimate")}</button>${S.view==="budget"?"":`<button type="button" class="btn" data-act="kv-budget" data-id="${esc(r.b.bkp)}">${L("Budget","Budget")}</button>`}${cmpBtns}</div></div>`;
}
function projectsHTML(){
  const item=p=>{const cur=p.id===D.pid;return `<button type="button" class="pitem${cur?" cur":""}" data-act="pick-project" data-id="${p.id}" data-q="${esc((p.name+" "+(p.place||"")+" "+(p.client||"")).toLowerCase())}"><span class="pn">${esc(p.name)}</span><span class="pp">${esc([p.place,p.client].filter(Boolean).join(" · "))}</span><span class="pc">${cur?"✓":""}</span></button>`;};
  const act=D.projects.filter(p=>!p.closed),done=D.projects.filter(p=>p.closed);
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pT">
    <div class="ohead"><h2 id="pT" style="font-size:1.25rem;font-weight:500">${L("Wechseln","Switch")}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody psw">
      <div class="pfirm"><button type="button" class="pitem${S.view==="buero"?" cur":""}" data-act="home"><span class="pn">Home</span><span class="pp">${esc((D.firm&&D.firm.name)||L("Ihr Büro","Your firm"))} · ${L("alle Projekte","all projects")}</span><span class="pc">${S.view==="buero"?"✓":""}</span></button><button type="button" class="pitem${S.view==="ausschreibungen"?" cur":""}" data-act="nav" data-v="ausschreibungen"><span class="pn">${L("Ausschreibungen","Tenders")}</span><span class="pp">${L("Öffentliche Verfahren für Ihr Büro","Public procedures for your firm")}</span><span class="pc">${S.view==="ausschreibungen"?"✓":""}</span></button></div>
      <h3 class="subh" style="margin:6px 0 -6px;border:0;padding:0">${L("Projekte","Projects")}</h3>
      ${D.projects.length>1?`<input type="search" id="pSearch" class="psearch" placeholder="${L("Projekt suchen","Search projects")}" autocomplete="off" aria-label="${L("Projekt suchen","Search projects")}">`:""}
      <div class="plist">${act.map(item).join("")||`<div class="empty">${L("Keine aktiven Projekte.","No active projects.")}</div>`}</div>
      ${done.length?`<details class="pdone"><summary>${L("Abgeschlossen","Completed")} <span class="cnt">${done.length}</span></summary><div class="plist">${done.map(item).join("")}</div></details>`:""}
      <p class="pnone" hidden>${L("Kein Projekt gefunden.","No project found.")}</p>
      <button type="button" class="padd" data-act="form-project">${L("+ Neues Projekt","+ New project")}</button>
    </div></div>`;
}
function sheetHTML(){
  if(S.sheet==="projects") return projectsHTML();
  const d=sheetDef(S.sheet);if(!d)return "";
  const items=d.groups.filter(g=>g[1].length).map(([g,list])=>(g?`<div class="grp">${g}</div>`:"")+list.map(x=>x.imp
    ?`<label class="mi"><span>${esc(x.label)}</span><span class="k">${x.acc===".json"?".json ↑":".xlsx ↑"}</span><input type="file" accept="${x.acc||".xlsx,.xls,.csv"}" data-imp="${x.imp}"${x.id?` data-id="${x.id}"`:""} aria-label="${esc(x.label)}"></label>`
    :x.btn?`<button type="button" class="mi ${x.cls||""}" data-act="${x.act}"${x.id?` data-id="${x.id}" data-c="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k"></span></button>`
    :`<button type="button" class="mi" data-act="${x.act}"${x.id?` data-id="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k">${x.act==="backup"?".json ↓":".xlsx ↓"}</span></button>`).join("")).join("");
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sT">
    <div class="ohead"><h2 id="sT" style="font-size:1.25rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody"><div class="menu">${items}</div>${d.note?`<span class="fine" style="color:var(--faint);font-size:.82rem">${esc(d.note)}</span>`:""}</div></div>`;
}

function renderOverlay(){queueMicrotask(()=>{if(S.form&&S.form.f==="fee")feeCalcUpdate();});queueMicrotask(()=>{const q=document.getElementById("qtext");if(q&&!q.dataset.top){q.scrollTop=0;q.dataset.top="1";}});queueMicrotask(()=>document.querySelectorAll('input[type=file]').forEach(x=>{if(!x.title)x.title=" ";}));
  const o=document.getElementById("overlay");let h="";
  if(S.form) h=formHTML(); else if(S.modal) h=captureHTML(); else if(S.sheet) h=sheetHTML(); else if(S.kvx) h=kvHTML(); else if(S.drawer&&INV(S.drawer)) h=drawerHTML(INV(S.drawer)); else if(S.fdrawer&&FE(S.fdrawer)) h=feeDrawerHTML(FE(S.fdrawer));
  o.innerHTML=h;o.classList.toggle("on",!!h);{const t=document.getElementById("toast");if(t)t.classList.toggle("top",!!h);}
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
  if(kind==="logo"){const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(file);});const im=new Image();im.src=url;await new Promise(r=>{im.onload=r;im.onerror=r;});
    const sc=Math.min(1,600/Math.max(im.naturalWidth||1,im.naturalHeight||1)),c=document.createElement("canvas");c.width=Math.round((im.naturalWidth||1)*sc);c.height=Math.round((im.naturalHeight||1)*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    readFirmForm();D.firm.logo=c.toDataURL("image/png");renderOverlay();return;}
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
function toast(msg,ms){const t=document.getElementById("toast");t.classList.toggle("top",!!document.querySelector("#overlay.on"));t.textContent=msg;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),ms||3000);}
async function copy(text,ok){try{await navigator.clipboard.writeText(text);toast(ok);}catch(e){toast(L("Kopieren nicht möglich","Copy failed"));}}
function closeAll(){stopCam();S.kvx=null;S.fdrawer=null;S.drawer=null;S.modal=null;S.sheet=null;S.form=null;S.formErr="";S.confirm=null;S.queryOpen=false;S.done=null;}
function go(v){if(!VIEWS.includes(v))v="uebersicht";closeAll();if(v!=="handwerker")S.cmpBack=null;S.view=v;if(v!=="handwerker")S.kid=null;if(v!=="ausschreibungen")S.tid=null;try{history.replaceState(null,"","#"+v);}catch(e){}render();document.getElementById("main").scrollTop=0;}
const openForm=(f,id,w)=>{const keepDrawer=S.drawer;closeAll();S.form={f,id:id||null,w:w||null,back:keepDrawer};renderOverlay();};

document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("site")&&S.kOpen)S.kOpen.ids[d.dataset.pid]=d.open;},true);
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  if(EXPORT[a])return void EXPORT[a](id);
  switch(a){
    case "start-example":D=seedExample();runMigrations();S.view="uebersicht";render();break;
    case "start-empty":D=seedEmpty();S.view="buero";render();openForm("firm");break;
    case "nav":S.kid=null;S.tid=null;go(el.dataset.v);break;
    case "lang":if(el.dataset.l!==S.lang)exampleSwap(el.dataset.l);S.lang=el.dataset.l;try{localStorage.setItem("arkitecton:lang",S.lang);}catch(err){}render();break;
    case "filter":S.filter=el.dataset.f;render();break;
    case "to-fees":S.rtab="deb";go("rechnungen");break;
    case "rtab":S.rtab=el.dataset.t;render();break;
    case "open-fee":closeAll();S.fdrawer=id;renderOverlay();break;
    case "fee-addline":readFeeLines();S.form.lines.push({t:"",q:1,u:L("pauschal","lump sum"),p:""});keepFeeFields(()=>renderOverlay());break;
    case "fee-delline":readFeeLines();S.form.lines.splice(+el.dataset.c,1);keepFeeFields(()=>renderOverlay());break;
    case "fee-paid":{const f=FE(id);f.paid=iso(TODAY);logInv(f,L("Zahlung eingegangen","Payment received"));render();toast(L("Als bezahlt markiert","Marked as paid"));break;}
    case "fee-unpaid":{const f=FE(id);f.paid=null;logInv(f,L("Zahlung zurückgenommen","Payment undone"));render();break;}
    case "fee-pdf":{const f=FE(id);feePDF(f,0).then(()=>{if(!(f.log||[]).some(x=>x.t===L("PDF erstellt","PDF created"))){logInv(f,L("PDF erstellt","PDF created"));render();}}).catch(()=>toast(L("PDF konnte nicht erstellt werden","Could not create PDF")));break;}
    case "fee-remind":{const f=FE(id),n=remDue(f);if(!n)break;feePDF(f,n).then(()=>{(f.rem=f.rem||[]).push({n,d:iso(TODAY)});logInv(f,remName(n)+L(" erstellt"," created"));render();toast(remName(n)+L(" erstellt"," created"));}).catch(()=>toast(L("PDF konnte nicht erstellt werden","Could not create PDF")));break;}
    case "fee-demo":{addDemoFees();render();toast(L("3 Beispielrechnungen angelegt","3 example invoices added"));break;}
    case "fee-del":{D.fees=FEES().filter(x=>x.id!==id);closeAll();render();toast(L("Rechnung gelöscht","Invoice deleted"));break;}
    case "logo-del":readFirmForm();delete D.firm.logo;renderOverlay();break;
    case "jump-flags":{const f=document.getElementById("flags");if(f)f.scrollIntoView({behavior:"smooth",block:"start"});break;}
    case "all-flags":S.allFlags=!S.allFlags;render();break;
    case "open-inv":closeAll();S.drawer=id;renderOverlay();break;
    case "open-k":S.wid=null;S.kid=id;S.ktab="konto";go("handwerker");S.kid=id;render();break;
    case "open-cmp":{const w=W(id);if(!w)break;S.cmpBack=S.drawer?{inv:S.drawer,view:S.view}:null;S.kid=w.k;S.ktab="vergleich";S.wid=w.id;go("handwerker");S.kid=w.k;S.wid=w.id;render();break;}
    case "kv-explain":closeAll();S.kvx=id;renderOverlay();break;
    case "kv-budget":closeAll();S.hl=id;go("budget");render();setTimeout(()=>{const e=document.querySelector('.brow[data-id="'+id+'"]');if(e)e.scrollIntoView({behavior:"smooth",block:"center"});},60);setTimeout(()=>{S.hl=null;},3000);break;
    case "open-w":S.wid=id;render();break;
    case "back-w":S.wid=null;S.cmpBack=null;render();break;
    case "back-inv":{const b=S.cmpBack;S.cmpBack=null;S.wid=null;S.kid=null;go(b?b.view:"rechnungen");if(b&&INV(b.inv)){S.drawer=b.inv;renderOverlay();}break;}
    case "back-k":S.kid=null;S.wid=null;S.cmpBack=null;render();break;
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
    case "open-project":D.pid=id;S.kid=null;go("uebersicht");break;
    case "home":go("buero");break;
    case "pick-project":D.pid=id;closeAll();S.kid=null;if(S.view==="buero"||S.view==="ausschreibungen")go("uebersicht");else render();toast(P().name);break;
    case "ask":S.confirm=el.dataset.c;if(/^ddel:/.test(S.confirm))render();else renderOverlay();break;
    case "notice-ok":D.noticeOk=1;render();break;
    case "doc-open":openDoc(el.dataset.id);break;
    case "doc-del":{const id=el.dataset.id;D.docs=DOCS().filter(d=>d.id!==id);S.confirm=null;FDB.del(id);render();toast(L("Dokument gelöscht","Document deleted"));break;}
    case "reset-ex":clearFiles();D=seedExample();runMigrations();closeAll();S.view="uebersicht";S.kid=null;S.tid=null;render();toast(L("Beispieldaten geladen","Example data loaded"));break;
    case "reset-all":clearFiles();try{localStorage.removeItem(KEY);}catch(err){}D=null;closeAll();render();break;
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
  const t=e.target;if(t.id==="capProj"&&S.modal){readCapture();S.modal.pid=t.value;delete S.modal.data.bkpSel;delete S.modal.data.typeSel;renderOverlay();return;}if(t.id==="fVatOn"){feeCalcUpdate();return;}if(!t.matches||!t.matches("input[type=file]"))return;
  if(t.id==="pSearch")return;
  if(t.dataset.imp==="doc"){const fs=[...(t.files||[])];t.value="";if(fs.length)addDocs(fs,t.dataset.id).catch(()=>toast(L("Speichern nicht möglich.","Could not save.")));return;}
  const f=t.files&&t.files[0];if(!f)return;
  if(t.id==="scanIn")onScanFile(f);else if(t.dataset.imp){handleImport(t.dataset.imp,f,t.dataset.id);t.value="";}
});
document.addEventListener("input",e=>{if(e.target.getAttribute&&e.target.getAttribute("aria-invalid")){e.target.removeAttribute("aria-invalid");const fe=e.target.closest(".f")&&e.target.closest(".f").querySelector(".ferr");if(fe)fe.remove();}if(e.target.id==="pSearch"){const q=e.target.value.trim().toLowerCase(),sh=document.querySelector(".psw");let n=0;sh.querySelectorAll(".pitem").forEach(b=>{const on=!q||b.dataset.q.includes(q);b.hidden=!on;if(on)n++;});sh.querySelectorAll(".plist").forEach(l=>{l.hidden=![...l.querySelectorAll(".pitem")].some(b=>!b.hidden);});const dd=sh.querySelector(".pdone");if(dd&&q)dd.open=true;sh.querySelector(".pnone").hidden=n>0;return;}if(S.form&&S.form.f==="fee"&&e.target.closest&&e.target.closest("#frm"))feeCalcUpdate();});
/* ---------- swipe between the main areas on a phone (same order as the tab bar) ----------
   the page follows the finger 1:1, a short flick is enough, and the next page
   slides in from where the old one left: one continuous movement, no blank moment */
const SWIPE=["uebersicht","rechnungen","handwerker","budget"];
(function(){
  const main=document.getElementById("main");let st=null,busy=false;
  const phone=()=>window.matchMedia("(max-width:820px)").matches;
  const blocked=t=>t.closest("input,textarea,select,.tabs:not(.chips),.chart,[data-noswipe]")||document.querySelector("#overlay.on");
  const set=(x,ms,ease)=>{main.style.transition=ms?`transform ${ms}ms ${ease||"cubic-bezier(.2,.7,.2,1)"}`:"none";main.style.transform=x?`translate3d(${x}px,0,0)`:"";};
  main.addEventListener("touchstart",e=>{
    if(busy||!D||!phone()||e.touches.length!==1||!SWIPE.includes(S.view)||blocked(e.target)){st=null;return;}
    const t=e.touches[0];if(t.clientX<20||t.clientX>innerWidth-20){st=null;return;} /* screen edges stay with the system back gesture */
    st={x:t.clientX,y:t.clientY,dir:0,dx:0,v:0,lx:t.clientX,lt:performance.now()};
  },{passive:true});
  main.addEventListener("touchmove",e=>{
    if(!st)return;const t=e.touches[0],dx=t.clientX-st.x,dy=t.clientY-st.y,now=performance.now();
    if(!st.dir){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;st.dir=Math.abs(dx)>Math.abs(dy)?1:-1;}
    if(st.dir!==1)return;
    st.v=(t.clientX-st.lx)/Math.max(1,now-st.lt);st.lx=t.clientX;st.lt=now;st.dx=dx;
    const i=SWIPE.indexOf(S.view),end=(dx>0&&i===0)||(dx<0&&i===SWIPE.length-1);
    set(end?dx*0.2:dx,0);
  },{passive:true});
  main.addEventListener("touchend",()=>{
    if(!st)return;const s0=st;st=null;if(s0.dir!==1){set(0,180);return;}
    const dx=s0.dx,i=SWIPE.indexOf(S.view),flick=Math.abs(s0.v)>0.35&&Math.sign(s0.v)===Math.sign(dx),n=i+(dx<0?1:-1);
    if(!(Math.abs(dx)>innerWidth*0.2||(flick&&Math.abs(dx)>24))||n<0||n>=SWIPE.length){set(0,220);return;}
    busy=true;const W=innerWidth,out=dx<0?-1:1,rest=W-Math.abs(dx),ms=Math.max(140,Math.min(260,rest/Math.max(1.4,Math.abs(s0.v)||1.4)));
    /* keep a picture of the old page and slide it out while the new page slides in right next to it */
    const r=main.getBoundingClientRect(),cs=getComputedStyle(main),g=document.createElement("div"),gi=document.createElement("div");
    g.setAttribute("aria-hidden","true");
    g.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;overflow:hidden;background:var(--bg);z-index:5;pointer-events:none;transform:translate3d(${dx}px,0,0)`;
    gi.style.cssText=`padding:${cs.padding};box-sizing:border-box;transform:translate3d(0,${-main.scrollTop}px,0)`;
    gi.innerHTML=main.innerHTML;g.appendChild(gi);document.body.appendChild(g);
    S.kid=null;S.tid=null;go(SWIPE[n]);
    set(dx-out*W,0);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const ease="cubic-bezier(.25,.8,.3,1)";
      g.style.transition=`transform ${ms}ms ${ease}`;g.style.transform=`translate3d(${out*W}px,0,0)`;
      set(0,ms,ease);
      setTimeout(()=>{g.remove();main.style.transition="";main.style.transform="";busy=false;},ms+40);
    }));
    if(!D.swipeSeen){D.swipeSeen=1;saveData();}
  });
  main.addEventListener("touchcancel",()=>{if(st){st=null;set(0,180);}});
})();
/* one-time hint on the phone, until the person has swiped once */
function swipeHint(){if(!D||D.swipeSeen||D.swipeHinted||!window.matchMedia("(max-width:820px)").matches||!SWIPE.includes(S.view))return;D.swipeHinted=1;saveData();setTimeout(()=>toast(L("Tipp: Seitlich wischen wechselt zwischen Projekt, Rechnungen, Handwerker und Budget.","Tip: swipe left or right to move between Project, Invoices, Contractors and Budget."),6000),900);}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&(S.drawer||S.fdrawer||S.modal||S.sheet||S.form||S.kvx)){closeAll();render();}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCam();});
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(D&&v!==S.view&&VIEWS.includes(v))go(v);});

try{const l=localStorage.getItem("arkitecton:lang");if(l==="de"||l==="en")S.lang=l;}catch(e){}
D=loadData();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
runMigrations();
const h0=location.hash.slice(1);if(VIEWS.includes(h0))S.view=h0;
render();
window.__ark={get D(){return D;},setD(o){D=o;render();},render:()=>render(),S,compare,budgetRows,totals,retention,payout,parseSPC,parseLines,flags};
})();
