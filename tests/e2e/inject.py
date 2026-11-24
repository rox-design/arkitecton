"""Markup in every text field must never run: injects an <img onerror> into all user texts and renders every view."""
import asyncio,os
from playwright.async_api import async_playwright
from common import ok,done,start
INJ=open(os.path.join(os.path.dirname(__file__),'inject.js')).read()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx,pg,errs=await start(b)
    await pg.evaluate(INJ)
    for v in ['buero','ausschreibungen','profil','uebersicht','rechnungen','handwerker','budget','einstellungen']:
      await pg.evaluate(f"S.tid=null;S.kid=null;S.mid=null;go('{v}')");await pg.wait_for_timeout(200)
    for t in await pg.evaluate("D.tenders.map(t=>t.id)"):
      await pg.evaluate(f"go('ausschreibungen');S.tid='{t}';render()");await pg.wait_for_timeout(120)
    for k in await pg.evaluate("D.contractors.map(k=>k.id)"):
      await pg.evaluate(f"go('handwerker');S.kid='{k}';render()");await pg.wait_for_timeout(80)
    for m in await pg.evaluate("D.office.team.map(m=>m.id)"):
      await pg.evaluate(f"go('profil');S.mid='{m}';render()");await pg.wait_for_timeout(80)
    hit=await pg.evaluate("[...new Set(window.__h||[])]")
    ok('Kein eingeschleuster Code ausgeführt',not hit,hit)
    await b.close()
  done()
asyncio.run(main())
