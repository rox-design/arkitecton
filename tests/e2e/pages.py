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
      SH='#overlay .sheet' if mob else '#tpanel'  # phone: sheet; computer: content below the tiles
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
      ok(f'{tag}: Einnahmen als Kachel, kein Abschnitt unten',await pg.evaluate("!!document.querySelector('#main .stats [data-k=\"income\"]')&&!document.querySelector('section.income')"))
      ok(f'{tag}: Kachel-Untertitel kurz',await pg.evaluate("Math.max(...[...document.querySelectorAll('#main .stat .ss')].map(e=>e.textContent.split(/\\s+/).length))")<=4)
      # «Nächster Schritt» on every page, first after the header, at most 3 points, the rest behind «Alle anzeigen»
      for v,js in [('Ausschreibungen',"go('ausschreibungen')"),('Home',"go('buero')"),('Projekt',"go('uebersicht')"),('Handwerker-Detail',"go('handwerker');S.kid=D.contractors[0].id;render()"),('Büroprofil',"go('profil')")]:
        await pg.evaluate("S.rtab='kred';S.kid=null;S.tid=null;"+js);await pg.wait_for_timeout(250)
        r=await pg.evaluate("(()=>{const c=document.querySelector('#main .tnext');if(!c)return null;const st=document.querySelector('#main .page>.stats');const pos=st?!!(st.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING):true;const before=[...document.querySelectorAll('#main .page section')].filter(x=>x!==c&&(x.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)&&!x.closest('details'));return {after_stats:pos,first:!before.length,rows:c.querySelectorAll('.rows .row').length}})()")
        ok(f'{tag}: {v} zeigt zuerst den Stand, dann «Nächster Schritt»',bool(r) and r['after_stats'] and r['first'],r)
        ok(f'{tag}: {v} zeigt höchstens 3 Punkte',bool(r) and r['rows']<=3,r)
      await pg.evaluate("go('uebersicht')");await pg.wait_for_timeout(300)
      await pg.click('.tnext [data-act="next-all"]');await pg.wait_for_timeout(200)
      ok(f'{tag}: Alle anzeigen zeigt alle Punkte',await pg.evaluate("document.querySelectorAll('.tnext .rows .row').length")>3)
      await pg.evaluate("go('handwerker');S.kid=D.contracts.find(w=>PJ(w.pid)&&PJ(w.pid).closed).k;render()");await pg.wait_for_timeout(300)
      ok(f'{tag}: Abgeschlossene Projekte beim Handwerker zugeklappt',await pg.evaluate("(()=>{const d=document.querySelector('.kdone');return !!d&&!d.open})()"))
      # tiles open a sheet; the sheet lists exactly what the tile counts; Rechnungen has no «Nächster Schritt»
      await pg.evaluate("closeAll();go('buero')");await pg.wait_for_timeout(250)
      ok(f'{tag}: alle Kacheln auf Home antippbar',await pg.evaluate("[...document.querySelectorAll('#main .stats .stat')].every(e=>e.tagName==='BUTTON'&&e.dataset.act==='sheet')"))
      for k in ['sum-inv','sum-fee','sum-ten','income']:
        await pg.evaluate("closeAll();render()");await pg.click(f'[data-k="{k}"]');await pg.wait_for_timeout(250)
        ok(f'{tag}: Home-Kachel {k} öffnet '+('ein Blatt' if mob else 'den Inhalt unter den Kacheln'),await pg.evaluate("!!document.querySelector('"+SH+"')&&!document.querySelector('"+('#tpanel' if mob else '#overlay .sheet')+"')"))
      for tab,pre,keys in [('kred','inv:',['pruefen','rueckfrage','frei','bezahlt']),('deb','fee:',['open','due','paid'])]:
        await pg.evaluate(f"closeAll();S.rtab='{tab}';go('rechnungen')");await pg.wait_for_timeout(250)
        ok(f'{tag}: Rechnungen {tab} ohne «Nächster Schritt»',not await pg.query_selector('#main .tnext'))
        for k in keys:
          await pg.evaluate("closeAll();render()");await pg.wait_for_timeout(100)
          t=await pg.query_selector(f'[data-k="{pre}{k}"]')
          if not t: continue
          n=await pg.evaluate(f"parseInt(document.querySelector('[data-k=\"{pre}{k}\"] .ss').textContent)||1")
          await t.click();await pg.wait_for_timeout(250)
          ok(f'{tag}: Kachel {pre}{k} zeigt so viele Einträge wie sie zählt',await pg.evaluate("document.querySelectorAll('"+SH+" .row').length")==n)
          btn=await pg.query_selector(SH+' .bar-actions .btn')
          if btn: ok(f'{tag}: Knopf im Blatt {pre}{k} über die ganze Breite',await pg.evaluate("(()=>{const b=document.querySelector('"+SH+" .bar-actions .btn'),r=b.parentElement.getBoundingClientRect(),q=b.getBoundingClientRect();return Math.abs(r.width-q.width)<2})()"))
        ok(f'{tag}: Rechnungen {tab}: keine Kachel leer (Beispieldaten)',await pg.evaluate("closeAll(),render(),[...document.querySelectorAll('#main .stats .stat')].every(e=>e.tagName==='BUTTON')"))
      await pg.evaluate("closeAll();S.kid=null;go('handwerker')");await pg.wait_for_timeout(250)
      ok(f'{tag}: Handwerker ohne «Nächster Schritt»',not await pg.query_selector('#main .tnext'))
      if not mob:
        # computer: tile content opens below the tiles, the tile is marked, a second click or × closes it, leaving the page closes it
        await pg.evaluate("closeAll();S.tsel=null;D.pid='p1';S.rtab='kred';go('rechnungen')");await pg.wait_for_timeout(200)
        await pg.click('#main [data-k="inv:pruefen"]');await pg.wait_for_timeout(250)
        ok('Desktop: Inhalt erscheint direkt unter den Kacheln, kein Blatt',await pg.evaluate("(()=>{const t=document.getElementById('tpanel');return !!t&&t.previousElementSibling.classList.contains('stats')&&!document.querySelector('#overlay .sheet')})()"))
        ok('Desktop: gewählte Kachel markiert',await pg.evaluate("document.querySelector('#main [data-k=\"inv:pruefen\"]').classList.contains('sel')&&document.querySelector('#main [data-k=\"inv:pruefen\"]').getAttribute('aria-expanded')==='true'"))
        await pg.click('#main [data-k="inv:pruefen"]');await pg.wait_for_timeout(200)
        ok('Desktop: zweiter Klick auf die Kachel schliesst',not await pg.query_selector('#tpanel'))
        await pg.click('#main [data-k="inv:bezahlt"]');await pg.wait_for_timeout(200);await pg.click('#tpanel .x');await pg.wait_for_timeout(200)
        ok('Desktop: × schliesst',not await pg.query_selector('#tpanel'))
        await pg.click('#main [data-k="inv:bezahlt"]');await pg.wait_for_timeout(200);await pg.evaluate("go('uebersicht')");await pg.wait_for_timeout(200)
        ok('Desktop: Seitenwechsel schliesst',not await pg.query_selector('#tpanel'))
        # the page must not move when a tile opens or closes its content
        await pg.evaluate("D.pid='p1';S.rtab='kred';go('rechnungen')");await pg.wait_for_timeout(200)
        await pg.evaluate("document.getElementById('main').scrollTop=120");await pg.wait_for_timeout(100)
        y0=await pg.evaluate("document.querySelector('#main .stats').getBoundingClientRect().top")
        # clicks without Playwright's own scrolling into view, like a person clicking a visible tile
        for k in ['inv:bezahlt','inv:pruefen','inv:bezahlt']:
          await pg.evaluate(f"document.querySelector('#main [data-k=\"{k}\"]').click()");await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#tpanel .x').click()");await pg.wait_for_timeout(200)
        y1=await pg.evaluate("document.querySelector('#main .stats').getBoundingClientRect().top")
        ok('Desktop: Kacheln öffnen und schliessen ohne dass die Seite springt',abs(y1-y0)<3,(y0,y1,await pg.evaluate("document.getElementById('main').scrollTop")))
      # Handwerker: every tile opens a sheet with exactly the entries it counts; no tile is empty in the example data
      for pid in await pg.evaluate("D.projects.filter(p=>!p.closed&&D.contracts.some(w=>w.pid===p.id)).map(p=>p.id)"):
        await pg.evaluate(f"closeAll();D.pid='{pid}';S.kid=null;go('handwerker')");await pg.wait_for_timeout(250)
        ok(f'{tag}: Handwerker {pid}: alle Kacheln antippbar, keine leer',await pg.evaluate("[...document.querySelectorAll('#main .stats .stat')].every(e=>e.tagName==='BUTTON'&&e.dataset.act==='sheet')"))
        for k in ['all','billed','ret','missing']:
          await pg.evaluate("closeAll();S.tsel=null;render()");await pg.wait_for_timeout(100)
          exp=await pg.evaluate(f"(()=>{{const d=kData();return '{k}'==='missing'?d.kMiss.length:'{k}'==='all'?d.all.length:d.all.filter(d.FL['{k}']).length}})()")
          await pg.click(f'[data-k="kw:{k}"]');await pg.wait_for_timeout(250)
          ok(f'{tag}: Handwerker-Kachel {k} zeigt so viele Einträge wie sie zählt',await pg.evaluate("document.querySelectorAll('"+SH+" .row').length")==exp)
      await pg.evaluate("closeAll();D.pid='p2';go('handwerker');D.pid='p1';go('uebersicht');go('handwerker')");await pg.wait_for_timeout(250)
      if not mob: ok('Desktop: Handwerker öffnet mit den Werkverträgen unter den Kacheln',await pg.evaluate("S.tsel==='kw:all'&&document.querySelectorAll('#tpanel .row').length===kData().all.length"))
      else: ok('Handy: Handwerker öffnet ohne Blatt',await pg.evaluate("!document.querySelector('#overlay .sheet')"))
      await pg.evaluate("S.tsel=null;render()")
      await pg.evaluate("closeAll();D.pid='p1';go('handwerker')");await pg.wait_for_timeout(250)
      ok(f'{tag}: Handwerker: keine Liste der Werkverträge unter den Kacheln',await pg.evaluate("document.querySelectorAll('#main .page section .rows .row').length")==await pg.evaluate("kData().loose.length"))
      await pg.click('[data-k="kw:ret"]');await pg.wait_for_timeout(250);await pg.click(SH+' .row');await pg.wait_for_timeout(300)
      ok(f'{tag}: Zeile im Blatt öffnet den Handwerker',await pg.evaluate("!!S.kid&&!document.querySelector('#overlay .sheet,#tpanel')"))
      # Budget: every tile opens the BKP table with exactly the positions it counts; nothing below the tiles
      for pid in await pg.evaluate("D.projects.filter(p=>!p.closed&&(p.budget||[]).length).map(p=>p.id)"):
        await pg.evaluate(f"closeAll();D.pid='{pid}';S.kid=null;go('budget')");await pg.wait_for_timeout(250)
        ok(f'{tag}: Budget {pid}: alle Kacheln antippbar, keine leer',await pg.evaluate("[...document.querySelectorAll('#main .stats .stat')].every(e=>e.tagName==='BUTTON'&&e.dataset.act==='sheet')"))
        ok(f'{tag}: Budget {pid}: unter den Kacheln nichts, was in den Blättern steht',await pg.evaluate("![...document.querySelectorAll('#main .tnext,#main .brow,#main .bgroup')].some(e=>!e.closest('#tpanel'))"))
        if not mob: ok(f'Desktop: Budget {pid} öffnet mit dem Kostenvoranschlag unter den Kacheln',await pg.evaluate("S.tsel==='bud:all'&&document.querySelectorAll('#tpanel .brow').length===budgetRows().length"))
        for k in ['all','aw','no','over']:
          await pg.evaluate("closeAll();S.tsel=null;render()");await pg.wait_for_timeout(100)
          exp=await pg.evaluate(f"budgetRows().filter(BUD_F['{k}']).length")
          await pg.click(f'[data-k="bud:{k}"]');await pg.wait_for_timeout(250)
          ok(f'{tag}: Budget-Kachel {k} zeigt so viele Positionen wie sie zählt',await pg.evaluate("document.querySelectorAll('"+SH+" .brow').length")==exp)
        if not mob:
          ok(f'{tag}: Budget unter den Kacheln breit genug für die Tabelle',await pg.evaluate("document.querySelector('"+SH+"').getBoundingClientRect().width")>=700)
      await pg.evaluate("closeAll();D.pid='p1';go('budget');S.tsel=null;render()");await pg.wait_for_timeout(200)
      await pg.click('[data-k="bud:over"]');await pg.wait_for_timeout(250);await pg.click(SH+' .brow');await pg.wait_for_timeout(300)
      ok(f'{tag}: Position im Blatt öffnet die Erklärung',await pg.evaluate("!!S.kvx"))
      # existing data with retention 0 already frozen in the invoices: the migration still fills the Rückbehalt tile
      await pg.evaluate("closeAll();S.kid=null;D.contracts.forEach(w=>w.ret=0);D.invoices.forEach(i=>{if(i.type==='akonto'&&counted(i))i.retPct=0;});delete D.mig.retDemo;runMigrations();D.pid='p1';go('handwerker')");await pg.wait_for_timeout(250)
      ok(f'{tag}: Rückbehalt-Kachel auch in bestehenden Daten gefüllt',await pg.evaluate("!!document.querySelector('#main [data-k=\"kw:ret\"]')"))
      await pg.evaluate("closeAll();S.kid=null;render()")
      await pg.evaluate("closeAll();D.pid='p1';go('uebersicht')");await pg.wait_for_timeout(200)
      await pg.click('.pback');await pg.wait_for_timeout(250)
      ok(f'{tag}: im Projekt führt «Projekte» oben zurück zur Projektliste',await pg.evaluate("S.view")=='projekte')
      await pg.evaluate("closeAll();D.pid='p1';go('handwerker');S.kid=D.contractors[0].id;render()");await pg.wait_for_timeout(200)
      ok(f'{tag}: Handwerker im Projekt zeigt seinen Namen sichtbar',await pg.evaluate("(()=>{const h=document.querySelector('#main .page>.ph h1');return !!h&&h.textContent===D.contractors[0].name&&h.getBoundingClientRect().width>20})()"))
      await pg.evaluate("closeAll();S.kid=null;render()")
      await pg.evaluate("closeAll();S.kid=null;go('buero')");await pg.wait_for_timeout(200)
      ok(f'{tag}: Alle Rechnungen erscheinen nur einmal (Tabelle am Computer, Zeilen auf dem Handy)',await pg.evaluate("[...document.querySelectorAll('.ainv-t,.ainv-m')].filter(e=>e.getClientRects().length).length")==1)
      ok(f'{tag}: Beispieldaten: alle gewichteten Eignungskriterien eingeschätzt',await pg.evaluate("D.tenders.filter(t=>t.gek).every(t=>t.gek.every(z=>z.me))"))
      await pg.evaluate("closeAll();go('ausschreibungen');S.tid='t2';S.tfold={};render();Object.keys(S.tfold).forEach(k=>S.tfold[k]=false);render()");await pg.wait_for_timeout(250)
      ok(f'{tag}: Hinweis-Symbol steht auf der Höhe der ersten Textzeile',await pg.evaluate("[...document.querySelectorAll('#main .notice')].filter(n=>n.getClientRects().length&&n.querySelector(':scope>.ic+*')).every(n=>{const i=n.querySelector(':scope>.ic').getBoundingClientRect(),r=document.createRange();r.selectNodeContents(n.querySelector(':scope>.ic+*'));const l=r.getClientRects()[0];return Math.abs((i.top+i.bottom)/2-(l.top+l.bottom)/2)<=2})"))
      await pg.evaluate("closeAll();S.tid=null;go('buero')")
      ok(f'{tag}: Keine JS-Fehler',not errs,errs[:3])
      await ctx.close()
    await b.close()
  done()
asyncio.run(main())
