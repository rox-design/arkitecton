/* arkitecton unit tests for the money logic, QR codes and tenders.
   Runs inside the app page (tests/run_unit.py injects this file), so it uses the app's real functions.
   Each test builds its own data set; the app's data is restored afterwards. */
(function(){
const results=[];let cur="";
const eq=(a,b,msg)=>{const ok=JSON.stringify(a)===JSON.stringify(b);results.push({t:cur,msg,ok,got:a,want:b});};
const near=(a,b,msg)=>{const ok=Math.abs(a-b)<0.005;results.push({t:cur,msg,ok,got:a,want:b});};
const yes=(c,msg)=>results.push({t:cur,msg,ok:!!c,got:c,want:true});
const test=(name,fn)=>{cur=name;try{fn();}catch(e){results.push({t:name,msg:"threw: "+e.message,ok:false});}};
const keep=D;
/* minimal data set: one project, one contractor; contracts and invoices added per test */
const base=()=>({v:1,seq:500,events:[],pid:"p1",firm:{name:"Test Architekten",street:"Weg 1",zip:"8000",city:"Zürich",iban:"CH9300762011623852957",vat:true,vatNo:"CHE-123.456.789"},
  projects:[{id:"p1",name:"Test",place:"Zürich",client:"Bauherr",cstreet:"Gasse 2",czip:"8001",ccity:"Zürich",budget:[]}],
  contractors:[{id:"k1",name:"Bau AG",street:"Str 1",zip:"8000",city:"Zürich",iban:"CH9300762011623852957",email:"a@b.ch"}],
  contracts:[],invoices:[],fees:[],docs:[],tenders:[],settings:{},mig:{}});
const inv=(id,w,type,gross,status,extra)=>Object.assign({id,no:id,w,type,n:1,date:"2026-01-01",due:"2026-02-01",gross,status,ref:""},extra||{});

test("Zahlen eingeben",()=>{
  eq(num("1'000.50"),1000.5,"Schweizer Schreibweise");eq(num("1000,50"),1000.5,"Komma");eq(num("1.000,50"),1000.5,"deutsche Schreibweise");
  eq(num("1,000.50"),1000.5,"englische Schreibweise");eq(num("CHF 2'500"),2500,"mit CHF");eq(num("abc"),null,"kein Betrag");});
test("Runden",()=>{eq(r2(1.005),1.01,"1.005");eq(r2(-1.005),-1.01,"negativ");eq(r2(0.1+0.2),0.3,"0.1+0.2");eq(r05(10.03),10.05,"5 Rappen");});

test("Rückbehalt: Akonto, Schluss, eingefroren",()=>{
  D=base();D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:100000,ret:10}];
  D.invoices=[inv("a1","w1","akonto",50000,"frei"),inv("s1","w1","schluss",48000,"pruefen")];
  eq(retention(D.invoices[0]),5000,"10 % auf Akonto");eq(payout(D.invoices[0]),45000,"Auszahlung Akonto");
  eq(retention(D.invoices[1]),-5000,"Schluss gibt Rückbehalt frei");eq(payout(D.invoices[1]),53000,"Auszahlung Schluss");
  stampRet();D.invoices[1].status="frei";stampRet();
  D.contracts[0].ret=0;
  eq(retention(D.invoices[0]),5000,"Akonto bleibt nach Vertragsänderung bei 10 %");eq(payout(D.invoices[1]),53000,"Schluss bleibt gleich");
  D.invoices.push(inv("a2","w1","akonto",2000,"pruefen"));D.contracts[0].ret=10;
  eq(retention(D.invoices[2]),0,"Akonto nach der Schlussrechnung ohne Rückbehalt");
  D.invoices[1].status="pruefen";stampRet();yes(D.invoices[1].retRel===undefined,"Freigabe zurückgenommen: Wert nicht mehr eingefroren");});

test("Abzug",()=>{D=base();D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:1000,ret:0}];
  const i=inv("a1","w1","akonto",1000,"pruefen",{ded:{amt:150,why:"Skonto"}});D.invoices=[i];eq(net(i),850,"Netto nach Abzug");eq(payout(i),850,"Auszahlung");});

