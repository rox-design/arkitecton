"""Storage safety: two tabs, damaged saved state, restore with undo."""
import asyncio,json
from playwright.async_api import async_playwright
from common import ok,done,start,URL
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx,a,errs=await start(b,room='safe')
    # example seeding saves in the background; wait until the saved revision stays the same for 2 s
    last=None;same=0
    for _ in range(40):
      r=await a.evaluate("localStorage.getItem(REVKEY)")
      same=same+1 if r==last else 0;last=r
      if same>=4:break
      await a.wait_for_timeout(500)
    bb=await ctx.new_page();await bb.goto(URL+'?raum=safe');await bb.wait_for_timeout(1500)
    await bb.evaluate("D.firm.name='Aus B';saveData()");await a.wait_for_timeout(400)
    ok('Anderer Tab übernimmt Änderung',await a.evaluate("D.firm.name")=="Aus B")
    await a.evaluate("openForm('firm')");await a.wait_for_timeout(200)
    await bb.evaluate("D.firm.city='Bern-B';saveData()");await a.wait_for_timeout(300)
    await a.fill('#fName','Aus A');await a.click('#overlay button[type=submit]');await a.wait_for_timeout(500)
    st=await a.evaluate("JSON.parse(localStorage.getItem(KEY)).firm")
    ok('Veralteter Tab überschreibt nicht',st['city']=='Bern-B',st)
    ok('Meldung «Nicht gespeichert»',(await a.inner_text('#toast')).startswith('Nicht gespeichert'))
    await bb.close()
    # damage the saved state while no app page is open (an open app would save again when it is closed)
    key=await a.evaluate("KEY");await a.close()
    q=await ctx.new_page();await q.goto(URL+'fonts/OFL.txt');await q.evaluate("k=>localStorage.setItem(k,'{kaputt')",key);await q.close()
    a=await ctx.new_page();a.on('pageerror',lambda e:errs.append(str(e)));await a.goto(URL+'?raum=safe');await a.wait_for_timeout(800)
    ok('Beschädigter Stand: Hinweis',await a.locator('.welcome .notice').count()==1)
    ok('Beschädigter Stand: Kopie bleibt',await a.evaluate("localStorage.getItem(BADKEY)")=='{kaputt')
    await a.click('[data-act="start-example"]');await a.wait_for_timeout(2000)
    bk=await a.evaluate("(()=>{const o=JSON.parse(JSON.stringify(D));o.firm.name='Aus Sicherung';return JSON.stringify(o);})()")
    await a.evaluate("D.firm.name='Vorher';saveData()")
    await a.evaluate("handleImport('backup',new File([%s],'bk.json',{type:'application/json'}))"%json.dumps(bk));await a.wait_for_timeout(800)
    ok('Sicherung geladen',await a.evaluate("D.firm.name")=="Aus Sicherung")
    await a.click('#toast [data-act="undo"]');await a.wait_for_timeout(300)
    ok('Sicherung rückgängig',await a.evaluate("D.firm.name")=="Vorher")
    ok('Keine JS-Fehler',not errs,errs[:3])
    await b.close()
  done()
asyncio.run(main())
