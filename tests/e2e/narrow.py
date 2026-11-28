"""Nothing sticks out sideways at 320 px, the narrowest phones."""
import asyncio
from playwright.async_api import async_playwright
from common import ok,done,start,URL
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx,pg,errs=await start(b,mobile=True,width=320)
    shots=["go('buero')","go('projekte')","go('uebersicht')","go('rechnungen')","go('handwerker')","go('handwerker');S.kid=D.contractors[0].id;render()","go('budget')","go('einstellungen')","go('ausschreibungen')","go('profil')"]+[f"go('ausschreibungen');S.tid='{t}';render()" for t in await pg.evaluate("D.tenders.map(t=>t.id)")]+["go('ausschreibungen');S.tid='t1';render();openForm('crew','t1')"]
    for js in shots:
      await pg.evaluate("()=>{try{closeAll()}catch(e){}}");await pg.evaluate(js);await pg.wait_for_timeout(200)
      ov=await pg.evaluate("[...document.querySelectorAll('#main *, #overlay *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,3).map(e=>e.className)")
      ok('320 px: '+js[-40:],not ov,ov)
    # every sheet that a tile opens: no button label is cut
    await pg.evaluate("()=>{closeAll();D.pid='p1';go('rechnungen')}");await pg.wait_for_timeout(200)
    for k in await pg.evaluate("[...document.querySelectorAll('#main [data-act=sheet]')].map(e=>e.dataset.k).filter(k=>k.startsWith('inv:'))"):
      await pg.evaluate("closeAll()");await pg.evaluate(f"document.querySelector('[data-k=\"{k}\"]').click()");await pg.wait_for_timeout(300)
      cut=await pg.evaluate("[...document.querySelectorAll('#overlay .btn')].filter(b=>b.getClientRects().length&&b.scrollWidth>b.clientWidth+1).map(b=>b.textContent.trim())")
      ok('320 px: Knöpfe im Blatt '+k+' nicht abgeschnitten',not cut,cut)
    ok('Keine JS-Fehler',not errs,errs[:3])
    # the landing page fits too
    lp=await ctx.new_page();await lp.goto(URL.replace('app/',''));await lp.wait_for_timeout(800)
    ok('320 px: Landingpage ohne seitliches Scrollen',await lp.evaluate("document.documentElement.scrollWidth<=innerWidth+1&&innerWidth<=321"),await lp.evaluate("[document.documentElement.scrollWidth,innerWidth]"))
    await b.close()
  done()
asyncio.run(main())
