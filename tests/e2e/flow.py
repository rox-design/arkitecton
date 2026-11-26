import asyncio,os,sys,tempfile,json,subprocess
from playwright.async_api import async_playwright
R=[]
def ok(name,cond,info=''):R.append(('OK ' if cond else 'FAIL ')+name+(' '+str(info) if info else ''))
async def act(pg,a,**kw):
  await pg.evaluate("([a,kw])=>{const b=document.createElement('button');b.dataset.act=a;Object.entries(kw).forEach(([k,v])=>b.dataset[k]=v);b.style.display='none';document.body.appendChild(b);b.click();b.remove()}",[a,kw]);await pg.wait_for_timeout(500)
async def dl(pg,js,name):
  try:
    async with pg.expect_download(timeout=15000) as d: await pg.evaluate(js)
    f=os.path.join(tempfile.gettempdir(),name);await (await d.value).save_as(f)
    t=subprocess.run(['pdftotext',f,'-'],capture_output=True,text=True).stdout
    n=subprocess.run(['pdfinfo',f],capture_output=True,text=True).stdout
    pages=[l for l in n.splitlines() if l.startswith('Pages')]
    return t,pages
  except Exception as e: return None,str(e)[:120]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True,locale='de-CH')
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load' not in m.text and errs.append(m.text))
    await pg.goto('http://localhost:8766/app/?raum=e2e');await pg.evaluate('localStorage.clear()');await pg.goto('http://localhost:8766/app/?raum=e2e')
    await pg.click('[data-act="start-example"]');await pg.wait_for_timeout(2500)
    n0=await pg.evaluate('D.invoices.length')
    # capture sample invoice
    await act(pg,'capture');await act(pg,'use-sample');await pg.wait_for_timeout(1200)
    st=await pg.evaluate('S.modal&&S.modal.step');ok('Beispielrechnung gelesen, Schritt',st in (2,3),st)
    for a in ['to-step3','confirm-capture']:
      if await pg.query_selector(f'#overlay [data-act="{a}"]'):await pg.click(f'#overlay [data-act="{a}"]');await pg.wait_for_timeout(700)
    n1=await pg.evaluate('D.invoices.length');ok('Rechnung erfasst',n1==n0+1,(n0,n1))
    # batch samples
    await act(pg,'capture');await act(pg,'use-samples');await pg.wait_for_timeout(2500)
    if await pg.query_selector('#overlay [data-act="batch-save"]'):await pg.click('#overlay [data-act="batch-save"]');await pg.wait_for_timeout(800)
    n2=await pg.evaluate('D.invoices.length');ok('Mehrere Rechnungen erfasst',n2>n1,(n1,n2))
    # approve one
    iid=await pg.evaluate("PI().find(i=>i.status==='pruefen').id");await act(pg,'open-inv',id=iid);await act(pg,'approve',id=iid)
    s=await pg.evaluate(f"D.invoices.find(i=>i.id==='{iid}').status");ok('Einzelfreigabe',s=='frei',s)
    # bulk
    await pg.evaluate("go('rechnungen')");await pg.wait_for_timeout(400)
    fb=await pg.evaluate("PI().filter(i=>i.status==='frei').length")
    await pg.click('[data-k="inv:pruefen"]');await pg.wait_for_timeout(400)  # the button sits in the «Zu prüfen» sheet
    if await pg.query_selector('[data-act="bulk-open"]'):
      await pg.click('[data-act="bulk-open"]');await pg.wait_for_timeout(500)
      if await pg.query_selector('#overlay [data-act="bulk-approve"]'):await pg.click('#overlay [data-act="bulk-approve"]');await pg.wait_for_timeout(700)
    fa=await pg.evaluate("PI().filter(i=>i.status==='frei').length");ok('Gemeinsam freigeben',fa>fb,(fb,fa))
    # PDFs
    t,pg_=await dl(pg,"payPDFAll(PIx().filter(i=>i.status==='frei'))",'za.pdf');ok('Zahlungsfreigabe PDF',t and 'ZA-' in t,pg_)
    t2,_=await dl(pg,"payPDFAll(PIx().filter(i=>i.status==='frei'))",'za2.pdf')
    import re
    z1=re.findall(r'ZA-\d+-\d+',t or '');z2=re.findall(r'ZA-\d+-\d+',t2 or '');ok('ZA-Nummer bleibt gleich beim Neudruck',z1[:1]==z2[:1] and z1,(z1[:2],z2[:2]))
    t,p_=await dl(pg,f"visumPDF(INV('{iid}'))",'visum.pdf');ok('Visum PDF',t is not None,p_)
    t,p_=await dl(pg,"costPDF()",'cost.pdf');ok('Kostenstand PDF 1 Seite',t and 'Kostenstand' in t,p_)
    t,p_=await dl(pg,"finalPDF()",'ba.pdf');ok('Bauabrechnung PDF',t and 'Bauabrechnung' in t,p_)
    # scan + save
    await pg.evaluate('dscanOpen()');await pg.wait_for_timeout(300);await pg.set_input_files('#dsIn','/tmp/scan/photo1.jpg');await pg.wait_for_timeout(1500)
    await pg.evaluate('daccept()');await pg.wait_for_timeout(600)
    stg=await pg.evaluate('DS()&&DS().stage');
    if stg!='save':
      await act(pg,'ds-next')
    stg=await pg.evaluate('DS()&&DS().stage');ok('Scanner bis Ablegen',stg=='save',stg)
    nd=await pg.evaluate("DOCS().length");await pg.evaluate("dscanSave()");await pg.wait_for_timeout(1500)
    nd2=await pg.evaluate("DOCS().length");ok('Dokument abgelegt',nd2==nd+1,(nd,nd2))
    # persistence
    await pg.reload();await pg.wait_for_timeout(1500)
    n3=await pg.evaluate('D.invoices.length');nd3=await pg.evaluate("DOCS().length");ok('Daten nach Neuladen da',n3==n2 and nd3==nd2,(n3,nd3))
    # overflow at 320px on all views
    await pg.set_viewport_size({'width':320,'height':640})
    for v in ['buero','uebersicht','rechnungen','handwerker','budget','ausschreibungen','einstellungen']:
      await pg.evaluate(f"go('{v}')");await pg.wait_for_timeout(400)
      ov=await pg.evaluate("(()=>{const W=document.documentElement.clientWidth;return [...document.querySelectorAll('#main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>W+1&&getComputedStyle(e).position!=='fixed'}).slice(0,3).map(e=>e.tagName+'.'+e.className+':'+Math.round(e.getBoundingClientRect().right))})()")
      ok('320px kein Überlauf '+v,not ov,ov)
    ok('Keine JS-Fehler',not errs,errs[:5])
    await b.close()
  print('\n'.join(R))
  sys.exit(1 if any(r.startswith('FAIL') for r in R) else 0)
asyncio.run(main())
