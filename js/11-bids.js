/* arkitecton · Tenders around the submission: checklist before submitting, the record of the submission,
   opening minutes, award result and appeal deadline, the firm folder for bid documents, and the selective procedure in two phases. */
"use strict";
const SUBF={simap:["online via simap.ch","online via simap.ch"],online:["online, ausserhalb von simap.ch","online, outside simap.ch"],post:["auf Papier (Post oder Abgabe)","on paper (post or hand-in)"]};
/* appeal period against an award or a selection decision: 20 days (Art. 56 BöB / IVöB); the notice in the decision is binding */
const APPEAL_DAYS=20;
const isSel=t=>t.proc==="sel";
const phaseOf=t=>isSel(t)?(t.pq&&t.pq.sel?2:1):0;
const waitT=t=>t.status==="eingereicht"||t.status==="pq";
const decidedT=t=>t.status==="gewonnen"||t.status==="verloren"||t.status==="nichtausg";
const appealEnd=d=>d?addDays(d,APPEAL_DAYS):null;
const bidName=t=>phaseOf(t)===1?L("Teilnahmeantrag","Request to participate"):L("Angebot","Bid");
const tFiles=(t,flag)=>DOCS().filter(d=>d.scope==="tender"&&d.ref===t.id&&d[flag]);
const pctTxt=v=>(v>0?"+":"")+String(v).replace(".",",")+" %";
function tRes(t){const r=t.res||{},pct=(a,b)=>a&&b?Math.round((a/b-1)*1000)/10:null;return Object.assign({},r,{dLow:pct(r.own,r.low),dWin:t.status==="verloren"?pct(r.own,r.win):null});}
/* over all decided tenders: how often the office wins, and how far its price was from the winning price when it lost */
function bidStats(){const dec=D.tenders.filter(t=>t.status==="gewonnen"||t.status==="verloren"),won=dec.filter(t=>t.status==="gewonnen").length;
  const gaps=dec.map(t=>tRes(t).dWin).filter(x=>x!=null),avg=gaps.length?Math.round(gaps.reduce((a,x)=>a+x,0)/gaps.length*10)/10:null;
  return {n:dec.length,won,avg,gaps:gaps.length};}
/* firm documents that fit a requested tender document, matched by the usual names */
const FIRMKEYS=[/handelsregister/i,/betreibung/i,/haftpflicht|versicherung/i,/ahv|sozial/i,/referenzliste/i,/porträt|portrait/i,/lebenslauf|curriculum/i];
function firmMatch(label){const fd=docsFor("firm","firm");for(const re of FIRMKEYS){if(re.test(label)){const m=fd.find(x=>re.test(x.name));if(m)return m;}}return null;}
function linkedDoc(t,id){const k=(t.link||{})[id];return k?DOCS().find(x=>x.id===k)||null:null;}

/* signatures: what the tender asks for, and whether the office can deliver it (ZertES; collective signing needs two) */
const SIGREQ={qes:["Qualifizierte elektronische Signatur (QES)","Qualified electronic signature (QES)"],scan:["Scan, von Hand unterschrieben","Scan of a handwritten signature"],papier:["Von Hand auf Papier","Handwritten on paper"]};
const SECO_CSP="https://www.seco.admin.ch/de/csp-elektronische-signatur";
const qesPeople=()=>(((D.office||{}).team)||[]).filter(m=>(m.extra||[]).includes("qes"));
const sigNeed=()=>(D.firm||{}).sigRule==="kollektiv2"?2:1;
function sigCheck(t){if(t.sig!=="qes")return null;const q=qesPeople(),need=sigNeed(),nm=q.map(m=>m.name).join(L(" und "," and "));
  if(q.length>=need)return {c:"ok",t:L("Unterschreiben können ","Can sign: ")+nm+(need===2?L(" (kollektiv zu zweien)"," (two signatures)"):"")+"."};
  if(!q.length)return {c:"crit",t:L("Niemand im Büro hat eine QES. Die Identifikation beim Anbieter braucht einige Tage Vorlauf.","Nobody in the office has a QES. Getting one takes a few days.")};
  return {c:"warn",t:L("Ihr Büro zeichnet kollektiv zu zweien, aber nur "+nm+" hat eine QES. Es braucht eine zweite Person mit QES.","Your office signs jointly by two, but only "+nm+" has a QES. A second person is needed.")};}