test("Budget: Prognose und Reserve",()=>{
  D=base();D.projects[0].budget=[{bkp:"211",de:"Baumeister",en:"x",kv:100000},{bkp:"221",de:"Fenster",en:"x",kv:50000},{bkp:"230",de:"Elektro",en:"x",kv:40000},{bkp:"250",de:"Sanitär",en:"x",kv:30000},{bkp:"511",de:"Gebühren",en:"x",kv:10000}];
  D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:90000,ret:0},{id:"w2",pid:"p1",k:"k1",bkp:"221",sum:45000,ret:0},{id:"w3",pid:"p1",k:"k1",bkp:"230",sum:38000,ret:0},{id:"w4",pid:"p1",k:"k1",bkp:"250",sum:30000,ret:0}];
  D.invoices=[inv("a1","w1","akonto",40000,"bezahlt"),
    inv("a2","w2","akonto",30000,"bezahlt"),inv("a3","w2","akonto",20000,"pruefen"),
    inv("a4","w3","akonto",20000,"bezahlt"),inv("s4","w3","schluss",15000,"frei"),
    inv("a5","w4","akonto",10000,"bezahlt"),inv("r5","w4","regie",2000,"frei")];
  const R=Object.fromEntries(budgetRows().map(r=>[r.b.bkp,r]));
  eq(R["211"].forecast,90000,"weniger abgerechnet als Vertrag: Vertrag zählt");eq(R["211"].rest,10000,"Reserve 211");
  eq(R["221"].forecast,50000,"mehr abgerechnet (inkl. offene Rechnung): abgerechnet zählt");eq(R["221"].rest,0,"Reserve 221");
  eq(R["230"].forecast,35000,"Schlussrechnung unter Vertrag: abgerechnet zählt");eq(R["230"].final,true,"als abgeschlossen erkannt");
  eq(R["250"].forecast,32000,"Regie kommt zum Vertrag dazu");yes(R["250"].over,"über Budget erkannt");
  eq(R["511"].forecast,10000,"nicht vergeben: Kostenvoranschlag");eq(R["511"].rest,0,"keine Reserve ohne Vertrag");
  eq(totals(budgetRows()).rest,10000+0+5000-2000+0,"Reserve total");});

test("Offene Rechnungen",()=>{D=base();D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:100000,ret:10}];
  D.invoices=[inv("a1","w1","akonto",10000,"pruefen"),inv("a2","w1","akonto",20000,"bezahlt"),inv("a3","w1","akonto",5000,"ersetzt")];
  eq(unpaid(D.invoices).map(i=>i.id),["a1"],"nur unbezahlte, nicht ersetzte");eq(toPay(D.invoices),9000,"Betrag nach Rückbehalt");});

test("Honorar: Summe, MWST, Rundung",()=>{D=base();
  const f={id:"h1",pid:"p1",no:"2026-001",date:"2026-03-01",lines:[{t:"A",q:10,u:"h",p:145.5},{t:"B",q:1,u:"p",p:1000}],vat:true,vatRate:8.1};
  eq(feeSub(f),2455,"Zwischensumme");eq(feeVat(f),198.86,"MWST 8.1 %");eq(feeTotal(f),2653.85,"Total auf 5 Rappen");});

test("QR-Referenzen",()=>{D=base();
  const scor=makeRef("2026-001");eq(scor.type,"SCOR","normale IBAN: Creditor Reference");
  const x=scor.ref.slice(4)+scor.ref.slice(0,4);eq(mod97(x),1,"ISO 11649 Prüfziffer");
  D.firm.iban="CH4431999123000889012";yes(isQrIban(D.firm.iban),"QR-IBAN erkannt");
  const q=makeRef("2026-001");eq(q.type,"QRR","QR-IBAN: QR-Referenz");eq(q.ref.length,27,"27 Stellen");eq(mod10r(q.ref.slice(0,26)),q.ref.slice(26),"Modulo-10-Prüfziffer");});

test("QR-Zahlteil des Honorars",()=>{D=base();
  const r=makeRef("2026-002");const f={id:"h1",pid:"p1",no:"2026-002",date:"2026-03-01",lines:[{t:"A",q:1,u:"p",p:1000}],vat:false,refType:r.type,ref:r.ref,term:45};D.fees=[f];
  let l=qrPayload(f).split("\n");eq(l[0],"SPC","Kopf");eq(l[18],"1000.00","Betrag");eq(l[19],"CHF","Währung");eq(l[27],"SCOR","Referenztyp");eq(l[30],"EPD","Trailer");
  yes(/\/40\/0:45$/.test(l[31]),"Zahlungsfrist 45 Tage im QR");
  D.firm.iban="CH4431999123000889012";l=qrPayload(f).split("\n");eq(l[27],"QRR","Referenz folgt neuer QR-IBAN");eq(l[28].length,27,"QR-Referenz 27 Stellen");});

