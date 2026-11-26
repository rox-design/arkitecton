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
- Navigation (seit 25.11.2026): unten vier Bereiche für das Büro: Home, Projekte, Ausschreibungen, Büroprofil (Einstellungen liegen im Büroprofil). Im Projekt oben Projektname (antippen wechselt das Projekt) und vier Reiter: Übersicht, Rechnungen, Handwerker, Budget. Die Reiter stehen beim Wechsel still und bleiben beim Scrollen oben. Neben dem Projektnamen «＋» für die Hauptaktion des Reiters (bei Übersicht keiner; bei Rechnungen auf dem Handy keiner, am Computer das Scanner-Symbol) und «···» für Nebenaktionen, Projekt bearbeiten und Neues Projekt. Wischen folgt der unteren Leiste.
- Seitenaufbau überall: Seitentitel gleich gross wie der Projektname, «＋» und «···» rechts daneben; zuerst der Stand (Kacheln, Zahl plus höchstens ein kurzes Wort), dann «Nächster Schritt» (höchstens 3 Punkte, Rest hinter «Alle anzeigen»), dann Abschnitte mit Statuszeile, zugeklappt wenn in Ordnung. Ausnahmen Rechnungen (Handwerker und Honorar), Reiter Handwerker und Budget: keine Karte «Nächster Schritt», weil die Kacheln genau diese Einträge öffnen.
- Kacheln öffnen ein Blatt (seit 25.11.2026), aber nur auf dem Handy. Am Computer erscheint derselbe Inhalt direkt unter den Kacheln (seit 26.11.2026): Kachel markiert, nochmals klicken oder × schliesst, Seitenwechsel schliesst. Gilt für: Home (Offene Rechnungen und Zu erhalten pro Projekt, Ausschreibungen nach Frist mit nächstem Schritt, Einnahmen-Diagramm) Rechnungen (die Rechnungen dieses Status) Handwerker (Werkverträge, Abgerechnet, Rückbehalt, Angaben fehlen) und Budget (Kostenvoranschlag mit Reserve, Vergeben, Nicht vergeben, Über Budget, jeweils als BKP-Tabelle). In den Beispieldaten ist keine Kachel leer: fehlt etwas, wird es per Migration simuliert, auch in bereits bestehenden Daten. Das Blatt zeigt genau so viele Einträge, wie die Kachel zählt. Eine Aktion im Blatt steht unten über die ganze Breite. Die Liste unter den Kacheln wird nicht gefiltert. Grundsatz: unter den Kacheln steht nichts, was schon in einem Blatt steht. Handwerker: nur Handwerker ohne Werkvertrag und der leere Zustand. Budget: nur der leere Zustand. Erklärungen nur im leeren Zustand oder hinter «i». Keine Bearbeiten- und Löschen-Knöpfe pro Zeile, sondern ein «···».
- Aufbau seit 27.11.2026 (Entwurf «uebersicht» übernommen): Kacheln überall als abgehobene Karten mit Schatten; am Computer ganze Breite bis 1600 px und schwarze Leiste links (Logo weiss, rotes Quadrat bleibt rot). Home: vier Kacheln (Offene Rechnungen, Zu erhalten, Ausschreibungen, Einnahmen), «Nächster Schritt» nur mit dem, was weder Kacheln noch Tabelle zeigen, dann Tabelle «Alle Rechnungen» über alle Projekte mit Filter (Offen, Zu prüfen, Rückfrage, Freigegeben, Mahnung fällig, Alle; Handwerker, Honorar, Beide). Projekte: Kacheln über alle laufenden Projekte (Laufende Projekte, Kostenvoranschlag, Mehrkosten, Über Budget) und jedes Projekt als Karte mit Kostenstand, Reserve, Mehrkosten, offenen Rechnungen. Übersicht im Projekt: Kacheln Rechnungen, Handwerker, Budget, Honorar springen in den Reiter; «Nächster Schritt» ohne Rechnungen; Mehrkosten, Angaben des Projekts, Projektdokumente. Im Projekt führt «‹ Projekte» über dem Namen zur Projektliste.
- Grössere Gestaltungsänderungen zuerst als Entwurf hinter `?entwurf=<name>` (Konstante `DRAFT` in `js/01-core.js`), Rox prüft, erst dann fest übernehmen.

## Technik
- Statische Web-App ohne Build, GitHub Pages. Startseite `index.html` ist die Landingpage (Testversion und Anmelden öffnen die App; alte App-Links mit #Bereich oder ?entwurf= leitet sie nach `app/` weiter). Die App liegt in `app/index.html` und lädt die Skripte aus dem Stamm (`../`), zur Laufzeit geladene Dateien über `ROOT`. Skripte in `app/index.html` in dieser Reihenfolge: `bkp.js`, `js/01-core.js` … `js/11-bids.js`, `app.js`. Alle teilen einen globalen Namensraum.
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
2. Version in `app/index.html` erhöhen (alle `?v=` gleich): `sed -i 's/ALT/NEU/g' app/index.html`, Format `JJJJMMTT` plus Buchstabe.
3. `tests/check_all.sh` (Unit-Tests und Layout, Tippziele mindestens 40 px). Bei grösseren Änderungen zusätzlich `tests/run_e2e.sh` (Abläufe, Seitenmuster, Navigation, mehrere Tabs, eingeschleuster Code, Barrierefreiheit, 320 px).
4. Vor dem Melden jede betroffene Seite gegen die abgemachten Muster prüfen und Rox das Ergebnis zeigen, nicht nur die Tests.
5. Selbst im Browser ansehen (Desktop und Handy, auch 320 px), bevor es Rox gemeldet wird.
6. Commit mit klarer Beschreibung, dann `git push` auf `main`. Rox den Link mit `?v=<Version>` geben.

## Anmeldung
- Heute (Entscheid 27.11.2026): «Anmelden» auf der Landingpage öffnet die App direkt, ohne Konto. Später mit dem Server: echte Anmeldung (Variante c).

## Offene Punkte
Siehe `BACKLOG.md` (u.a. Signaturschlüssel des Prüfsiegels auf den Server beim Server-Entscheid, Offline-Start, Linter).