function sigBlock(t,c){
  const head=`<div class="sigrow"><span class="sl2">${L("Verlangte Unterschrift","Required signature")}</span><span>${t.sig?esc(L(...SIGREQ[t.sig])):`<span class="muted">${L("noch nicht erfasst, steht in den Unterlagen im Kapitel «Einreichung»","not entered yet, see the chapter on submission")}</span>`}</span></div>`;
  const k=!c&&sigCheck(t);if(!k)return head;
  return head+`<div class="notice"><span class="ic ${k.c}" aria-hidden="true">${k.c==="ok"?"✓":"!"}</span><span>${k.t}${k.c==="ok"?"":` ${L("Wer eine hat, im Büroprofil bei der Person «QES» ankreuzen.","Tick «QES» at the person in the office profile.")} <a class="srclink" href="${SECO_CSP}" target="_blank" rel="noopener">${L("Anerkannte Anbieter","Recognised providers")} ↗</a>`}</span></div>`;}

/* tasks of the office around tenders, shown on the start page */
function tenderTasks(){
  const out=[],gaps=[],add=(t,c,title,label,o={})=>out.push(Object.assign({t,c,title,label},o));
  D.tenders.forEach(t=>{
    const dd=daysTo(t.due),qd=t.qDue?daysTo(t.qDue):-1;
    if((t.status==="neu"||t.status==="arbeit")&&fitOf(t).fit!=="no"){
      if(dd>=0&&dd<=7)add(t,dd<=2?"crit":"warn",bidName(t)+L(" einreichen"," to submit"),dd===0?L("heute","today"):L("in "+dd+" "+dayWord(dd),"in "+dd+" "+(dd===1?"day":"days")));
      if(t.status==="arbeit"&&qd>=0&&qd<=3)add(t,"warn",L("Fragen stellen","Ask questions"),L("bis ","until ")+fdate(t.qDue));
      const k=sigCheck(t);if(k&&k.c!=="ok"&&dd>=0)gaps.push([t,k]);}
    if(waitT(t)&&!tFiles(t,"submitted").length)add(t,"warn",L("Eingereichte Dateien ablegen","File the submitted documents"),L("simap löscht sie","simap deletes them"));
    if(t.status==="eingereicht"&&!tFiles(t,"prot").length&&!t.protAsked)add(t,"n",L("Offertöffnungsprotokoll verlangen","Request the opening minutes"),L("Preise der anderen","prices of the others"));
    const r=t.res||{},ae=appealEnd(t.status==="nichtausg"?(t.pq||{}).at:r.at);
    if((t.status==="verloren"||t.status==="nichtausg")&&ae&&daysTo(ae)>=0)add(t,"warn",L("Beschwerdefrist läuft","Appeal period running"),L("bis ","until ")+fdate(ae));
    if(t.status==="gewonnen"&&ae&&daysTo(ae)>=0)add(t,"n",L("Zuschlag wird verbindlich, noch keine Arbeit beginnen","Award becomes binding, do not start work yet"),L("am ","on ")+fdate(addDays(ae,1)));
  });
  /* a missing QES is one task for the office, not one per tender */
  if(gaps.length){gaps.sort((a,b)=>toDate(a[0].due)-toDate(b[0].due));const [t,k]=gaps[0],n=gaps.length;
    add(t,k.c,k.c==="crit"?L("QES fehlt im Büro","No QES in the office"):L("Zweite QES fehlt","Second QES missing"),L("bis ","by ")+fdate(t.due),{meta:n===1?tx(t.title):L(n+" Ausschreibungen verlangen eine QES",n+" tenders require a QES")});}
  return out.sort((a,b)=>({crit:0,warn:1,n:2}[a.c]-{crit:0,warn:1,n:2}[b.c]));
}
function tenderTaskRows(){return tenderTasks().map(x=>row({act:"open-t",id:x.t.id,c:x.c,title:esc(x.title),meta:esc(x.meta||tx(x.t.title)),amt:"",label:x.label,lc:x.c})).join("");}

