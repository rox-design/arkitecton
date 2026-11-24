/* arkitecton · Events, gestures, tooltips and start-up (loaded last). */
"use strict";

/* ---------- events ---------- */
let toastT;
/* undo: a snapshot of the data is taken right before an action that changes or deletes something.
   Files of deleted documents are only removed once the undo is no longer possible. */
let undoSnap=null;
function snap(){undoCommit();undoSnap={d:JSON.stringify(D),files:[]};}
function undoCommit(){if(undoSnap){undoSnap.files.forEach(f=>FDB.del(f));undoSnap=null;}}
function fileDel(id){if(undoSnap)undoSnap.files.push(id);else FDB.del(id);}
/* after a save was refused (another window changed the data), success messages of that same action must not appear */
let toastLock=0;
function toast(msg,ms,hint,undo){if(Date.now()<toastLock&&!String(msg).startsWith(L("Nicht gespeichert","Not saved")))return;const t=document.getElementById("toast");if(hint)t.dataset.hint="1";else delete t.dataset.hint;t.classList.toggle("top",!!document.querySelector("#overlay.on"));
  if(undo&&undoSnap){t.innerHTML=`<span>${esc(msg)}</span><button type="button" class="tundo" data-act="undo">${ico("undo")}${L("Rückgängig","Undo")}</button>`;t.classList.add("withundo");}else{t.textContent=msg;t.classList.remove("withundo");}
  t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>{t.classList.remove("on");if(undo)undoCommit();},ms||(undo?7000:3000));}
async function copy(text,ok){try{await navigator.clipboard.writeText(text);toast(ok);}catch(e){toast(L("Kopieren nicht möglich","Copy failed"));}}
/* payout explanation: open the one under the clicked ⓘ, close the others; only classes change */
function calcTip(btn,on){const box=btn.closest(".calc3");if(!box)return;
  box.querySelectorAll(".cinfo").forEach(b=>{const o=on&&b===btn;b.classList.toggle("on",o);b.setAttribute("aria-expanded",o);const x=box.querySelector("#cx-"+b.dataset.k);if(x)x.classList.toggle("on",o);});}
function closeAll(){stopCam();dstopCam();S.dscan=null;S.bulk=null;S.kvx=null;S.fdrawer=null;S.drawer=null;S.modal=null;S.sheet=null;S.form=null;S.formErr="";S.confirm=null;S.queryOpen=false;S.done=null;}
const startView=v=>{S.from=null;S.kid=null;S.wid=null;S.tid=null;S.mid=null;S.cmpBack=null;
  if(v==="rechnungen"){S.rtab="kred";S.filter="pruefen";S.ffilter="open";}
  if(v==="handwerker")S.kfilter="";if(v==="budget")S.bfilter="";if(v==="ausschreibungen"){S.tfilter="open";}if(v==="profil")S.pfilter="refs";};
const fromHere=target=>{S.from=S.view!==target?{view:S.view,top:document.getElementById("main").scrollTop}:null;};
const backBtn=(act,label)=>S.from?`<button type="button" class="back" data-act="back-from">← ${vName(S.from.view)}</button>`:`<button type="button" class="back" data-act="${act}">← ${label}</button>`;
function go(v){if(!VIEWS.includes(v))v="uebersicht";closeAll();if(v!==S.view)S.mid=null;if(v!=="handwerker")S.cmpBack=null;S.view=v;if(v!=="handwerker")S.kid=null;if(v!=="ausschreibungen")S.tid=null;try{history.replaceState(null,"","#"+v);}catch(e){}render();document.getElementById("main").scrollTop=0;}
const openForm=(f,id,w)=>{const keepDrawer=S.drawer;closeAll();S.form={f,id:id||null,w:w||null,back:keepDrawer};renderOverlay();};

