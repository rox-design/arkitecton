"use strict";
/* ---------- document scanner (phone) ----------
   Photograph pages, find the sheet, straighten it, make it look scanned, then file all pages as one PDF
   with kind, project and (for contractor documents) the contractor. Desktop keeps plain upload. */

let dcam=null;
const DS=()=>S.dscan;

function dscanOpen(){closeAll();S.dscan={stage:"cam",pages:[],err:""};renderOverlay();}
function dscanClose(){dstopCam();S.dscan=null;renderOverlay();}

async function dstartCam(){
  const M=DS();if(!M||M.stage!=="cam"||dcam)return;
  if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){M.err=L("Live-Kamera hier nicht verfügbar. Bitte «Foto wählen» nutzen.","Live camera not available here. Please use «Choose photo».");return renderOverlay();}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:2560},height:{ideal:1920}}});
    if(!DS()||DS().stage!=="cam"){stream.getTracks().forEach(t=>t.stop());return;}
    dcam={stream};dattachCam();
  }catch(e){if(DS()){DS().err=String(camErrText(e)).replace(/die Rechnung als PDF oder Foto/g,"ein Foto des Dokuments").replace(/the invoice as PDF or photo/g,"a photo of the document");renderOverlay();}}
}
function dattachCam(){const v=document.getElementById("dsv");if(!dcam||!v)return;if(v.srcObject!==dcam.stream){v.srcObject=dcam.stream;v.play().catch(()=>{});}}
function dstopCam(){if(!dcam)return;dcam.stream.getTracks().forEach(t=>t.stop());dcam=null;}

/* take the current frame (or a chosen photo) and go to the corner check */
function dshoot(){
  const v=document.getElementById("dsv");if(!v||!v.videoWidth)return;
  const cv=document.createElement("canvas");cv.width=v.videoWidth;cv.height=v.videoHeight;cv.getContext("2d").drawImage(v,0,0);
  try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}
  dtake(cv);
}
async function dfromFile(f){
  if(!f||!/^image\//.test(f.type||"image/"))return toast(L("Bitte ein Foto wählen.","Please choose a photo."));
  const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(f);});
  const k=Math.min(1,3000/Math.max(img.width,img.height)),cv=document.createElement("canvas");cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
  URL.revokeObjectURL(img.src);dtake(cv);
}
function dtake(cv){const M=DS();if(!M)return;dstopCam();M.src=cv;M.quad=detectQuad(cv);M.color=false;M.stage="adjust";renderOverlay();}

