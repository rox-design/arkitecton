"""Shared helpers for the end-to-end checks. Needs a local server in the repo: python3 -m http.server 8766"""
import os,sys
URL=os.environ.get("ARK_URL","http://localhost:8766/")
R=[]
def ok(name,cond,info=''):R.append(('OK ' if cond else 'FAIL ')+name+(' '+str(info) if info and not cond else ''))
def done():
    print('\n'.join(R));sys.exit(1 if any(r.startswith('FAIL') for r in R) else 0)
async def start(b,mobile=False,width=None,room='e2e',**kw):
    vp={'width':width or (390 if mobile else 1440),'height':900}
    ctx=await b.new_context(viewport=vp,is_mobile=mobile,has_touch=mobile,locale='de-CH',accept_downloads=True,**kw)
    pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    u=URL+'?raum='+room
    await pg.goto(u);await pg.evaluate('localStorage.clear()');await pg.goto(u)
    await pg.click('[data-act="start-example"]');await pg.wait_for_timeout(2500)
    return ctx,pg,errs
