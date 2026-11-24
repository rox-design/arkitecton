"""Nothing sticks out sideways at 320 px, the narrowest phones."""
import asyncio
from playwright.async_api import async_playwright
from common import ok,done,start
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx,pg,errs=await start(b,mobile=True,width=320)
    shots=["go('buero')","go('uebersicht')","go('rechnungen')","go('handwerker')","go('handwerker');S.kid=D.contractors[0].id;render()","go('budget')","go('einstellungen')","go('ausschreibungen')","go('profil')"]+[f"go('ausschreibungen');S.tid='{t}';render()" for t in await pg.evaluate("D.tenders.map(t=>t.id)")]+["go('ausschreibungen');S.tid='t1';render();openForm('crew','t1')"]
    for js in shots:
      await pg.evaluate("()=>{try{closeAll()}catch(e){}}");await pg.evaluate(js);await pg.wait_for_timeout(200)
      ov=await pg.evaluate("[...document.querySelectorAll('#main *, #overlay *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1}).slice(0,3).map(e=>e.className)")
      ok('320 px: '+js[-40:],not ov,ov)
    ok('Keine JS-Fehler',not errs,errs[:3])
    await b.close()
  done()
asyncio.run(main())
