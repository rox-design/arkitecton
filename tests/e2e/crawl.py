import asyncio,sys,json
from playwright.async_api import async_playwright
VIEW=sys.argv[1];MOB=sys.argv[2]=="m"
SKIP={"reset-all","wipe","demo-reset"}
async def fresh(pg):
  await pg.goto('http://localhost:8766/'); await pg.evaluate("localStorage.clear()"); await pg.goto('http://localhost:8766/')
  await pg.click('[data-act="start-example"]'); await pg.wait_for_timeout(250)
  await pg.goto('http://localhost:8766/#'+VIEW); await pg.wait_for_timeout(250)
async def main():
  out=[]
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx=await b.new_context(viewport={'width':390,'height':844} if MOB else {'width':1440,'height':900},is_mobile=MOB,has_touch=MOB,accept_downloads=True)
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' else None)
    pg.on('dialog',lambda d:asyncio.ensure_future(d.dismiss()))
    await fresh(pg)
    acts=await pg.evaluate("""[...document.querySelectorAll('[data-act]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).map((e,i)=>({i,act:e.dataset.act,id:e.dataset.id||'',f:e.dataset.f||e.dataset.k||e.dataset.v||e.dataset.t||'',txt:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,30)}))""")
    for a in acts:
      if a['act'] in SKIP: continue
      errs.clear()
      try:
        await fresh(pg)
        els=await pg.query_selector_all('[data-act]')
        vis=[e for e in els if await e.is_visible()]
        if a['i']>=len(vis): continue
        await vis[a['i']].click(timeout=2000); await pg.wait_for_timeout(250)
        # if a form/sheet opened: try its primary submit and every button once
        sub=await pg.query_selector('#overlay form button[type=submit]')
        if sub:
          await sub.click(timeout=1500); await pg.wait_for_timeout(200)
        ov=await pg.query_selector_all('#overlay [data-act]')
        for j in range(min(len(ov),12)):
          o=(await pg.query_selector_all('#overlay [data-act]'))
          if j>=len(o): break
          if await o[j].is_visible():
            act=await o[j].get_attribute('data-act')
            if act in SKIP: continue
            try: await o[j].click(timeout=1000); await pg.wait_for_timeout(150)
            except Exception: pass
      except Exception as e:
        errs.append('click-fail:'+str(e)[:80])
      real=[x for x in errs if not x.startswith('click-fail') and 'favicon' not in x and 'Failed to load resource' not in x]
      if real: out.append({'act':a,'errs':real[:3]})
    await b.close()
  print(json.dumps({'view':VIEW,'mob':MOB,'n':len(acts),'problems':out},ensure_ascii=False))
asyncio.run(main())
