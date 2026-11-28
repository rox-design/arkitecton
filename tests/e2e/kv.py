"""Cost estimate from Excel/CSV: preview, group totals left out, replace with undo, menus and empty state."""
import asyncio,os,tempfile
from playwright.async_api import async_playwright
from common import ok,done,start
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for mob,w in ((False,1440),(True,390)):
      tag='Handy' if mob else 'Desktop'
      ctx,pg,errs=await start(b,mobile=mob,width=w)
      await pg.evaluate("()=>{D.noticeOk=1;D.swipeSeen=1;D.swipeHinted=1}")
      # a new, empty project: empty budget offers the upload, the «···» of the project too
      await pg.evaluate("()=>{const id=newId('p');D.projects.push({id,name:'KV Test',place:'Zug',budget:[]});D.pid=id;go('budget')}");await pg.wait_for_timeout(200)
      ok(f'{tag}: Leeres Budget bietet «Kostenvoranschlag hochladen»',await pg.evaluate("!!document.querySelector('#main input[type=file][data-imp=kv]')"))
      await pg.evaluate("()=>{go('uebersicht');S.sheet='pmenu';render()}");await pg.wait_for_timeout(150)
      ok(f'{tag}: «···» im Projekt bietet «Kostenvoranschlag hochladen»',await pg.evaluate("!!document.querySelector('#overlay input[data-imp=kv]')"))
      await pg.evaluate("()=>{closeAll();go('budget');S.sheet='pmenu';render()}");await pg.wait_for_timeout(150)
      ok(f'{tag}: Im Reiter Budget genau einmal',await pg.evaluate("document.querySelectorAll('#overlay input[data-imp=kv]').length")==1)
      await pg.evaluate("closeAll();render()")
      # the template from the app itself
      async with pg.expect_download() as dl:
        await pg.evaluate("EXPORT['x-kv-template']()")
      d=await dl.value;path=os.path.join(tempfile.mkdtemp(),'kv.xlsx');await d.save_as(path)
      await pg.set_input_files('#main input[data-imp=kv]',path);await pg.wait_for_timeout(1500)
      n=await pg.evaluate("document.querySelectorAll('#overlay .kvr').length")
      ok(f'{tag}: Vorschau zeigt die 16 Positionen ohne Gruppensummen',n==16,n)
      ok(f'{tag}: Summe stimmt mit dem Total im Dokument',await pg.evaluate("!document.getElementById('kvChk').classList.contains('bad')&&num(document.getElementById('kvSum').textContent)===1844000&&+document.getElementById('kvChk').dataset.total===1844000"),await pg.evaluate("document.getElementById('kvSum').textContent"))
      # switch one off, correct one amount: the total follows
      await pg.click('#kvOn0',force=True);await pg.fill('#kvA1','300000');await pg.wait_for_timeout(100)
      ok(f'{tag}: Summe folgt Abwahl und Korrektur',await pg.evaluate("num(document.getElementById('kvSum').textContent)")==1844000-42000-18000)
      await pg.click('#overlay .ofoot .btn.primary');await pg.wait_for_timeout(500)
      bud=await pg.evaluate("P().budget.map(b=>b.bkp+':'+b.kv)")
      ok(f'{tag}: 15 Positionen übernommen, Unterpositionen wie 211.5 dabei',len(bud)==15 and '211.5:300000' in bud and not any(x.startswith('211.1:') for x in bud),bud[:4])
      ok(f'{tag}: Danach im Reiter Budget',await pg.evaluate("S.view")=='budget')
      # a second upload replaces, keeps contracted items, and can be undone
      await pg.evaluate("()=>{const k=D.contractors[0];D.contracts.push({id:newId('w'),pid:D.pid,k:k.id,bkp:'211.5',sum:290000,ret:0});}")
      csv=os.path.join(tempfile.mkdtemp(),'kv2.csv')
      open(csv,'w',encoding='utf-8').write("BKP;Bezeichnung;Anteil;Betrag\n2 Gebäude;;100%;\"500'000.00\"\n221 Fenster;;30%;\"150'000.00\"\n230 Elektroanlagen;;70%;350000\nTotal;;;500000\n")
      await pg.evaluate("closeAll();render()")
      await pg.evaluate("()=>{S.sheet='pmenu';render()}");await pg.wait_for_timeout(150)
      await pg.set_input_files('#overlay input[data-imp=kv]',csv);await pg.wait_for_timeout(1200)
      ok(f'{tag}: CSV mit Code und Name in einer Zelle: 2 Positionen',await pg.evaluate("document.querySelectorAll('#overlay .kvr').length")==2)
      ok(f'{tag}: Hinweis Ersetzen und Werkvertrag 211.5 bleibt',await pg.evaluate("/Ersetzt die 15/.test(document.getElementById('overlay').innerText)&&/211\\.5/.test(document.getElementById('overlay').innerText)"))
      await pg.click('#overlay .ofoot .btn.primary');await pg.wait_for_timeout(500)
      bud=await pg.evaluate("P().budget.map(b=>b.bkp+':'+b.kv)")
      ok(f'{tag}: Ersetzt: 221, 230 und 211.5 mit 0',sorted(bud)==sorted(['221:150000','230:350000','211.5:0']),bud)
      await pg.evaluate("document.querySelector('#toast [data-act=undo], #toast button')?.click()");await pg.wait_for_timeout(400)
      ok(f'{tag}: Rückgängig bringt die 15 Positionen zurück',await pg.evaluate("P().budget.length")==15,await pg.evaluate("P().budget.length"))
      # a file without BKP codes says so
      bad=os.path.join(tempfile.mkdtemp(),'x.csv');open(bad,'w').write("Name;Wert\nA;1\n")
      await pg.evaluate("()=>{S.sheet='pmenu';render()}");await pg.wait_for_timeout(150)
      await pg.set_input_files('#overlay input[data-imp=kv]',bad);await pg.wait_for_timeout(800)
      ok(f'{tag}: Datei ohne BKP: Meldung, kein Formular',await pg.evaluate("!S.form&&/Keine BKP-Positionen/.test(document.getElementById('toast').innerText)"))
      ok(f'{tag}: Keine JS-Fehler',not errs,errs[:3])
      await ctx.close()
    await b.close()
  done()
asyncio.run(main())