test("QR-Rechnung lesen",()=>{
  const pl=["SPC","0200","1","CH4431999123000889012","S","Sanitär Huber & Co.","Bahnhofstrasse","12","8001","Zürich","CH","","","","","","","","25000.00","CHF","S","Bauherr","Seestr","12","8002","Zürich","CH","QRR","210000000003139471430009017","Rechnung 2026/0987, Akonto 2, Objekt: MFH Seestrasse 12","EPD","//S1/10/2026\\/0987/11/261116"].join("\r\n");
  const d=parseSPC(pl);eq(d.name,"Sanitär Huber & Co.","Firma");eq(d.street,"Bahnhofstrasse 12","Strasse");eq(d.zip,"8001","PLZ");eq(d.amount,25000,"Betrag");eq(d.cur,"CHF","Währung");
  eq(swicoNo(d.bill),"2026/0987","Rechnungsnummer aus Swico");eq(guessKind(d),{type:"akonto",n:2},"Akonto 2 erkannt");
  const e=parseSPC(pl.replace("\r\nCHF\r\n","\r\nEUR\r\n"));fxCheck(e);eq(e.amount,0,"EUR: CHF-Betrag muss eingegeben werden");eq(e.fx,{cur:"EUR",amount:25000},"Originalbetrag behalten");
  eq(parseSPC("hello"),null,"kein Swiss QR");});

test("Daten",()=>{eq(addDays("2026-03-28",2),"2026-03-30","über die Sommerzeit");eq(addDays("2026-12-31",1),"2027-01-01","Jahreswechsel");});

test("Gemeinsam freigeben: nur ohne Hinweise",()=>{
  D=base();D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:100000,ret:0}];
  D.invoices=[inv("c1","w1","akonto",30000,"pruefen",{ref:"RF18 5390 0754 7034",due:"2099-01-01"}),inv("c2","w1","akonto",120000,"pruefen",{n:2,ref:"RF45 5390 0754 7102",due:"2099-01-01"}),inv("c3","w1","regie",500,"pruefen",{ref:"RF71 1",due:"2099-01-01"})];
  yes(cleanInv(D.invoices[0]),"im Vertrag, vollständig: ohne Hinweis");
  yes(!cleanInv(D.invoices[1]),"über Werkvertrag: einzeln prüfen");
  yes(!cleanInv(D.invoices[2]),"Regie: einzeln prüfen");
  D.contractors[0].email="";yes(cleanInv(D.invoices[0]),"fehlende E-Mail blockiert nicht");
  D.contractors[0].iban="";yes(!cleanInv(D.invoices[0]),"fehlende IBAN blockiert");});
test("Mehrere Rechnungen erfassen",()=>{
  D=base();D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:100000,ret:0}];D.invoices=[inv("a1","w1","akonto",10000,"frei",{ref:"RF18 5390 0754 7034"})];
  const q=(ref,amt,cur)=>({name:"Bau AG",street:"Str 1",zip:"8000",city:"Zürich",iban:"CH9300762011623852957",amount:amt,cur:cur||"CHF",ref,msg:"Akonto 2",bill:"",no:"X"+amt});
  const M={batch:{items:[batchItem(q("RF02 1",5000)),batchItem(q("RF18 5390 0754 7034",10000)),batchItem(q("RF03 1",7000,"EUR")),batchItem(null),batchItem(q("RF02 1",5000))]}};
  finishBatch(M);
  eq(M.batch.items.map(i=>i.st),["ok","dup","fx","err","twice"],"neu, bereits erfasst, Fremdwährung, kein QR, zweimal");
  eq(M.batch.sel,[0],"nur die neue ist ausgewählt");
  const r=saveCapture(M.batch.items[0].d,{type:M.batch.items[0].type});eq(r.ni.n,2,"Akonto 2 aus dem Text");eq(r.ni.status,"pruefen","liegt in Zu prüfen");});
test("KV revidiert",()=>{
  D=base();D.projects[0].budget=[{bkp:"211",de:"Baumeister",en:"",kv:100000,kvr:120000},{bkp:"221",de:"Fenster",en:"",kv:50000}];
  D.contracts=[{id:"w1",pid:"p1",k:"k1",bkp:"211",sum:110000,ret:0}];D.invoices=[];
  const rs=budgetRows(),t=totals(rs);
  eq(rs[0].kv,120000,"revidierter KV zählt");eq(rs[0].rest,10000,"Reserve gegen revidierten KV");yes(rs[0].rev&&!rs[1].rev,"nur 211 revidiert");
  eq(t.kv,170000,"Total revidiert");eq(t.kv0,150000,"Total ursprünglich");yes(t.rev,"Projekt hat Revision");});
