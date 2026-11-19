#!/bin/sh
# Release gate: unit tests for money logic and QR codes, then the layout check.
# Needs a local server in the repo: python3 -m http.server 8766
set -e
cd "$(dirname "$0")/.."
python3 tests/run_unit.py
python3 tests/layout_check.py
