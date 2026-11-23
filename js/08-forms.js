/* arkitecton · Forms, sheets, Excel import and export, backup. */
"use strict";

/* ---------- forms ---------- */
const fld=(id,label,val,o={})=>`<div class="f${o.wide?" wide":""}"><label for="${id}">${label}</label><input id="${id}" name="${id}" value="${esc(val==null?"":val)}"${o.type?` type="${o.type}"`:""}${o.mode?` inputmode="${o.mode}" autocomplete="off"`:""}${o.req?" required":""}${o.ph?` placeholder="${esc(o.ph)}"`:""}>${o.hint?`<span class="hint">${o.hint}</span>`:""}</div>`;
function formDef(){
  if(S.form&&S.form.f==="fee") return feeFormDef(S.form);
  const F=S.form, p=P();
  {const bd=bidFormDef(F);if(bd)return bd;}
  if(F.f==="tsrc"){const t=D.tenders.find(x=>x.id===F.id)||{},sr=t.src||{};return {title:L("Publikation","Publication"),body:
      fld("fSUrl",L("Link zur Publikation auf simap.ch","Link to the publication on simap.ch"),sr.url||"",{wide:true,ph:"https://www.simap.ch/…"})
      +fld("fSId",L("Projekt-ID auf simap.ch","Project ID on simap.ch"),sr.id||"",{wide:true,ph:L("steht in der Publikation","shown in the publication")})
      +`<div class="f wide"><label for="fSSig">${L("Verlangte Unterschrift","Required signature")}</label><select id="fSSig"><option value="">${L("noch offen","not known yet")}</option>${Object.keys(SIGREQ).map(k=>`<option value="${k}"${t.sig===k?" selected":""}>${esc(L(...SIGREQ[k]))}</option>`).join("")}</select><span class="hint">${L("Steht in den Unterlagen im Kapitel «Einreichung».","See the chapter on submission in the documents.")}</span></div>`};}
  if(F.f==="zk"){const t=D.tenders.find(x=>x.id===F.id)||{},key=F.w||"zk",gek=key==="gek";if(!F.lines)F.lines=(t[key]&&t[key].length?t[key]:[gek?{typ:"ref",t:L(...ZKT.ref),w:""}:{typ:"preis",t:L(...ZKT.preis),w:""}]).map(z=>({...z}));
    const rows=F.lines.map((z,i)=>`<div class="zkline"><input id="zt${i}" aria-label="${L("Kriterium","Criterion")}" value="${esc(z.t)}" placeholder="${L("z. B. Auftragsanalyse","e.g. task analysis")}"><label class="fc"><span>${L("Gewichtung %","Weight %")}</span><input id="zw${i}" inputmode="decimal" autocomplete="off" value="${esc(z.w)}"></label><label class="fc"><span>${L("Art","Type")}</span><select id="zy${i}">${Object.keys(ZKT).map(k=>`<option value="${k}"${z.typ===k?" selected":""}>${esc(L(...ZKT[k]))}</option>`).join("")}</select></label>${F.lines.length>1?`<button type="button" class="ib sm" aria-label="${L("Zeile entfernen","Remove line")}" data-act="zk-del" data-c="${i}">${ico("trash")}</button>`:"<span></span>"}</div>`).join("");
    return {title:gek?L("Gewichtete Eignungskriterien","Weighted qualification criteria"):L("Zuschlagskriterien","Award criteria"),body:`<div class="f wide"><span class="l">${L("Kriterien und Gewichtung gemäss Dossier","Criteria and weights as in the dossier")}</span>${rows}<button type="button" class="ghost" data-act="zk-add">${L("+ Kriterium","+ Criterion")}</button><span class="hint">${L("Die Art bestimmt, welche Tipps arkitecton zeigt. Zusammen sollten es 100 % sein.","The type decides which tips arkitecton shows. Together they should add up to 100 %.")}</span></div>`};}
  if(F.f==="tender"){const opt=(o,cur,all)=>(all?`<option value="">${all}</option>`:"")+Object.keys(o).map(k=>`<option value="${k}"${cur===k?" selected":""}>${esc(tx(o[k]))}</option>`).join("");
    const Y=YNOW();
    return {title:L("Ausschreibung erfassen","Add tender"),body:
      fld("fTTitle",L("Titel","Title"),"",{wide:true,req:true,ph:L("z. B. Neubau Kindergarten","e.g. New kindergarten")})
      +fld("fTClient",L("Auftraggeber","Contracting authority"),"",{wide:true,ph:L("z. B. Gemeinde Kilchberg","e.g. Municipality of Kilchberg")})
      +`<div class="f"><label for="fTProc">${L("Verfahren","Procedure")}</label><select id="fTProc">${opt(PROC,"sel")}</select></div>`
      +fld("fTCost",L("Bausumme in Mio. CHF","Construction cost, CHF m"),"",{mode:"decimal",ph:"z. B. 7.2"})
      +fld("fTUrl",L("Link zur Publikation auf simap.ch","Link to the publication on simap.ch"),"",{wide:true,ph:"https://www.simap.ch/…"})
      +fld("fTDue",L("Eingabefrist","Submission deadline"),"",{type:"date",req:true,hint:L("Beim selektiven Verfahren: Frist für den Teilnahmeantrag","Selective procedure: deadline of the request to participate")})+fld("fTQDue",L("Fragefrist","Question deadline"),"",{type:"date"})
      +fld("fTMax",L("Höchstzahl eingeladener Büros","Max. firms invited"),"",{mode:"numeric",hint:L("Nur beim selektiven Verfahren","Selective procedure only")})
      +`<div class="f"><label for="fTSig">${L("Verlangte Unterschrift","Required signature")}</label><select id="fTSig"><option value="">${L("noch offen","not known yet")}</option>${Object.keys(SIGREQ).map(k=>`<option value="${k}">${esc(L(...SIGREQ[k]))}</option>`).join("")}</select></div>`
      +`<h3 class="subh" style="grid-column:1/-1;margin:10px 0 -4px">${L("Eignungskriterien","Eligibility criteria")}</h3>`
      +fld("fTRefN",L("Anzahl Referenzen","Number of references"),"2",{mode:"numeric"})+fld("fTRefSince",L("Referenzen seit (Jahr)","References since (year)"),String(Y-10),{mode:"numeric"})
      +fld("fTRefMin",L("Referenzen ab Bausumme (Mio. CHF)","References from cost (CHF m)"),"",{mode:"decimal",ph:"z. B. 2.5"})
      +`<div class="f"><label for="fTRefType">${L("Art der Referenzen","Type of references")}</label><select id="fTRefType">${opt(RTYPE,"",L("beliebig","any"))}</select></div>`
      +`<div class="f wide"><label class="chk"><input type="checkbox" id="fTRefPub"> ${L("Referenzen mit öffentlicher Bauherrschaft verlangt","References with public client required")}</label></div>`
      +`<div class="f wide"><label for="fTTeam">${L("Schlüsselperson","Key person")}</label><select id="fTTeam"><option value="">${L("keine verlangt","none required")}</option><option value="bl">${L("Bauleiter mit eidg. Fachausweis","Site manager, federal certificate")}</option><option value="pl">${L("Projektleiter, öffentliche Bauten","Project lead, public buildings")}</option></select></div>`
      +`<div class="f wide"><label class="chk"><input type="checkbox" id="fTEng"> ${L("Bauingenieur im Team verlangt","Structural engineer required")}</label></div>`};}
  if(F.f==="ref"){const O=D.office,r=O.refs.find(x=>x.id===F.id)||{},pr=F.w?PJ(F.w):null,bud=pr?(pr.budget||[]).reduce((a,b)=>a+(b.kv||0),0):0;
    const v=k=>r[k]!=null?r[k]:"";const name=F.id?tx(r):pr?pr.name+(pr.place?", "+pr.place:""):"";
    const opt=(o,cur)=>Object.keys(o).map(k=>`<option value="${k}"${cur===k?" selected":""}>${esc(tx(o[k]))}</option>`).join("");
    return {title:F.id?L("Referenz bearbeiten","Edit reference"):pr?L("Projekt als Referenz","Project as reference"):L("Neue Referenz","New reference"),
      body:fld("fRName",L("Projekt und Ort","Project and place"),name,{wide:true,req:true,ph:L("z. B. Erweiterung Schulhaus, Horgen","e.g. School extension, Horgen")})
        +fld("fRClient",L("Bauherrschaft","Client"),F.id?v("client"):pr?pr.client||"":"",{wide:true})
        +`<div class="f wide"><label class="chk"><input type="checkbox" id="fRPub"${r.pub?" checked":""}> ${L("Öffentliche Bauherrschaft (Gemeinde, Kanton, Bund)","Public client (municipality, canton, federal)")}</label></div>`
        +`<div class="f"><label for="fRType">${L("Art","Type")}</label><select id="fRType"><option value="">${L("andere","other")}</option>${opt(RTYPE,r.type)}</select></div>`
        +fld("fRCost",L("Bausumme in Mio. CHF","Construction cost, CHF m"),F.id?v("cost"):bud?Math.round(bud/1e5)/10:"",{mode:"decimal",ph:"z. B. 4.2"})
        +fld("fRYear",L("Abschlussjahr","Year completed"),F.id?(r.running?"":v("year")):YNOW(),{mode:"numeric"})
        +fld("fRPhases",L("SIA-Phasen","SIA phases"),F.id?v("phases"):"31–53",{ph:"31–53"})
        +`<div class="f wide"><label class="chk"><input type="checkbox" id="fRRun"${r.running?" checked":""}> ${L("Projekt läuft noch","Project still running")}</label></div>`,
      del:!!F.id};}
  if(F.f==="signers"){const team=D.office.team,G=D.firm.signers||[];
    if(!team.length)return {title:L("Unterschriften","Signatures"),noSubmit:true,body:`<div class="f wide"><span class="hint">${L("Unterschreiben können Personen aus dem Team. Noch ist niemand erfasst.","People from the team can sign. Nobody has been added yet.")}</span><button type="button" class="btn primary" data-act="sig-person">${L("Person erfassen","Add person")}</button></div>`};
    return {title:L("Unterschriften","Signatures"),body:`<div class="f wide"><span class="hint">${L("Architekt und Bauleitung unterschreiben die Zahlungsfreigabe, dazu kommt die Bauherrschaft. Beim Kostenstand unterschreiben die beiden für das Büro. Name und Titel kommen aus dem Team, die Funktion legen Sie hier fest.","Architect and site management sign the payment release, plus the client. On the cost status both sign for the office. Name and title come from the team; set the role here.")}</span></div>`
      +[0,1].map(n=>{const g=G[n]||{};return `<div class="f wide"><span class="l sgh">${n?L("2. Unterschrift · Bauleitung","2nd signature · site management"):L("1. Unterschrift · Architekt","1st signature · architect")}</span></div>`
        +`<div class="f"><label for="fSg${n}m">${L("Person","Person")}</label><select id="fSg${n}m"><option value="">${L("– niemand –","– nobody –")}</option>${team.map(m=>`<option value="${m.id}"${m.id===g.m?" selected":""}>${esc(m.name)}${m.qual?" · "+esc(m.qual):""}</option>`).join("")}</select></div>`
        +fld("fSg"+n+"r",L("Funktion","Role"),g.role||"",{ph:n?L("z. B. Inhaberin","e.g. owner"):L("z. B. Projektleiter","e.g. project lead")});}).join("")
      +`<div class="f wide"><button type="button" class="ghost" data-act="sig-person">+ ${L("Person erfassen","Add person")}</button></div>`};}
  if(F.f==="person"){const m=D.office.team.find(x=>x.id===F.id)||{extra:[]};
    return {title:F.id?L("Person bearbeiten","Edit person"):L("Neue Person","New person"),
      body:fld("fMName",L("Name","Name"),m.name||"",{wide:true,req:true})+fld("fMQual",L("Titel / Ausbildung","Title / education"),m.qual||"",{wide:true,ph:L("z. B. dipl. Architekt ETH SIA","e.g. Architect, BSc"),hint:L("Steht auch unter der Unterschrift auf Briefen.","Also shown under the signature on letters.")})
        +`<div class="f wide"><label>${L("Zusatzqualifikationen","Additional qualifications")}</label>${Object.keys(XQ).map(k=>`<label class="chk"><input type="checkbox" data-xq="${k}"${(m.extra||[]).includes(k)?" checked":""}> ${tx(XQ[k])}</label>`).join("")}</div>`
        +(F.id?"":`<p class="hint" style="grid-column:1/-1">${L("Den Werdegang mit Rollen und Jahren erfassen Sie danach auf der Personenseite.","Add the career with roles and years on the person page afterwards.")}</p>`),
      del:!!F.id};}
  if(F.f==="career"){const m=D.office.team.find(x=>x.id===F.id)||{career:[]},i=F.w!=null&&F.w!==""?+F.w:-1,c=i>=0?m.career[i]:{role:"arch",firm:D.firm.name||"",from:"",to:null};
    return {title:(i>=0?L("Station bearbeiten · ","Edit position · "):L("Neue Station · ","New position · "))+esc(m.name||""),
      body:`<div class="f wide"><label for="fCRole">${L("Rolle","Role")}</label><select id="fCRole">${Object.keys(ROLES).map(k=>`<option value="${k}"${c.role===k?" selected":""}>${tx(ROLES[k])}</option>`).join("")}</select></div>`
        +fld("fCFirm",L("Arbeitgeber","Employer"),c.firm||"",{wide:true})+fld("fCFrom",L("Von (Jahr)","From (year)"),c.from||"",{mode:"numeric",req:true})+fld("fCTo",L("Bis (Jahr)","To (year)"),c.to||"",{mode:"numeric",hint:L("Leer lassen, wenn die Rolle heute noch gilt.","Leave empty if the role is current.")}),
      del:i>=0};}
  if(F.f==="offersum"){const w=W(F.id)||{},o=S.offerDraft||{};const k=K(w.k)||{};
    return {title:L("Offerte · ","Offer · ")+esc(k.name||""),body:`<p class="hint wide">${esc(o.name||"")}</p>`+fld("fOfferSum",L("Offertsumme CHF","Offer total CHF"),o.sum!=null?nf2.format(o.sum):"",{mode:"decimal",wide:true,req:true,hint:o.sum!=null?L("Aus dem PDF gelesen. Bitte mit der Offerte vergleichen.","Read from the PDF. Please check against the offer."):L("Im PDF wurde keine Summe gefunden. Bitte eintragen.","No total found in the PDF. Please enter it.")})
      +`<label class="chk wide"><input type="checkbox" id="fOfferAsSum"${!w.sum?" checked":""}> ${L("Als Vertragssumme übernehmen","Use as contract sum")}${w.sum?` <span class="hint">(${L("heute ","now ")+chf(w.sum,false)})</span>`:""}</label>`};}
  if(F.f==="docvalid"){const d=DOCS().find(x=>x.id===F.id)||{},filed=d.scope==="project"||d.scope==="contractor"||d.scope==="doc";return {title:esc(d.name||""),body:(filed?`<div class="f wide"><label for="fDKind">${L("Art","Kind")}</label><select id="fDKind">${dkOptions(docKind(d))}</select></div>`:"")+fld("fUntil",docKind(d)==="gs"?L("Garantie endet am","Warranty ends on"):L("Gültig bis","Valid until"),d.until||"",{type:"date",wide:true,hint:L("Leer lassen, wenn das Dokument nicht abläuft. Vor Ablauf erscheint eine Warnung unter «Zu erledigen» (Garantieschein 60 Tage, sonst 30 Tage).","Leave empty if it does not expire. A warning appears 30 days before.")})};}
  if(F.f==="project"){const x=F.id?D.projects.find(q=>q.id===F.id):{};return {title:F.id?L("Projekt bearbeiten","Edit project"):L("Projekt erfassen","Add project"),body:fld("fName",L("Projektname","Project name"),x.name,{wide:true,req:true,ph:L("z. B. EFH Bergstrasse 4","e.g. Bergstrasse 4 house")})+fld("fPlace",L("Ort","Place"),x.place,{ph:L("z. B. Horgen","e.g. Horgen")})+fld("fClient",L("Bauherrschaft","Client"),x.client)+fld("fCStreet",L("Adresse Bauherrschaft","Client address"),x.cstreet,{wide:true,ph:L("Strasse und Nr.","Street and no.")})+fld("fCZip",L("PLZ","Postcode"),x.czip,{mode:"numeric"})+fld("fCCity",L("Ort","Town"),x.ccity)+fld("fDesc",L("Beschreibung","Description"),x.desc,{wide:true,ph:L("z. B. Umbau Einfamilienhaus","e.g. house conversion")})+(F.id?`<div class="f wide"><label class="chk"><input type="checkbox" id="fClosed"${x.closed?" checked":""}> ${L("Projekt abgeschlossen","Project completed")}</label><span class="hint">${L("Abgeschlossene Projekte erscheinen in der Auswahl eingeklappt.","Completed projects are collapsed in the project switcher.")}</span></div>`:"")};}
  if(F.f==="contractor"){const x=F.id?K(F.id):{};return {title:F.id?L("Handwerker bearbeiten","Edit contractor"):L("Neuer Handwerker","New contractor"),body:fld("fName",L("Firma","Company"),x.name,{wide:true,req:true})+fld("fStreet",L("Strasse","Street"),x.street,{wide:true})+fld("fZip",L("PLZ","ZIP"),x.zip,{mode:"numeric"})+fld("fCity",L("Ort","City"),x.city)+fld("fIban","IBAN",x.iban,{wide:true})+fld("fEmail",L("E-Mail","Email"),x.email,{type:"email"})+fld("fPhone",L("Telefon","Phone"),x.phone,{type:"tel"}),del:F.id&&!D.contracts.some(w=>w.k===F.id)};}
  if(F.f==="contract"){const k=K(F.id),w=(F.w&&W(F.w))||{};return {title:L("Werkvertrag · ","Contract · ")+k.name,body:`<div class="f wide"><label for="fBkp">BKP</label><select id="fBkp">${bkpOptions(w.bkp)}</select></div>`+fld("fSum",L("Werkvertragssumme CHF","Contract sum CHF"),w.sum||"",{mode:"decimal",req:true})+fld("fRet",L("Rückbehalt % (optional)","Retention % (optional)"),w.ret!=null?w.ret:SET().ret,{mode:"decimal",hint:L("0 = kein Rückbehalt. Öffentliche Bauherren wie die Stadt verlangen oft einen, zum Beispiel 10 %.","0 = no retention. Public clients such as the city often require one, e.g. 10 %.")}),del:w.id&&!D.invoices.some(i=>i.w===w.id)};}
  if(F.f==="invoice"){
    const ks=PC().map(w=>K(w.k)).filter(Boolean);
    const sel=F.id||"";
    return {title:L("Rechnung erfassen","Add invoice"),body:(ks.length?`<div class="f wide"><label for="fK">${L("Handwerker","Contractor")}</label><select id="fK">${ks.map(k=>`<option value="${k.id}"${k.id===sel?" selected":""}>${esc(k.name)}</option>`).join("")}</select><span class="hint">${L("Nur Handwerker mit Werkvertrag in diesem Projekt.","Only contractors with a contract in this project.")}</span></div>`:"")+(ks.length?`<div class="f"><label for="fType">${L("Art","Type")}</label><select id="fType"><option value="akonto">Akonto</option><option value="schluss">${L("Schlussrechnung","Final invoice")}</option><option value="regie">${L("Regie","Time & materials")}</option></select></div>`
      +fld("fNo",L("Rechnungsnummer","Invoice number"),"")+fld("fAmt",L("Betrag CHF","Amount CHF"),"",{mode:"decimal",req:true})+fld("fDate",L("Datum","Date"),iso(TODAY),{type:"date"})+fld("fDue",L("Fällig am","Due"),addDays(iso(TODAY),SET().term),{type:"date"})+fld("fRef",L("Referenz (optional)","Reference (optional)"),"",{wide:true}):`<div class="f wide nok"><p>${L("In diesem Projekt gibt es noch keinen Handwerker mit Werkvertrag.","This project has no contractor with a contract yet.")}</p><p class="sp">${L("Am schnellsten: QR-Rechnung scannen. arkitecton legt Handwerker und Werkvertrag dabei selbst an.","Fastest: scan the QR-bill. arkitecton adds the contractor and contract for you.")}</p><div class="nokb"><button type="button" class="btn primary" data-act="capture">${L("QR scannen","Scan QR")}</button><button type="button" class="btn" data-act="form" data-f="contractor">${L("Handwerker erfassen","Add contractor")}</button></div></div>`),noSubmit:!ks.length};}
  if(F.f==="bkp"){const used=new Set(p.budget.map(b=>b.bkp));return {title:L("BKP-Position erfassen","Add BKP item"),body:`<div class="f wide"><label for="fBkpQ">${L("BKP-Position","BKP item")}</label><input id="fBkpQ" list="bkpList" autocomplete="off" placeholder="${L("Nummer oder Bezeichnung, z.B. 421 oder Gärtner","Number or name, e.g. 421 or garden")}"><datalist id="bkpList">${BKPCAT().filter(e=>e[0].length>=2&&!used.has(e[0])).map(e=>`<option value="${e[0]} ${esc(e[1])}"></option>`).join("")}</datalist><span class="hint">${L("Alle Hauptgruppen 0 bis 9. Unterpositionen wie 211.5 frei eintippen oder unter Einstellungen › BKP-Liste Ihre eigene Liste laden.","All main groups 0 to 9. Type sub-items like 211.5 freely, or load your own list under Settings › BKP list.")}</span></div>`+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),"",{mode:"decimal",wide:true})};}
  if(F.f==="kv"){const b=B(F.id);return {title:"BKP "+b.bkp+" "+tx(b),body:fld("fLabel",L("Bezeichnung","Name"),tx(b),{wide:true})+fld("fKv",L("Kostenvoranschlag CHF","Cost estimate CHF"),b.kv||"",{mode:"decimal",wide:true})+fld("fKvr",L("Kostenvoranschlag revidiert CHF","Revised estimate CHF"),b.kvr!=null?b.kvr:"",{mode:"decimal",wide:true,ph:L("leer lassen, wenn nicht revidiert","leave empty if not revised"),hint:L("Wenn der Kostenvoranschlag im Projekt angepasst wurde. Prognose und Reserve rechnen dann mit diesem Betrag, der ursprüngliche bleibt zum Vergleich sichtbar.","If the estimate was adjusted during the project. Forecast and reserve then use this amount; the original stays visible for comparison.")}),del:!PC().some(w=>w.bkp===b.bkp)};}
  if(F.f==="answer"){return {title:L("Antwort erhalten","Reply received"),body:`<div class="f wide"><label for="fNote">${L("Was war die Antwort?","What was the reply?")}</label><textarea id="fNote" rows="3" placeholder="${L("z. B. Rapporte erhalten, 6 h bestätigt","e.g. time sheets received, 6 h confirmed")}"></textarea><span class="hint">${L("Wird im Verlauf gespeichert. Die Rechnung ist danach wieder zu prüfen.","Saved in the history. The invoice goes back to review.")}</span></div>`};}
  if(F.f==="ded"){const i=INV(F.id),d=i.ded||{};return {title:L("Abzug · ","Deduction · ")+i.no,body:fld("fDedAmt",L("Abzug CHF","Deduction CHF"),d.amt||"",{mode:"decimal",req:true})+`<div class="f wide"><label for="fDedWhy">${L("Begründung","Reason")}</label><textarea id="fDedWhy" rows="2" placeholder="${L("z. B. 2 h Regie nicht belegt","e.g. 2 h not supported by time sheets")}">${esc(d.why||"")}</textarea><span class="hint">${L("Rechnung ","Invoice ")}${nf2.format(i.gross)} · ${L("0 eingeben, um den Abzug zu entfernen.","Enter 0 to remove the deduction.")}</span></div>`};}
  if(F.f==="firm"){const t=F.tmp,B=t?Object.assign({},D.firm,{name:t.fName,street:t.fStreet,zip:t.fZip,city:t.fCity,iban:t.fIban,email:t.fEmail,phone:t.fPhone,vatNo:t.fVatNo,vat:t.fVat,sigRule:t.fSigRule}):D.firm;return {title:L("Büro","Office"),body:fld("fName",L("Firmenname","Company name"),B.name,{wide:true,req:true})
    +fld("fStreet",L("Strasse und Nr.","Street and no."),B.street,{wide:true,ph:L("z. B. Seestrasse 40","e.g. Seestrasse 40")})+fld("fZip",L("PLZ","Postcode"),B.zip,{mode:"numeric"})+fld("fCity",L("Ort","Town"),B.city)
    +fld("fIban","IBAN",B.iban?fmtIban(B.iban):"",{wide:true,hint:L("Für den QR-Code auf Ihren Rechnungen.","For the QR code on your invoices.")})
    +fld("fEmail",L("E-Mail","Email"),B.email,{type:"email"})+fld("fPhone",L("Telefon","Phone"),B.phone,{type:"tel"})
    +`<div class="f wide"><label class="chk"><input type="checkbox" id="fVat"${B.vat?" checked":""}> ${L("MWST-pflichtig","Subject to VAT")}</label><span class="hint">${L("Pflichtig ab CHF 100'000 Umsatz im Jahr.","Required from CHF 100,000 turnover a year.")}</span></div>`
    +fld("fVatNo",L("MWST-Nummer","VAT number"),B.vatNo,{wide:true,ph:"CHE-123.456.789 MWST"})
    +`<div class="f wide"><label for="fSigRule">${L("Zeichnungsberechtigung laut Handelsregister","Signing authority (commercial register)")}</label><select id="fSigRule"><option value="einzel"${B.sigRule!=="kollektiv2"?" selected":""}>${L("Einzelunterschrift","Single signature")}</option><option value="kollektiv2"${B.sigRule==="kollektiv2"?" selected":""}>${L("Kollektiv zu zweien","Jointly by two")}</option></select><span class="hint">${L("Bei kollektiv zu zweien braucht jedes Angebot zwei Unterschriften, online zwei QES.","Jointly by two: every bid needs two signatures, online two QES.")}</span></div>`
    +`<div class="f wide"><span class="l">Logo</span><div class="logo-row">${B.logo?`<img src="${B.logo}" alt="" class="logo-prev">`:""}<label class="btn">${B.logo?L("Ersetzen","Replace"):L("Logo wählen","Choose logo")}<input type="file" accept="image/png,image/jpeg" data-imp="logo"></label>${B.logo?`<button type="button" class="ghost" data-act="logo-del">${L("Entfernen","Remove")}</button>`:""}</div><span class="hint">${L("Erscheint oben auf Ihren Rechnungen. PNG oder JPG.","Shown at the top of your invoices. PNG or JPG.")}</span></div>`};}
  return null;
}
function readZk(){const F=S.form;if(!F||!F.lines)return;F.lines=F.lines.map((z,i)=>({...z,t:val("zt"+i),w:val("zw"+i),typ:(document.getElementById("zy"+i)||{}).value||z.typ}));}
function formHTML(){
  const d=formDef(); if(!d) return "";
  const delKey="delform";
  return `<div class="scrim" data-act="close"></div><div class="sheet${S.form.f==="fee"?" wide":""}" role="dialog" aria-modal="true" aria-labelledby="fT">
    <div class="ohead"><h2 id="fT" style="font-size:1.125rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <form id="frm" class="obody" novalidate><div class="fields">${d.body}</div><span class="err" id="formErr" role="alert"></span>
    ${d.del?(S.confirm===delKey?`<button type="button" class="ghost danger" data-act="form-del">${L("Wirklich löschen?","Really delete?")}</button>`:`<button type="button" class="ghost" data-act="ask" data-c="${delKey}">${L("Löschen","Delete")}</button>`):""}</form>
    ${d.noSubmit?"":`<div class="ofoot"><button type="submit" form="frm" class="btn primary">${d.save||L("Speichern","Save")}</button></div>`}</div>`;
}
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():"";};
function submitForm(){
  const F=S.form,p=P();S.formErr="";
  const backTo=()=>{const bk=F.back;closeAll();if(bk&&INV(bk))S.drawer=bk;};
  const fail=(m,id)=>{const e=document.getElementById("formErr"),frm=document.getElementById("frm");
    document.querySelectorAll("#frm [aria-invalid]").forEach(x=>x.removeAttribute("aria-invalid"));document.querySelectorAll("#frm .ferr").forEach(x=>x.remove());
    const fe=id?document.getElementById(id):frm?[...frm.querySelectorAll("input[required]")].find(x=>!x.value.trim()):null;
    if(fe&&fe.closest(".f")){if(e)e.textContent="";fe.setAttribute("aria-invalid","true");const s=document.createElement("span");s.className="ferr";s.setAttribute("role","alert");s.textContent=m;fe.closest(".f").appendChild(s);fe.scrollIntoView({block:"center",behavior:"smooth"});fe.focus({preventScroll:true});}
    else if(e){e.textContent=m;e.scrollIntoView({block:"nearest",behavior:"smooth"});}};
  if(bidSubmit(F,fail))return;
  if(F.f==="project"){
    if(!val("fName")) return fail(L("Projektname fehlt.","Project name missing."));
    if(F.id){const x=D.projects.find(q=>q.id===F.id);Object.assign(x,{name:val("fName"),place:val("fPlace"),client:val("fClient"),cstreet:val("fCStreet"),czip:val("fCZip"),ccity:val("fCCity"),desc:val("fDesc"),closed:!!(document.getElementById("fClosed")||{}).checked});}
    else{const x={id:newId("p"),name:val("fName"),place:val("fPlace"),client:val("fClient"),cstreet:val("fCStreet"),czip:val("fCZip"),ccity:val("fCCity"),desc:val("fDesc"),budget:[]};D.projects.push(x);D.pid=x.id;S.view="uebersicht";}
    backTo();render();return toast(L("Projekt gespeichert","Project saved"));
  }
  if(F.f==="contractor"){
    if(!val("fName")) return fail(L("Firma fehlt.","Company missing."));
    const iban=val("fIban");
    if(iban&&!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(norm(iban))) return fail(L("IBAN prüfen: Schweizer IBAN hat 21 Zeichen (CH…).","Check the IBAN: Swiss IBANs have 21 characters (CH…)."),"fIban");
    const rec={name:val("fName"),street:val("fStreet"),zip:val("fZip"),city:val("fCity"),iban:iban?fmtIban(iban):"",email:val("fEmail"),phone:val("fPhone")};
    if(F.id) Object.assign(K(F.id),rec); else{const k=Object.assign({id:newId("k"),pid:D.pid},rec);D.contractors.push(k);S.kid=k.id;S.view="handwerker";}
    backTo();render();return toast(L("Handwerker gespeichert","Contractor saved"));
  }
  if(F.f==="contract"){
    const sum=num(val("fSum")),ret=num(val("fRet"));
    if(sum===null||sum<0) return fail(L("Werkvertragssumme eingeben.","Enter the contract sum."),"fSum");
    if(ret===null||ret<0||ret>30) return fail(L("Rückbehalt zwischen 0 und 30 %.","Retention between 0 and 30 %."),"fRet");
    const bkp=document.getElementById("fBkp").value;ensureBkp(bkp);
    let w=F.w&&W(F.w); if(w) Object.assign(w,{bkp,sum:r2(sum),ret}); else{w={id:newId("w"),pid:D.pid,k:F.id,bkp,sum:r2(sum),ret};D.contracts.push(w);}
    backTo();render();return toast(L("Werkvertrag gespeichert","Contract saved"));
  }
  if(F.f==="invoice"){
    const kid=val("fK"),amt=num(val("fAmt"));const w=CW(kid);
    if(!w) return fail(L("Handwerker wählen.","Choose a contractor."));
    if(F.rep&&INV(F.rep)&&W(INV(F.rep).w).k!==kid) return fail(L("Ersetzen geht nur mit einer Rechnung vom selben Handwerker: ","Replacing only works with an invoice from the same contractor: ")+K(W(INV(F.rep).w).k).name);
    if(!amt||amt<=0) return fail(L("Betrag eingeben.","Enter the amount."),"fAmt");
    const type=val("fType"),ref=val("fRef");
    if(ref&&D.invoices.some(x=>x.ref&&live(x)&&x.id!==F.rep&&norm(x.ref)===norm(ref))) return fail(L("Diese Referenz ist bereits erfasst (Doppelrechnung).","This reference is already recorded (duplicate)."),"fRef");
    const ni={id:newId("i"),no:val("fNo")||L("ohne Nr.","no number"),w:w.id,type,n:type==="akonto"?D.invoices.filter(x=>x.w===w.id&&x.type==="akonto").length+1:0,date:val("fDate")||iso(TODAY),due:val("fDue")||addDays(iso(TODAY),SET().term),gross:r2(amt),status:"pruefen",ref:ref?fmtRef(ref):""};
    logInv(ni,L("Von Hand erfasst","Entered by hand"));D.invoices.push(ni);if(F.rep)linkReplace(F.rep,ni);
    closeAll();S.drawer=ni.id;render();return toast(L("Rechnung erfasst","Invoice added"));
  }
  if(F.f==="bkp"){
    const q=(val("fBkpQ")||"").trim(),m=q.match(/^(\d{2,3}(?:\.\d+)?)\s*(.*)$/);
    if(!m) return fail(L("BKP-Nummer eingeben, z.B. 421 Gärtnerarbeiten.","Enter a BKP number, e.g. 421 garden works."));
    let code=m[1],label=m[2].trim()||bkpCat(code);
    if(!label) return fail(L("Bezeichnung zur BKP-Nummer eingeben.","Enter a name for the BKP number."));
    if(p.budget.some(b=>b.bkp===code)) return fail(L("Diese Position gibt es schon.","This item already exists."));
    const s=STD_BKP.find(x=>x[0]===code);
    p.budget.push({bkp:code,de:label||(s?s[1]:code),en:s?s[2]:label,kv:r2(num(val("fKv"))||0)});p.budget.sort((a,b)=>a.bkp.localeCompare(b.bkp));
    backTo();render();return toast("BKP "+code);
  }
  if(F.f==="kv"){
    const b=B(F.id),kv=num(val("fKv"));
    if(kv===null||kv<0) return fail(L("Betrag eingeben.","Enter an amount."),"fKv");
    const kr=val("fKvr");if(kr){const v=num(kr);if(v===null||v<0)return fail(L("Revidierten Betrag prüfen.","Check the revised amount."),"fKvr");b.kvr=r2(v);}else delete b.kvr;
    b.kv=r2(kv);const lab=val("fLabel");if(lab){if(S.lang==="de")b.de=lab;else b.en=lab;}
    backTo();render();return toast(L("Gespeichert","Saved"));
  }
  if(F.f==="fee") return saveFee(F,fail);
  if(F.f==="offersum"){const w=W(F.id),o=S.offerDraft||{};const v=num(val("fOfferSum"));if(!w)return;if(!(v>0))return toast(L("Bitte die Offertsumme eintragen.","Please enter the offer total."));
    w.offerPdf={doc:o.doc,sum:r2(v),date:iso(TODAY),name:o.name};if(document.getElementById("fOfferAsSum")&&document.getElementById("fOfferAsSum").checked)w.sum=r2(v);
    S.offerDraft=null;backTo();render();return toast(L("Offerte gespeichert · ","Offer saved · ")+chf(v,false));}
  if(F.f==="docvalid"){const d=DOCS().find(x=>x.id===F.id);if(d){d.until=val("fUntil")||null;if(document.getElementById("fDKind"))d.kind=val("fDKind");}backTo();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="answer"){const i=INV(F.id),note=(document.getElementById("fNote").value||"").trim();i.status="pruefen";logInv(i,L("Antwort erhalten","Reply received")+(note?": "+note:""));const id=i.id;closeAll();S.drawer=id;render();return toast(L("Wieder zu prüfen","Back to review"));}
  if(F.f==="ded"){const i=INV(F.id),amt=num(val("fDedAmt")),why=(document.getElementById("fDedWhy").value||"").trim();
    if(amt===null||amt<0) return fail(L("Betrag eingeben.","Enter an amount."),"fDedAmt");
    if(amt>=i.gross) return fail(L("Der Abzug muss kleiner als die Rechnung sein.","The deduction must be less than the invoice."),"fDedAmt");
    if(amt>0&&!why) return fail(L("Bitte kurz begründen.","Please give a short reason."));
    if(amt>0){i.ded={amt:r2(amt),why};logInv(i,L("Abzug CHF ","Deduction CHF ")+nf2.format(r2(amt))+": "+why);}else if(i.ded){delete i.ded;logInv(i,L("Abzug entfernt","Deduction removed"));}
    const id=i.id;closeAll();S.drawer=id;render();return toast(amt>0?L("Abzug gespeichert","Deduction saved"):L("Abzug entfernt","Deduction removed"));}
  if(F.f==="tsrc"){const t=D.tenders.find(x=>x.id===F.id);const u=val("fSUrl");if(u&&!/^https?:\/\//i.test(u))return fail(L("Link muss mit https:// beginnen.","Link must start with https://."),"fSUrl");t.src={url:u,id:val("fSId")};t.sig=val("fSSig")||null;closeAll();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="zk"){const t=D.tenders.find(x=>x.id===F.id);readZk();const zk=F.lines.filter(z=>z.t.trim()).map(z=>({typ:z.typ,t:z.t.trim(),w:num(String(z.w))||0,me:z.me||""}));t[F.w||"zk"]=zk;closeAll();render();return toast(L("Kriterien gespeichert","Criteria saved"));}
  if(F.f==="tender"){if(!val("fTTitle"))return fail(L("Titel fehlt.","Title missing."),"fTTitle");
    if(!val("fTDue"))return fail(L("Eingabefrist fehlt.","Submission deadline missing."),"fTDue");
    const n=parseInt(val("fTRefN"),10)||0,since=parseInt(val("fTRefSince"),10)||YNOW()-10,min=num(val("fTRefMin"))||0,typ=document.getElementById("fTRefType").value,tag=document.getElementById("fTTeam").value,eng=document.getElementById("fTEng").checked;
    const reqs=[];if(n>0)reqs.push({k:"refs",n,since,minCost:min,pub:document.getElementById("fTRefPub").checked,types:typ?[typ]:null});if(tag)reqs.push({k:"team",tag});reqs.push({k:"disc",need:eng?["291","292"]:["291"]});
    const docs=[];if(n>0)docs.push({id:"d1",auto:"refs"});if(tag)docs.push({id:"d2",auto:"team"});docs.push({id:"d3",auto:"self"});
    const t={id:newId("t"),title:{de:val("fTTitle"),en:val("fTTitle")},client:val("fTClient"),proc:document.getElementById("fTProc").value,phases:"31–53",cost:num(val("fTCost"))||0,qDue:val("fTQDue")||null,due:val("fTDue"),status:"neu",reqs,docs,done:{},own:true,src:val("fTUrl")?{url:val("fTUrl")}:null,zk:[]};if(t.proc==="sel")t.pq={max:parseInt(val("fTMax"),10)||null};t.sig=val("fTSig")||null;
    D.tenders.push(t);S.ttab="verfahren";S.from=null;backTo();go("ausschreibungen");S.tid=t.id;render();return toast(L("Ausschreibung erfasst","Tender added"));}
  if(F.f==="ref"){const O=D.office,name=val("fRName");if(!name)return fail(L("Projekt fehlt.","Project missing."),"fRName");
    const cost=val("fRCost")?num(val("fRCost")):null;if(val("fRCost")&&(cost===null||cost<0))return fail(L("Bausumme als Zahl in Mio. CHF eingeben, z. B. 4.2","Enter the cost in CHF m, e.g. 4.2"),"fRCost");
    const run=document.getElementById("fRRun").checked,year=parseInt(val("fRYear"),10);if(!run&&!(year>1950&&year<=YNOW()+1))return fail(L("Abschlussjahr eingeben oder «läuft noch» wählen.","Enter the year or tick «still running»."),"fRYear");
    const rec={de:name,en:name,client:val("fRClient"),pub:document.getElementById("fRPub").checked,type:document.getElementById("fRType").value||null,cost:cost||0,year:run?YNOW():year,running:run,phases:val("fRPhases")};
    let r=O.refs.find(x=>x.id===F.id);if(r)Object.assign(r,rec);else{r=Object.assign({id:newId("r")},rec);O.refs.unshift(r);const pr=F.w&&PJ(F.w);if(pr)pr.refId=r.id;}
    S.pfilter="refs";backTo();render();return toast(L("Referenz gespeichert","Reference saved"));}
  if(F.f==="signers"){D.firm.signers=[0,1].map(n=>({m:val("fSg"+n+"m"),role:val("fSg"+n+"r")}));backTo();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="person"){const O=D.office;if(!val("fMName"))return fail(L("Name fehlt.","Name missing."),"fMName");
    const extra=[...document.querySelectorAll("[data-xq]")].filter(e=>e.checked).map(e=>e.dataset.xq);
    let m=O.team.find(x=>x.id===F.id);if(m)Object.assign(m,{name:val("fMName"),qual:val("fMQual"),extra});else{m={id:newId("m"),name:val("fMName"),qual:val("fMQual"),extra,career:[]};O.team.push(m);if(F.w!=="signers")S.mid=m.id;}
    if(F.w==="signers"){const G=D.firm.signers=(D.firm.signers||[]).slice(0,2);while(G.length<2)G.push({m:"",role:""});const free=G.find(g=>!g.m);if(free)free.m=m.id;closeAll();render();openForm("signers");return toast(L("Gespeichert","Saved"));}
    backTo();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="career"){const m=D.office.team.find(x=>x.id===F.id);if(!m)return;const from=parseInt(val("fCFrom"),10),to=val("fCTo")?parseInt(val("fCTo"),10):null,Y=YNOW();
    if(!(from>1950&&from<=Y))return fail(L("Startjahr eingeben, z. B. 2016.","Enter the start year, e.g. 2016."),"fCFrom");
    if(to!==null&&!(to>=from&&to<=Y))return fail(L("Endjahr muss zwischen Start und heute liegen.","End year must be between start and today."),"fCTo");
    const rec={role:document.getElementById("fCRole").value,firm:val("fCFirm"),from,to};const i=F.w!=null&&F.w!==""?+F.w:-1;
    m.career=m.career||[];if(i>=0)m.career[i]=rec;else m.career.push(rec);backTo();render();return toast(L("Gespeichert","Saved"));}
  if(F.f==="firm"){
    if(!val("fName")) return fail(L("Firmenname fehlt.","Company name missing."));
    const ib_=norm(val("fIban"));if(ib_&&!ibanValid(ib_)) return fail(L("IBAN prüfen: Die Prüfziffer stimmt nicht.","Check the IBAN: the check digits do not match."),"fIban");
    const vat=document.getElementById("fVat").checked,vno=val("fVatNo");
    if(vat&&!/^CHE-?\d{3}\.?\d{3}\.?\d{3}/i.test(vno)) return fail(L("MWST-Nummer im Format CHE-123.456.789 MWST eingeben.","Enter the VAT number as CHE-123.456.789 MWST."),"fVatNo");
    Object.assign(D.firm,{name:val("fName"),street:val("fStreet"),zip:val("fZip"),city:val("fCity"),iban:ib_,email:val("fEmail"),phone:val("fPhone"),vat,vatNo:vno,sigRule:val("fSigRule")||"einzel"});
    {const want=isQrIban(ib_)?"QRR":"SCOR";FEES().filter(f=>!f.paid&&f.refType!==want).forEach(f=>{const r=makeRef(f.no);f.refType=r.type;f.ref=r.ref;});} /* open fee invoices get a reference that fits the new account */
    backTo();render();return toast(L("Gespeichert","Saved"));}
}
function formDelete(){
  snap();const F=S.form;
  if(F.f==="ref"){D.office.refs=D.office.refs.filter(r=>r.id!==F.id);D.projects.forEach(p=>{if(p.refId===F.id)delete p.refId;});}
  if(F.f==="person"){D.office.team=D.office.team.filter(m=>m.id!==F.id);S.mid=null;}
  if(F.f==="career"){const m=D.office.team.find(x=>x.id===F.id);if(m)m.career.splice(+F.w,1);}
  if(F.f==="contractor"){D.contractors=D.contractors.filter(k=>k.id!==F.id);S.kid=null;}
  if(F.f==="contract"){const w=W(F.w);D.contracts=D.contracts.filter(x=>x!==w);S.wid=null;}
  if(F.f==="kv"){const p=P();p.budget=p.budget.filter(b=>b.bkp!==F.id);}
  closeAll();render();toast(L("Gelöscht","Deleted"),0,0,1);
}

/* ---------- sheets: Excel, projects, data ---------- */
function sheetDef(key){
  const ex=(label,act,id)=>({label,act,id}),im=(label,imp,id,acc)=>({label,imp,id,acc}),bt=(label,act,id,cls)=>({label,act,id,btn:true,cls});
  if(key==="scan") return {title:L("Scannen","Scan"),groups:[["",[bt(L("QR-Rechnung erfassen","Capture QR-bill"),"capture"),bt(L("Dokument scannen: Werkvertrag, Rapport, Protokoll …","Scan document: contract, report, minutes …"),"dscan")]]]};
  if(key==="projects") return {title:L("Projekte","Projects"),groups:[["",D.projects.map(p=>bt((p.id===D.pid?"● ":"")+p.name+(p.place?" · "+p.place:""),"pick-project",p.id))],["",[bt(L("Projekt erfassen","Add project"),"form-project"),...(P()?[bt(L("Aktuelles Projekt bearbeiten","Edit current project"),"form-project-edit",D.pid)]:[])]]]};
  if(key==="daten"){
    const c=S.confirm;
    return {title:L("Daten und Sicherung","Data and backup"),groups:[
      [L("Sicherung","Backup"),[ex(L("Sicherung herunterladen","Download backup"),"backup"),im(L("Sicherung laden","Restore backup"),"backup",null,".json")]],
      [L("Neu beginnen","Start over"),[bt(c==="reset-ex"?L("Wirklich alles durch Beispieldaten ersetzen?","Really replace everything with example data?"):L("Beispieldaten laden","Load example data"),c==="reset-ex"?"reset-ex":"ask",c==="reset-ex"?null:"reset-ex",c==="reset-ex"?"danger":""),
        bt(c==="reset-all"?L("Wirklich alle Daten löschen?","Really delete all data?"):L("Alle Daten löschen","Delete all data"),c==="reset-all"?"reset-all":"ask",c==="reset-all"?null:"reset-all","danger")]]],
      note:L("Testversion: Alle Daten und Dokumente liegen nur in diesem Browser auf diesem Gerät. Es wird nichts an einen Server gesendet. Die Sicherung enthält die Daten, aber nicht die Dokumente. Safari kann Daten löschen, wenn arkitecton länger als 7 Tage nicht geöffnet wird: Auf dem iPhone deshalb über Teilen → «Zum Home-Bildschirm» hinzufügen und regelmässig sichern.","Test version: all data and documents stay in this browser on this device. Nothing is sent to a server. The backup contains the data but not the documents. Safari may delete data if arkitecton is not opened for more than 7 days: on iPhone add it via Share → Add to Home Screen and back up regularly.")};
  }
  if(key==="rechnungen") return {title:L("Weitere Aktionen","More actions"),groups:[["",[Object.assign(bt(L("Rechnung ohne QR erfassen","Add invoice without QR"),"form"),{f:"invoice"})]],[L("Herunterladen","Download"),[ex(L("Rechnungsliste","Invoice list"),"x-invoices")]]]};
  if(key==="k-add"){const inP=new Set(PC().map(w=>w.k)),others=D.contractors.filter(k=>!inP.has(k.id)&&!(k.pid===D.pid&&!D.contracts.some(w=>w.k===k.id))).sort((a,b)=>a.name.localeCompare(b.name));
    return {title:L("Handwerker erfassen","Add contractor"),groups:[["",[Object.assign(bt(L("Neuen Handwerker erfassen","Add new contractor"),"form"),{f:"contractor"})]],...(others.length?[[L("Aus Ihrem Büro zuweisen","Assign from your office"),others.map(k=>Object.assign(bt(k.name,"form",k.id),{f:"contract"}))]]:[])]};}
  if(key==="handwerker") return {title:L("Weitere Aktionen","More actions"),groups:[[L("Hochladen","Upload"),[im(L("Handwerkerliste importieren","Import contractor list"),"contractors")]],[L("Herunterladen","Download"),[ex(L("Handwerkerliste","Contractor list"),"x-contractors")]]]};
  if(key==="budget") return {title:L("Weitere Aktionen","More actions"),groups:[[L("Herunterladen","Download"),[ex(L("Kostenstand für die Bauherrschaft (PDF)","Cost status for the client (PDF)"),"cost-pdf"),ex(L("Bauabrechnung (PDF)","Construction account (PDF)"),"final-pdf"),ex(L("Kostenübersicht für die Bauherrschaft","Cost overview for the client"),"x-report"),ex(L("Budget nach BKP","Budget by BKP"),"x-budget")]]]};
  if(key==="tender") return {title:L("Weitere Aktionen","More actions"),groups:[[L("Herunterladen","Download"),[ex(L("Verfahrensliste","Procedure list"),"x-tenders"),ex(L("Referenzliste","Reference list"),"x-refs")]]]};
  if(key.startsWith("t:")) return {title:L("Weitere Aktionen","More actions"),groups:[[L("Herunterladen","Download"),[ex(L("Referenzen für diese Bewerbung","References for this bid"),"x-refs",key.slice(2))]]]};
  if(key.startsWith("k:")){const id=key.slice(2),w=CW(id);
    return {title:L("Weitere Aktionen","More actions"),groups:[[L("Hochladen","Upload"),w?[im(L("Offerte","Offer"),"offer",w.id),im(L("Schlussabrechnung","Final account"),"final",w.id)]:[]],[L("Herunterladen","Download"),[ex(L("Dossier für Sie","File for you"),"x-dossier",id),ex(L("Kontoauszug für den Handwerker","Statement for the contractor"),"x-statement",id),ex(L("Leere Offertvorlage","Blank offer template"),"x-template")]]]};}
  return null;
}
function kvHTML(){
  const r=budgetRows().find(x=>x.b.bkp===S.kvx),p=P()||{};if(!r)return "";
  const ws=PC().filter(w=>w.bkp===r.b.bkp),kv=r.kv;
  const line=(a,b,c,cls)=>`<span${cls?` class="${cls}"`:""}>${a}</span><span class="r${cls?" "+cls:""}">${b}</span><span class="r d${cls?" "+cls:""}">${c||""}</span>`;
  /* one base for every line: the cost estimate; the line that counts is named and explained */
  let rows=r.rev?line(L("Kostenvoranschlag ursprünglich","Original estimate"),nfq.format(r.b.kv||0),"","mute")+line(L("Kostenvoranschlag revidiert","Revised estimate"),nfq.format(kv),""):line(L("Kostenvoranschlag","Cost estimate"),nfq.format(kv),"");
  ws.forEach(w=>{rows+=line(L("Werkvertrag ","Contract ")+esc(K(w.k).name),nfq.format(w.sum||0),"");});
  const base=r.billed+r.open-r.regie;
  if(base) rows+=line(r.open?L("Abgerechnet inkl. offene Rechnungen","Billed incl. open invoices"):L("Abgerechnet","Billed"),nfq.format(base),"");
  if(r.regie) rows+=line(L("Regie ausserhalb Werkvertrag","Time & materials outside contract"),nfq.format(r.regie),"");
  const why=r.none?L("noch nicht vergeben, darum der Kostenvoranschlag","not awarded yet, so the cost estimate"):r.final?L("Schlussrechnung liegt vor, darum abgerechnet","final invoice in, so the billed total"):base>r.awarded?L("abgerechnet, weil höher als der Werkvertrag","billed, as it exceeds the contract"):L("Werkvertrag, Rest wird noch verrechnet","contract, the rest is still to be billed");
  rows+=line((p.closed||r.final?L("Endkosten","Final cost"):L("Prognose","Forecast"))+`<span class="kvwhy">${why}${r.regie?L(", plus Regie",", plus T&M"):""}</span>`,nfq.format(r.forecast),"","fc");
  rows+=line(r.rest<0?L("Über Kostenvoranschlag","Over cost estimate"):L("Reserve","Reserve")+`<span class="kvwhy">${L("Kostenvoranschlag minus ","cost estimate minus ")+(p.closed||r.final?L("Endkosten","final cost"):L("Prognose","forecast"))}</span>`,nfq.format(Math.abs(r.rest)),"","sum");
  const cmpBtns=ws.filter(w=>compare(w)).map(w=>`<button type="button" class="btn primary" data-act="open-cmp" data-id="${w.id}">${L("Abweichungen","Differences")}${ws.length>1?" · "+esc(K(w.k).name):""}</button>`).join("");
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="kT">
    <div class="ohead"><div><h2 id="kT" style="font-size:1.125rem;font-weight:500">BKP ${esc(r.b.bkp)} ${esc(tx(r.b))}</h2><div class="sub">${r.rest<0?"CHF "+nfq.format(-r.rest)+" "+L("über Kostenvoranschlag","over cost estimate"):L("Reserve CHF ","Reserve CHF ")+nfq.format(r.rest)}</div></div><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody"><div class="calc kvx">${rows}</div></div>
    <div class="ofoot"><button type="button" class="btn" data-act="form" data-f="kv" data-id="${esc(r.b.bkp)}">${L("Kostenvoranschlag ändern","Edit estimate")}</button>${S.view==="budget"?"":`<button type="button" class="btn" data-act="kv-budget" data-id="${esc(r.b.bkp)}">${L("Budget","Budget")}</button>`}${cmpBtns}</div></div>`;
}
function projectsHTML(){
  const item=p=>{const cur=p.id===D.pid;return `<button type="button" class="pitem${cur?" cur":""}" data-act="pick-project" data-id="${p.id}" data-q="${esc((p.name+" "+(p.place||"")+" "+(p.client||"")).toLowerCase())}"><span class="pn">${p.fav?'<span class="pfav" aria-label="'+L("Favorit","Favourite")+'">★ </span>':""}${esc(p.name)}</span><span class="pp">${esc([p.place,p.client].filter(Boolean).join(" · "))}</span><span class="pc">${cur?"✓":""}</span></button>`;};
  const act=activeProjects(),done=D.projects.filter(p=>p.closed);
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pT">
    <div class="ohead"><h2 id="pT" style="font-size:1.125rem;font-weight:500">${L("Projekte","Projects")}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody psw">
      ${D.projects.length>1?`<input type="search" id="pSearch" class="psearch" placeholder="${L("Projekt suchen","Search projects")}" autocomplete="off" aria-label="${L("Projekt suchen","Search projects")}">`:""}
      <div class="plist">${act.map(item).join("")||`<div class="empty">${L("Keine aktiven Projekte.","No active projects.")}</div>`}</div>
      ${done.length?`<details class="pdone"><summary>${L("Abgeschlossen","Completed")} <span class="cnt">${done.length}</span></summary><div class="plist">${done.map(item).join("")}</div></details>`:""}
      <p class="pnone" hidden>${L("Kein Projekt gefunden.","No project found.")}</p>
    </div></div>`;
}
function sheetHTML(){
  if(S.sheet==="projects") return projectsHTML();
  const d=sheetDef(S.sheet);if(!d)return "";
  const items=menuItems(d);
  return sheetWrap(d,items);
}
function menuItems(d){
  return d.groups.filter(g=>g[1].length).map(([g,list])=>(g?`<div class="grp">${g}</div>`:"")+list.map(x=>x.imp
    ?`<label class="mi"><span>${esc(x.label)}</span><span class="k">${x.acc===".json"?".json ↑":".xlsx ↑"}</span><input type="file" accept="${x.acc||".xlsx,.xls,.csv"}" data-imp="${x.imp}"${x.id?` data-id="${x.id}"`:""} aria-label="${esc(x.label)}"></label>`
    :x.btn?`<button type="button" class="mi ${x.cls||""}" data-act="${x.act}"${x.f?` data-f="${x.f}"`:""}${x.id?` data-id="${x.id}" data-c="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k"></span></button>`
    :`<button type="button" class="mi" data-act="${x.act}"${x.id?` data-id="${x.id}"`:""}><span>${esc(x.label)}</span><span class="k">${x.act==="backup"?".json ↓":".xlsx ↓"}</span></button>`).join("")).join("");
}
function sheetWrap(d,items){
  return `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sT">
    <div class="ohead"><h2 id="sT" style="font-size:1.125rem;font-weight:500">${esc(d.title)}</h2><button type="button" class="x" data-act="close" aria-label="${L("Schliessen","Close")}">×</button></div>
    <div class="obody"><div class="menu">${items}</div>${d.note?`<span class="fine" style="color:var(--faint);font-size:.78rem">${esc(d.note)}</span>`:""}</div></div>`;
}

function renderOverlay(){queueMicrotask(()=>{if(S.form&&S.form.f==="fee")feeCalcUpdate();});queueMicrotask(()=>{const q=document.getElementById("qtext");if(q&&!q.dataset.top){q.scrollTop=0;q.dataset.top="1";}});queueMicrotask(()=>document.querySelectorAll('input[type=file]').forEach(x=>{if(!x.title)x.title=" ";}));
  const o=document.getElementById("overlay");let h="";
  if(S.dscan) h=dscanHTML(); else if(S.form) h=formHTML(); else if(S.bulk) h=bulkHTML(); else if(S.modal) h=captureHTML(); else if(S.sheet) h=sheetHTML(); else if(S.kvx) h=kvHTML(); else if(S.drawer&&INV(S.drawer)) h=drawerHTML(INV(S.drawer)); else if(S.fdrawer&&FE(S.fdrawer)) h=feeDrawerHTML(FE(S.fdrawer));
  o.innerHTML=h;o.classList.toggle("on",!!h);{const t=document.getElementById("toast");if(t){t.classList.toggle("top",!!h);if(h&&t.dataset.hint)t.classList.remove("on");}}
  if(S.modal&&S.modal.step===1&&P()&&!S.modal.batch&&!S.modal.camErr&&!S.modal.fileFirst){if(cam)attachCam();else startCam();}
  const f=document.getElementById("frm");if(f)f.addEventListener("submit",e=>{e.preventDefault();submitForm();});
  o.classList.toggle("dsfull",!!(S.dscan&&S.dscan.stage!=="save"));if(S.dscan)dscanAttach();
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
/* offer as PDF (stage 1): keep the PDF with the contract and suggest the total from its text; the architect confirms it.
   Reading single positions from PDFs is left for later (AI on a server, see BACKLOG.md). */
async function pdfText(file){const lib=await loadPdfJs();const doc=await lib.getDocument({data:await file.arrayBuffer()}).promise;let out=[];
  for(let i=1;i<=Math.min(doc.numPages,30);i++){const tc=await (await doc.getPage(i)).getTextContent();const lines={};tc.items.forEach(it=>{const y=Math.round(it.transform[5]);(lines[i+":"+y]=lines[i+":"+y]||[]).push(it);});
    Object.keys(lines).sort((a,b)=>Number(b.split(":")[1])-Number(a.split(":")[1])).forEach(k=>out.push(lines[k].sort((a,b)=>a.transform[4]-b.transform[4]).map(t=>t.str).join(" ")));}
  return out;}
function guessOfferSum(lines){
  const amt=t=>[...String(t).matchAll(/(?:CHF|Fr\.?)?\s*(\d{1,3}(?:['’ ]\d{3})+|\d{4,})(?:[.,](\d{2}))?(?!\d)/g)].map(m=>Number(m[1].replace(/['’ ]/g,"")+"."+(m[2]||"00"))).filter(n=>n>=100&&n<1e8);
  const key=/(gesamt|total|offertsumme|offertbetrag|endbetrag|nettobetrag|zu bezahlen|inkl\.? ?mwst)/i;
  let best=null;lines.forEach(l=>{if(key.test(l)){const a=amt(l);if(a.length){const v=Math.max(...a);if(!best||v>=best)best=v;}}});
  if(best)return best;const all=lines.flatMap(amt);return all.length?Math.max(...all):null;}
async function handleImport(kind,file,id){
  if(!file)return;
  if(kind==="logo"){const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(file);});const im=new Image();im.src=url;await new Promise(r=>{im.onload=r;im.onerror=r;});
    const sc=Math.min(1,600/Math.max(im.naturalWidth||1,im.naturalHeight||1)),c=document.createElement("canvas");c.width=Math.round((im.naturalWidth||1)*sc);c.height=Math.round((im.naturalHeight||1)*sc);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
    readFirmForm();D.firm.logo=c.toDataURL("image/png");renderOverlay();return;}
  S.sheet=null;S.confirm=null;
  if(kind==="bkplist"){let rows;try{if(typeof XLSX==="undefined")throw 0;const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:"",raw:false});}catch(e){return toast(L("Datei nicht lesbar. Bitte Excel oder CSV.","Cannot read file. Please use Excel or CSV."));}
    const out=[];rows.forEach(r=>{let c=String(r[0]||"").trim(),n=String(r[1]||"").trim();const m=c.match(/^(\d{1,3}(?:\.\d{1,2})?)\s*(.*)$/);if(!m)return;c=m[1];if(!n)n=m[2].trim();if(!n)return;if(!out.some(o=>o[0]===c))out.push([c,n.replace(/\s+/g," ")]);});
    if(!out.length)return toast(L("Keine BKP-Codes gefunden. Spalte A: Nummer, Spalte B: Bezeichnung.","No BKP codes found. Column A: number, column B: name."));
    D.bkpList=out;D.bkpListInfo={name:file.name,date:iso(TODAY)};saveData();render();const sub=out.filter(o=>o[0].includes(".")).length;
    return toast(out.length+L(" Codes geladen"," codes loaded")+(sub?" · "+sub+L(" Unterpositionen"," sub-items"):""));}
  if(kind==="offerpdf"){const w=W(id);if(!w)return;
    if(!isPdf(file))return toast(L("Bitte die Offerte als PDF wählen.","Please choose the offer as PDF."));
    toast(L("Offerte wird gelesen …","Reading offer …"));
    let sum=null;try{sum=guessOfferSum(await pdfText(file));}catch(e){sum=null;}
    const did=newId("f");await FDB.put(did,file);DOCS().push({id:did,scope:"project",ref:w.pid,name:file.name,type:file.type||"application/pdf",size:file.size,date:iso(TODAY)});
    S.offerDraft={w:w.id,doc:did,sum,name:file.name};saveData();openForm("offersum",w.id);return;}
  if(kind==="backup"){
    try{const o=JSON.parse(await file.text());if(!o||o.v!==1||!Array.isArray(o.projects))throw new Error("format");
      ["contractors","contracts","invoices","fees","docs","tenders","events"].forEach(k=>{if(!Array.isArray(o[k]))o[k]=[];});o.firm=o.firm||{name:""};o.seq=Math.max(+o.seq||0,100);
      const files=o.files||{};delete o.files;await clearFiles();let nf=0;
      for(const id of Object.keys(files)){try{const b=await (await fetch(files[id])).blob();await FDB.put(id,b);nf++;}catch(e){}}
      D=o;runMigrations();S.kid=null;S.tid=null;S.view="uebersicht";render();return toast(L("Sicherung geladen","Backup restored")+(nf?" · "+nf+L(" Dokumente"," documents"):""));}
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
  /* the backup carries the documents too (as data URLs), so a restore on another device is complete */
  async "backup"(){S.sheet=null;renderOverlay();const files={};
    for(const d of DOCS()){try{const b=await FDB.get(d.id);if(b)files[d.id]=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.onerror=()=>r(null);fr.readAsDataURL(b);});}catch(e){}}
    saveBlob("arkitecton-sicherung-"+iso(TODAY)+".json",new Blob([JSON.stringify(Object.assign({},D,{files}))],{type:"application/json"}));},
  "x-report"(){const rows=budgetRows(),t=totals(rows),fc=r2(rows.reduce((a,r)=>a+r.forecast,0)),fcL=(P()||{}).closed?L("Endkosten CHF","Final cost CHF"):L("Prognose CHF","Forecast CHF"),body=rows.map(r=>[r.b.bkp,tx(r.b),r.b.kv||0].concat(t.rev?[r.kv]:[],[r.awarded,r.billed,r.forecast,r.rest]));body.push(["","Total",t.kv0].concat(t.rev?[t.kv]:[],[t.awarded,t.billed,fc,t.rest]));
    wbSave("Kostenuebersicht-"+pslug()+".xlsx",[{name:L("Kostenübersicht","Cost overview"),widths:[8,30,18,16,16,16,16,16],rows:headRows(L("Kostenübersicht für die Bauherrschaft","Cost overview for the client")).concat([["BKP",L("Arbeitsgattung","Trade"),L("Kostenvoranschlag CHF","Estimate CHF")].concat(t.rev?[L("KV revidiert CHF","Revised estimate CHF")]:[],[L("Vergeben CHF","Awarded CHF"),L("Abgerechnet CHF","Billed CHF"),fcL,L("Reserve CHF","Reserve CHF")])],body)}]);},
  "x-budget"(){const rows=budgetRows(),t=totals(rows),body=rows.map(r=>[r.b.bkp,tx(r.b),r.kv,r.awarded,r.billed,r.paid,r.ret,r.open,r.rest]);body.push(["","Total",t.kv,t.awarded,t.billed,t.paid,t.ret,t.open,t.rest]);
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
