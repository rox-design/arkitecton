"use strict";
/* ---------- seal: a signed check code on payment releases and approval stamps ----------
   Each office has its own key pair (ECDSA P-256), made on first use and kept with the office data.
   The code carries the facts (numbers, amounts, date), the office's public key and the signature.
   Scanning it opens pruefen.html, which checks the signature in the browser: any changed digit fails.
   Limit until there is a server: the page cannot yet confirm that a key really belongs to the office;
   it shows the key's short fingerprint and remembers it per office, so a different key is flagged. */

const b64u=buf=>{let s="";new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");};
const unb64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;};
const SEAL_MAX=6; /* invoices per payment-release code: keeps the code small enough to scan from paper */

async function sealKey(){
  const F=D.firm||(D.firm={});
  if(F.sk&&F.sk.pub&&F.sk.priv)return F.sk;
  const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
  const raw=new Uint8Array(await crypto.subtle.exportKey("raw",kp.publicKey));
  F.sk={pub:b64u(raw),priv:await crypto.subtle.exportKey("jwk",kp.privateKey),made:iso(TODAY)};saveData();return F.sk;
}
/* compressed public key (33 bytes) keeps the code small; the check page expands it again */
const compressPub=raw=>{const u=raw instanceof Uint8Array?raw:unb64u(raw),c=new Uint8Array(33);c[0]=(u[64]&1)?3:2;c.set(u.slice(1,33),1);return c;};
async function keyPrint(pub){const h=new Uint8Array(await crypto.subtle.digest("SHA-256",compressPub(pub)));const x=[...h.slice(0,4)].map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();return x.slice(0,4)+"-"+x.slice(4);}

/* compact fields keep the code small enough to scan from paper: whole francs without decimals, dates as 20261120 */
const amt=n=>{const v=r2(n);return Number.isInteger(v)?String(v):v.toFixed(2);},cd=d=>String(d||"").replace(/-/g,"");
const clean=s=>String(s==null?"":s).replace(/[|~]/g," ").trim();
async function sealUrl(text){
  const sk=await sealKey(),key=await crypto.subtle.importKey("jwk",sk.priv,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
  const msg=new TextEncoder().encode(text),sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},key,msg);
  const base=/github\.io$/.test(location.hostname)?"https://rox-design.github.io/arkitecton/pruefen.html":new URL("pruefen.html",location.href.split(/[?#]/)[0]).href;
  return base+"#"+b64u(msg)+"."+b64u(compressPub(sk.pub))+"."+b64u(sig);
}
/* visum numbers: one per approved invoice, counted per year */
function ensureVno(i){
  if(i.vno)return i.vno;const y=(i.rel||iso(TODAY)).slice(0,4),S2=D.sealSeq||(D.sealSeq={}),k="V"+y;S2[k]=(S2[k]||0)+1;
  i.vno="V-"+y+"-"+String(S2[k]).padStart(4,"0");return i.vno;
}
function nextZa(){const y=iso(TODAY).slice(0,4),S2=D.sealSeq||(D.sealSeq={}),k="Z"+y;S2[k]=(S2[k]||0)+1;return "ZA-"+y+"-"+String(S2[k]).padStart(3,"0");}
const relDate=i=>i.rel||((i.log||[]).find(e=>/^(Freigegeben|Approved)/.test(e.t))||{}).d||i.date;

async function sealInvoice(i){
  const w=W(i.w),k=K(w.k);ensureVno(i);saveData();
  const text=["AK2","V",i.vno.replace(/^V-/,""),clean((D.firm||{}).name),clean(k.name).slice(0,30),clean(i.no).slice(0,20),cd(relDate(i)),amt(i.gross),amt(payout(i)),w.bkp].join("|");
  return {url:await sealUrl(text),no:i.vno,print:await keyPrint((await sealKey()).pub)};
}
async function sealRelease(list,p){
  /* the same invoices give the same release: number and date are kept, so printing twice does not create a second release */
  list.forEach(ensureVno);const ids=list.map(i=>i.id).sort().join(","),R=D.releases||(D.releases=[]);
  let rec=R.find(r=>r.ids===ids);if(!rec){rec={no:nextZa(),ids,date:iso(TODAY)};R.push(rec);}saveData();const za=rec.no;
  const total=r2(list.reduce((a,i)=>a+payout(i),0));
  /* per invoice only its visum number and amount: contractor and invoice stand next to it on paper; keeps the code easy to scan */
  const text=["AK2","Z",za.replace(/^ZA-/,""),clean((D.firm||{}).name),clean(p&&p.name).slice(0,20),cd(rec.date),amt(total),list.length].concat(list.map(i=>i.vno.replace(/^V-\d{4}-/,"")+"~"+amt(payout(i)))).join("|");
  return {url:await sealUrl(text),no:za,date:rec.date,print:await keyPrint((await sealKey()).pub)};
}

/* the mosaic code: round dots, rounded finder eyes, the arkitecton mark in the middle */
async function mosaicPng(url,px,ecc,lg){
  await loadScript("vendor/qrcode-gen.js");
  const q=qrcode(0,ecc||"Q");q.addData(url,"Byte");q.make();
  const n=q.getModuleCount(),qz=2,s=Math.max(4,Math.floor((px||900)/(n+qz*2))),W0=(n+qz*2)*s,cv=document.createElement("canvas");cv.width=cv.height=W0;
  const g=cv.getContext("2d"),ink="#141414",red="#d6342c";g.fillStyle="#fff";g.fillRect(0,0,W0,W0);
  const eye=(r,c)=>(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);
  const cw=Math.round(n*(lg||.16))|1,c0=Math.floor((n-cw)/2),mid=(r,c)=>r>=c0&&r<c0+cw&&c>=c0&&c<c0+cw;
  g.fillStyle=ink;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){if(!q.isDark(r,c)||eye(r,c)||mid(r,c))continue;g.beginPath();g.arc((c+qz+.5)*s,(r+qz+.5)*s,s*.46,0,Math.PI*2);g.fill();}
  const rr=(x,y,w,h,rad)=>{g.beginPath();g.moveTo(x+rad,y);g.arcTo(x+w,y,x+w,y+h,rad);g.arcTo(x+w,y+h,x,y+h,rad);g.arcTo(x,y+h,x,y,rad);g.arcTo(x,y,x+w,y,rad);g.closePath();};
  [[0,0],[0,n-7],[n-7,0]].forEach(([r,c])=>{const x=(c+qz)*s,y=(r+qz)*s;g.fillStyle=ink;rr(x,y,7*s,7*s,2*s);g.fill();g.fillStyle="#fff";rr(x+s,y+s,5*s,5*s,1.4*s);g.fill();g.fillStyle=ink;rr(x+2*s,y+2*s,3*s,3*s,.9*s);g.fill();});
  /* the mark from the logo (viewBox 30), centred */
  const L0=(c0+qz)*s,LW=cw*s,k=LW/30;g.fillStyle="#fff";g.fillRect(L0,L0,LW,LW);
  [[3,20,24,7,ink],[7,9,9,11,ink],[16,14,7,6,ink],[16,3,6,6,red]].forEach(([x,y,w,h,col])=>{g.fillStyle=col;g.fillRect(L0+x*k,L0+y*k,w*k,h*k);});
  return {data:cv.toDataURL("image/png"),n};
}
