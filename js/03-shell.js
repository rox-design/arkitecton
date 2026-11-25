/* arkitecton · App shell (navigation, top bar), fee invoices, example projects, income. */
"use strict";

/* ---------- chrome ---------- */
const VIEWS=["buero","projekte","uebersicht","rechnungen","handwerker","budget","ausschreibungen","profil","einstellungen"];
const PVIEWS=["uebersicht","rechnungen","handwerker","budget"];
const NAV_ICO={
buero:'<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M10 20v-5h4v5"/>',
projekte:'<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/>',
uebersicht:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
rechnungen:'<path d="M6.5 3h8l3.5 3.5V21h-11.5Z"/><path d="M14 3v4h4"/><path d="M9.5 11.5h5"/><path d="M9.5 15h5"/>',
handwerker:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20.5c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
budget:'<path d="M4 20h16"/><path d="M7 20v-6"/><path d="M12 20V8"/><path d="M17 20v-9"/>',
ausschreibungen:'<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
profil:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.6-1.7 1.8-2.5 3.2-2.5s2.6.8 3.2 2.5"/><path d="M14.5 10h3.5M14.5 13.5h3.5"/>',
einstellungen:'<g stroke-width="1.35"><path d="M4 6.5h2.4M10.6 6.5H20"/><circle cx="8.5" cy="6.5" r="2.1"/><path d="M4 12h9.4M17.6 12H20"/><circle cx="15.5" cy="12" r="2.1"/><path d="M4 17.5h4.9M13.1 17.5H20"/><circle cx="11" cy="17.5" r="2.1"/></g>',
scan:'<path d="M3.5 7.5v-3a1 1 0 0 1 1-1h3"/><path d="M16.5 3.5h3a1 1 0 0 1 1 1v3"/><path d="M20.5 16.5v3a1 1 0 0 1-1 1h-3"/><path d="M7.5 20.5h-3a1 1 0 0 1-1-1v-3"/><rect x="7" y="7" width="4" height="4" rx=".6"/><rect x="13" y="7" width="4" height="4" rx=".6"/><rect x="7" y="13" width="4" height="4" rx=".6"/><path d="M13.5 13.5h1.2v1.2h-1.2zM16 16h1v1h-1zM13.5 16.3h.9"/>',
pin:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15"/>'};
/* one rail row: the link plus quick actions that appear on hover (desktop) */
const NAV_PLUS=()=>({ausschreibungen:["form","tender",L("Ausschreibung erfassen","Add tender")],uebersicht:["form-project","",L("Projekt erfassen","Add project")],rechnungen:["capture","",L("QR scannen","Scan QR")],handwerker:["form","contractor",L("Handwerker erfassen","Add contractor")],budget:["form","bkp",L("BKP-Position erfassen","Add BKP item")]});
const NAV_MORE=()=>({uebersicht:L("Projekt bearbeiten, Kostenübersicht","Edit project, cost overview"),rechnungen:L("Ohne QR, Honorar, Excel","Without QR, fee, Excel"),handwerker:L("Importieren, Excel","Import, Excel"),budget:L("Excel-Auswertungen","Excel reports"),ausschreibungen:L("Excel-Listen","Excel lists")});
function navRow(v,extra=""){const pl=NAV_PLUS()[v],mo=NAV_MORE()[v];
  return `<div class="nrow" style="--na:${(pl?24:0)+(mo?24:0)}px"><button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${navIco(v)}<span>${vName(v)}</span>${extra}</button><span class="nact">${pl?`<button type="button" class="na" data-act="${pl[0]}"${pl[1]?` data-f="${pl[1]}"`:""} data-tip="${pl[2]}" aria-label="${pl[2]}">+</button>`:""}${mo?`<button type="button" class="na" data-act="nmore" data-v="${v}" data-tip="${mo}" aria-label="${L("Weitere Aktionen","More actions")}">···</button>`:""}</span></div>`;}
const navIco=v=>`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICO[v]}</svg>`;
const vName=v=>({buero:"Home",projekte:L("Projekte","Projects"),uebersicht:L("Projekt","Project"),rechnungen:L("Rechnungen","Invoices"),handwerker:L("Handwerker","Contractors"),budget:"Budget",ausschreibungen:L("Ausschreibungen","Tenders"),profil:L("Büroprofil","Office profile"),einstellungen:L("Einstellungen","Settings")})[v];
function renderChrome(){
  document.documentElement.lang=S.lang;
  const p=P();
  const rs=document.getElementById("railScan");if(rs)rs.innerHTML=`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_ICO.scan}</svg><span>${L("QR scannen","Scan QR")}</span>`;if(rs)rs.setAttribute("aria-label",L("QR scannen","Scan QR"));
  const firmLvl=S.view==="buero"||S.view==="ausschreibungen"||S.view==="profil"||S.view==="einstellungen",tp=document.getElementById("topProj");tp.innerHTML=esc(firmLvl?(S.view!=="buero"?vName(S.view):((D.firm&&D.firm.name)||L("Büroname ergänzen","Add firm name"))):(p?p.name:L("Kein Projekt","No project")));
  const sw=!firmLvl&&S.view!=="uebersicht";
  if(sw){tp.innerHTML+='<span class="cv" aria-hidden="true">⌄</span>';tp.dataset.act="sheet";tp.dataset.k="projects";tp.setAttribute("aria-haspopup","dialog");tp.title=L("Projekt wechseln","Switch project");}
  else{tp.dataset.act="home";tp.removeAttribute("aria-haspopup");tp.title="";}
  const stat=!sw; /* the name is only a button where it switches projects; the logo is the way Home */tp.classList.toggle("static",stat);tp.tabIndex=stat?-1:0;
  document.querySelector(".topbar").classList.toggle("home",firmLvl);
  const fn=(D.firm&&D.firm.name)||L("Büroname ergänzen","Add firm name");["railFirm","topFirm"].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent=fn;e.title=L("Alle Projekte","All projects");e.setAttribute("aria-current",S.view==="buero"?"page":"false");}});
  const min=navMode()==="min";document.getElementById("app").classList.toggle("rail-min",min);
  document.getElementById("footNav").innerHTML=`<button type="button" data-act="nav" data-v="einstellungen"${S.view==="einstellungen"?' aria-current="page"':""}>${navIco("einstellungen")}<span>${vName("einstellungen")}</span></button><button type="button" class="pinb" data-act="nav-mode" data-v="${min?"open":"min"}" title="${min?L("Leiste fest offen lassen","Keep the bar open"):L("Leiste einklappen","Collapse the bar")}">${navIco("pin")}<span>${min?L("Leiste fixieren","Keep open"):L("Einklappen","Collapse")}</span></button>`;
  document.querySelectorAll(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.l===S.lang)));
  const cp=P(),open=!!S.projOpen;
  const plist=open?activeProjects().map(x=>`<div class="nrow prow${x.id===D.pid?" cur":""}"><button type="button" data-act="pick-project" data-id="${x.id}"><span class="pi" aria-hidden="true">${x.fav?"★":"·"}</span><span>${esc(x.name)}</span></button><span class="nact"><button type="button" class="na" data-act="pmore" data-id="${x.id}" data-tip="${L("Favorit, umbenennen, Papierkorb","Favourite, rename, bin")}" aria-label="${L("Weitere Aktionen","More actions")}">···</button></span></div>`).join("")+`<div class="nrow prow"><button type="button" data-act="form-project"><span class="pi" aria-hidden="true">+</span><span>${L("Projekt erfassen","Add project")}</span></button></div>`:"";
  const tog=(cp||D.projects.length)?`<span class="chev" role="button" tabindex="0" data-act="ptoggle" aria-expanded="${open}" aria-label="${open?L("Projektliste schliessen","Close project list"):L("Alle Projekte anzeigen","Show all projects")}" data-tip="${open?L("Projektliste schliessen","Close project list"):L("Alle Projekte anzeigen","Show all projects")}">›</span>`:"";
  document.getElementById("nav").innerHTML=NAVD?"":["uebersicht","rechnungen","handwerker","budget"].map(v=>navRow(v)).join("");void tog;void plist;
  /* draft: one level for the whole office; a project's parts are tabs inside the project */
  const navCur=v=>v==="projekte"?(S.view==="projekte"||PVIEWS.includes(S.view)):v==="profil"?(S.view==="profil"||S.view==="einstellungen"):S.view===v;
  const fnv=document.getElementById("firmNav");if(fnv)fnv.innerHTML=NAVD?["buero","projekte","ausschreibungen","profil"].map(v=>`<div class="nrow"><button type="button" data-act="nav" data-v="${v}"${navCur(v)?' aria-current="page"':""}>${navIco(v)}<span>${vName(v)}</span></button></div>`).join(""):navRow("buero")+navRow("ausschreibungen")+navRow("profil");
  document.getElementById("app").classList.toggle("navd",NAVD);
  const tb=(v,l)=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${navIco(v)}<span>${l}</span></button>`;
  const firmTabs=["buero","ausschreibungen","einstellungen"].includes(S.view);
  /* one tab bar everywhere; Home is the logo and firm name at the top */
  const tbd=v=>`<button type="button" data-act="nav" data-v="${v}"${navCur(v)?' aria-current="page"':""}>${navIco(v)}<span>${vName(v)}</span></button>`;
  document.getElementById("tabbar").innerHTML=(NAVD?["buero","projekte","ausschreibungen","profil"].map(tbd).join(""):tb("ausschreibungen",L("Ausschreibungen","Tenders"))+tb("uebersicht",L("Projekt","Project"))+tb("rechnungen",L("Rechnungen","Invoices"))+tb("handwerker",L("Handwerker","Contractors"))+tb("budget","Budget"))+(S.view==="rechnungen"&&S.rtab!=="deb"?`<button type="button" class="tabscan" data-act="scan-menu" aria-label="${L("Scannen: QR-Rechnung oder Dokument","Scan: QR-bill or document")}" title="${L("Scannen","Scan")}">${navIco("scan")}</button>`:"");
  document.querySelector(".topbar").classList.toggle("is-home",S.view==="buero");void firmTabs;
  const ts=document.getElementById("topSet");if(ts){ts.innerHTML=navIco("einstellungen");ts.setAttribute("aria-label",L("Einstellungen","Settings"));ts.title=L("Einstellungen","Settings");ts.setAttribute("aria-current",S.view==="einstellungen"?"page":"false");}
}
/* draft: inside a project the project name (tap to switch) and its four parts as tabs, like Airbnb's top categories */
const pTabs=()=>{const p=P();if(!NAVD||!p||!PVIEWS.includes(S.view))return "";
  return `<div class="pbar"><button type="button" class="pbname" data-act="sheet" data-k="projects" aria-haspopup="dialog" title="${L("Projekt wechseln","Switch project")}">${esc(p.name)}<span class="cv" aria-hidden="true">⌄</span></button>${[p.place,p.desc].filter(Boolean).length?`<div class="pbsub">${esc([p.place,p.desc].filter(Boolean).join(" · "))}</div>`:""}
  <nav class="pseg" aria-label="${L("Teile des Projekts","Project parts")}">${PVIEWS.map(v=>`<button type="button" data-act="nav" data-v="${v}"${S.view===v?' aria-current="page"':""}>${navIco(v)}<span>${v==="uebersicht"?L("Übersicht","Overview"):vName(v)}</span></button>`).join("")}</nav></div>`;};
const draftBar=()=>NAVD?`<div class="draftbar"><span><b>${L("Entwurf","Draft")}</b> · ${L("neue Navigation","new navigation")}</span><a href="?entwurf=aus${location.hash}">${L("Entwurf beenden","End draft")}</a></div>`:"";
const ph=(eyebrow,title,lead,tools)=>(NAVD&&PVIEWS.includes(S.view)?(draftBar()+pTabs()+phx("",S.view==="uebersicht"&&P()&&title===esc(P().name)?L("Übersicht","Overview"):title,lead,tools)):draftBar()+phx(eyebrow,title,lead,tools));
const phx=(eyebrow,title,lead,tools)=>`<header class="ph">${P()&&eyebrow===esc(P().name)?`<button type="button" class="eyebrow pname" data-act="sheet" data-k="projects" aria-haspopup="dialog" title="${L("Projekt wechseln","Switch project")}">${eyebrow}<span class="cv" aria-hidden="true">⌄</span></button>`:`<span class="eyebrow">${eyebrow}</span>`}<h1>${title}</h1>${tools?`<div class="tools">${tools}</div>`:"<span></span>"}${lead?`<p class="lead">${lead}</p>`:""}</header>`;
const ICO={
profil:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.6-1.7 1.8-2.5 3.2-2.5s2.6.8 3.2 2.5"/><path d="M14.5 10h3.5M14.5 13.5h3.5"/>',
spark:'<path d="M12 3.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z"/><path d="M18.5 14.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z"/>',
undo:'<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H12"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
share:'<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
edit:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14 7 3 3"/>',
trash:'<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/>',
flag:'<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
more:'<circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
download:'<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;
const ibl=(n,label,attrs,short)=>`<button type="button" class="ibl" title="${label}" ${attrs||""}>${ico(n)}<span>${short||label}</span></button>`;
const ib=(n,label,attrs)=>`<button type="button" class="ib" title="${label}" aria-label="${label}" ${attrs||""}>${ico(n)}</button>`;
const excelBtn=key=>`<button type="button" class="ib" title="${L("Weitere Aktionen","More actions")}" aria-label="${L("Weitere Aktionen","More actions")}" data-act="sheet" data-k="${key}">${ico("more")}</button>`;
const noProject=()=>`<div class="page">${ph("",L("Noch kein Projekt","No project yet"),"")}<div class="empty"><span>${L("Legen Sie Ihr erstes Projekt an.","Create your first project.")}</span><button type="button" class="btn primary" data-act="form" data-f="project">${L("Projekt anlegen","Create project")}</button></div></div>`;

/* ---------- views ---------- */
function viewWelcome(){
  return `<div class="welcome"><div class="box">
    <div class="word"><svg viewBox="0 0 30 30" aria-hidden="true" style="width:26px;height:26px"><rect class="mk-ink" x="3" y="20" width="24" height="7"/><rect class="mk-ink" x="7" y="9" width="9" height="11"/><rect class="mk-ink" x="16" y="14" width="7" height="6"/><rect class="mk-red" x="16" y="3" width="6" height="6"/></svg>arkitecton</div>
    <h1>${L("Bauadministration, die mitdenkt.","Construction admin that thinks along.")}</h1>
    ${CORRUPT?`<div class="notice"><span class="ic crit" aria-hidden="true">!</span><span>${L("Der gespeicherte Stand liess sich nicht lesen. Er ist nicht gelöscht, sondern als Kopie aufbewahrt. Laden Sie Ihre letzte Sicherung oder laden Sie die Kopie herunter, damit sie gerettet werden kann.","The saved state could not be read. It was kept as a copy. Restore your last backup, or download the copy so it can be recovered.")}</span></div>
    <div class="acts"><label class="btn block">${L("Sicherung laden","Restore backup")}<input type="file" accept=".json" data-imp="backup" hidden></label><button type="button" class="btn block" data-act="dl-bad">${L("Kopie herunterladen","Download the copy")}</button></div>`:""}
    <div class="acts">
      <button type="button" class="btn primary block" data-act="start-example">${L("Mit Beispielprojekt starten","Start with an example project")}</button>
      <button type="button" class="btn block" data-act="start-empty">${L("Leer starten","Start empty")}</button>
    </div>
    <span class="fine">${L("Testversion. Ihre Daten bleiben in diesem Browser auf diesem Gerät.","Test version. Your data stays in this browser on this device.")}</span>
  </div></div>`;
}

/* ---------- fee invoices (Debitoren) ---------- */
const VAT_RATE=8.1;
const nf1=v=>new Intl.NumberFormat("de-CH",{minimumFractionDigits:1,maximumFractionDigits:1}).format(v);
const VAT_RATES=()=>[[8.1,L("Normalsatz","Standard rate")],[3.8,L("Sondersatz Beherbergung","Accommodation rate")],[2.6,L("Reduzierter Satz","Reduced rate")]];
const vrate=f=>f&&f.vat?(f.vatRate||VAT_RATE):0;
const vatSelVal=()=>{const e=document.getElementById("fVatSel");const v=e?+e.value:0;return {vat:v>0,vatRate:v>0?v:null};};
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
const feeVat=f=>f.vat?r2(feeSub(f)*vrate(f)/100):0;
const feeTotal=f=>r05(feeSub(f)+feeVat(f));
const feeDue=f=>addDays(f.date,f.term||30);
const feeAge=f=>-daysTo(f.date);
const remDue=f=>{if(f.paid)return 0;const a=feeAge(f),rm=SET().rem,lvl=a>=rm[2]?3:a>=rm[1]?2:a>=rm[0]?1:0,sent=(f.rem||[]).length;return lvl>sent&&sent<3?sent+1:0;};
const remName=n=>[L("1. Mahnung","1st reminder"),L("2. Mahnung","2nd reminder"),L("Letzte Mahnung","Final reminder")][n-1];
function feeState(f){
  if(f.paid) return {c:"ok",t:L("Bezahlt","Paid")};
  const r=remDue(f); if(r) return {c:"crit",t:remName(r)+L(" fällig"," due")};
  const sent=(f.rem||[]).length; if(sent) return {c:"warn",t:remName(sent)+L(" erstellt"," created"),d:f.rem[sent-1].d};
  const d=daysTo(feeDue(f)); return {c:d<0?"warn":"n",t:dueText(d)};
}
const firmMissing=()=>{const f=D.firm||{},m=[];if(!f.name)m.push(L("Name","name"));if(!f.street||!f.zip||!f.city)m.push(L("Adresse","address"));if(!ibanValid(f.iban||""))m.push("IBAN");if(f.vat&&!f.vatNo)m.push(L("MWST-Nummer","VAT number"));return m;};
const nextFeeNo=()=>{const y=TODAY.getFullYear(),n=FEES().filter(f=>String(f.no).startsWith(y+"-")).reduce((a,f)=>Math.max(a,parseInt(String(f.no).slice(5),10)||0),0)+1;return y+"-"+String(n).padStart(3,"0");};
const splitStreet=s=>{const m=String(s||"").trim().match(/^(.*?)\s+(\d+\s?[a-zA-Z]?)$/);return m?[m[1],m[2].replace(/\s/g,"")]:[String(s||"").trim(),""];};

function addDemoFees(){const pidKeep=D.pid;if(!D.projects.some(p=>p.id===D.pid)&&D.projects[0])D.pid=D.projects[0].id;

      const F=D.firm;if(!F.street){Object.assign(F,{street:"Zugerstrasse 18",zip:"8820",city:"Wädenswil"});}if(!ibanValid(F.iban||"")){F.iban="CH6700700110004357712";}if(!F.email)F.email="info@beispiel-architekten.example";if(!F.phone)F.phone="044 780 12 34";if(F.vat===undefined){F.vat=true;F.vatNo="CHE-123.456.788 MWST";}
      const p=P();if(p&&!p.ccity){Object.assign(p,{cstreet:p.cstreet||"Rebhalde 5",czip:"8820",ccity:p.place||"Wädenswil",client:p.client||"Familie Graf"});}
      const ad=n=>addDays(iso(TODAY),n);
      const mk=(no,days,title,lines,paid)=>{const r=makeRef(no),f={id:newId("h"),pid:D.pid,no,date:ad(days),title,lines,vat:!!F.vat,refType:r.type,ref:r.ref,rem:[],paid:paid?ad(paid):null,log:[{d:ad(days),t:L("Erstellt","Created")}]};if(paid)f.log.push({d:ad(paid),t:L("Zahlung eingegangen","Payment received")});FEES().push(f);};
      mk("2026-011",-150,L("Honorar Akonto 1, Vorprojekt","Fee progress payment 1"),[{t:L("Akonto 1, Phase Vorprojekt","Progress payment 1"),q:1,u:L("pauschal","lump sum"),p:24000}],-122);
      mk("2026-014",-66,L("Honorar Akonto 2, Bauprojekt","Fee progress payment 2"),[{t:L("Akonto 2, Phase Bauprojekt","Progress payment 2"),q:1,u:L("pauschal","lump sum"),p:31000}],0);
      mk("2026-017",-12,L("Honorar Bauleitung Oktober","Site supervision October"),[{t:L("Bauleitung","Site supervision"),q:38,u:"h",p:145},{t:L("Nebenkosten, Fahrten","Expenses, travel"),q:1,u:L("pauschal","lump sum"),p:240}],0);
      D.pid=pidKeep;}
/* ---------- example invoices for an empty project ---------- */
function seedProjectDemo(p){
  const ad=n=>addDays(iso(TODAY),n);
  const KS=[["Holzbau Ammann AG","Seestrasse 55","8805","Richterswil","CH47 0070 0110 0055 6677 8"],["Dachtechnik Wyss GmbH","Gewerbestrasse 12","8804","Au ZH","CH12 0900 0000 8044 1122 3"],["Elektro Brunner AG"],["Sanitär Huber & Co."],["Meier Malerei GmbH"]];
  const kid=([n,st,z,c,iban])=>{let k=D.contractors.find(x=>x.name===n);if(!k){k={id:newId("k"),name:n,street:st||"",zip:z||"",city:c||"",iban:iban||"",email:"",phone:""};D.contractors.push(k);}return k.id;};
  const plan=[["214",kid(KS[0]),186000],["224",kid(KS[1]),64500],["230",kid(KS[2]),52800],["250",kid(KS[3]),71400],["285",kid(KS[4]),23900]];
  if(!(p.budget||[]).length)p.budget=plan.map(([b,,sum])=>{const s=STD_BKP.find(x=>x[0]===b)||[b,"BKP "+b,"BKP "+b];return {bkp:b,de:s[1],en:s[2],kv:Math.round(sum*1.06/1000)*1000};});
  const o=D.contracts.length*3;
  const W_=plan.map(([b,k,sum])=>{const w={id:newId("w"),pid:p.id,k,bkp:b,sum,ret:SET().ret};D.contracts.push(w);return w;});
  const ref=n=>"21 00000 00012 "+String(40000+n).padStart(5,"0")+" 20260 "+String(10000+n*7).slice(-5);
  const inv=(w,no,type,n,day,gross,status)=>D.invoices.push({id:newId("i"),no,w:w.id,type,n,date:ad(day),due:ad(day+30),gross,status,ref:ref(D.invoices.length)});
  inv(W_[0],"HA-2026-"+(311+o),"akonto",1,-96,60000,"bezahlt");
  inv(W_[0],"HA-2026-"+(388+o),"akonto",2,-38,55000,"bezahlt");
  inv(W_[0],"HA-2026-"+(421+o),"akonto",3,-6,42000,"pruefen");
  inv(W_[1],"DW-"+(1407+o),"akonto",1,-27,25000,"frei");
  inv(W_[1],"DW-"+(1433+o),"regie",0,-4,2860,"pruefen");
  inv(W_[2],"EB-"+(1203+o),"akonto",1,-16,18000,"rueckfrage");
  inv(W_[3],"2026/"+(1011+o),"akonto",1,-9,24000,"pruefen");
  if(!p.client){Object.assign(p,{client:"Bauherrschaft "+p.name,cstreet:p.cstreet||"",czip:p.czip||"",ccity:p.ccity||p.place||""});}
  const mk=(no,day,title,lines,paid)=>{const r=makeRef(no),f={id:newId("h"),pid:p.id,no,date:ad(day),title,lines,vat:!!D.firm.vat,vatRate:8.1,refType:r.type,ref:r.ref,rem:[],paid:paid?ad(day+paid):null,log:[{d:ad(day),t:L("Erstellt","Created")}]};if(paid)f.log.push({d:ad(day+paid),t:L("Zahlung eingegangen","Payment received")});FEES().push(f);};
  const y=TODAY.getFullYear(),nx=()=>{const n=FEES().filter(f=>String(f.no).startsWith(y+"-")).reduce((a,f)=>Math.max(a,parseInt(String(f.no).slice(5),10)||0),0)+1;return y+"-"+String(n).padStart(3,"0");};
  mk(nx(),-110,L("Honorar Akonto 1, Vorprojekt","Fee progress payment 1"),[{t:L("Akonto 1, Phase Vorprojekt","Progress payment 1, preliminary design"),q:1,u:L("pauschal","lump sum"),p:18500}],26);
  mk(nx(),-48,L("Honorar Akonto 2, Bauprojekt","Fee progress payment 2"),[{t:L("Akonto 2, Phase Bauprojekt","Progress payment 2, design"),q:1,u:L("pauschal","lump sum"),p:22000}],0);
  mk(nx(),-9,L("Honorar Bauleitung Oktober","Site supervision October"),[{t:L("Bauleitung","Site supervision"),q:26,u:"h",p:145}],0);
}
/* example: a finished public project (municipality), everything billed and paid; the municipality holds 10 % retention, released with each final invoice */
function seedClosedDemo(p){
  const ad=n=>addDays(iso(TODAY),n);
  const kid=(n,st,z,c,iban,em,ph)=>{let k=D.contractors.find(x=>x.name===n);if(!k){k={id:newId("k"),name:n,street:st||"",zip:z||"",city:c||"",iban:iban||"",email:em||"",phone:ph||""};D.contractors.push(k);}return k.id;};
  const cat=c=>{const s=STD_BKP.find(x=>x[0]===c);return s?[s[1],s[2]]:[bkpCat(c)||"BKP "+c,bkpCat(c)||"BKP "+c];};
  Object.assign(p,{client:p.client||"Gemeinde Wädenswil",cstreet:p.cstreet||"Florhofstrasse 3",czip:p.czip||"8820",ccity:p.ccity||"Wädenswil"});
  /* [bkp, cost estimate, contractor, contract sum, akonto amounts, final invoice] */
  const plan=[
    ["112",28000,["Abbruch Huber AG","Industriestrasse 4","8820","Wädenswil","CH44 0070 0110 0032 1144 2","info@abbruch-huber.example","044 780 22 10"],26500,[],26500],
    ["211",640000,["Keller Bau AG"],618000,[180000,200000,160000],86400],
    ["221",118000,["Fenster Frei AG"],121400,[60000],63900],
    ["230",96000,["Elektro Brunner AG"],92300,[40000,35000],18100],
    ["250",104000,["Sanitär Huber & Co."],99800,[45000,40000],15600],
    ["271",52000,["Gipserei Rossi GmbH"],50600,[30000],21300],
    ["285",41000,["Meier Malerei GmbH"],39200,[20000],19900],
    ["421",36000,["Gartenbau Zollinger AG","Rietstrasse 21","8804","Au ZH","CH61 0900 0000 8711 2233 9","office@zollinger-garten.example","044 781 45 60"],34800,[],35400]];
  p.budget=plan.map(([b,kv])=>{const [de,en]=cat(b);return {bkp:b,de,en,kv};}).concat([["511","Bewilligungen, Baugespann, Gebühren","Permits, fees",14500],["531","Bauzeitversicherungen","Construction insurance",7200]].map(([bkp,de,en,kv])=>({bkp,de,en,kv})));
  let day=-560,n=0;const ref=()=>"21 00000 00031 "+String(52000+(++n)*37).padStart(5,"0")+" 20250 "+String(30000+n*11).slice(-5);
  plan.forEach(([b,,k,sum,ak,fin],j)=>{const w={id:newId("w"),pid:p.id,k:kid(...k),bkp:b,sum,ret:10};D.contracts.push(w);
    const pre=["AB","KB","FF","EB","SH","GR","MM","GZ"][j];let d=day+j*12;
    ak.forEach((g,x)=>{D.invoices.push({id:newId("i"),no:pre+"-"+(2025)+"-"+String(100+j*10+x),w:w.id,type:"akonto",n:x+1,date:ad(d),due:ad(d+30),gross:g,status:"bezahlt",ref:ref()});d+=55;});
    D.invoices.push({id:newId("i"),no:pre+"-"+(2025)+"-"+String(190+j),w:w.id,type:"schluss",n:0,date:ad(d+20),due:ad(d+50),gross:fin,status:"bezahlt",ref:ref()});});
  /* fees: SIA phases billed and paid, final fee invoice included */
  const byY={};FEES().forEach(f=>{const y=String(f.no).slice(0,4);byY[y]=Math.max(byY[y]||0,parseInt(String(f.no).slice(5),10)||0);});
  const fee=(day,title,lines,paidAfter)=>{const y=String(ad(day)).slice(0,4);byY[y]=(byY[y]||0)+1;const no=y+"-"+String(byY[y]).padStart(3,"0"),r=makeRef(no);
    FEES().push({id:newId("h"),pid:p.id,no,date:ad(day),title,lines,vat:!!D.firm.vat,vatRate:8.1,refType:r.type,ref:r.ref,rem:[],paid:ad(day+paidAfter),log:[{d:ad(day),t:L("Erstellt","Created")},{d:ad(day+paidAfter),t:L("Zahlung eingegangen","Payment received")}]});};
  fee(-640,L("Honorar Vorprojekt","Fee preliminary design"),[{t:L("Phase Vorprojekt","Preliminary design"),q:1,u:L("pauschal","lump sum"),p:24000}],28);
  fee(-560,L("Honorar Bauprojekt und Bewilligung","Fee design and permit"),[{t:L("Phase Bauprojekt und Bewilligungsverfahren","Design and permit"),q:1,u:L("pauschal","lump sum"),p:31000}],30);
  fee(-470,L("Honorar Ausschreibung","Fee tendering"),[{t:L("Phase Ausschreibung","Tendering"),q:1,u:L("pauschal","lump sum"),p:19500}],25);
  fee(-330,L("Honorar Ausführung, Akonto","Fee execution, progress payment"),[{t:L("Bauleitung","Site supervision"),q:180,u:"h",p:145}],31);
  fee(-210,L("Honorar Schlussrechnung","Final fee invoice"),[{t:L("Bauleitung und Abschluss","Site supervision and completion"),q:120,u:"h",p:145},{t:L("Schlussabrechnung und Dokumentation","Final account and documentation"),q:1,u:L("pauschal","lump sum"),p:6500}],29);
}
/* closed example: permit fees and construction insurance were paid too, by invoice from the municipality and the insurer */
function seedClosedFees(p){
  const ad=n=>addDays(iso(TODAY),n);
  const mk=(bkp,name,st,z,c,iban,sum,day,no,em)=>{let k=D.contractors.find(x=>x.name===name);if(!k){k={id:newId("k"),name,street:st,zip:z,city:c,iban,email:em||"",phone:""};D.contractors.push(k);}
    const w={id:newId("w"),pid:p.id,k:k.id,bkp,sum,ret:0};D.contracts.push(w);D.invoices.push({id:newId("i"),no,w:w.id,type:"schluss",n:0,date:ad(day),due:ad(day+30),gross:sum,status:"bezahlt",ref:""});};
  mk("511","Gemeinde Wädenswil, Bauamt","Florhofstrasse 3","8820","Wädenswil","CH09 0070 0110 0001 2345 6",13860,-600,"BA-2025-0412","bauamt@waedenswil.example");
  mk("531","Bauversicherung Zürichsee AG","Seestrasse 101","8810","Horgen","CH27 0900 0000 8765 4321 0",7050,-590,"POL-77310","schaden@bauversicherung-zs.example");
}
/* ---------- income picture ---------- */
function addIncomeHistory(){
  const ps=D.projects.slice(0,2);if(!ps.length)return;
  const ad=n=>addDays(iso(TODAY),n);
  const plan=[[-340,14500,28],[-312,9800,35],[-280,21000,24],[-255,6400,41],[-226,18200,30],[-198,12600,27],[-170,24500,33],[-140,8900,45],[-110,16700,29],[-84,11200,38],[-48,19400,26],[-36,7300,0]];
  plan.forEach(([d,amt,pay],k)=>{const p=ps[k%ps.length],no="2026-H"+String(k+1).padStart(2,"0");if(FEES().some(f=>f.no===no))return;const r=makeRef(no);
    const f={id:newId("h"),pid:p.id,no,date:ad(d),title:k%3===2?L("Honorar Bauleitung","Site supervision"):L("Honorar Akonto","Fee progress payment"),lines:[{t:k%3===2?L("Bauleitung","Site supervision"):L("Akonto, Teilleistung","Progress payment"),q:1,u:L("pauschal","lump sum"),p:amt}],vat:!!D.firm.vat,refType:r.type,ref:r.ref,rem:[],paid:pay?ad(d+pay):null,log:[{d:ad(d),t:L("Erstellt","Created")}]};
    if(pay)f.log.push({d:ad(d+pay),t:L("Zahlung eingegangen","Payment received")});FEES().push(f);});
}