/* ---------- finding the sheet: bright paper on a darker surface ---------- */
function detectQuad(src){
  const W=src.width,H=src.height,k=Math.min(1,360/Math.max(W,H)),w=Math.max(8,Math.round(W*k)),h=Math.max(8,Math.round(H*k));
  const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d",{willReadFrequently:true});g.filter="blur(1px)";g.drawImage(src,0,0,w,h);
  const px=g.getImageData(0,0,w,h).data,gray=new Uint8Array(w*h),hist=new Array(256).fill(0);
  for(let i=0;i<w*h;i++){const v=(px[i*4]*299+px[i*4+1]*587+px[i*4+2]*114)/1000|0;gray[i]=v;hist[v]++;}
  /* Otsu threshold */
  let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];let sB=0,wB=0,best=0,th=128;
  for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=w*h-wB;if(!wF)break;sB+=t*hist[t];const mB=sB/wB,mF=(sum-sB)/wF,between=wB*wF*(mB-mF)*(mB-mF);if(between>best){best=between;th=t;}}
  /* edges (text, the sheet border, folders) act as barriers: the sheet is the largest bright area between strong edges.
     Otherwise a light surface touching the sheet would be counted as paper. */
  const mag=new Float32Array(w*h),mh=new Uint32Array(256);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,
    gx=gray[i-w+1]+2*gray[i+1]+gray[i+w+1]-gray[i-w-1]-2*gray[i-1]-gray[i+w-1],gy=gray[i+w-1]+2*gray[i+w]+gray[i+w+1]-gray[i-w-1]-2*gray[i-w]-gray[i-w+1];
    const m=Math.min(255,Math.hypot(gx,gy)/4);mag[i]=m;mh[m|0]++;}
  let acc=0,T=255;for(let t=0;t<256;t++){acc+=mh[t];if(acc>=w*h*.85){T=t;break;}}
  /* largest connected region of pixels that pass ok(i) */
  const biggest=ok=>{const lab=new Int32Array(w*h).fill(-1),q=new Int32Array(w*h);let bestN=0,bestId=-1,id=0;
    for(let s0=0;s0<w*h;s0++){if(lab[s0]>=0||!ok(s0))continue;let qh=0,qt=0,n=0;q[qt++]=s0;lab[s0]=id;
      while(qh<qt){const p=q[qh++];n++;const x=p%w;
        for(const nb of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(nb>=0&&nb<w*h&&lab[nb]<0&&ok(nb)){lab[nb]=id;q[qt++]=nb;}}
      if(n>bestN){bestN=n;bestId=id;}id++;}
    const r=new Uint8Array(w*h);for(let i=0;i<w*h;i++)r[i]=lab[i]===bestId&&bestId>=0?1:0;return [r,bestN];};
  const chroma=new Uint8Array(w*h);for(let i=0;i<w*h;i++){const a=px[i*4],b=px[i*4+1],c=px[i*4+2];chroma[i]=Math.max(a,b,c)-Math.min(a,b,c);}
  const inset=()=>[[.06,.06],[.94,.06],[.94,.94],[.06,.94]].map(([a,b])=>[a*W,b*H]);
  /* 1st pass: rough sheet, to learn how bright this paper is */
  let [reg,n]=biggest(i=>gray[i]>th&&mag[i]<T);if(n<w*h*.08)return inset();
  const gh=new Uint32Array(256);for(let i=0;i<w*h;i++)if(reg[i])gh[gray[i]]++;let med=0;for(let t=0,a=0;t<256;t++){a+=gh[t];if(a>=n/2){med=t;break;}}
  /* 2nd pass: paper is near that brightness and nearly colourless. A grey-blue strip, a wooden table or a folder next to the sheet drops out. */
  const th2=Math.max(th,med*.8),paper=i=>gray[i]>th2&&chroma[i]<40;
  [reg,n]=biggest(i=>paper(i)&&mag[i]<T);if(n<w*h*.08||n>w*h*.97)return inset();
  /* grow back over the sheet's own edges and handwriting, a few pixels only and only onto paper-like pixels */
  for(let r=0;r<6;r++){const nx=reg.slice();for(let i=0;i<w*h;i++){if(reg[i]||!paper(i))continue;const x=i%w;if((x>0&&reg[i-1])||(x<w-1&&reg[i+1])||(i>=w&&reg[i-w])||(i<w*h-w&&reg[i+w]))nx[i]=1;}reg=nx;}
  /* fill holes (dark text, punched holes): everything not reachable from the border is inside */
  {const seen=new Uint8Array(w*h),q=[];for(let x=0;x<w;x++){q.push(x,(h-1)*w+x);}for(let y=0;y<h;y++){q.push(y*w,y*w+w-1);}
    while(q.length){const p=q.pop();if(seen[p]||reg[p])continue;seen[p]=1;const x=p%w;if(x>0)q.push(p-1);if(x<w-1)q.push(p+1);if(p>=w)q.push(p-w);if(p<w*h-w)q.push(p+w);}
    for(let i=0;i<w*h;i++)if(!seen[i])reg[i]=1;}
  /* rough corners: extreme points along the diagonals */
  let tl=[0,0,1e9],tr=[0,0,-1e9],br=[0,0,-1e9],bl=[0,0,1e9];
  for(let p=0;p<w*h;p++){if(!reg[p])continue;const x=p%w,y=(p-x)/w;
    if(x+y<tl[2])tl=[x,y,x+y];if(x+y>br[2])br=[x,y,x+y];if(x-y>tr[2])tr=[x,y,x-y];if(x-y<bl[2])bl=[x,y,x-y];}
  const Q=[tl,tr,br,bl].map(([x,y])=>[x,y]);
  /* precise corners: fit a straight line to each side of the outline and intersect neighbouring sides.
     Extreme points alone sit slightly inside when a corner is rounded or dog-eared. */
  const B=[];for(let p=0;p<w*h;p++){if(!reg[p])continue;const x=p%w;if(x===0||x===w-1||p<w||p>=w*h-w||!reg[p-1]||!reg[p+1]||!reg[p-w]||!reg[p+w])B.push([x,(p-x)/w]);}
  const lines=Q.map((A,i)=>{const C=Q[(i+1)%4],vx=C[0]-A[0],vy=C[1]-A[1],L=Math.hypot(vx,vy)||1,ux=vx/L,uy=vy/L;
    let sx=0,sy=0,sxx=0,syy=0,sxy=0,m=0;
    for(const [x,y] of B){const dx=x-A[0],dy=y-A[1],t=(dx*ux+dy*uy)/L,d=-dx*uy+dy*ux;if(t>.15&&t<.85&&Math.abs(d)<Math.max(6,L*.06)){sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;m++;}}
    if(m<10)return {p:A,d:[ux,uy]};
    const cx=sx/m,cy=sy/m,a=sxx/m-cx*cx,b=sxy/m-cx*cy,c=syy/m-cy*cy,ang=.5*Math.atan2(2*b,a-c);return {p:[cx,cy],d:[Math.cos(ang),Math.sin(ang)]};});
  return Q.map((q0,i)=>{const l1=lines[(i+3)%4],l2=lines[i],det=l1.d[0]*-l2.d[1]+l2.d[0]*l1.d[1];let X=q0;
    if(Math.abs(det)>1e-6){const rx=l2.p[0]-l1.p[0],ry=l2.p[1]-l1.p[1],t=(rx*-l2.d[1]+l2.d[0]*ry)/det,P=[l1.p[0]+t*l1.d[0],l1.p[1]+t*l1.d[1]];if(Math.hypot(P[0]-q0[0],P[1]-q0[1])<25)X=P;}
    return [Math.max(0,Math.min(W,X[0]/k)),Math.max(0,Math.min(H,X[1]/k))];});
}