/* the steps after the submission: what was submitted, the opening minutes, the decision, the appeal deadline, and the comparison */
function tenderAfter(t){
  if(!waitT(t)&&!decidedT(t))return "";
  const p1=t.status==="pq"||t.status==="nichtausg",sub=p1?(t.pq||{}):{sub:t.sub,subAt:t.subAt,form:t.subForm};
  const files=tFiles(t,"submitted").filter(d=>p1?d.phase===1:d.phase!==1),prot=tFiles(t,"prot"),r=tRes(t);
  const fileRow=d=>`<div class="drow"><button type="button" class="dopen" data-act="doc-open" data-id="${d.id}"><span class="dk">${esc(kindOf(d.name))}</span><span class="dn">${esc(d.name)}</span><span class="dm">${fsize(d.size||0)} · ${fdate(d.date)}</span></button>${S.confirm==="ddel:"+d.id?`<button type="button" class="ghost danger" data-act="doc-del" data-id="${d.id}">${L("Löschen?","Delete?")}</button>`:ib("trash",L("Dokument löschen","Delete document"),`data-act="ask" data-c="ddel:${d.id}"`)}</div>`;
  const up=(key,tip)=>`<label class="ib" data-tip="${tip}" aria-label="${tip}">${ico("plus")}<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png" data-imp="doc" data-id="${key}|${t.id}"></label>`;
  const step=(c,title,body,right)=>`<li class="astep"><span class="ic ${c}" aria-hidden="true">${{ok:"✓",warn:"!",crit:"✕",n:"·"}[c]}</span><div class="ab"><div class="at"><span>${title}</span>${right?`<span class="ar">${right}</span>`:""}</div>${body}</div></li>`;
  const steps=[];
  /* 1 what was submitted, kept here because simap deletes submissions 365 days after the deadline */
  steps.push(step(files.length?"ok":"warn",(p1?L("Teilnahmeantrag eingereicht","Request submitted"):L("Angebot eingereicht","Bid submitted"))+(sub.sub?` <span class="res">${L("am ","on ")+fdate(sub.sub)+(sub.subAt?", "+esc(sub.subAt)+L(" Uhr",""):"")+(sub.form&&SUBF[sub.form]?" · "+L(...SUBF[sub.form]):"")}</span>`:""),
    (files.length?`<div class="dlist">${files.map(fileRow).join("")}</div>`:"")+`<p class="res">${files.length?L("Eingereichte Dateien und Eingangsbestätigung sind hier gesichert.","Submitted files and receipt are kept here."):L("Eingereichte Dateien und Eingangsbestätigung hier ablegen: simap löscht sie 365 Tage nach der Frist.","File the submitted documents and the receipt here: simap deletes them 365 days after the deadline.")}</p>`,
    up(p1?"tsub1":"tsub",L("Eingereichte Dateien ablegen","File submitted documents"))));
  /* 2 opening minutes: every bidder may see them, at the latest after the award (Art. 37 BöB / IVöB) */
  if(!p1){const law=t.proc==="einl"?L("Im Einladungsverfahren ist die Einsicht nicht geregelt. Fragen lohnt sich trotzdem.","Not regulated in the invitation procedure, but worth asking."):L("Sie haben Anspruch auf Einsicht, spätestens nach dem Zuschlag (Art. 37 BöB / IVöB). Es zeigt die Preise aller Angebote.","You may see it at the latest after the award (Art. 37). It shows the prices of all bids.");
    steps.push(step(prot.length?"ok":t.protAsked?"n":"warn",L("Offertöffnungsprotokoll","Opening minutes")+(t.protAsked&&!prot.length?` <span class="res">${L("verlangt am ","requested on ")+fdate(t.protAsked)}</span>`:""),
      (prot.length?`<div class="dlist">${prot.map(fileRow).join("")}</div>`:`<p class="res">${law}</p>`)+(prot.length?"":`<button type="button" class="btn sm" data-act="t-protmail" data-id="${t.id}">${L("E-Mail an die Vergabestelle","E-mail to the contracting authority")}</button>`),
      up("tprot",L("Protokoll ablegen","File the minutes"))));}
  /* 3 the decision */
  if(p1){const pq=t.pq||{};
    steps.push(t.status==="nichtausg"?step("n",L("Nicht ausgewählt","Not selected")+(pq.at?` <span class="res">${L("Mitteilung vom ","Notice of ")+fdate(pq.at)}</span>`:""),appealLine(t,pq.at,false),"")
      :step("n",L("Auswahl der Teilnehmer","Selection of participants"),`<p class="res">${L("Die Vergabestelle teilt die Auswahl meist per Verfügung mit, nicht öffentlich.","Usually notified individually, not published.")+(pq.max?" "+L("Eingeladen werden höchstens "+pq.max+" Büros.","At most "+pq.max+" firms are invited."):"")}</p>`,""));}
  else if(t.status==="eingereicht")steps.push(step("n",L("Zuschlag","Award"),`<p class="res">${L("Die Zuschlagsverfügung kommt per E-Mail oder Post, am Publikationsdatum auch auf simap.ch.","The award notice comes by e-mail or post, and on simap.ch on the publication date.")}</p>`,""));
  else{const won=t.status==="gewonnen";
    steps.push(step(won?"ok":"n",(won?L("Zuschlag erhalten","Contract awarded"):L("Kein Zuschlag","Not awarded"))+(r.at?` <span class="res">${L("Verfügung vom ","Decision of ")+fdate(r.at)}${!won&&r.winner?" · "+L("Zuschlag an ","awarded to ")+esc(r.winner):""}</span>`:""),
      appealLine(t,r.at,won),ib("edit",L("Ergebnis bearbeiten","Edit result"),`data-act="t-res" data-id="${t.id}" data-w="edit"`)));
    steps.push(step("n",L("Vergleich","Comparison"),resultTable(t),""));}
  return `<section class="after docs"><div class="sh"><h2>${L("Nach der Eingabe","After submitting")}</h2></div><ul class="checks asteps">${steps.join("")}</ul></section>`;
}
function appealLine(t,at,won){const ae=appealEnd(at);if(!ae)return "";const n=daysTo(ae);
  if(won)return `<p class="res">${n>=0?L("Zuschlag wird verbindlich am ","Award becomes binding on ")+fdate(addDays(ae,1))+L(", wenn keine Beschwerde eingeht (Frist bis ",", if no appeal is filed (period until ")+fdate(ae)+L("). Bis dahin noch keine Arbeit beginnen.","). Do not start work before."):L("Zuschlag verbindlich seit ","Award binding since ")+fdate(addDays(ae,1))+L(", sofern keine Beschwerde eingegangen ist.",", unless an appeal was filed.")} ${L("Massgebend ist die Rechtsmittelbelehrung in der Verfügung.","The notice in the decision is binding.")}</p>`;
  return `<p class="res">${L("Beschwerdefrist bis ","Appeal period until ")+fdate(ae)}${n>=0?" ("+(n===0?L("heute","today"):L("noch "+n+" "+dayWord(n),n+" days left"))+")":" ("+L("abgelaufen","over")+")"}. ${L("Massgebend ist die Rechtsmittelbelehrung in der Verfügung.","The notice in the decision is binding.")}</p>`;}
