/* arkitecton · Data access and money logic: invoices, retention, budget forecast, flags, tenders. */
"use strict";

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
/* BKP catalogue: the built-in list (codes up to 3 digits) plus the office's own list, e.g. with sub-items like 211.5 (Einstellungen › BKP-Liste) */
let _bkpCache=null,_bkpKey="";
const BKPCAT=()=>{const base=typeof BKP_ALL!=="undefined"?BKP_ALL:[],own=(D&&D.bkpList)||[],key=base.length+":"+own.length+":"+(own[0]||[]).join();if(_bkpCache&&_bkpKey===key)return _bkpCache;
  const m=new Map(base.map(e=>[e[0],e[1]]));own.forEach(([c,n])=>m.set(c,n));_bkpKey=key;_bkpCache=[...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));return _bkpCache;};
const bkpCat=c=>{const x=BKPCAT().find(e=>e[0]===String(c));return x?x[1]:"";};
const bkpMain=c=>String(c||"").charAt(0);
const bkpMainName=d=>bkpCat(d)||({0:"Grundstück",1:"Vorbereitung",2:"Gebäude",3:"Betriebseinrichtungen",4:"Umgebung",5:"Baunebenkosten",9:"Ausstattung"})[d]||"";
const bName=bkp=>{const b=B(bkp);if(b)return tx(b);const s=STD_BKP.find(x=>x[0]===bkp);if(s)return S.lang==="de"?s[1]:s[2];return bkpCat(bkp);};
const projTitle=pp=>{const p=pp||P();return p?p.name+(p.place?", "+p.place:""):"";};
const PJ=id=>D.projects.find(p=>p.id===id)||null;
const KC=kid=>D.contracts.filter(w=>w.k===kid);
const counted=i=>i.status==="frei"||i.status==="bezahlt";
const openSub=list=>{const n=st=>list.filter(i=>i.status===st).length,c=n("pruefen"),q=n("rueckfrage"),f=n("frei");return [c?c+" "+L("zu prüfen","to check"):"",q?q+" "+L("Rückfrage","queried"):"",f?f+" "+L("freigegeben","approved"):""].filter(Boolean).join(" · ")||L("nichts offen","nothing open");};
/* "Offene Rechnungen" (open invoices) means the same everywhere; the client pays them after the architect releases them: every unpaid invoice, as the amount actually paid out */
const unpaid=list=>list.filter(i=>live(i)&&i.status!=="bezahlt");
const toPay=list=>r2(unpaid(list).reduce((a,i)=>a+payout(i),0));
const sumLines=ls=>r2((ls||[]).reduce((a,l)=>a+l.qty*l.price,0));
/* office-wide defaults, editable under Einstellungen */
const SET=()=>{const s=(D&&D.settings)||{};return {ret:typeof s.ret==="number"?s.ret:0,term:s.term||30,feeTerm:s.feeTerm||30,rem:Array.isArray(s.rem)&&s.rem.length===3?s.rem:[60,90,120]};};
const retPct=w=>w&&typeof w.ret==="number"?w.ret:SET().ret;
const net=i=>r2(i.gross-(i.ded&&i.ded.amt?i.ded.amt:0));
const live=i=>i.status!=="ersetzt";
/* retention is frozen per invoice once it is approved: later changes to the contract's % do not rewrite paid invoices.
   A final invoice releases the retention of the akontos approved before it; an akonto approved after the final invoice has none. */