/* ---------- straighten: projective warp of the quad onto a rectangle ---------- */
function homography(src,dst){ /* maps dst -> src; solve 8x8 */
  const A=[],b=[];for(let i=0;i<4;i++){const [x,y]=dst[i],[u,v]=src[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);}
  for(let c=0;c<8;c++){let m=c;for(let r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[m][c]))m=r;[A[c],A[m]]=[A[m],A[c]];[b[c],b[m]]=[b[m],b[c]];
    for(let r=0;r<8;r++){if(r===c)continue;const f=A[r][c]/A[c][c];for(let k=c;k<8;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c];}}
  return b.map((v,i)=>v/A[i][i]);
}
function warp(src,quad){
  const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),[tl,tr,br,bl]=quad;
  let ow=Math.max(d(tl,tr),d(bl,br)),oh=Math.max(d(tl,bl),d(tr,br));const s=Math.min(1,1800/Math.max(ow,oh));ow=Math.round(ow*s);oh=Math.round(oh*s);
  const Hm=homography(quad,[[0,0],[ow,0],[ow,oh],[0,oh]]);
  const sc=src.getContext("2d",{willReadFrequently:true}).getImageData(0,0,src.width,src.height),sp=sc.data,SW=src.width,SH=src.height;
  const out=document.createElement("canvas");out.width=ow;out.height=oh;const og=out.getContext("2d"),od=og.createImageData(ow,oh),dp=od.data;
  for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const z=Hm[6]*x+Hm[7]*y+1,u=(Hm[0]*x+Hm[1]*y+Hm[2])/z,v=(Hm[3]*x+Hm[4]*y+Hm[5])/z;
    const xi=Math.min(SW-2,Math.max(0,u|0)),yi=Math.min(SH-2,Math.max(0,v|0)),fx=u-xi,fy=v-yi,o=(y*ow+x)*4;
    for(let ch=0;ch<3;ch++){const i0=(yi*SW+xi)*4+ch;dp[o+ch]=(sp[i0]*(1-fx)+sp[i0+4]*fx)*(1-fy)+(sp[i0+SW*4]*(1-fx)+sp[i0+SW*4+4]*fx)*fy;}dp[o+3]=255;}
  og.putImageData(od,0,0);return out;
}
/* scan look: even out the light (divide by a blurred background), then stretch to white paper and dark ink */
function scanLook(cv){
  const w=cv.width,h=cv.height,g=cv.getContext("2d",{willReadFrequently:true}),im=g.getImageData(0,0,w,h),p=im.data;
  const bw=Math.max(8,w>>4),bh=Math.max(8,h>>4),bc=document.createElement("canvas");bc.width=bw;bc.height=bh;const bg=bc.getContext("2d",{willReadFrequently:true});bg.filter="blur(3px)";bg.drawImage(cv,0,0,bw,bh);
  const big=document.createElement("canvas");big.width=w;big.height=h;const bgg=big.getContext("2d",{willReadFrequently:true});bgg.imageSmoothingQuality="high";bgg.drawImage(bc,0,0,w,h);const B=bgg.getImageData(0,0,w,h).data;
  for(let i=0;i<p.length;i+=4){const v=(p[i]*299+p[i+1]*587+p[i+2]*114)/1000,b=Math.max(40,(B[i]*299+B[i+1]*587+B[i+2]*114)/1000);
    let r=v/b*255;r=(r-70)*1.45;r=r<0?0:r>255?255:r;p[i]=p[i+1]=p[i+2]=r;}
  g.putImageData(im,0,0);return cv;
}
function daccept(){
  const M=DS();if(!M||!M.src)return;
  let pg=warp(M.src,M.quad);
  /* trim a thin margin so no table edge from the photo remains at the border */
  {const m=Math.round(Math.min(pg.width,pg.height)*.008),c=document.createElement("canvas");c.width=pg.width-2*m;c.height=pg.height-2*m;c.getContext("2d").drawImage(pg,-m,-m);pg=c;}
  if(!M.color)scanLook(pg);
  M.pages.push({data:pg.toDataURL("image/jpeg",.82),w:pg.width,h:pg.height});M.src=null;M.quad=null;M.stage="cam";renderOverlay();
}