function resultTable(t){const r=tRes(t),f=v=>v?chf(v,false):"–";
  if(!r.own&&!r.win&&!r.low&&!r.n)return `<p class="res">${L("Zahlen aus dem Offertöffnungsprotokoll und der Zuschlagspublikation erfassen. So sehen Sie mit der Zeit, wo Ihr Büro preislich liegt.","Enter the figures from the minutes and the award notice.")}</p><button type="button" class="btn sm" data-act="t-res" data-id="${t.id}" data-w="edit">${L("Zahlen erfassen","Enter figures")}</button>`;
  const rows=[[L("Ihr Preis","Your price"),f(r.own)],[L("Tiefster Preis","Lowest price"),f(r.low)+(r.dLow!=null&&r.dLow!==0?` <span class="l-${r.dLow>0?"warn":"ok"}">${L("Sie ","you ")+pctTxt(r.dLow)}</span>`:"")]]
    .concat(t.status==="verloren"?[[L("Zuschlagspreis","Winning price"),f(r.win)+(r.dWin!=null?` <span class="l-${r.dWin>0?"warn":"ok"}">${L("Sie ","you ")+pctTxt(r.dWin)}</span>`:"")]]:[])
    .concat([[L("Angebote","Bids"),r.n?String(r.n)+(r.rank?L(" · Ihr Rang beim Preis: "," · your price rank: ")+r.rank:""):"–"]]);
  return `<div class="rtab">${rows.map(([a,b])=>`<span>${a}</span><span>${b}</span>`).join("")}</div>`;}

