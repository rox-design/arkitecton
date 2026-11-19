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