/* ---------- views ---------- */
function dscanHTML(){
  const M=DS(),n=M.pages.length;
  const thumbs=n?`<div class="dsthumbs">${M.pages.map((p,i)=>`<div class="dsth"><img src="${p.data}" alt="${L("Seite ","Page ")+(i+1)}"><button type="button" class="dsx" data-act="ds-del" data-id="${i}" aria-label="${L("Seite löschen","Delete page")}">×</button><span>${i+1}</span></div>`).join("")}</div>`:"";
  if(M.stage==="cam"){
    return `<div class="dscan" role="dialog" aria-label="${L("Dokument scannen","Scan document")}">
      <div class="dshead"><button type="button" class="dsclose" data-act="ds-close">${L("Abbrechen","Cancel")}</button><span>${n?n+(n===1?L(" Seite"," page"):L(" Seiten"," pages")):L("Dokument scannen","Scan document")}</span>${n?`<button type="button" class="dsdone" data-act="ds-next">${L("Fertig","Done")}</button>`:"<span></span>"}</div>
      <div class="dsview">${M.err?`<div class="dserr">${esc(M.err)}</div>`:`<video id="dsv" playsinline muted autoplay></video><div class="dsframe" aria-hidden="true"></div><p class="dshint">${L("Blatt flach auf eine dunkle Unterlage legen, ganz im Bild.","Lay the sheet flat on a dark surface, fully in view.")}</p>`}</div>
      ${thumbs}
      <div class="dsbar"><label class="dspick">${L("Foto wählen","Choose photo")}<input type="file" accept="image/*" id="dsIn"></label><button type="button" class="dsshoot" data-act="ds-shoot" aria-label="${L("Seite aufnehmen","Take page")}"${M.err?" disabled":""}></button><span class="dspick dsph"></span></div>
    </div>`;
  }
  if(M.stage==="adjust"){
    return `<div class="dscan" role="dialog" aria-label="${L("Ecken prüfen","Check corners")}">
      <div class="dshead"><button type="button" class="dsclose" data-act="ds-retake">${L("Neu aufnehmen","Retake")}</button><span>${L("Ecken prüfen","Check corners")}</span><button type="button" class="dsdone" data-act="ds-accept">${L("Übernehmen","Use")}</button></div>
      <div class="dsview dsadj" id="dsadj"><canvas id="dsimg"></canvas><svg id="dssvg"></svg></div>
      <p class="dshint dsh2">${L("Die blauen Punkte an die Blattecken ziehen.","Drag the blue dots to the sheet corners.")}</p>
      <div class="dsbar dsmode"><div class="seg" role="group"><button type="button" class="${M.color?"":"on"}" data-act="ds-color" data-id="0">${L("Scan","Scan")}</button><button type="button" class="${M.color?"on":""}" data-act="ds-color" data-id="1">${L("Farbe","Colour")}</button></div></div>
    </div>`;
  }
  /* save */
  const kind=M.kind||"wv",withK=DK_WITH_K.includes(kind),pid=M.pid||D.pid||(D.projects[0]||{}).id,ks=D.contractors.filter(k=>D.contracts.some(w=>w.pid===pid&&w.k===k.id));
  const kid=M.kid&&ks.some(k=>k.id===M.kid)?M.kid:"",name=M.name||dsName(kind,pid,kid);
  return wrapCapture(L("Dokument ablegen","File document"),`${thumbs}
    <div class="f wide"><label for="dsKind">${L("Was ist es?","What is it?")}</label><select id="dsKind" data-act="ds-field">${dkOptions(kind)}</select></div>
    <div class="f wide"><label for="dsPid">${L("Projekt","Project")}</label><select id="dsPid" data-act="ds-field">${D.projects.filter(p=>!p.closed||p.id===pid).map(p=>`<option value="${p.id}"${p.id===pid?" selected":""}>${esc(p.name)}</option>`).join("")}</select></div>
    ${withK?`<div class="f wide"><label for="dsKid">${L("Handwerker","Contractor")}</label><select id="dsKid" data-act="ds-field"><option value="">${L("– keiner –","– none –")}</option>${ks.map(k=>`<option value="${k.id}"${k.id===kid?" selected":""}>${esc(k.name)}</option>`).join("")}</select><span class="hint">${L("Dann erscheint das Dokument auch beim Handwerker.","Then the document also shows with the contractor.")}</span></div>`:""}
    ${DK_UNTIL.includes(kind)?`<div class="f wide"><label for="dsUntil">${kind==="gs"?L("Garantie endet am","Warranty ends on"):L("Gültig bis","Valid until")}</label><input id="dsUntil" type="date" data-act="ds-field" value="${esc(M.until!=null?M.until:kind==="gs"?addDays(iso(TODAY),730):"")}"><span class="hint">${kind==="gs"?L("Meist 2 Jahre ab Abnahme. 60 Tage vorher erscheint eine Warnung unter «Zu erledigen», damit Mängel rechtzeitig gerügt werden.","Usually 2 years from acceptance. A warning appears under «To do» 60 days before."):L("30 Tage vor Ablauf erscheint eine Warnung unter «Zu erledigen».","A warning appears under «To do» 30 days before.")}</span></div>`:""}
    <div class="f wide"><label for="dsName">${L("Name","Name")}</label><input id="dsName" value="${esc(name)}"></div>`,
    `<button type="button" class="btn" data-act="ds-more">${L("+ Seite","+ Page")}</button><button type="button" class="btn primary" data-act="ds-save">${L("Ablegen","File")}</button>`);
}
function dsName(kind,pid,kid){const k=kid&&K(kid);return [dkShort(kind),k?k.name:(PJ(pid)||{}).name,fdate(iso(TODAY))].filter(Boolean).join(" ");}
function dsRead(){const M=DS(),g=id=>{const e=document.getElementById(id);return e?e.value:null;};
  const kind=g("dsKind"),pid=g("dsPid"),kid=g("dsKid"),nm=g("dsName"),un=g("dsUntil");if(kind&&kind!==M.kind)M.until=null;else if(un!==null)M.until=un;
  const auto=!M.name||M.name===dsName(M.kind||"wv",M.pid||D.pid,M.kid||"");
  if(kind)M.kind=kind;if(pid)M.pid=pid;M.kid=kid||"";if(nm!==null)M.name=auto?"":nm;}

