"""Accessibility (axe-core, WCAG 2 A/AA) on the main screens, phone size."""
import asyncio,os
from playwright.async_api import async_playwright
from common import ok,done,start
AXE=open(os.path.join(os.path.dirname(__file__),'..','vendor','axe.min.js')).read()
SCREENS=[('buero',''),('uebersicht',''),('rechnungen',''),('rechnungen',"document.querySelector('[data-act=open-inv]').click()"),('handwerker',''),('handwerker',"S.kid=D.contractors[0].id;render()"),('budget',''),('ausschreibungen',''),('ausschreibungen',"S.tid='t7';render()"),('ausschreibungen',"S.tid='t6';render()"),('ausschreibungen',"S.tid='t2';render()"),('ausschreibungen',"S.tid='t5';render()"),('profil',''),('einstellungen','')]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx,pg,errs=await start(b,mobile=True,room='ax')
    for v,js in SCREENS:
      await pg.evaluate(f"()=>{{try{{closeAll()}}catch(e){{}};S.tid=null;S.kid=null;go('{v}');{js}}}");await pg.wait_for_timeout(500)
      await pg.add_script_tag(content=AXE)
      r=await pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa']});return r.violations.map(v=>v.id+' ('+v.nodes.length+')')}")
      ok('Barrierefrei: '+v+(' · '+js[:20] if js else ''),not r,r)
    await b.close()
  done()
asyncio.run(main())
