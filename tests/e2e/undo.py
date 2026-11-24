import asyncio,os,sys,tempfile
from playwright.async_api import async_playwright
R=[]
def ok(n,c,i=''):R.append(('OK ' if c else 'FAIL ')+n+' '+str(i))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto('http://localhost:8766/?raum=un');await pg.evaluate('localStorage.clear()');await pg.goto('http://localhost:8766/?raum=un')
    await pg.click('[data-act="start-example"]');await pg.wait_for_timeout(2000)
    async def act(a,**kw):
      await pg.evaluate("([a,kw])=>{const b=document.createElement('button');b.dataset.act=a;Object.entries(kw).forEach(([k,v])=>b.dataset[k]=v);document.body.appendChild(b);b.click();b.remove()}",[a,kw]);await pg.wait_for_timeout(500)
    # batch -> flash
    await act('capture');await pg.click('[data-act=use-samples]');await pg.wait_for_timeout(2500);await pg.click('#overlay [data-act=batch-save]');await pg.wait_for_timeout(600)
    fl=await pg.evaluate("document.querySelectorAll('.row.flash').length");ok('neue Rechnungen leuchten',fl>0,fl)
    await pg.screenshot(path=os.path.join(tempfile.gettempdir(),'flash.png'))
    # bulk approve + undo
    await pg.wait_for_timeout(300);await pg.click('[data-act=bulk-open]');await pg.wait_for_timeout(500);await pg.click('#overlay [data-act=bulk-approve]');await pg.wait_for_timeout(500)
    fr=await pg.evaluate("PI().filter(i=>i.status==='frei').length");t=await pg.evaluate("document.getElementById('toast').innerText")
    ok('Meldung mit Rückgängig',('Rückgängig' in t),t.replace('\n',' '))
    await pg.screenshot(path=os.path.join(tempfile.gettempdir(),'undo_toast.png'))
    await pg.click('#toast .tundo');await pg.wait_for_timeout(500)
    fr2=await pg.evaluate("PI().filter(i=>i.status==='frei').length");ok('Gemeinsam freigeben rückgängig',fr2<fr,(fr,fr2))
    # delete invoice + undo, file kept
    iid=await pg.evaluate("(D.invoices.find(i=>DOCS().some(d=>d.ref===i.id))||D.invoices[0]).id");fid=await pg.evaluate(f"(DOCS().find(d=>d.ref==='{iid}')||{{}}).id||''")
    n=await pg.evaluate('D.invoices.length');await act('del-inv',id=iid);n2=await pg.evaluate('D.invoices.length')
    await pg.click('#toast .tundo');await pg.wait_for_timeout(500);n3=await pg.evaluate('D.invoices.length')
    f=(await pg.evaluate(f"FDB.get('{fid}').then(x=>!!x)")) if fid else 'keine Datei';ok('Rechnung löschen rückgängig, Datei noch da',n2==n-1 and n3==n and f,(n,n2,n3,f))
    # delete doc, let undo expire -> file removed
    did=await pg.evaluate("DOCS().find(d=>d.scope==='doc').id");await act('doc-del',id=did);await pg.wait_for_timeout(7800)
    f2=await pg.evaluate(f"FDB.get('{did}').then(x=>!!x)");ok('Nach Ablauf Datei wirklich gelöscht',not f2,f2)
    # reload persists undo state
    await pg.reload();await pg.wait_for_timeout(1500);ok('Nach Neuladen konsistent',await pg.evaluate('D.invoices.length')==n)
    ok('Keine JS-Fehler',not errs,errs[:3])
    await b.close()
  print('\n'.join(R))
  sys.exit(1 if any(r.startswith('FAIL') for r in R) else 0)
asyncio.run(main())
