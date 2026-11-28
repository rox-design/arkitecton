"""Access code: the test version opens only with a valid code (forced on localhost with arkitecton:gate=1)."""
import asyncio
from playwright.async_api import async_playwright
from common import ok,done
B='http://localhost:8766/'
async def run(b,mob):
  tag='Handy' if mob else 'Desktop'
  ctx=await b.new_context(viewport={'width':390 if mob else 1440,'height':860},is_mobile=mob,has_touch=mob);pg=await ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  await pg.goto(B);await pg.evaluate("localStorage.clear();localStorage.setItem('arkitecton:gate','1')")
  # direct app link without code goes back to the start page with the code dialog
  await pg.goto(B+'app/');await pg.wait_for_timeout(800)
  ok(f'{tag}: App ohne Code führt zur Startseite',pg.url.rstrip('/')==B.rstrip('/') or pg.url.startswith(B+'#') or pg.url==B,pg.url)
  ok(f'{tag}: Codefenster offen',await pg.evaluate("document.getElementById('gate').open"))
  await pg.evaluate("document.getElementById('gate').close()")
  # Testversion asks for the code
  await pg.click('header a[href="app/"]');await pg.wait_for_timeout(200)
  ok(f'{tag}: «Testversion» fragt nach dem Code',await pg.evaluate("document.getElementById('gate').open"))
  await pg.fill('#gateC','falsch');await pg.click('#gateF button[type=submit]');await pg.wait_for_timeout(300)
  ok(f'{tag}: Falscher Code: Meldung',"stimmt nicht" in await pg.inner_text('#gateM'))
  # an expired code says so
  await pg.evaluate("ACCESS.codes.push({h:'',until:'2020-01-01T00:00:00+01:00'})")
  await pg.evaluate("ACCESS.hash('ALT-1').then(h=>{ACCESS.codes[ACCESS.codes.length-1].h=h})");await pg.wait_for_timeout(100)
  await pg.fill('#gateC','alt-1');await pg.click('#gateF button[type=submit]');await pg.wait_for_timeout(300)
  ok(f'{tag}: Abgelaufener Code: Meldung',"abgelaufen" in await pg.inner_text('#gateM'))
  # the architect's code works (lower case accepted) and is remembered
  await pg.fill('#gateC','seestrasse-2811');await pg.click('#gateF button[type=submit]');await pg.wait_for_timeout(1500)
  live=await pg.evaluate("1") if True else 0
  if '/app/' in pg.url:
    ok(f'{tag}: Richtiger Code öffnet die App',await pg.evaluate("!!document.querySelector('[data-act=\"start-example\"]')"))
    await pg.goto(B+'app/');await pg.wait_for_timeout(800)
    ok(f'{tag}: Code bleibt gemerkt',"/app/" in pg.url)
  else:
    ok(f'{tag}: Architekten-Code nach Ablauf gesperrt (Testlauf nach dem 28.11.)',"abgelaufen" in await pg.inner_text('#gateM'))
  # after the end: app sends back with the expired note
  await pg.goto(B);await pg.evaluate("localStorage.setItem('arkitecton:access','ebaa7b8815ba15fe19757294e6d27857bceced70633443d6a23f06611c9cd0d2')")
  await pg.add_init_script("(()=>{const r=Date.now;Date.now=()=>Date.parse('2026-11-29T00:00:30+01:00');})()")
  await pg.goto(B+'app/');await pg.wait_for_timeout(800)
  ok(f'{tag}: Nach Ablauf: App führt zur Startseite mit Hinweis',"abgelaufen" in await pg.inner_text('#gateM'),pg.url)
  ok(f'{tag}: Keine JS-Fehler',not errs,errs[:3])
  await ctx.close()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for mob in (False,True):await run(b,mob)
    await b.close()
  done()
asyncio.run(main())
