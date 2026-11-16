"""Layout check for arkitecton. Run before every release:
   python3 -m http.server 8766 &   then   python3 tests/layout_check.py
Fails on: page errors, horizontal overflow, cut-off tile values, elements outside the screen, tap targets under 40 px on phone."""
import asyncio,sys
from playwright.async_api import async_playwright
URL="http://localhost:8766/"
VIEWS=["buero","ausschreibungen","uebersicht","rechnungen","handwerker","budget","einstellungen"]
CHECK="""(phone)=>{const m=document.getElementById('main'),out=[];const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'};
 if(m.scrollWidth>m.clientWidth+1)out.push('horizontal overflow '+m.scrollWidth+'>'+m.clientWidth);
 const mr=m.getBoundingClientRect();if(phone&&(mr.left>1||mr.width<innerWidth-1))out.push('main is not full width: '+Math.round(mr.left)+'/'+Math.round(mr.width));
 [...m.querySelectorAll('.sv,.ra,h1')].filter(vis).forEach(e=>{if(e.scrollWidth>e.clientWidth+1)out.push('cut off: '+e.textContent.trim().slice(0,30))});
 [...m.querySelectorAll('.row,.stat,h1')].filter(vis).forEach(e=>{const r=e.getBoundingClientRect();if(r.right>innerWidth+1||r.left<-1)out.push('outside screen: '+e.textContent.trim().slice(0,30))});
 if(phone)[...document.querySelectorAll('main button,main summary,.tabbar button,.topbar button')].filter(vis).forEach(e=>{if(getComputedStyle(e).pointerEvents==='none')return;const r=e.getBoundingClientRect();if(r.height<40||r.width<40)out.push('small tap target '+Math.round(r.width)+'x'+Math.round(r.height)+': '+(e.getAttribute('aria-label')||e.textContent).trim().slice(0,24))});
 return out}"""
async def main():
  bad=[]
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for name,vp in [("desktop",(1440,900)),("laptop",(1100,720)),("phone",(390,844)),("small phone",(360,640))]:
      pg=await (await b.new_context(viewport={"width":vp[0],"height":vp[1]})).new_page()
      pg.on("pageerror",lambda e,name=name:bad.append(f"{name}: page error {e}"))
      await pg.goto(URL); await pg.click('[data-act="start-example"]'); await pg.wait_for_timeout(300)
      for v in VIEWS:
        await pg.evaluate(f"location.hash='{v}'"); await pg.wait_for_timeout(900)
        for x in await pg.evaluate(CHECK,"phone" in name): bad.append(f"{name} / {v}: {x}")
    await b.close()
  print("\n".join(bad) if bad else "layout check passed"); sys.exit(1 if bad else 0)
asyncio.run(main())
