"""The common page patterns on a phone and a desktop: short tiles, sections with a summary line, one «···» per document (sheet on the phone, menu on the desktop) with delete and undo, completed projects folded at the contractor."""
import asyncio
from playwright.async_api import async_playwright
from common import ok,done,start
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for mob in [True,False]:
      ctx,pg,errs=await start(b,mobile=mob);tag='Handy' if mob else 'Desktop'
      M='#overlay .mi' if mob else '#pop .popi'
      await pg.evaluate("go('profil')");await pg.wait_for_timeout(300)
      ok(f'{tag}: keine Stift- und Papierkorb-Knöpfe pro Dokument',not await pg.query_selector('.drow [data-act="ask"],.drow [data-f="docvalid"]'))
      n0=await pg.evaluate("docsFor('firm','firm').length")
      await pg.click('.docs .dmore');await pg.wait_for_timeout(200)
      ok(f'{tag}: ··· zeigt Öffnen, Bearbeiten, Löschen',len(await pg.query_selector_all(M))==3)
      await pg.click(f'{M}[data-act="doc-del"]');await pg.wait_for_timeout(300)
      ok(f'{tag}: Löschen',await pg.evaluate("docsFor('firm','firm').length")==n0-1)
      await pg.click('#toast [data-act="undo"]');await pg.wait_for_timeout(300)
      ok(f'{tag}: Rückgängig',await pg.evaluate("docsFor('firm','firm').length")==n0)
      ok(f'{tag}: Abgelaufene Unterlagen offen mit Statuszeile',await pg.evaluate("(()=>{const s=document.querySelector('section.docs.tsec');return !s.classList.contains('folded')&&!!s.querySelector('.sum')})()"))
      await pg.evaluate("go('buero')");await pg.wait_for_timeout(300)
      ok(f'{tag}: Einnahmen zugeklappt mit Statuszeile',await pg.evaluate("(()=>{const s=document.querySelector('section.income');return s.classList.contains('folded')&&!!s.querySelector('.sum')})()"))
      ok(f'{tag}: Kachel-Untertitel kurz',await pg.evaluate("Math.max(...[...document.querySelectorAll('#main .stat .ss')].map(e=>e.textContent.split(/\\s+/).length))")<=4)
      await pg.evaluate("go('uebersicht')");await pg.wait_for_timeout(300)
      ok(f'{tag}: Projekt zeigt höchstens 5 Aufgaben',await pg.evaluate("document.querySelectorAll('#main section:nth-of-type(1) .rows .row').length")<=5)
      await pg.click('[data-act="all-todo"]');await pg.wait_for_timeout(200)
      ok(f'{tag}: Alle anzeigen zeigt alle Aufgaben',await pg.evaluate("document.querySelectorAll('#main section:nth-of-type(1) .rows .row').length")>5)
      await pg.evaluate("go('handwerker');S.kid=D.contracts.find(w=>PJ(w.pid)&&PJ(w.pid).closed).k;render()");await pg.wait_for_timeout(300)
      ok(f'{tag}: Abgeschlossene Projekte beim Handwerker zugeklappt',await pg.evaluate("(()=>{const d=document.querySelector('.kdone');return !!d&&!d.open})()"))
      ok(f'{tag}: Keine JS-Fehler',not errs,errs[:3])
      await ctx.close()
    await b.close()
  done()
asyncio.run(main())