/* corner handles: drawn over the photo, dragged with the finger */
function dscanAttach(){
  const M=DS();if(!M)return;
  if(M.stage==="cam"){if(!M.err){if(dcam)dattachCam();else dstartCam();}const fi=document.getElementById("dsIn");if(fi)fi.onchange=()=>{const f=fi.files[0];fi.value="";dfromFile(f).catch(()=>toast(L("Foto konnte nicht gelesen werden.","Could not read the photo.")));};return;}
  if(M.stage!=="adjust"||!M.src)return;
  const box=document.getElementById("dsadj"),cv=document.getElementById("dsimg"),svg=document.getElementById("dssvg");if(!box||!cv)return;
  const bw=box.clientWidth-48,bh=box.clientHeight-48,k=Math.min(bw/M.src.width,bh/M.src.height),w=Math.round(M.src.width*k),h=Math.round(M.src.height*k);
  cv.width=w;cv.height=h;cv.style.width=w+"px";cv.style.height=h+"px";cv.getContext("2d").drawImage(M.src,0,0,w,h);
  svg.setAttribute("width",w);svg.setAttribute("height",h);svg.style.width=w+"px";svg.style.height=h+"px";
  const draw=()=>{const pts=M.quad.map(([x,y])=>[x*k,y*k]);svg.innerHTML=`<polygon points="${pts.map(p=>p.join(",")).join(" ")}" fill="rgba(37,99,235,.12)" stroke="#2563eb" stroke-width="2"/>`+pts.map((p,i)=>`<circle data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="14" fill="#fff" stroke="#2563eb" stroke-width="3"/>`).join("");};
  draw();let drag=-1;
  svg.onpointerdown=e=>{const t=e.target.closest("circle");if(!t)return;drag=+t.dataset.i;svg.setPointerCapture(e.pointerId);e.preventDefault();};
  svg.onpointermove=e=>{if(drag<0)return;const r=svg.getBoundingClientRect(),x=Math.max(0,Math.min(w,e.clientX-r.left)),y=Math.max(0,Math.min(h,e.clientY-r.top));M.quad[drag]=[x/k,y/k];draw();};
  svg.onpointerup=svg.onpointercancel=()=>{drag=-1;};
}

