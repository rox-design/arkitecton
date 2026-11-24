# arkitecton: Regeln für die Arbeit mit Claude

arkitecton ist eine Web-App für die Bauadministration kleiner Schweizer Architekturbüros (1 bis 9 Personen): Projekte, Handwerker, Werkverträge, Rechnungen mit QR-Einzahlungsschein, Budget nach BKP, Honorare, Ausschreibungen (simap.ch), Büroprofil.
Live: https://rox-design.github.io/arkitecton/ · Inhaber: Rox (rox-design).

## Zusammenarbeit
- Antworten auf Deutsch, direkt und präzise. Keine Gedankenstriche (— oder –) in Texten für Rox oder in der App: Komma, Doppelpunkt oder Punkt verwenden.
- Keine gendergerechte Schreibweise (keine :innen/*innen). Begriffe wie «Bauherrschaft» sind in Ordnung.
- Genau das tun, was Rox verlangt. Beim Iterieren oder Erkunden zuerst Fragen stellen, nicht mit eigenen Lösungen vorpreschen. Vorschläge kurz begründen und auf Bestätigung warten.
- Keine Annahmen über das hinaus, was Rox sagt. Wenn keine Antwort vorhanden ist: «Ich habe keine Antwort».
- Keine Behauptungen ohne Prüfung: erst testen, dann melden. Nie behaupten, Rox habe etwas gesagt, das er nicht gesagt hat.

## Produktgrundsätze
- Jede neue Funktion ist sofort in der Live-App sichtbar und testbar, mit Beispieldaten in den bestehenden Beispieldaten (Migration), ohne Zusatzschritte für Rox.
- Alles muss ohne Erklärung verständlich sein (Erstnutzer). UI/UX-Best-Practices proaktiv anwenden.
- Ursachen strukturell beheben, nicht einzelne Beschriftungen flicken.
- Überall dieselbe Struktur und Hierarchie: jede Seite sieht gleich aus und verhält sich gleich, mit und ohne Daten.
- Für viele Büros bauen, nicht nur für einen Testarchitekten. Branchenstandards (z.B. selektives Verfahren, Bewerbungsmappe) gehören dazu.
- Entscheide: Scan-Knopf auf dem Handy nur im Bereich Rechnungen. Büroprofil ist ein eigener Bereich (Büro, Team, Referenzen, Unterlagen des Büros). Bei Ausschreibungen werden Personen aus dem Team Rollen zugewiesen.

## Technik
- Statische Web-App ohne Build, GitHub Pages. Skripte in `index.html` in dieser Reihenfolge: `bkp.js`, `js/01-core.js` … `js/11-bids.js`, `app.js`. Alle teilen einen globalen Namensraum.
- Daten: ein Objekt `D` in localStorage (`KEY`), Dateien in IndexedDB (`FDB`). Speichern nur über `saveData()` (Revisionsprüfung gegen andere Tabs).
- Neue Felder oder Beispieldaten: Migration in `runMigrations()` mit eigenem Flag `D.mig.<name>`, Beispieldaten nur wenn `D.example`.
- Neue Objekte: `newId("<präfix>")` (zufällig, UUID). Bestehende Kennungen nie umschreiben.
- Texte immer zweisprachig mit `L(de,en)`. Jeder Benutzertext in HTML durch `esc()`.
- Aktionen über `data-act` und den zentralen `switch` in `app.js`. Formulare über `formDef()`/`submitForm()` in `js/08-forms.js`.
- Löschen und folgenschwere Aktionen: `snap()` vorher, Toast mit Rückgängig.
- Grosse Bibliotheken bei Bedarf laden (`loadScript`, `libXLSX`, `libQR`, jsPDF).
- Fristen und Daten in lokaler Zeit (`iso`, `TODAY`, `addDays`, `daysTo`), nie `toISOString()` für Kalendertage.

## Ablauf bei jeder Änderung
1. Lokaler Server im Repo: `python3 -m http.server 8766`
2. Version in `index.html` erhöhen (alle `?v=` gleich): `sed -i 's/ALT/NEU/g' index.html`, Format `JJJJMMTT` plus Buchstabe.
3. `tests/check_all.sh` (Unit-Tests und Layout, Tippziele mindestens 40 px). Bei grösseren Änderungen zusätzlich `tests/run_e2e.sh` (Abläufe, mehrere Tabs, eingeschleuster Code, Barrierefreiheit, 320 px).
4. Selbst im Browser ansehen (Desktop und Handy, auch 320 px), bevor es Rox gemeldet wird.
5. Commit mit klarer Beschreibung, dann `git push` auf `main`. Rox den Link mit `?v=<Version>` geben.

## Offene Punkte
Siehe `BACKLOG.md` (u.a. Signaturschlüssel des Prüfsiegels auf den Server beim Server-Entscheid, Offline-Start, Linter).
