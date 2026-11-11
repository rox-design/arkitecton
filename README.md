# arkitecton

Bauadministration für kleine Architekturbüros: Handwerker, Werkverträge, Rechnungen mit QR-Scan, Rückbehalte, Budget nach BKP, Offertvergleich und Ausschreibungen.

**Stand:** Web-App MVP für Tests mit Architekten. Die Daten bleiben im Browser auf dem jeweiligen Gerät (localStorage). Kein Server, keine Anmeldung.

## Starten

Die App ist eine statische Website ohne Build-Schritt: `index.html`, `styles.css`, `app.js`.

Lokal: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.
Die Live-Kamera braucht HTTPS (zum Beispiel GitHub Pages) oder `localhost`.

## Bibliotheken

- [SheetJS](https://sheetjs.com) für Excel-Import und -Export
- [jsQR](https://github.com/cozmo/jsQR) für das Lesen der Schweizer QR-Rechnung

## Nächste Phasen

1. Tests mit Architekten
2. Datenbank, Anmeldung und Dateiablage (Supabase, Region Zürich)
3. Ausschreibungen von simap.ch
4. Zahlungsdatei (pain.001), Buchhaltungsanbindung, native App