/* the award (or, in phase 1, the selection) at a glance: pending opens the entry, decided leads to the details */
function resultTile(t){
  if(!waitT(t)&&!decidedT(t))return "";
  const p1=t.status==="pq"||t.status==="nichtausg",r=t.res||{},pending=waitT(t);
  const at=p1?(t.pq||{}).at:r.at,ae=appealEnd(at),open=ae&&daysTo(ae)>=0;
  const sl=p1?L("Auswahl","Selection"):L("Zuschlag","Award");
  let sv,c="",ss;
  if(pending){sv=L("ausstehend","pending");ss=(p1?L("Mitteilung meist per Verfügung","Usually notified by decision"):L("Entscheid kommt per E-Mail oder Post","Decision comes by e-mail or post"))+L(" · erfassen"," · record");}
  else if(t.status==="gewonnen"){sv=L("Erhalten","Awarded");c=" ok";ss=(at?L("Verfügung vom ","Decision of ")+fdate(at):"")+(open?L(" · verbindlich ab "," · binding from ")+fdate(addDays(ae,1)):"");}
  else{sv=p1?L("Nein","No"):L("Nicht erhalten","Not awarded");ss=[!p1&&r.winner?L("an ","to ")+esc(r.winner):"",open?L("Beschwerde bis ","appeal until ")+fdate(ae):at?L("Verfügung vom ","decision of ")+fdate(at):""].filter(Boolean).join(" · ");}
  return `<button type="button" class="stat" data-act="${pending?"form":"t-after"}" data-f="tres" data-id="${t.id}" data-w="pick"><span class="sl">${sl}</span><span class="sv${c}">${sv}</span><span class="ss">${ss}</span></button>`;
}
/* forms: record the submission (with the checklist), the decision, and pick a firm document */
function bidFormDef(F){
  const t=D.tenders.find(x=>x.id===F.id);if(!t)return null;
  const opt=(o,cur)=>Object.keys(o).map(k=>`<option value="${k}"${cur===k?" selected":""}>${esc(L(...o[k]))}</option>`).join("");
  if(F.f==="tsub"){const nm=bidName(t),now=new Date(),hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"),p1=phaseOf(t)===1;
    return {title:nm+L(" eingereicht"," submitted"),save:L("Als eingereicht speichern","Save as submitted"),body:
      `<div class="f wide"><div class="notice"><span class="ic warn" aria-hidden="true">!</span><span>${L("Auf simap.ch ist "+(p1?"der Teilnahmeantrag":"das Angebot")+" mit «Einreichen» verbindlich. Danach sind keine Änderungen mehr möglich. arkitecton hält fest, was und wann Sie eingereicht haben.","On simap.ch, submitting is binding: no changes afterwards. arkitecton records what and when you submitted.")}</span></div></div>`
      +`<div class="f wide"><label for="fSubF">${L("Form der Einreichung","Form of submission")}</label><select id="fSubF">${opt(SUBF,(p1?(t.pq||{}).form:t.subForm)||"simap")}</select><span class="hint">${L("Welche Form zugelassen ist, steht in den Unterlagen im Kapitel «Einreichung».","The tender documents say which form is allowed.")}</span></div>`
      +fld("fSubD",L("Eingereicht am","Submitted on"),iso(TODAY),{type:"date",req:true})+fld("fSubT",L("Uhrzeit","Time"),hm,{type:"time"})
      +(p1?"":fld("fSubP",L("Ihr Preis in CHF (Honorar inkl. MWST)","Your price in CHF (fee incl. VAT)"),(t.res||{}).own||"",{wide:true,mode:"decimal",hint:L("Für den Vergleich nach dem Zuschlag.","For the comparison after the award.")}))
      +`<div class="f wide"><span class="l">${L("Vor dem Einreichen prüfen","Check before submitting")}</span>
        <label class="chk"><input type="checkbox" id="fC1"> ${L("Die gewählte Form ist laut Unterlagen zugelassen","The chosen form is allowed by the documents")}</label>
        <label class="chk"><input type="checkbox" id="fC2"> ${(t.sig==="qes"?L("Jede zu unterschreibende Datei mit QES signiert und geprüft","Each file to be signed has a checked QES"):t.sig==="scan"?L("Unterschriebene Seiten von Hand unterschrieben und eingescannt","Signed pages signed by hand and scanned"):t.sig==="papier"?L("Von Hand unterschrieben","Signed by hand"):L("Unterschriften gültig: online jede zu unterschreibende Datei mit qualifizierter elektronischer Signatur (QES), auf Papier von Hand","Signatures valid: online each file to be signed with a QES, on paper by hand"))+(sigNeed()===2?L(", von zwei zeichnungsberechtigten Personen (kollektiv zu zweien)",", by two authorised persons"):"")}</label>
        ${t.sig==="scan"||t.sig==="papier"?"":`<a class="srclink" href="https://www.validator.admin.ch" target="_blank" rel="noopener">${L("Signatur prüfen auf validator.admin.ch","Check a signature on validator.admin.ch")} ↗</a>`}</div>`
      +(()=>{const k=sigCheck(t);return k&&k.c!=="ok"?`<div class="f wide"><div class="notice"><span class="ic ${k.c}" aria-hidden="true">!</span><span>${k.t}</span></div></div>`:"";})()};}
  if(F.f==="tres"){const w=F.w||"edit";
    if(w==="pick"){const p1=t.status==="pq",b=(x,lab,pr)=>`<button type="button" class="btn${pr?" primary":""}" data-act="t-res" data-id="${t.id}" data-w="${x}">${lab}</button>`;
      return {title:p1?L("Auswahl erfassen","Record selection"):L("Zuschlag erfassen","Record the award"),noSubmit:true,body:`<div class="f wide"><p class="hint">${p1?L("Was steht in der Mitteilung der Vergabestelle?","What does the notice say?"):L("Was steht in der Verfügung der Vergabestelle?","What does the decision say?")}</p><div class="pickres">${p1?b("nsel",L("Nicht ausgewählt","Not selected"))+b("sel",L("Ausgewählt","Selected"),true):b("lost",L("Kein Zuschlag","Not awarded"))+b("won",L("Zuschlag erhalten","Contract awarded"),true)}</div></div>`};}
    if(w==="sel")return {title:L("Ausgewählt für Phase 2","Selected for phase 2"),save:L("Phase 2 starten","Start phase 2"),body:
      `<div class="f wide"><p class="hint">${L("Mit der Einladung erhalten Sie die Aufforderung zur Angebotsabgabe mit neuen Fristen und den Zuschlagskriterien.","The invitation brings new deadlines and the award criteria.")}</p></div>`
      +fld("fRAt",L("Mitteilung vom","Notice of"),iso(TODAY),{type:"date"})+fld("fRDue",L("Eingabefrist Angebot","Bid deadline"),"",{type:"date",req:true})+fld("fRQ",L("Fragefrist","Question deadline"),"",{type:"date"})};
    if(w==="nsel")return {title:L("Nicht ausgewählt","Not selected"),body:fld("fRAt",L("Mitteilung (Verfügung) vom","Notice (decision) of"),iso(TODAY),{type:"date",req:true,hint:L("Ab diesem Datum läuft die Beschwerdefrist von 20 Tagen.","The 20-day appeal period runs from this date.")})};
    const r=t.res||{},won=w==="won"||(w==="edit"&&t.status==="gewonnen");
    return {title:w==="won"?L("Zuschlag erhalten","Contract awarded"):w==="lost"?L("Kein Zuschlag","Not awarded"):L("Ergebnis","Result"),body:
      fld("fRAt",L("Zuschlagsverfügung vom","Award decision of"),r.at||iso(TODAY),{type:"date",req:true,hint:L("Ab diesem Datum läuft die Beschwerdefrist von 20 Tagen.","The 20-day appeal period runs from this date.")})
      +(won?"":fld("fRWin",L("Zuschlag an (Büro)","Awarded to (firm)"),r.winner||"",{wide:true}))
      +fld("fROwn",L("Ihr Preis CHF","Your price CHF"),r.own||"",{mode:"decimal"})+(won?"":fld("fRWinP",L("Zuschlagspreis CHF","Winning price CHF"),r.win||"",{mode:"decimal"}))
      +fld("fRLow",L("Tiefster Preis CHF","Lowest price CHF"),r.low||"",{mode:"decimal"})+fld("fRN",L("Anzahl Angebote","Number of bids"),r.n||"",{mode:"numeric"})
      +fld("fRRank",L("Ihr Rang beim Preis","Your price rank"),r.rank||"",{mode:"numeric",hint:L("1 = tiefster Preis. Steht im Offertöffnungsprotokoll.","1 = lowest. See the opening minutes.")})};}
  if(F.f==="tlink"){const fd=docsFor("firm","firm"),cur=(t.link||{})[F.w];
    return {title:L("Aus Büro-Unterlagen","From firm documents"),save:L("Übernehmen","Use"),body:fd.length?`<div class="f wide"><span class="l">${L("Welches Dokument gehört zu dieser Unterlage?","Which document fits?")}</span>${fd.map(d=>{const v=docValid(d);return `<label class="chk"><input type="radio" name="fLk" value="${d.id}"${cur===d.id?" checked":""}> ${esc(d.name)}${v?` <span class="l-${v.c}">· ${v.t}</span>`:""}</label>`;}).join("")}</div>`
      :`<div class="f wide"><p class="hint">${L("Noch keine Büro-Unterlagen. Auf der Startseite unter «Unterlagen des Büros» ablegen.","No firm documents yet. Add them on the start page.")}</p></div>`};}
  return null;
}
function bidSubmit(F,fail){
  const t=D.tenders.find(x=>x.id===F.id);if(!t||!["tsub","tres","tlink"].includes(F.f))return false;
  const ck=id=>!!(document.getElementById(id)||{}).checked,n=id=>num(val(id));
  if(F.f==="tsub"){if(!ck("fC1")||!ck("fC2")){fail(L("Bitte beide Punkte prüfen und abhaken.","Please check and tick both points."));return true;}
    if(!val("fSubD")){fail(L("Datum fehlt.","Date missing."),"fSubD");return true;}
    snap();const d=val("fSubD"),tm=val("fSubT"),fm=val("fSubF");
    if(phaseOf(t)===1){t.pq=Object.assign(t.pq||{},{sub:d,subAt:tm,form:fm});t.status="pq";}
    else{t.sub=d;t.subAt=tm;t.subForm=fm;const p=n("fSubP");t.res=Object.assign(t.res||{},p?{own:p}:{});t.status="eingereicht";}
    closeAll();render();toast(t.status==="pq"?L("Teilnahmeantrag als eingereicht gespeichert","Request saved as submitted"):L("Angebot als eingereicht gespeichert","Bid saved as submitted"),0,false,true);return true;}
  if(F.f==="tres"){const w=F.w||"edit";
    if(!val("fRAt")){fail(L("Datum fehlt.","Date missing."),"fRAt");return true;}
    if(w==="sel"){if(!val("fRDue")){fail(L("Eingabefrist fehlt.","Deadline missing."),"fRDue");return true;}
      snap();t.pq=Object.assign(t.pq||{},{sel:true,at:val("fRAt"),due:t.due,qDue:t.qDue});t.due=val("fRDue");t.qDue=val("fRQ")||null;t.status="arbeit";
      closeAll();render();toast(L("Phase 2: Angebot ausarbeiten","Phase 2: prepare the bid"),0,false,true);return true;}
    if(w==="nsel"){snap();t.pq=Object.assign(t.pq||{},{sel:false,at:val("fRAt")});t.status="nichtausg";closeAll();render();toast(L("Gespeichert","Saved"),0,false,true);return true;}
    snap();const won=w==="won"||(w==="edit"&&t.status==="gewonnen"),own=n("fROwn");
    t.res=Object.assign(t.res||{},{at:val("fRAt"),own:own||null,low:n("fRLow")||null,n:n("fRN")||null,rank:n("fRRank")||null,winner:won?((D.firm||{}).name||""):val("fRWin"),win:won?own||null:n("fRWinP")||null});
    if(w!=="edit")t.status=won?"gewonnen":"verloren";
    closeAll();render();toast(w==="edit"?L("Gespeichert","Saved"):tx(TST[t.status]),0,false,true);return true;}
  if(F.f==="tlink"){const r=document.querySelector('input[name="fLk"]:checked');if(!r){fail(L("Bitte ein Dokument wählen.","Please pick a document."));return true;}
    t.link=t.link||{};t.link[F.w]=r.value;closeAll();render();toast(L("Übernommen","Linked"));return true;}
  return false;
}
/* mail to the contracting authority asking for the opening minutes */
function protMail(t){const F=D.firm||{},s=L("Einsicht Offertöffnungsprotokoll: ","Opening minutes: ")+tx(t.title);
  const b=L("Guten Tag\n\nWir haben für das Verfahren «"+tx(t.title)+"» am "+fdate(t.sub||iso(TODAY))+" ein Angebot eingereicht. Gestützt auf Art. 37 BöB / IVöB bitten wir um Einsicht in das Offertöffnungsprotokoll, gerne als PDF per E-Mail.\n\nBesten Dank und freundliche Grüsse\n"+(F.name||""),
    "Hello\n\nWe submitted a bid for «"+tx(t.title)+"». Under Art. 37 we kindly ask for the opening minutes, as a PDF by e-mail.\n\nKind regards\n"+(F.name||""));
  return "mailto:"+(t.mail||"")+"?subject="+encodeURIComponent(s)+"&body="+encodeURIComponent(b);}

