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
      # «Nächster Schritt» on every page, first after the header, at most 3 points, the rest behind «Alle anzeigen»
      for v,js in [('Ausschreibungen',"go('ausschreibungen')"),('Home',"go('buero')"),('Projekt',"go('uebersicht')"),('Rechnungen',"go('rechnungen')"),('Honorar',"go('rechnungen');S.rtab='deb';render()"),('Handwerker',"go('handwerker')"),('Handwerker-Detail',"go('handwerker');S.kid=D.contractors[0].id;render()"),('Budget',"go('budget')"),('Büroprofil',"go('profil')")]:
        await pg.evaluate("S.rtab='kred';S.kid=null;S.tid=null;"+js);await pg.wait_for_timeout(250)
        r=await pg.evaluate("(()=>{const c=document.querySelector('#main .tnext');if(!c)return null;const st=document.querySelector('#main .page>.stats');const pos=st?!!(st.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING):true;const before=[...document.querySelectorAll('#main .page section')].filter(x=>x!==c&&(x.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)&&!x.closest('details'));return {after_stats:pos,first:!before.length,rows:c.querySelectorAll('.rows .row').length}})()")
        ok(f'{tag}: {v} zeigt zuerst den Stand, dann «Nächster Schritt»',bool(r) and r['after_stats'] and r['first'],r)
        ok(f'{tag}: {v} zeigt höchstens 3 Punkte',bool(r) and r['rows']<=3,r)
      await pg.evaluate("go('uebersicht')");await pg.wait_for_timeout(300)
      await pg.click('.tnext [data-act="next-all"]');await pg.wait_for_timeout(200)
      ok(f'{tag}: Alle anzeigen zeigt alle Punkte',await pg.evaluate("document.querySelectorAll('.tnext .rows .row').length")>3)
      await pg.evaluate("go('handwerker');S.kid=D.contracts.find(w=>PJ(w.pid)&&PJ(w.pid).closed).k;render()");await pg.wait_for_timeout(300)
      ok(f'{tag}: Abgeschlossene Projekte beim Handwerker zugeklappt',await pg.evaluate("(()=>{const d=document.querySelector('.kdone');return !!d&&!d.open})()"))
      ok(f'{tag}: Keine JS-Fehler',not errs,errs[:3])
      await ctx.close()
    await b.close()
  done()
asyncio.run(main())