/* ---------- tenders ---------- */
const ad=n=>addDays(iso(TODAY),n);
const office=()=>({disc:["291"],refs:[{id:"r1",de:"Schulhaus",en:"",client:"Gemeinde",pub:true,type:"schule",year:2024,cost:6,phases:"31–53"}],
  team:[{id:"m1",name:"Anna",qual:"Architektin",extra:["qes"],career:[{role:"pl",firm:"X",from:2018,to:null}]},
        {id:"m2",name:"Beat",qual:"Bauleiter mit Fachausweis",extra:["blfa"],career:[{role:"bl",firm:"X",from:2015,to:null}]},
        {id:"m3",name:"Cora",qual:"Architektin",extra:[],career:[{role:"arch",firm:"X",from:2020,to:null}]}]});
const tender=(id,o)=>Object.assign({id,title:{de:"T "+id,en:""},client:"Gemeinde",proc:"offen",phases:"31–53",cost:5,qDue:ad(5),due:ad(20),status:"arbeit",
  reqs:[{k:"refs",n:1,since:2016,minCost:1,pub:true,types:null},{k:"team",tag:"bl"},{k:"disc",need:["291"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"}],done:{d3:true}},o||{});
test("Ausschreibung: Eignung mit zugewiesener Person",()=>{
  D=base();D.office=office();
  D.tenders=[tender("t1")];eq(fitOf(D.tenders[0]).fit,"ok","ohne Zuweisung zählt jemand Passendes im Team");
  yes(/noch nicht zugewiesen/.test(fitOf(D.tenders[0]).ev[1].res),"Hinweis: noch nicht zugewiesen");
  D.tenders[0].crew=[{role:"pl",m:"m1"},{role:"bl",m:"m3"}];eq(fitOf(D.tenders[0]).ev[1].s,"crit","zugewiesene Person ohne Fachausweis: rot");
  yes(/Passend wäre Beat/.test(fitOf(D.tenders[0]).ev[1].res),"nennt die passende Person");
  D.tenders[0].crew[1].m="m2";eq(fitOf(D.tenders[0]).fit,"ok","passende Person zugewiesen: erfüllt");});
test("Ausschreibung: Schlüsselpersonen",()=>{
  D=base();D.office=office();const t=tender("t1",{crew:[{role:"pl",m:"m1",pct:40},{role:"stv",m:null},{role:"bl",m:"m2"}]});D.tenders=[t];
  const d=()=>docsOf(t).find(x=>x.id==="d2");
  eq(d().done,false,"offen, solange eine Rolle frei ist");yes(/Stellvertretung/.test(d().sub),"nennt die offene Rolle");
  t.crew[1].m="m3";eq(d().done,true,"erledigt, wenn alle Rollen besetzt sind");yes(/Anna \(40 %\)/.test(d().sub),"Name mit Pensum");});
test("Ausschreibung: Auslastung",()=>{
  D=base();D.office=office();
  D.tenders=[tender("t1",{crew:[{role:"pl",m:"m1",pct:40}]}),tender("t2",{crew:[{role:"pl",m:"m1",pct:50}]}),tender("t3",{status:"eingereicht",crew:[{role:"pl",m:"m1",pct:30}]}),
    tender("t4",{status:"verloren",crew:[{role:"pl",m:"m1",pct:90}]}),tender("t5",{crew:[{role:"pl",m:"m1"}]})];
  const l=crewLoad(D.tenders[0],"m1");
  eq(l.tot,120,"40 + 50 + 30 (eingereicht zählt, verloren nicht)");eq(l.oth.length,3,"drei andere Verfahren binden die Person");eq(l.miss,1,"ein Pensum fehlt");});
test("Ausschreibung: Unterschrift (QES)",()=>{
  D=base();D.office=office();const t=tender("t1",{sig:"qes"});D.tenders=[t];
  D.firm.sigRule="einzel";eq(sigCheck(t).c,"ok","Einzelunterschrift, eine QES reicht");
  D.firm.sigRule="kollektiv2";eq(sigCheck(t).c,"warn","kollektiv zu zweien, nur eine QES");
  D.office.team.forEach(m=>m.extra=m.extra.filter(x=>x!=="qes"));eq(sigCheck(t).c,"crit","niemand hat eine QES");
  D.tenders.push(tender("t2",{sig:"qes",due:ad(3)}));
  const q=tenderTasks().filter(x=>/QES/.test(x.title));eq(q.length,1,"eine Aufgabe für alle Ausschreibungen");eq(q[0].t.id,"t2","nennt die nächste Frist");
  t.sig="scan";eq(sigCheck(t),null,"Scan verlangt: keine QES-Prüfung");});
test("Ausschreibung: Fristen und Aufgaben",()=>{
  D=base();D.office=office();
  D.tenders=[tender("t1",{due:ad(2)}),tender("t2",{due:ad(7)}),tender("t3",{due:ad(8)}),tender("t4",{status:"eingereicht",sub:ad(-1)})];
  const tk=tenderTasks(),f=id=>tk.filter(x=>x.t.id===id).map(x=>x.c+":"+x.title);
  yes(f("t1").some(x=>x.startsWith("crit:")),"in 2 Tagen: rot");yes(f("t2").some(x=>x.startsWith("warn:")),"in 7 Tagen: orange");eq(f("t3").filter(x=>/einreichen/.test(x)).length,0,"in 8 Tagen: noch keine Aufgabe");
  yes(f("t4").some(x=>/Offertöffnungsprotokoll/.test(x)),"nach der Eingabe: Protokoll verlangen");yes(f("t4").some(x=>/Dateien ablegen/.test(x)),"eingereichte Dateien ablegen");
  D.tenders[3].protAsked=iso(TODAY);yes(!tenderTasks().some(x=>x.t.id==="t4"&&/Offertöffnungsprotokoll/.test(x.title)),"verlangt: Aufgabe weg");});
test("Ausschreibung: Zuschlag und Beschwerdefrist",()=>{
  D=base();D.office=office();
  eq(appealEnd("2026-11-10"),"2026-11-30","20 Tage ab Verfügung");
  const lost=tender("t1",{status:"verloren",res:{at:ad(-5),own:110000,win:100000,low:95000}}),won=tender("t2",{status:"gewonnen",res:{at:ad(-30),own:80000,win:80000}});D.tenders=[lost,won];
  near(tRes(lost).dWin,10,"10 % über dem Zuschlagspreis");eq(tRes(won).dWin,null,"gewonnen: kein Abstand");
  eq(bidStats().won,1,"1 gewonnen");eq(bidStats().n,2,"von 2 entschieden");
  yes(tenderTasks().some(x=>x.t.id==="t1"&&/Beschwerdefrist/.test(x.title)),"verloren: Beschwerdefrist läuft");
  yes(!tenderTasks().some(x=>x.t.id==="t2"),"gewonnen vor 30 Tagen: Frist vorbei, keine Aufgabe");});
test("Ausschreibung: selektives Verfahren und Status",()=>{
  D=base();D.office=office();const t=tender("t1",{proc:"sel"});D.tenders=[t];
  eq(phaseOf(t),1,"Phase 1");t.pq={sel:true};eq(phaseOf(t),2,"ausgewählt: Phase 2");eq(phaseOf(tender("t2")),0,"offenes Verfahren: keine Phase");
  ["neu","arbeit"].forEach(s=>{t.status=s;eq(closedT(t),false,s+" ist offen");});
  ["eingereicht","pq","gewonnen","verloren","nichtausg","verzichtet"].forEach(s=>{t.status=s;eq(closedT(t),true,s+" ist abgeschlossen");});});
test("Büro-Unterlagen passend vorschlagen",()=>{
  D=base();D.docs=[{id:"f1",scope:"firm",ref:"firm",name:"Handelsregisterauszug.pdf"},{id:"f2",scope:"firm",ref:"firm",name:"Police Berufshaftpflicht.pdf"},{id:"f3",scope:"firm",ref:"firm",name:"AHV-Bestätigung.pdf"}];
  eq((firmMatch("Handelsregisterauszug")||{}).id,"f1","Handelsregister");eq((firmMatch("Nachweis Berufshaftpflichtversicherung")||{}).id,"f2","Haftpflicht");
  eq((firmMatch("Nachweis Steuern und Sozialabgaben")||{}).id,"f3","Sozialabgaben ↔ AHV");eq(firmMatch("Honorarofferte"),null,"Honorar: kein Vorschlag");});
test("Kennungen",()=>{D=base();const ids=new Set();for(let i=0;i<2000;i++)ids.add(newId("i"));eq(ids.size,2000,"2000 neue Kennungen, alle verschieden");yes(/^i_[0-9a-f]{32}$/.test(newId("i")),"Typ-Präfix und 32 Hex-Zeichen");});
D=keep;
window.__unit=results;
})();