/* example data: a bid waiting for the decision, one lost with figures, one won, a selective procedure in phase 2, and bid documents from the firm folder */
async function seedBids(){
  const ad=n=>addDays(iso(TODAY),n),T=D.tenders,F=(D.firm||{}).name||"Beispiel Architekten GmbH";
  const pdf=async(ref,name,lines,date,flag)=>{const b=samplePdf(lines.concat(["","Beispieldokument, fiktive Daten."]));const id=newId("f");await FDB.put(id,b);DOCS().push(Object.assign({id,scope:"tender",ref,name,type:"application/pdf",size:b.size,date},flag));};
  const base={phases:"31–53",reqs:[{k:"refs",n:1,since:2016,minCost:1,pub:true,types:null},{k:"team",tag:"pl"},{k:"disc",need:["291"]}],docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"}],done:{d3:true},src:{url:"https://www.simap.ch",id:L("Beispiel","Example")}};
  if(!T.some(t=>t.id==="t7")){T.push(Object.assign({},base,{id:"t7",title:{de:"Erweiterung Feuerwehrgebäude",en:"Fire station extension"},client:"Gemeinde Thalwil",proc:"offen",cost:2.6,sig:"qes",qDue:ad(-92),due:ad(-70),sub:ad(-71),subAt:"16:10",subForm:"simap",status:"verloren",
      res:{at:ad(-12),winner:"Atelier Brändli Architekten AG",win:286400,own:311900,low:279800,n:7,rank:3},zk:[{typ:"preis",t:L(...ZKT.preis),w:40,me:"m"},{typ:"analyse",t:L(...ZKT.analyse),w:35,me:"m"},{typ:"ref",t:L(...ZKT.ref),w:25,me:"s"}]}));
    await pdf("t7","Angebot Feuerwehrgebäude komplett.pdf",["Angebot","Erweiterung Feuerwehrgebaeude",F,"Honorar CHF 311'900 inkl. MWST"],ad(-71),{submitted:true});
    await pdf("t7","Eingangsbestätigung simap.pdf",["Eingangsbestaetigung","Eingegangen "+fdate(ad(-71))+", 16:10 Uhr"],ad(-71),{submitted:true});
    await pdf("t7","Offertöffnungsprotokoll.pdf",["Offertoeffnungsprotokoll","Erweiterung Feuerwehrgebaeude, Gemeinde Thalwil","7 Angebote, Gesamtpreise inkl. MWST:","1. CHF 279'800  2. CHF 286'400  3. CHF 311'900 ("+F+")","4. CHF 318'000  5. CHF 325'700  6. CHF 341'200  7. CHF 362'900"],ad(-60),{prot:true});}
  if(!T.some(t=>t.id==="t8")){T.push(Object.assign({},base,{id:"t8",title:{de:"Sanierung Werkhof",en:"Depot refurbishment"},client:"Gemeinde Horgen",proc:"einl",cost:1.4,sig:"papier",qDue:ad(-150),due:ad(-130),sub:ad(-131),subAt:"11:45",subForm:"post",status:"gewonnen",
      res:{at:ad(-95),winner:F,win:184300,own:184300,low:176900,n:5,rank:2}}));
    await pdf("t8","Angebot Werkhof (Scan).pdf",["Angebot","Sanierung Werkhof",F],ad(-131),{submitted:true});}
  if(!T.some(t=>t.id==="t6")){T.push(Object.assign({},base,{id:"t6",title:{de:"Neubau Alterszentrum",en:"New retirement centre"},client:"Stadt Adliswil",proc:"sel",cost:18.5,qDue:ad(2),due:ad(6),status:"arbeit",sig:"qes",
      pq:{sub:ad(-40),subAt:"10:05",form:"simap",sel:true,at:ad(-9),due:ad(-38),qDue:ad(-50),max:5},
      reqs:[{k:"refs",n:2,since:2014,minCost:2.5,pub:true,types:null},{k:"team",tag:"pl"},{k:"disc",need:["291"]}],
      docs:[{id:"d1",auto:"refs"},{id:"d2",auto:"team"},{id:"d3",auto:"self"},{id:"d8",de:"Handelsregisterauszug",en:"Commercial register extract"},{id:"d11",de:"Nachweis Berufshaftpflichtversicherung",en:"Professional liability insurance"},{id:"d6",de:"Honorarofferte (Honorarparameter SIA 102)",en:"Fee offer (SIA 102 parameters)"}],done:{d3:true},
      gek:[{typ:"ref",t:L(...ZKT.ref),w:50,me:"s"},{typ:"team",t:L(...ZKT.team),w:30,me:"s"},{typ:"analyse",t:L("Auftragsverständnis (1 A4)","Understanding of the task (1 A4)"),w:20,me:"m"}],
      zk:[{typ:"preis",t:L(...ZKT.preis),w:30,me:"m"},{typ:"analyse",t:L(...ZKT.analyse),w:40,me:""},{typ:"team",t:L(...ZKT.team),w:30,me:"s"}]}));
    await pdf("t6","Teilnahmeantrag Alterszentrum.pdf",["Teilnahmeantrag","Neubau Alterszentrum",F],ad(-40),{submitted:true,phase:1});}
  /* t2 is a selective procedure still in phase 1: weighted qualification criteria and documents from the firm folder */
  const t2=T.find(t=>t.id==="t2");if(t2){t2.pq=t2.pq||{max:5};if(!t2.gek)t2.gek=[{typ:"ref",t:L(...ZKT.ref),w:50,me:"s"},{typ:"team",t:L(...ZKT.team),w:30,me:"m"},{typ:"analyse",t:L("Auftragsverständnis (1 A4)","Understanding of the task (1 A4)"),w:20,me:""}];
    [["d8","Handelsregisterauszug","Commercial register extract"],["d11","Nachweis Berufshaftpflichtversicherung","Professional liability insurance"],["d10","Betreibungsregisterauszug (max. 3 Monate alt)","Debt enforcement extract (max. 3 months)"]].forEach(([id,de,en])=>{if(!t2.docs.some(d=>d.id===id))t2.docs.push({id,de,en});});}
  /* t5 waits for the award: its files were the submission */
  const t5=T.find(t=>t.id==="t5");if(t5){t5.subAt=t5.subAt||"14:32";t5.subForm=t5.subForm||"simap";t5.res=t5.res||{own:399437.22};DOCS().forEach(d=>{if(d.scope==="tender"&&d.ref==="t5"&&!d.dossier)d.submitted=true;});}
  if(!docsFor("firm","firm").some(d=>/betreibung/i.test(d.name))){const b=samplePdf(["Betreibungsregisterauszug",F,"Keine Betreibungen","","Beispieldokument, fiktive Daten."]);const id=newId("f");await FDB.put(id,b);
    DOCS().push({id,scope:"firm",ref:"firm",name:"Betreibungsregisterauszug.pdf",type:"application/pdf",size:b.size,date:ad(-80),until:ad(10)});}
  saveData();
}
