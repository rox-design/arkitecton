# arkitecton backlog

Ideas decided for later. Each entry says why it waits.

## Offers as PDF: read single positions with AI (stage 3)

- **Today (stage 1):** an offer PDF is stored with the contract; the app suggests the total from the PDF text and the architect confirms it. Comparing positions with the final account still needs the offer as Excel.
- **Later (stage 3):** read every position (pos, text, quantity, unit, price) from any offer PDF with an AI model, so the offer/final-account comparison works without Excel.
- **Why it waits:** needs a server (the PDF leaves the device, API costs, data protection). Implement together with the server and cross-device sync decision.
- **Not planned:** stage 2 (rule-based reading of positions from PDF text). Every contractor lays out offers differently and scanned PDFs have no text, so it would often read wrong.
- **Open question for architects:** do contractors deliver SIA 451 files (Swiss data format for bills of quantities)? Those can be read exactly, without AI.

## Payment flow (learned from the first architect, 18.11.2026)

- The architect checks and releases contractor invoices; the release goes to the client (Bauherrschaft), who pays the contractors and the architect's fees.
- Consequence to review: wording such as «Zu zahlen» and «Bezahlt» describes what the client pays, not the architect; the payment recommendation PDF to the client is the central output.

## BKP catalogue licence

- The app ships the classic BKP up to 3 digits in `bkp.js` (list from tender-service.ch). Sub-items like 211.5 come from the office's own list (Settings › BKP list, Excel import), so the office holds the rights to it.
- The BKP belongs to CRB. Before selling arkitecton, clarify with CRB whether the full catalogue may be shipped, or license it.

## Architecture before launch (from the code review, 19.11.2026)

- Done 19.11.2026: unit tests for the money logic and QR codes (`tests/unit.js`, run with `tests/run_unit.py`; `tests/check_all.sh` runs them together with the layout check).
- Done 19.11.2026: the code is split into `js/01-core.js` … `js/08-forms.js` and `app.js` (start-up), loaded in order by index.html. Next step later: ES modules with explicit imports instead of one shared global scope.
- Server sync with a schema version, replacing per-browser storage (see the sync decision).

## Echtheits-Code (Prüfsiegel) – Stand 20.11.2026
- Umgesetzt: Jedes Büro hat ein Schlüsselpaar (ECDSA P-256). Zahlungsfreigabe (ein Code pro Seite, max. 6 Rechnungen) und Visum (ein Code pro Rechnung) tragen einen signierten Mosaik-QR. `pruefen.html` prüft die Signatur im Browser, zeigt den Schlüssel-Fingerabdruck und merkt ihn sich pro Büro.
- Grenze ohne Server: Ein komplett nachgebauter Code mit eigenem Schlüssel wird nur erkannt, wenn das Gerät den echten Schlüssel des Büros schon kennt.
- Mit Server: Schlüsselregister pro Büro (Prüfseite fragt «gehört dieser Schlüssel zu diesem Büro?»), privater Schlüssel nicht mehr im Browser-Speicher, Widerruf bei Verlust, Prüfprotokoll der Scans.
- Option später: Logo des Büros im Code (grosses Paket).

## Architecture review 24.11.2026: fix with the server decision

Fixed on 24.11.2026 (version 20261126e): several tabs no longer overwrite each other (revision check, other tab reloads), a damaged saved state is kept aside and offered for download, restoring a backup no longer wipes documents first and can be undone, backup note corrected. Two escaping gaps fixed (names in the QES check, SIA phases).

To do together with the server and sync decision:
1. **IDs:** today `p12`, `i340` count up per browser. Switch to UUIDs before syncing devices, with a migration that rewrites all references.
2. **Signing key of the seal:** the private key sits in browser storage and in the backup file; whoever has the file can sign valid codes. Move signing to the server (key never leaves it), backup without the key.
3. ~~**Load time**~~ Done 24.11.2026: xlsx and jsQR load on first use and in the background after start; first start on a slow line 9 s → 3.4 s.
4. **Offline:** no service worker; without network the app does not start. Add one with a versioned cache.
5. ~~**Fonts:** self-host instead of Google Fonts.~~ Done 24.11.2026: Instrument Sans lies in `fonts/` (OFL), no request leaves the app.
6. **Tests:** unit tests cover only the money logic. Add tenders (eligibility, deadlines, appeal period, workload, signatures) and move the end-to-end, layout-at-320px, accessibility (axe) and injection scripts into `tests/`.
7. **Maintainability:** very dense lines (up to 1'300 characters), one shared global scope, no linter or formatter in the repo (ESLint ran clean on 24.11.). Add Prettier and ESLint, then ES modules.
8. **Example data:** example seeds and their 22 migrations are mixed with production code; move them into their own file that real offices never load.
9. ~~**Date at midnight**~~ Done 24.11.2026: `TODAY` moves forward in place when the day changes (checked every minute, on focus and when the app becomes visible) and the view redraws.
