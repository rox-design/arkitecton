"""Unit tests for arkitecton's money logic and QR codes.
Usage: python3 -m http.server 8766 (in the repo), then python3 tests/run_unit.py
Prints each failed check and exits with 1 if any fail."""
import asyncio,sys,os
from playwright.async_api import async_playwright
URL=os.environ.get("ARK_URL","http://localhost:8766/app/")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.wait_for_timeout(300)
    await pg.add_script_tag(path=os.path.join(os.path.dirname(__file__),"unit.js"))
    res=await pg.evaluate("window.__unit")
    await b.close()
  bad=[r for r in res if not r["ok"]]
  for r in bad: print("FAIL",r["t"],"·",r["msg"],"got",r.get("got"),"want",r.get("want"))
  print(f"{len(res)-len(bad)} of {len(res)} checks passed"+(" · page errors: "+"; ".join(errs) if errs else ""))
  sys.exit(1 if bad or errs else 0)
asyncio.run(main())
