/* arkitecton web app MVP
   Static, no build step. Data is kept in this browser (localStorage, files in IndexedDB).
   Libraries: SheetJS (Excel), jsQR (QR codes), pdf.js and jsPDF (loaded on demand).
   The code is split into classic scripts that share one global scope; index.html loads them in order:
   bkp.js, js/01-core … js/08-forms, then app.js (start-up). */
/* arkitecton · Dates, text and numbers, reference lists, example data, storage. */
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
const r2=n=>{const x=Math.round(Math.abs(n)*100+1e-7)/100;return n<0?-x:x;};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>String(s||"").replace(/\s+/g,"").toUpperCase();
const fmtIban=s=>norm(s).replace(/(.{4})/g,"$1 ").trim();
const fmtRef=s=>{const n=norm(s);return /^\d{27}$/.test(n)?n.slice(0,2)+" "+n.slice(2).replace(/(.{5})/g,"$1 ").trim():n.replace(/(.{4})/g,"$1 ").trim();};
/* amounts as people type them: 1'000.50, 1000,50, 1.000,50 or 1,000.50; the last separator is the decimal point */
const num=v=>{if(typeof v==="number")return v;let s=String(v==null?"":v).replace(/[\s'’`]|chf|fr\.?/gi,"");const c=s.lastIndexOf(","),d=s.lastIndexOf(".");
  if(c>-1&&d>-1){s=c>d?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");}else if(c>-1){s=(s.match(/,/g).length>1?s.replace(/,/g,""):s.replace(",","."));}else if((s.match(/\./g)||[]).length>1){s=s.replace(/\./g,"");}
  const n=parseFloat(s);return isNaN(n)?null:n;};
const tx=o=>o?(S.lang==="de"?o.de:(o.en||o.de)):"";

/* ---------- reference lists ---------- */
const STD_BKP=[["211","Baumeisterarbeiten","Building shell works"],["214","Montagebau in Holz","Timber construction"],["221","Fenster, Aussentüren","Windows, exterior doors"],["222","Spenglerarbeiten","Sheet metal works"],["224","Bedachungsarbeiten","Roofing"],["226","Fassadenputze","Facade plaster"],["230","Elektroanlagen","Electrical installations"],["240","Heizung, Lüftung, Klima","Heating, ventilation, air conditioning"],["250","Sanitäranlagen","Plumbing"],["258","Kücheneinrichtungen","Kitchens"],["271","Gipserarbeiten","Plastering"],["272","Metallbauarbeiten","Metalwork"],["273","Schreinerarbeiten","Joinery"],["281","Bodenbeläge","Floor coverings"],["285","Malerarbeiten","Painting"],["287","Baureinigung","Construction cleaning"]];
/* example cost estimate also outside BKP 2: preparation, surroundings, ancillary costs */
const EX_BKP_EXTRA=[["112","Abbrüche","Demolition",18000],["421","Gärtnerarbeiten","Garden works",38000],["511","Bewilligungen, Baugespann, Gebühren","Permits, fees",12500],["531","Bauzeitversicherungen","Construction insurance",6500]];
const DISC={"291":{de:"Architektur/Baumanagement",en:"Architecture/construction management"},"292":{de:"Bauingenieurwesen",en:"Structural engineering"}};
const ROLES={inhaber:{de:"Inhaber",en:"Owner"},pl:{de:"Projektleiter",en:"Project lead"},bl:{de:"Bauleiter",en:"Site manager"},arch:{de:"Architekt",en:"Architect"},zeich:{de:"Zeichner",en:"Draughtsman"}};
const XQ={blfa:{de:"Bauleiter mit eidg. Fachausweis",en:"Site manager, federal certificate"},pub:{de:"Erfahrung öffentliche Bauten",en:"Public buildings experience"},sia:{de:"SIA-Mitglied",en:"SIA member"},rega:{de:"REG A",en:"REG A"},qes:{de:"Qualifizierte elektronische Signatur (QES)",en:"Qualified electronic signature (QES)"}};
const YNOW=()=>TODAY.getFullYear();
const spanY=c=>Math.max(1,(c.to||YNOW())-c.from+1);
const roleYears=(m,r)=>(m.career||[]).filter(c=>!r||c.role===r).reduce((a,c)=>a+spanY(c),0);
const curRole=m=>{const c=(m.career||[]).filter(x=>!x.to).sort((a,b)=>b.from-a.from)[0]||(m.career||[]).slice().sort((a,b)=>(b.to||0)-(a.to||0))[0];return c?c.role:null;};
const startY=m=>Math.min(...(m.career||[]).map(c=>c.from).concat([YNOW()]));
const mTags=m=>{const t=[];if((m.extra||[]).includes("blfa"))t.push("bl");if((m.extra||[]).includes("pub")&&roleYears(m,"pl")>0)t.push("pl");return t;};
const yrs=n=>n===1?L("1 Jahr","1 year"):n+" "+L("Jahre","years");
const RTYPE={schule:{de:"Schulbauten",en:"School buildings"},instandsetzung:{de:"Instandsetzung",en:"Refurbishment"},wohnen:{de:"Wohnbauten",en:"Housing"}};
const PROC={sel:{de:"Selektives Verfahren (2 Phasen)",en:"Selective procedure (2 phases)"},offen:{de:"Offenes Verfahren",en:"Open procedure"},einl:{de:"Einladungsverfahren",en:"Invitation procedure"}};
const TST={neu:{de:"Neu",en:"New",c:"acc"},arbeit:{de:"In Arbeit",en:"In progress",c:"warn"},eingereicht:{de:"Eingereicht",en:"Submitted",c:"ok"},verzichtet:{de:"Verzichtet",en:"Declined",c:"n"},pq:{de:"Teilnahmeantrag eingereicht",en:"Request submitted",c:"ok"},gewonnen:{de:"Zuschlag erhalten",en:"Contract awarded",c:"ok"},verloren:{de:"Kein Zuschlag",en:"Not awarded",c:"n"},nichtausg:{de:"Nicht ausgewählt",en:"Not selected",c:"n"}};
const FIT={ok:{de:"Erfüllt",en:"Eligible",c:"ok"},partner:{de:"Nur mit Partner",en:"Only with partner",c:"warn"},no:{de:"Nicht erfüllt",en:"Not eligible",c:"crit"},nodata:{de:"Büroprofil fehlt",en:"Office profile missing",c:"n"}};
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
  return {v:1,seq:100,events:[],pid:"p1",firm:{name:L("Beispiel Architekten GmbH","Example Architects Ltd"),street:"Zugerstrasse 18",zip:"8820",city:"Wädenswil",iban:"CH6700700110004357712",email:"info@beispiel-architekten.example",signers:[{m:"m1",role:"Projektleiter"},{m:"m2",role:"Bauleitung"}],phone:"044 780 12 34",vat:true,vatNo:"CHE-123.456.788 MWST"},
    projects:[{id:"p1",name:"MFH Seestrasse 12",place:"Wädenswil",client:"Familie Graf",cstreet:"Rebhalde 5",czip:"8820",ccity:"Wädenswil",desc:L("Neubau, 8 Wohnungen","New build, 8 flats"),
      budget:[["211",420000],["221",96000],["224",58000],["230",74000],["250",88000],["271",41000],["281",52000],["285",36000]].map(([b,kv])=>{const s=STD_BKP.find(x=>x[0]===b);return Object.assign({bkp:b,de:s[1],en:s[2],kv},b==="285"?{kvr:41000}:{});}).concat(EX_BKP_EXTRA.map(([bkp,de,en,kv])=>({bkp,de,en,kv}))).sort((a,b)=>a.bkp.localeCompare(b.bkp))},
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
      {id:"w1",pid:"p1",k:"k1",bkp:"211",sum:412500,ret:0},
      {id:"w2",pid:"p1",k:"k2",bkp:"221",sum:98700,ret:0,
        offer:[{pos:"1",text:"Holz-Metall-Fenster, 2-flüglig",unit:"Stk",qty:24,price:2150},{pos:"2",text:"Hebeschiebetüren Balkon",unit:"Stk",qty:8,price:3900},{pos:"3",text:"Hauseingangstür",unit:"Stk",qty:1,price:6400},{pos:"4",text:"Fensterbänke aussen, Aluminium",unit:"m",qty:62,price:85},{pos:"5",text:"Montage und Abdichtung",unit:"pauschal",qty:1,price:4230}],
        final:[{pos:"1",text:"Holz-Metall-Fenster, 2-flüglig",unit:"Stk",qty:24,price:2150},{pos:"2",text:"Hebeschiebetüren Balkon",unit:"Stk",qty:8,price:3900},{pos:"3",text:"Hauseingangstür",unit:"Stk",qty:1,price:6400},{pos:"4",text:"Fensterbänke aussen, Aluminium",unit:"m",qty:68,price:85},{pos:"5",text:"Montage und Abdichtung",unit:"pauschal",qty:1,price:4230},{pos:"6",text:"Insektenschutzrollos",unit:"Stk",qty:8,price:290}]},
      {id:"w3",pid:"p1",k:"k3",bkp:"230",sum:71200,ret:0},
      {id:"w4",pid:"p1",k:"k4",bkp:"250",sum:86400,ret:0},
      {id:"w5",pid:"p1",k:"k5",bkp:"271",sum:39800,ret:0},
      {id:"w6",pid:"p1",k:"k6",bkp:"285",sum:34600,ret:0},
      {id:"w7",pid:"p2",k:"k6",bkp:"285",sum:12300,ret:0},
      {id:"w8",pid:"p2",k:"k2",bkp:"221",sum:26400,ret:0}],
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
/* a real start: no example tenders, references or team */
function seedEmpty(){const tt=seedTenders();return {v:1,seq:100,events:[],pid:null,firm:{name:""},projects:[],contractors:[],contracts:[],invoices:[],fees:[],office:Object.assign({},tt.office,{team:[],refs:[]}),tenders:[],example:false};}
const SAMPLE={name:"Meier Malerei GmbH",street:"Zürcherstrasse 88",zip:"8820",city:"Wädenswil",iban:"CH44 3199 9123 0008 8901 2",amount:12450,ref:"21 00000 00003 13947 14300 09017",no:"2026-417",msg:"Objekt: MFH Seestr. 12, Wädenswil – Malerarbeiten Treppenhaus"};
/* three invoices at once: one new, one more progress payment, one already recorded */
const SAMPLES=[SAMPLE,
  {name:"Keller Bau AG",street:"Zugerstrasse 41",zip:"8810",city:"Horgen",iban:"CH93 0076 2011 6238 5295 7",amount:45000,ref:"21 00000 00001 10233 41100 00041",no:"AK-092",msg:"Akonto 4 · Objekt: MFH Seestrasse 12, Wädenswil"},
  {name:"Sanitär Huber & Co.",street:"Bahnhofstrasse 3",zip:"8805",city:"Richterswil",iban:"CH38 0070 0110 0012 3456 1",amount:30000,ref:"21 00000 00009 31200 20260 09125",no:"2026/0912",msg:"Akonto 1 · Objekt: MFH Seestrasse 12"}];
const EX_OFFER=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1420,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:42,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410}];
const EX_FINAL=[{pos:"1",text:"Wände streichen, 2 Anstriche",unit:"m²",qty:1465,price:14},{pos:"2",text:"Decken streichen",unit:"m²",qty:610,price:12},{pos:"3",text:"Türzargen lackieren",unit:"Stk",qty:44,price:95},{pos:"4",text:"Abdeck- und Vorarbeiten",unit:"pauschal",qty:1,price:3410},{pos:"5",text:"Ausbesserungen nach Elektriker",unit:"h",qty:6,price:98}];

/* ---------- storage ---------- */
/* ?raum=name opens a separate, empty data space in the same browser (e.g. a test person on the presenter's laptop) */
const SPACE=(new URLSearchParams(location.search).get("raum")||"").replace(/[^a-z0-9-]/gi,"").slice(0,30).toLowerCase();
const KEY="arkitecton:data:v1"+(SPACE?":"+SPACE:"");
let D=null;
/* Storage safety.
   A damaged saved state is never overwritten: it is copied aside (KEY:defekt) and the start screen says so.
   Several open tabs: every save writes a revision; a tab whose revision is outdated reloads instead of overwriting the newer state. */
const REVKEY=KEY+":rev",BADKEY=KEY+":defekt";let myRev=null,CORRUPT=false;
const readRev=()=>{try{return localStorage.getItem(REVKEY);}catch(e){return null;}};
function loadData(){let s=null;try{s=localStorage.getItem(KEY);}catch(e){}
  if(!s)return null;
  try{const o=JSON.parse(s);if(o&&o.v===1&&Array.isArray(o.projects)){o.fees=o.fees||[];o.firm=o.firm||{name:""};myRev=readRev();return o;}}catch(e){}
  try{localStorage.setItem(BADKEY,s);localStorage.removeItem(KEY);}catch(e){}CORRUPT=true;return null;}
function conflictReload(){const o=loadData();if(o)D=o;toastLock=Date.now()+2500;
  setTimeout(()=>{try{S.form=null;closeAll();render();toast(L("Nicht gespeichert: In einem anderen Fenster wurde arkitecton inzwischen geändert. Hier ist jetzt der neuste Stand. Bitte die Änderung nochmals machen.","Not saved: arkitecton was changed in another window meanwhile. This is now the latest state; please redo the change."),10000);}catch(x){}},0);}
let saveWarned=false;
function saveData(){if(!D)return;
  const st=readRev();let has=false;try{has=localStorage.getItem(KEY)!==null;}catch(e){}if(has&&st&&st!==myRev){conflictReload();return;}
  try{localStorage.setItem(KEY,JSON.stringify(D));myRev=Date.now().toString(36)+Math.random().toString(36).slice(2,7);localStorage.setItem(REVKEY,myRev);saveWarned=false;}catch(e){if(!saveWarned){saveWarned=true;setTimeout(()=>{try{toast(L("Speichern nicht möglich: Der Browser-Speicher ist voll. Bitte sofort unter Einstellungen › Daten und Sicherung eine Sicherung herunterladen.","Cannot save: browser storage is full. Please download a backup now under Settings › Data and backup."),12000);}catch(x){}},0);}}}
/* IDs are random (122 bits of a UUID, kept short with a type prefix), so devices can later sync without two objects getting the same ID.
   Existing IDs (p1, i340) stay: they are unique within the office data, and only new objects need to be unique across devices. */
const uid=()=>{if(crypto.randomUUID)return crypto.randomUUID().replace(/-/g,"");const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;return [...b].map(x=>x.toString(16).padStart(2,"0")).join("");};
const newId=p=>p+"_"+uid();
