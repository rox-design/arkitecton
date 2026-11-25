"""The navigation: four tabs for the office at the bottom (Home, Projekte, Ausschreibungen, Büroprofil), inside a project four tabs at the top
(Übersicht, Rechnungen, Handwerker, Budget) with «＋» and «···» beside the project name. The tabs stay in place when switching, swiping follows the bottom bar."""
import asyncio
from playwright.async_api import async_playwright
from common import ok,done,start
SW="""(dir)=>new Promise(res=>{const m=document.getElementById('main');const y=400,x0=dir<0?300:90,x1=dir<0?60:330;
 const mk=(t,x)=>{const tt=new Touch({identifier:1,target:m,clientX:x,clientY:y});m.dispatchEvent(new TouchEvent(t,{touches:t==='touchend'?[]:[tt],changedTouches:[tt],bubbles:true,cancelable:true}));};
 mk('touchstart',x0);let i=0;const iv=setInterval(()=>{i++;mk('touchmove',x0+(x1-x0)*i/8);if(i===8){clearInterval(iv);mk('touchend',x1);setTimeout(res,700);}},16);})"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for mob in [True,False]:
      ctx,pg,errs=await start(b,mobile=mob);tag='Handy' if mob else 'Desktop'
      bar='#tabbar' if mob else '#firmNav'
      ok(f'{tag}: unten vier Bereiche',await pg.evaluate(f"[...document.querySelectorAll('{bar} button')].map(b=>b.dataset.v).join()")=="buero,projekte,ausschreibungen,profil")
      await pg.click(f'{bar} [data-v="projekte"]');await pg.wait_for_timeout(250)
      ok(f'{tag}: Projekte listet die Projekte',await pg.evaluate("document.querySelectorAll('#main [data-act=\"open-project\"]').length")>=2)
      await pg.click('#main [data-act="open-project"]');await pg.wait_for_timeout(250)
      ok(f'{tag}: Projekt zeigt oben vier Reiter',await pg.evaluate("[...document.querySelectorAll('.pseg button')].map(b=>b.dataset.v).join()")=="uebersicht,rechnungen,handwerker,budget")
      ok(f'{tag}: Projekte bleibt im Projekt markiert',await pg.evaluate(f"document.querySelector('{bar} [aria-current]').dataset.v")=="projekte")
      pos=lambda:pg.evaluate("Math.round(document.querySelector('.pseg').getBoundingClientRect().top)")
      p0=await pos();moved=[]
      for v in ['rechnungen','handwerker','budget','uebersicht']:
        await pg.click(f'.pseg [data-v="{v}"]');await pg.wait_for_timeout(200);moved.append(await pos()-p0)
      ok(f'{tag}: Reiter bleiben beim Wechsel stehen',not any(moved),moved)
      gaps=[]
      for v in ['uebersicht','rechnungen','handwerker','budget']:
        await pg.click(f'.pseg [data-v="{v}"]');await pg.wait_for_timeout(200)
        gaps.append(await pg.evaluate("(()=>{const s=document.querySelector('.psegw').getBoundingClientRect().bottom;const f=[...document.querySelector('.psegw+.page').children].find(e=>getComputedStyle(e).position!=='absolute'&&e.offsetHeight>0);return Math.round(f.getBoundingClientRect().top-s)})()"))
      ok(f'{tag}: gleicher Abstand unter den Reitern',len(set(gaps))==1,gaps)
      exp={'uebersicht':None,'handwerker':'Handwerker erfassen','budget':'BKP-Position erfassen','rechnungen':None if mob else 'QR scannen'}
      for v,lab in exp.items():
        await pg.evaluate("closeAll();render()");await pg.click(f'.pseg [data-v="{v}"]');await pg.wait_for_timeout(200)
        got=await pg.evaluate("[...document.querySelectorAll('.pbact .ib')].filter(e=>e.offsetParent&&e.dataset.k!=='pmenu').map(e=>e.getAttribute('aria-label'))[0]||null")
        ok(f'{tag}: Knopf neben dem Projektnamen bei {v}',got==lab,got)
      await pg.click('.pseg [data-v="budget"]');await pg.wait_for_timeout(200)
      await pg.click('.pbact [data-act="form"][data-f="bkp"]');await pg.wait_for_timeout(250)
      ok(f'{tag}: ＋ bei Budget öffnet BKP-Position',await pg.evaluate("S.form&&S.form.f")=="bkp")
      await pg.evaluate("closeAll();render()");await pg.click('.pbact [data-k="pmenu"]');await pg.wait_for_timeout(250)
      items=await pg.evaluate("[...document.querySelectorAll('#overlay .mi')].map(e=>e.textContent)")
      ok(f'{tag}: ··· enthält Projekt bearbeiten und Neues Projekt',any('Projekt bearbeiten' in t for t in items) and any('Neues Projekt' in t for t in items),items)
      await pg.evaluate("closeAll();render()")
      if mob:
        await pg.evaluate("D.swipeSeen=1;go('buero')");await pg.wait_for_timeout(200);seq=[]
        for d in [-1,-1,-1,1]:
          await pg.evaluate(SW,d);seq.append(await pg.evaluate("S.view"))
        ok('Handy: Wischen folgt der Leiste unten',seq==['projekte','ausschreibungen','profil','ausschreibungen'],seq)
        ok('Handy: Scan-Knopf unten nur bei Rechnungen',await pg.evaluate("go('rechnungen');!!document.querySelector('#tabbar .tabscan')")and not await pg.evaluate("go('budget');!!document.querySelector('#tabbar .tabscan')"))
      ok(f'{tag}: Einstellungen im Büroprofil erreichbar',await pg.evaluate("go('profil');!!document.querySelector('#main [data-v=\"einstellungen\"]')"))
      ok(f'{tag}: keine JS-Fehler',not errs,errs[:3])
      await ctx.close()
    await b.close()
  done()
asyncio.run(main())