const invPct=i=>typeof i.retPct==="number"?i.retPct:retPct(W(i.w));
const akRet=x=>r2(net(x)*invPct(x)/100);
function retention(i){
  if(i.type==="akonto"){const fin=D.invoices.find(x=>x.w===i.w&&x.type==="schluss"&&counted(x)&&Array.isArray(x.relIds));if(fin&&!fin.relIds.includes(i.id))return 0;return akRet(i);}
  if(i.type==="schluss"){if(counted(i)&&typeof i.retRel==="number")return -i.retRel;return -r2(D.invoices.filter(x=>x.w===i.w&&x.type==="akonto"&&counted(x)).reduce((a,x)=>a+akRet(x),0));}
  return 0;
}
function stampRet(){if(!D||!D.invoices)return;
  D.invoices.forEach(i=>{if(i.type==="akonto"){if(counted(i)){if(typeof i.retPct!=="number")i.retPct=retPct(W(i.w));}else delete i.retPct;}});
  D.invoices.forEach(i=>{if(i.type!=="schluss")return;if(counted(i)){if(typeof i.retRel!=="number"){const ak=D.invoices.filter(x=>x.w===i.w&&x.type==="akonto"&&counted(x));i.relIds=ak.map(x=>x.id);i.retRel=r2(ak.reduce((a,x)=>a+akRet(x),0));}}else{delete i.retRel;delete i.relIds;}});}
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
const foldRows=(title,html,n)=>n?`<details class="pdone hdone"><summary>${title} <span class="cnt">${n}</span></summary><div class="rows">${html}</div></details>`:"";
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
    /* a revised estimate replaces the original for forecast and reserve; the original stays for comparison */
    const rev=b.kvr!=null&&b.kvr!=="",kv=rev?+b.kvr:(b.kv||0);
    const ws=PC().filter(w=>w.bkp===b.bkp), ids=ws.map(w=>w.id), inv=D.invoices.filter(i=>ids.includes(i.w));
    const awarded=ws.reduce((a,w)=>a+w.sum,0), billed=inv.filter(counted).reduce((a,i)=>a+net(i),0);
    const paid=inv.filter(i=>i.status==="bezahlt").reduce((a,i)=>a+payout(i),0), approved=inv.filter(i=>i.status==="frei").reduce((a,i)=>a+payout(i),0);
    const open=inv.filter(i=>!counted(i)&&live(i)).reduce((a,i)=>a+net(i),0), ret=inv.filter(counted).reduce((a,i)=>a+retention(i),0);
    /* forecast: the contract, or what is billed under it incl. invoices still to check, whichever is higher;
       time & materials (Regie) is outside the contract and always comes on top */
    const regie=inv.filter(i=>live(i)&&i.type==="regie").reduce((a,i)=>a+net(i),0);
    /* per contract: once a final invoice is in, the billed total is the end cost; before, the contract or what is billed, whichever is higher.
       A position without contract or invoice is expected to cost its estimate (no reserve yet). Regie always comes on top. */
    let final=ws.length>0;const fc=ws.reduce((a,w)=>{const iw=inv.filter(i=>i.w===w.id&&live(i)&&i.type!=="regie"),bw=iw.reduce((x,i)=>x+net(i),0),fin=iw.some(i=>i.type==="schluss");if(!fin)final=false;return a+(fin?bw:Math.max(w.sum||0,bw));},0);
    const none=!ws.length&&!inv.some(live);
    const forecast=none?kv:fc+regie;
    return {b,kv,rev,awarded,billed,paid,approved,open,ret,regie,forecast,final,none,rest:kv-forecast,over:kv>0&&forecast>kv};
  });
}
function totals(rows){const t={kv:0,kv0:0,awarded:0,billed:0,paid:0,approved:0,open:0,ret:0,rest:0};rows.forEach(r=>{for(const k in t)t[k]+=k==="kv0"?(r.b.kv||0):r[k];});t.rev=rows.some(r=>r.rev);return t;}
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
    const has=O.team.find(x=>mTags(x).includes(r.tag));
    return {k:"team",s:has?"ok":"crit",t:lab,res:has?esc(has.name)+" · "+esc(has.qual)+", "+yrs(roleYears(has)):L("Fehlt im Team","Missing in the team")};
  }
  const miss=r.need.filter(d=>!O.disc.includes(d));
  return {k:"disc",s:miss.length?"warn":"ok",t:r.need.map(discName).join(", "),res:miss.length?L("Partner nötig: ","Partner needed: ")+miss.map(discName).join(", "):L("Im eigenen Büro","In your own office")};
}
function fitOf(t){const ev=t.reqs.map(evalReq);if(!D.office.refs.length||!D.office.team.length)return {ev,fit:"nodata"};return {ev,fit:ev.some(e=>e.s==="crit")?"no":ev.some(e=>e.s==="warn")?"partner":"ok"};}
function docsOf(t){
  const ev=fitOf(t).ev;
  return t.docs.map(d=>{
    if(d.auto==="refs"){const e=ev.find(x=>x.k==="refs"),ok=!!e&&e.s==="ok";return {id:d.id,auto:true,done:ok,t:L("Referenzblätter","Reference sheets"),sub:ok?e.refs.map(x=>tx(x)).join(", "):L("Zu wenig passende Referenzen","Not enough matching references")};}
    if(d.auto==="team"){const m=D.office.team.filter(x=>mTags(x).length);return {id:d.id,auto:true,done:m.length>0,t:L("Schlüsselpersonen","Key people"),sub:m.map(x=>esc(x.name)+" ("+(curRole(x)?tx(ROLES[curRole(x)]):"")+")").join(", ")};}
    if(d.auto==="self")return {id:d.id,auto:false,done:!!t.done[d.id],t:L("Selbstdeklaration","Self-declaration"),sub:L("Vorausgefüllt, unterschreiben","Pre-filled, sign it")};
    return {id:d.id,auto:false,done:!!t.done[d.id],t:tx(d),sub:""};
  });
}