document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("site")&&S.kOpen)S.kOpen.ids[d.dataset.pid]=d.open;},true);
document.addEventListener("click",e=>{const lb=e.target.closest&&e.target.closest("label");const fi=lb&&lb.querySelector('input[type=file]');if(fi&&e.target!==fi){e.preventDefault();fi.click();}},true);
document.addEventListener("dragover",e=>{if(S.modal&&S.modal.step===1&&!S.modal.batch&&e.target.closest&&e.target.closest(".sheet")){e.preventDefault();e.target.closest(".sheet").classList.add("drop");}});
document.addEventListener("dragleave",e=>{const sh=e.target.closest&&e.target.closest(".sheet");if(sh&&!sh.contains(e.relatedTarget))sh.classList.remove("drop");});
document.addEventListener("drop",e=>{if(!(S.modal&&S.modal.step===1&&!S.modal.batch))return;const sh=e.target.closest&&e.target.closest(".sheet");if(!sh)return;e.preventDefault();sh.classList.remove("drop");const fs=[...((e.dataTransfer&&e.dataTransfer.files)||[])];if(fs.length>1)onScanFiles(fs);else if(fs[0])onScanFile(fs[0]);});
document.addEventListener("click",e=>{
  if(S.pop&&!e.target.closest("#pop")&&!e.target.closest('[data-act="nmore"],[data-act="pmore"]'))closePop();
  const el=e.target.closest("[data-act]");if(!el)return;
  if(el.closest("#pop")&&!["pask","nmore","pmore"].includes(el.dataset.act)){S.pop=null;S.pconfirm=null;renderPop();}
  const a=el.dataset.act,id=el.dataset.id;
  if(EXPORT[a])return void EXPORT[a](id);
  switch(a){
    case "start-example":D=seedExample();runMigrations();S.view="uebersicht";render();break;
    case "start-empty":D=seedEmpty();runMigrations();S.view="buero";render();openForm("firm");break;
    case "nav":startView(el.dataset.v);go(el.dataset.v);break;
    case "theme-set":setTheme(el.dataset.v);render();toast(L("Gespeichert","Saved"));break;
    case "nmore":case "pmore":{const r=el.getBoundingClientRect();S.pconfirm=null;S.pop={kind:a==="nmore"?"nav":"proj",key:a==="nmore"?el.dataset.v:id,rect:r,kb:e.detail===0};renderPop();return;}
    case "ptoggle":S.projOpen=!S.projOpen;renderChrome();break;
    case "pfav":{const p=D.projects.find(x=>x.id===id);if(p){p.fav=!p.fav;closePop();render();toast(p.fav?L("Zu Favoriten hinzugefügt","Added to favourites"):L("Aus Favoriten entfernt","Removed from favourites"));}break;}
    case "pask":S.pconfirm=id;renderPop();return;
    case "ptrash":{const p=D.projects.find(x=>x.id===id);trashProject(id);closePop();if(!D.pid)S.view="buero";render();toast((p?p.name:"")+L(" ist im Papierkorb. Wiederherstellen unter Einstellungen."," moved to the bin. Restore it under Settings."),6000);break;}
    case "trash-restore":{restoreTrash(id);S.confirm=null;render();toast(L("Wiederhergestellt","Restored"));break;}
    case "trash-purge":{const tp=(D.trash||[]).find(x=>x.id===id);if(tp){const ids=new Set([tp.p.id]),wk=new Set(tp.contracts.map(w=>w.id));D.docs=DOCS().filter(d=>!(d.scope==="project"&&ids.has(d.ref))&&!(d.scope==="contract"&&wk.has(d.ref)));setTimeout(sweepFiles,0);}D.trash=(D.trash||[]).filter(x=>x.id!==id);S.confirm=null;render();toast(L("Endgültig gelöscht","Deleted permanently"));break;}
    case "nav-mode":setNavMode(el.dataset.v||(navMode()==="min"?"open":"min"));renderChrome();if(S.view==="einstellungen")render();break;
    case "lang-set":if(el.dataset.v!==S.lang)exampleSwap(el.dataset.v);S.lang=el.dataset.v;try{localStorage.setItem("arkitecton:lang",S.lang);}catch(err){}render();break;
    case "lang":if(el.dataset.l!==S.lang)exampleSwap(el.dataset.l);S.lang=el.dataset.l;try{localStorage.setItem("arkitecton:lang",S.lang);}catch(err){}render();break;
    case "pfilter":S.pfilter=el.dataset.f;render();break;
    case "open-m":S.mid=id;render();document.getElementById("main").scrollTop=0;break;
    case "back-m":S.mid=null;render();break;
    case "tfilter":S.tfilter=el.dataset.f;render();break;
    case "fold":{const tmp=el.dataset.s==="t",st=tmp?(S.tfold||(S.tfold={})):foldGet(),k=el.dataset.k,sec=el.closest("section"),cl=!sec.classList.contains("folded");st[k]=cl;if(!tmp)try{localStorage.setItem(FOLDK,JSON.stringify(st));}catch(e){}sec.classList.toggle("folded",cl);el.setAttribute("aria-expanded",String(!cl));el.setAttribute("aria-label",(cl?L("Aufklappen: ","Expand: "):L("Zuklappen: ","Collapse: "))+sec.querySelector("h2").textContent.trim());break;}
    case "t-go":{const k=el.dataset.k;S.tfold=S.tfold||{};S.tfold["t:"+S.tid+":"+k]=false;render();const sec=document.querySelector('#main section[data-fk="'+k+'"]');if(sec){sec.scrollIntoView({behavior:"smooth",block:"start"});const f=sec.querySelector("input:not(:checked),button.row,button");if(f)setTimeout(()=>f.focus({preventScroll:true}),350);}break;}
    case "bfilter":S.bfilter=el.dataset.f;render();break;
    case "kfilter":S.kfilter=el.dataset.f;render();break;
    case "ffilter":S.ffilter=el.dataset.f;render();break;
    case "filter":S.filter=el.dataset.f;render();break;
    case "bkp-reset":delete D.bkpList;delete D.bkpListInfo;saveData();render();toast(L("Standardliste aktiv","Standard list active"));break;
    case "final-pdf":closeAll();renderOverlay();finalPDF().then(()=>toast(L("Bauabrechnung als PDF gespeichert","Construction account saved as PDF"))).catch(e=>{console.error(e);toast(L("PDF nicht möglich.","PDF failed."));});break;
    case "cost-pdf":closeAll();renderOverlay();costPDF().then(()=>toast(L("Kostenstand als PDF gespeichert","Cost status saved as PDF"))).catch(()=>toast(L("PDF nicht möglich.","PDF failed.")));break;
    case "pay-pdf-all":payPDFAll(PIx().filter(i=>i.status==="frei")).catch(()=>toast(L("PDF nicht möglich.","PDF failed.")));break;
    case "to-pay":startView("rechnungen");S.filter="zahlen";go("rechnungen");break;
    case "to-fees":S.rtab="deb";go("rechnungen");break;
    case "rtab":S.rtab=el.dataset.t;render();break;
    case "open-fee":closeAll();S.fdrawer=id;renderOverlay();break;
    case "fee-addline":readFeeLines();S.form.lines.push({t:"",q:1,u:L("pauschal","lump sum"),p:""});keepFeeFields(()=>renderOverlay());break;
    case "fee-delline":readFeeLines();S.form.lines.splice(+el.dataset.c,1);keepFeeFields(()=>renderOverlay());break;
    case "fee-paid":{snap();const f=FE(id);f.paid=iso(TODAY);logInv(f,L("Zahlung eingegangen","Payment received"));render();toast(L("Als bezahlt markiert","Marked as paid"),0,0,1);break;}
    case "fee-unpaid":{const f=FE(id);f.paid=null;logInv(f,L("Zahlung zurückgenommen","Payment undone"));render();break;}
    case "pay-pdf":{const i=INV(id);payPDF(i).then(()=>{if(!(i.log||[]).some(x=>x.t===L("Zahlungsempfehlung erstellt","Payment recommendation created"))){logInv(i,L("Zahlungsempfehlung erstellt","Payment recommendation created"));saveData();renderOverlay();}toast(L("Zahlungsempfehlung für die Bauherrschaft erstellt","Payment recommendation for the client created"));}).catch(()=>toast(L("PDF konnte nicht erstellt werden","Could not create the PDF")));break;}
    case "fee-pdf":{const f=FE(id);feePDF(f,0).then(()=>{if(!(f.log||[]).some(x=>x.t===L("PDF erstellt","PDF created"))){logInv(f,L("PDF erstellt","PDF created"));render();}}).catch(()=>toast(L("PDF konnte nicht erstellt werden","Could not create PDF")));break;}
    case "fee-remind":{const f=FE(id),n=remDue(f);if(!n)break;feePDF(f,n).then(()=>{(f.rem=f.rem||[]).push({n,d:iso(TODAY)});logInv(f,remName(n)+L(" erstellt"," created"));render();toast(remName(n)+L(" erstellt"," created"));}).catch(()=>toast(L("PDF konnte nicht erstellt werden","Could not create PDF")));break;}
    case "fee-demo":{addDemoFees();render();toast(L("3 Beispielrechnungen angelegt","3 example invoices added"));break;}
    case "fee-del":{snap();D.fees=FEES().filter(x=>x.id!==id);closeAll();render();toast(L("Rechnung gelöscht","Invoice deleted"),0,0,1);break;}
    case "logo-del":readFirmForm();delete D.firm.logo;renderOverlay();break;
    case "jump-flags":{S.allFlags=true;render();const f=document.getElementById("flags");if(f)f.scrollIntoView({behavior:"smooth",block:"start"});break;}
    case "all-flags":S.allFlags=!S.allFlags;render();break;
    case "open-inv":closeAll();S.drawer=id;renderOverlay();break;
    case "open-k":fromHere("handwerker");S.wid=null;S.kid=id;S.ktab="konto";go("handwerker");S.kid=id;render();break;
    case "open-cmp":{const w=W(id);if(!w)break;if(!S.drawer)fromHere("handwerker");S.cmpBack=S.drawer?{inv:S.drawer,view:S.view}:null;S.kid=w.k;S.ktab="vergleich";S.wid=w.id;go("handwerker");S.kid=w.k;S.wid=w.id;render();break;}
    case "kv-explain":closeAll();S.kvx=id;renderOverlay();break;
    case "kv-budget":closeAll();S.hl=id;go("budget");render();setTimeout(()=>{const e=document.querySelector('.brow[data-id="'+id+'"]');if(e)e.scrollIntoView({behavior:"smooth",block:"center"});},60);setTimeout(()=>{S.hl=null;},3000);break;
    case "open-w":S.wid=id;render();break;
    case "back-w":S.wid=null;S.cmpBack=null;render();break;
    case "back-inv":{const b=S.cmpBack;S.cmpBack=null;S.wid=null;S.kid=null;go(b?b.view:"rechnungen");if(b&&INV(b.inv)){S.drawer=b.inv;renderOverlay();}break;}
    case "back-k":S.kid=null;S.wid=null;S.cmpBack=null;render();break;
    case "ktab":S.ktab=el.dataset.t;S.wid=null;render();break;
    case "to-cmp":S.ktab="vergleich";render();break;
    case "cmp-all":S.cmpAll=!S.cmpAll;render();break;
    case "open-t":fromHere("ausschreibungen");go("ausschreibungen");S.tid=id;render();break;
    case "back-from":{const f=S.from;S.from=null;S.kid=null;S.wid=null;S.tid=null;S.cmpBack=null;if(f){go(f.view);document.getElementById("main").scrollTop=f.top||0;}else render();break;}
    case "back-t":S.tid=null;render();break;
    case "ttab":S.ttab=el.dataset.t;render();break;
    case "t-status":{const t=T(id),s=el.dataset.s;snap();
      /* a reset decision keeps what was submitted; reopening a selective procedure in phase 1 forgets only that submission */
      if(s==="pq"&&t.pq){t.pq.sel=null;}if(s==="arbeit"&&t.status==="pq"&&t.pq){delete t.pq.sub;}
      t.status=s;render();toast(tx(TST[s]),0,false,true);break;}
    case "t-submit":openForm("tsub",id);break;
    case "dl-bad":{let s="";try{s=localStorage.getItem(BADKEY)||"";}catch(e){}const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([s],{type:"application/json"}));a.download="arkitecton-beschaedigt-"+iso(TODAY)+".json";a.click();break;}
    case "crew-add":readCrew();S.form.lines.push({role:"x",t:"",m:null,pct:null});renderOverlay();break;
    case "crew-del":readCrew();S.form.lines.splice(+el.dataset.c,1);renderOverlay();break;
    case "t-after":{const a=document.querySelector(".after");if(a)a.scrollIntoView({behavior:"smooth",block:"start"});break;}
    case "t-res":openForm("tres",id,el.dataset.w);break;
    case "t-protmail":{const t=T(id);t.protAsked=iso(TODAY);render();location.href=protMail(t);break;}
    case "t-link":{const t=T(id);t.link=t.link||{};t.link[el.dataset.d]=el.dataset.f;render();toast(L("Aus Büro-Unterlagen übernommen","Taken from firm documents"));break;}
    case "t-unlink":{const t=T(id);if(t.link)delete t.link[el.dataset.d];openForm("tlink",id,el.dataset.d);break;}
    case "t-doc":{const t=T(el.dataset.t);t.done[el.dataset.d]=!t.done[el.dataset.d];render();break;}
    case "sheet":closeAll();S.sheet=el.dataset.k;renderOverlay();break;
    case "form":openForm(el.dataset.f,id,el.dataset.w);break;
    case "form-project":openForm("project");break;
    case "form-project-edit":openForm("project",id);break;
    case "form-firm":openForm("firm");break;
    case "form-del":formDelete();break;
    case "open-project":D.pid=id;S.kid=null;go("uebersicht");break;
    case "home":startView("buero");go("buero");break;
    case "pick-project":D.pid=id;closeAll();S.kid=null;if(S.view==="buero"||S.view==="ausschreibungen"||S.view==="profil"||S.view==="einstellungen")go("uebersicht");else render();break;
    case "ask":S.confirm=el.dataset.c;if(/^ddel:/.test(S.confirm)||!S.sheet)render();else renderOverlay();break;
    case "notice-ok":D.noticeOk=1;render();break;
    case "doc-open":openDoc(el.dataset.id);break;
    case "doc-del":{snap();const id=el.dataset.id;D.docs=DOCS().filter(d=>d.id!==id);S.confirm=null;fileDel(id);render();toast(L("Dokument gelöscht","Document deleted"),0,0,1);break;}
    case "reset-ex":closeAll();clearFiles().then(()=>{D=seedExample();runMigrations();S.view="uebersicht";S.kid=null;S.tid=null;render();toast(L("Beispieldaten geladen","Example data loaded"));});break;
    case "reset-all":closeAll();clearFiles().then(()=>{try{localStorage.removeItem(KEY);}catch(err){}D=null;render();});break;
    case "close":{const back=S.form&&S.form.back;closeAll();if(back&&INV(back))S.drawer=back;render();break;}
    case "bulk-open":{const all=PIx().filter(i=>i.status==="pruefen"&&live(i)),ok=all.filter(cleanInv);closeAll();S.bulk={ids:ok.map(i=>i.id),sel:ok.map(i=>i.id),rest:all.length-ok.length};renderOverlay();break;}
    case "team-go":S.mid=null;go("profil");requestAnimationFrame(()=>{const t=document.getElementById("team");if(t)t.scrollIntoView({block:"start"});});break;
    case "scan-menu":closeAll();S.sheet="scan";renderOverlay();break;
    case "undo":if(undoSnap){D=JSON.parse(undoSnap.d);undoSnap=null;closeAll();saveData();render();toast(L("Rückgängig gemacht","Undone"));}break;
    case "zk-me":{const t=D.tenders.find(x=>x.id===id),z=t&&(t[el.dataset.k||"zk"]||[])[+el.dataset.i];if(z){z.me=z.me===el.dataset.v?"":el.dataset.v;render();}break;}
    case "zk-add":readZk();S.form.lines.push({typ:"andere",t:"",w:""});renderOverlay();break;
    case "zk-del":readZk();S.form.lines.splice(+el.dataset.c,1);renderOverlay();break;
    case "calc-info":calcTip(el,!el.classList.contains("on"));break;
    case "dscan":dscanOpen({pid:el.dataset.pid,kid:el.dataset.kid});break;
    case "ds-close":dscanClose();break;
    case "ds-shoot":dshoot();break;
    case "ds-retake":{const M=DS();if(M){M.src=null;M.quad=null;M.stage="cam";renderOverlay();}break;}
    case "ds-accept":daccept();break;
    case "ds-color":{const M=DS();if(M){M.color=id==="1";renderOverlay();}break;}
    case "ds-del":{const M=DS();if(M){M.pages.splice(+id,1);if(!M.pages.length&&M.stage==="save")M.stage="cam";renderOverlay();}break;}
    case "ds-next":{const M=DS();if(M&&M.pages.length){dstopCam();M.stage="save";renderOverlay();}break;}
    case "ds-more":{const M=DS();if(M){dsRead();M.stage="cam";renderOverlay();}break;}
    case "ds-save":dscanSave().catch(e=>{console.error(e);toast(L("Ablegen nicht möglich.","Could not file."));});break;
    case "sig-person":openForm("person",null,"signers");break;
    case "bulk-tog":{const B=S.bulk;if(!B)break;B.sel=B.sel.includes(id)?B.sel.filter(x=>x!==id):B.sel.concat(id);renderOverlay();break;}
    case "bulk-approve":bulkApprove();break;
    case "visum-pdf":visumPDF(INV(id)).then(()=>toast(L("Rechnung mit Visum gespeichert","Invoice with approval stamp saved"))).catch(e=>{console.error(e);toast(L("PDF nicht möglich.","PDF failed."));});break;
    case "approve":{snap();const i=INV(id);i.status="frei";i.rel=iso(TODAY);ensureVno(i);logInv(i,L("Freigegeben","Approved"));S.done=null;S.queryOpen=false;render();toast(L("Freigegeben · ","Approved · ")+chf(payout(i)),0,0,1);break;}
    case "unapprove":{const i=INV(id);i.status="pruefen";logInv(i,L("Freigabe zurückgenommen","Approval undone"));render();break;}
    case "paid":{snap();const i=INV(id);i.status="bezahlt";logInv(i,L("Bezahlt","Paid"));render();toast(L("Als bezahlt markiert","Marked as paid"),0,0,1);break;}
    case "inv-unpaid":{const i=INV(id);i.status="frei";logInv(i,L("Zahlung zurückgenommen","Payment undone"));render();toast(L("Wieder freigegeben, nicht bezahlt","Back to approved, not paid"));break;}
    case "del-inv":snap();D.invoices=D.invoices.filter(x=>x.id!==id);DOCS().filter(d=>d.scope==="inv"&&d.ref===id).forEach(d=>fileDel(d.id));D.docs=DOCS().filter(d=>!(d.scope==="inv"&&d.ref===id));closeAll();render();toast(L("Rechnung gelöscht","Invoice deleted"),0,0,1);break;
    case "query":S.queryOpen=true;renderOverlay();{const q=document.getElementById("qtext");if(q)q.scrollIntoView({block:"nearest"});}break;
    case "copy-query":{const q=document.getElementById("qtext");copy(q?q.value:"",L("Kopiert","Copied"));break;}
    case "share-query":{const q=document.getElementById("qtext"),inv=D.invoices.find(x=>x.id===id);navigator.share({title:L("Rechnung ","Invoice ")+(inv?inv.no:""),text:q?q.value:""}).catch(()=>{});break;}
    case "gmail-query":{const q=document.getElementById("qtext"),inv=D.invoices.find(x=>x.id===id),k=inv&&K(W(inv.w).k);if(!k)break;window.open("https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(k.email)+"&su="+encodeURIComponent(L("Rechnung ","Invoice ")+inv.no)+"&body="+encodeURIComponent(q?q.value:""),"_blank","noopener");break;}
    case "mail-query":{const q=document.getElementById("qtext");if(q)el.href=el.href.split("&body=")[0]+"&body="+encodeURIComponent(q.value);break;}
    case "mark-query":{const i=INV(id);i.status="rueckfrage";logInv(i,L("Rückfrage gesendet","Query sent"));S.queryOpen=false;render();toast(L("Rückfrage gesendet · wartet auf Antwort","Query sent · waiting for reply"));break;}
    case "answer":openForm("answer",id);break;
    case "capture":closeAll();S.modal={step:1,data:null,err:"",busy:false,fileFirst:window.matchMedia("(hover:hover) and (pointer:fine)").matches};renderOverlay();break;
    case "cam-retry":if(S.modal){S.modal.camErr="";renderOverlay();}break;
    case "use-cam":if(S.modal){S.modal.fileFirst=false;renderOverlay();}break;
    case "manual":{const rep=S.modal&&S.modal.rep,ro=rep&&INV(rep);closeAll();openForm("invoice",ro?W(ro.w).k:null);S.form.rep=rep||null;break;}
    case "replace":{closeAll();S.modal={step:1,data:null,err:"",busy:false,rep:id};renderOverlay();break;}
    case "use-samples":{const M=S.modal;if(!M)break;stopCam();M.err="";M.batch={items:SAMPLES.map(x=>batchItem(Object.assign({},x),"")),total:SAMPLES.length};finishBatch(M);break;}
    case "batch-tog":{const B=S.modal&&S.modal.batch;if(!B)break;const n=+id;B.sel=B.sel.includes(n)?B.sel.filter(x=>x!==n):B.sel.concat(n).sort((a,b)=>a-b);renderOverlay();break;}
    case "batch-save":batchSave();break;
    case "use-sample":stopCam();S.modal.data=Object.assign({},SAMPLE);setDates(S.modal.data);S.modal.err="";S.modal.step=2;renderOverlay();break;
    case "to-step3":{const amt=num(document.getElementById("capAmt").value);if(!amt||amt<=0){S.modal.err=L("Betrag eingeben","Enter the amount");return renderOverlay();}
      S.modal.data.amount=r2(amt);S.modal.data.no=document.getElementById("capNo").value.trim();S.modal.err="";S.modal.step=3;if(resolveCapture(S.modal.data).dup)logDup();renderOverlay();break;}
    case "confirm-capture":confirmCapture();break;
    case "ex-offer":{const w=W("w6");if(w){w.offer=EX_OFFER.map(x=>Object.assign({},x));render();toast(L("4 Positionen · CHF 34'600","4 items · CHF 34'600"));}break;}
    case "ex-final":{const w=W("w6");if(w){w.final=EX_FINAL.map(x=>Object.assign({},x));render();toast(L("Verglichen · ","Compared · ")+sgn(compare(w).diff));}break;}
  }
});
document.addEventListener("change",e=>{
  if(e.target&&e.target.dataset&&e.target.dataset.act==="ds-field"){dsRead();renderOverlay();return;}
  const t=e.target;if(t.dataset&&t.dataset.set){saveSetting(t);return;}if(t.id==="capProj"&&S.modal){readCapture();S.modal.pid=t.value;S.modal.pidSrc="man";delete S.modal.data.bkpSel;delete S.modal.data.typeSel;renderOverlay();return;}if(t.id==="fVatSel"){feeCalcUpdate();return;}if(!t.matches||!t.matches("input[type=file]"))return;
  if(t.id==="pSearch")return;
  if(t.dataset.imp==="doc"){const fs=[...(t.files||[])];t.value="";if(fs.length)addDocs(fs,t.dataset.id).catch(()=>toast(L("Speichern nicht möglich.","Could not save.")));return;}
  const f=t.files&&t.files[0];if(!f)return;
  if(t.id==="scanIn"){const fs=[...t.files];t.value="";if(fs.length>1)onScanFiles(fs);else onScanFile(f);}else if(t.dataset.imp){closePop();handleImport(t.dataset.imp,f,t.dataset.id);t.value="";}
});
document.addEventListener("input",e=>{if(e.target.getAttribute&&e.target.getAttribute("aria-invalid")){e.target.removeAttribute("aria-invalid");const fe=e.target.closest(".f")&&e.target.closest(".f").querySelector(".ferr");if(fe)fe.remove();}if(e.target.id==="pSearch"){const fold=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(),q=fold(e.target.value.trim()),sh=document.querySelector(".psw");let n=0;sh.querySelectorAll(".pitem").forEach(b=>{const on=!q||fold(b.dataset.q).includes(q);b.hidden=!on;if(on)n++;});sh.querySelectorAll(".plist").forEach(l=>{l.hidden=![...l.querySelectorAll(".pitem")].some(b=>!b.hidden);});const dd=sh.querySelector(".pdone");if(dd&&q)dd.open=true;sh.querySelector(".pnone").hidden=n>0;return;}if(S.form&&S.form.f==="fee"&&e.target.closest&&e.target.closest("#frm"))feeCalcUpdate();});
/* ---------- swipe between the main areas on a phone (same order as the tab bar) ----------
   the page follows the finger 1:1, a short flick is enough, and the next page
   slides in from where the old one left: one continuous movement, no blank moment */
const SWIPE=["ausschreibungen","uebersicht","rechnungen","handwerker","budget"]; /* same order as the tab bar */
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
    if(end){if(main.style.transform)set(0,0);return;} /* no page in that direction: the page stays put */
    set(dx,0);
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
    startView(SWIPE[n]);go(SWIPE[n]);
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
/* ---------- phone: "back to top" once the page is scrolled to the end ---------- */
(function(){
  const main=document.getElementById("main"),b=document.createElement("button");
  b.type="button";b.className="totop";b.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  document.body.appendChild(b);
  const lab=()=>{const t=L("Nach oben","Back to top");b.setAttribute("aria-label",t);b.title=t;};try{lab();}catch(e){b.setAttribute("aria-label","Nach oben");}
  const upd=()=>{if(!window.matchMedia("(max-width:820px)").matches){b.classList.remove("on");return;}
    const tb=document.getElementById("tabbar"),r=tb&&tb.getBoundingClientRect();
    if(r&&r.height)b.style.bottom=(innerHeight-r.top+12)+"px";
    const end=main.scrollTop>40&&main.scrollTop+main.clientHeight>=main.scrollHeight-60;
    document.body.classList.toggle("at-end",end);
    if(end)lab();b.classList.toggle("on",end&&!document.querySelector("#overlay.on"));};
  main.addEventListener("scroll",upd,{passive:true});window.addEventListener("resize",upd);
  new MutationObserver(()=>requestAnimationFrame(upd)).observe(main,{childList:true});
  b.addEventListener("click",()=>{main.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});b.classList.remove("on");});
})();
/* phone: the top bar name repeats the page title, so it only appears once the title has scrolled away (large-title pattern) */
(function(){
  const main=document.getElementById("main");
  const upd=()=>{const tp=document.getElementById("topProj"),h=main.querySelector(".ph h1");if(!tp)return;
    const norm=x=>(x||"").replace(/[⌄\s]+/g," ").trim();
    const echo=!!h&&norm(h.textContent)===norm(tp.textContent);
    tp.classList.toggle("echo",echo);
    tp.classList.toggle("shown",!echo||h.getBoundingClientRect().bottom<document.querySelector(".topbar").getBoundingClientRect().bottom);};
  main.addEventListener("scroll",upd,{passive:true});window.addEventListener("resize",upd);
  new MutationObserver(()=>requestAnimationFrame(upd)).observe(main,{childList:true});
  new MutationObserver(()=>requestAnimationFrame(upd)).observe(document.getElementById("topProj"),{childList:true,characterData:true,subtree:true});
})();
/* ---------- tooltips in the navigation (desktop) ---------- */
(function(){let tm=null,cur=null;const tip=document.createElement("div");tip.id="tip";tip.setAttribute("role","tooltip");document.body.appendChild(tip);
  const hide=()=>{clearTimeout(tm);tm=null;cur=null;tip.classList.remove("on");};
  document.addEventListener("mouseover",e=>{let t=e.target.closest("[data-tip],.ib[title],button[title],label[title]");if(t&&!t.closest(".app,#overlay"))t=null;if(t&&t.title){t.dataset.tip=t.title;t.removeAttribute("title");}if(t===cur)return;hide();if(!t||!window.matchMedia("(hover:hover)").matches)return;cur=t;
    tm=setTimeout(()=>{if(S.pop)return;tip.textContent=t.dataset.tip;tip.classList.add("on");const r=t.getBoundingClientRect(),w=tip.offsetWidth;
      tip.style.left=Math.min(innerWidth-w-8,Math.max(8,r.left+r.width/2-w/2))+"px";const h=tip.offsetHeight;tip.style.top=(r.bottom+6+h>innerHeight-8?r.top-6-h:r.bottom+6)+"px";},380);});
  document.addEventListener("mousedown",hide,true);document.addEventListener("scroll",hide,true);
})();
/* one-time hint on the phone, until the person has swiped once */
function swipeHint(){if(!D||D.swipeSeen||D.swipeHinted||!window.matchMedia("(max-width:820px)").matches||!SWIPE.includes(S.view))return;D.swipeHinted=1;saveData();setTimeout(()=>{if(document.querySelector("#overlay.on")){D.swipeHinted=0;return;}toast(L("Tipp: Seitlich wischen wechselt zwischen den Bereichen der Leiste unten.","Tip: swipe left or right to move between the areas of the bar below."),6000,true);},900);}
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('span[role="button"][data-act]')){e.preventDefault();e.target.click();return;}if(e.key==="Escape"&&S.pop){closePop();return;}if(e.key==="Escape"&&(S.drawer||S.fdrawer||S.modal||S.sheet||S.form||S.kvx)){closeAll();render();}});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCam();});
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(D&&v!==S.view&&VIEWS.includes(v))go(v);});

try{const l=localStorage.getItem("arkitecton:lang");if(l==="de"||l==="en")S.lang=l;}catch(e){}themeMeta();
D=loadData();
/* another tab saved: take over its state, unless a form is open (then the next save notices the conflict) */
addEventListener("storage",e=>{if(e.key!==REVKEY||!e.newValue||e.newValue===myRev||!D||S.form)return;const o=loadData();if(!o)return;D=o;undoSnap=null;render();toast(L("In einem anderen Fenster geändert. Die Ansicht ist aktualisiert.","Changed in another window. The view is updated."));});
/* after the first screen is up, fetch the Excel and QR libraries in the background */
setTimeout(()=>{const go_=()=>{libXLSX().catch(()=>{});libQR().catch(()=>{});};(window.requestIdleCallback||setTimeout)(go_,{timeout:4000});},2500);
{const had=!!D;setTimeout(()=>{if(had&&D)sweepFiles();},15000);}try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
runMigrations();
const h0=location.hash.slice(1);if(VIEWS.includes(h0))S.view=h0;
render();
window.__ark={get D(){return D;},setD(o){D=o;render();},render:()=>render(),S,compare,budgetRows,totals,retention,payout,parseSPC,parseLines,flags};