async function dscanSave(){
  const M=DS();if(!M||!M.pages.length)return;dsRead();
  const kind=M.kind||"wv",pid=M.pid||D.pid,kid=DK_WITH_K.includes(kind)?M.kid:"",name=(M.name||dsName(kind,pid,kid)).replace(/\.pdf$/i,"")+".pdf";
  await libsPDF();const {jsPDF}=window.jspdf;let doc=null;
  M.pages.forEach(pg=>{const land=pg.w>pg.h,PW=land?297:210,PH=land?210:297;if(!doc)doc=new jsPDF({unit:"mm",format:"a4",orientation:land?"landscape":"portrait"});else doc.addPage("a4",land?"landscape":"portrait");
    const s=Math.min(PW/pg.w,PH/pg.h),w=pg.w*s,h=pg.h*s;doc.addImage(pg.data,"JPEG",(PW-w)/2,(PH-h)/2,w,h);});
  const blob=doc.output("blob"),id=newId("f");await FDB.put(id,blob);
  DOCS().push({id,scope:"doc",ref:pid,pid,kid:kid||undefined,kind,name,type:"application/pdf",size:blob.size,date:iso(TODAY),pages:M.pages.length,until:DK_UNTIL.includes(kind)?(M.until!=null?M.until:kind==="gs"?addDays(iso(TODAY),730):"")||null:null});
  dscanClose();render();
  toast(dkName(kind)+L(" abgelegt bei "," filed with ")+((PJ(pid)||{}).name||"")+(kid&&K(kid)?" · "+K(kid).name:""));
}
