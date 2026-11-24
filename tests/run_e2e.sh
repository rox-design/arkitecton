#!/bin/sh
# End-to-end checks (Playwright, Chromium). Needs a local server in the repo: python3 -m http.server 8766
# Each script prints OK/FAIL lines and exits with 1 on a failure.
cd "$(dirname "$0")/e2e" || exit 1
fail=0
for s in flow undo tenders safety inject a11y narrow; do
  echo "== $s"; python3 $s.py || fail=1
done
exit $fail
