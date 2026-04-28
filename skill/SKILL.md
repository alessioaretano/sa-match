---
name: cv-job-match-salesahead
description: Bewertet die Passung eines Kandidaten-CVs zu einer Stellenbeschreibung mit einem Match-Score von 0 bis 100 Prozent und generiert einen HTML-Report im SalesAhead-Branding. Immer verwenden, wenn Alessio einen CV gegen eine Stellenbeschreibung matchen, scoren oder bewerten will, wenn er nach "Match Score", "CV Bewertung", "Kandidat vs Stelle", "Passung prüfen" oder "wie gut passt dieser Kandidat" fragt, oder wenn er einen CV zusammen mit einer Stellenanzeige (Text, PDF, Word-Datei oder URL) hochlädt. Auch verwenden, wenn er unsicher ist, ob ein Kandidat für ein aktuelles Mandat geeignet ist, oder einen Kandidaten-Shortlist-Vergleich braucht.
---

# CV-Job Match Analyzer (SalesAhead)

Dieser Skill bewertet systematisch, wie gut ein Kandidaten-CV zu einer Stellenbeschreibung passt, und produziert einen HTML-Report mit Match-Score, Pro/Contra-Analyse, Must-Have-Checkliste, Red Flags und Interview-Fragen im SalesAhead-Branding.

## Kernphilosophie

**SalesAhead arbeitet auf Mandat. Wir liefern nur Top-Kandidaten an unsere Kunden.** Der Scoring-Algorithmus ist daher streng:

- Fehlende Must-Haves führen zu harten Score-Caps
- Wer noch nie eine vergleichbare Rolle ausgeübt hat, kann nicht hoch bewertet werden, egal wie beeindruckend der Rest des CVs ist
- Branchen- und Funktionsfit schlagen theoretische Qualifikation
- Ehrlich statt nett: wenn ein Kandidat nicht passt, klar sagen

## Workflow

### Schritt 1: Inputs sammeln

Zwei Inputs sind nötig. Wenn Alessio nur einen von beiden schickt, aktiv nach dem fehlenden fragen, bevor du startest.

**Stellenbeschreibung** (eines davon):
- Copy-Paste-Text im Chat
- PDF-Datei in `/mnt/user-data/uploads`
- Word-Datei in `/mnt/user-data/uploads`
- URL zur Stellenanzeige (mit `web_fetch` abrufen)

**CV** (eines davon):
- Copy-Paste-Text im Chat
- PDF-Datei (wenn der Inhalt nicht bereits im Kontext ist, mit dem `pdf-reading` Skill extrahieren)
- Word-Datei
- LinkedIn-Profil-URL (mit `web_fetch` versuchen. LinkedIn blockt oft. Wenn kein sinnvoller Inhalt zurückkommt, Alessio um Copy-Paste des Profils bitten)

### Schritt 2: Anforderungen aus der Stellenbeschreibung extrahieren

**Must-Haves** erkennst du an Formulierungen wie:
- "zwingend", "Voraussetzung", "setzt voraus", "muss", "erforderlich", "required", "must have"
- Aufgelistete Kern-Qualifikationen ohne jeden Weichmacher
- Branchenerfahrung, wenn explizit genannt (z.B. "SaaS-Erfahrung erforderlich")
- Sprachen, wenn explizit genannt (z.B. "Deutsch verhandlungssicher")
- Berufserfahrung in Jahren, wenn explizit genannt ("mindestens 5 Jahre")
- Führungsspanne, wenn explizit genannt

**Nice-to-Haves** erkennst du an:
- "von Vorteil", "wünschenswert", "plus", "bevorzugt", "idealerweise", "preferred", "nice to have", "gerne gesehen"

**Funktionsfit (kritisch, siehe Scoring-Logik):**
Identifiziere die Kernrolle der Stelle und prüfe, ob der Kandidat diese oder eine klar vergleichbare Rolle schon einmal ausgeübt hat.

### Schritt 3: Scoring berechnen

**Vor jeder Score-Berechnung** die Datei `references/scoring-logic.md` vollständig lesen. Dort stehen die genauen Regeln für Caps, Gewichtungen und qualitative Zu- und Abschläge.

Die wichtigsten Regeln in Kürze:
- Keine vergleichbare Rolle je ausgeübt: Cap bei 25 Prozent
- 1 Must-Have fehlt vollständig: Cap bei 65 Prozent
- 2 Must-Haves fehlen: Cap bei 40 Prozent
- 3+ Must-Haves fehlen: Cap bei 20 Prozent
- Alle Must-Haves erfüllt: Startbasis 70 Prozent, Nice-to-Haves und Qualitätssignale führen nach oben

### Schritt 4: Pro- und Contra-Punkte formulieren

**Pro-Punkte** (konkret, mit Evidenz aus dem CV):
- "5 Jahre Account Management in B2B SaaS bei Company X" (nicht: "Relevante Erfahrung")
- Quantifizierte Erfolge ("120 Prozent Quote 3 Jahre in Folge")
- Branchennetzwerk, das zum Mandat passt
- Tech-Stack, Kundenportfolio, spezifische Expertise

**Contra-Punkte** (klar benennen, nicht umschreiben):
- Fehlende Must-Haves (z.B. "Keine Cybersecurity-Erfahrung")
- Seniorität mismatched (zu junior oder zu senior)
- Branchenwechsel ohne Übergang
- Geografischer Mismatch

### Schritt 5: Red Flags identifizieren

Prüfe und markiere:
- Häufige Jobwechsel (mehr als 2 Wechsel in 3 Jahren, ausser erklärlich durch Firmeninsolvenz, Umzug etc.)
- Längere unerklärte Lücken (>6 Monate ohne Kontext)
- Abwärtsbewegung in der Karriere
- Überqualifikation (signalisiert oft Flight-Risk)
- Zu kurze Verweildauer in aktueller Rolle (<1 Jahr) kombiniert mit vielen ähnlichen Wechseln

Wenn keine Red Flags: ausdrücklich so sagen, nicht erfinden.

### Schritt 6: 3 Interview-Fragen für Kim generieren

Die Fragen sollen:
- Unsicherheiten aus der Analyse konkret adressieren
- Auf identifizierte Lücken oder Red Flags eingehen
- Keine Standard-HR-Fragen sein ("Wo sehen Sie sich in 5 Jahren")
- Kurz, direkt, auf Deutsch (oder Englisch, je nach Mandatssprache)

Beispiel (gut): "Sie haben den Wechsel von inside sales zu field sales bei Y gemacht. Was war der Trigger und welche drei Fähigkeiten mussten Sie sich neu aneignen?"

Beispiel (schlecht, weil generisch): "Erzählen Sie von sich."

### Schritt 7: HTML-Report generieren

1. Lies `assets/template.html` vollständig ein.
2. Ersetze alle `{{PLATZHALTER}}` mit den analysierten Daten. Format-Hinweise siehe unten.
3. Speichere das finale HTML unter `/mnt/user-data/outputs/match-report-[kandidatenname-slug].html` (slug = nur ASCII, Kleinbuchstaben, Bindestriche).
4. Kopiere auch `assets/logo.png` nach `/mnt/user-data/outputs/logo.png`, damit der Report das Logo findet.
5. Nutze `present_files` um den Report Alessio zur Verfügung zu stellen.

### Schritt 8: Kurz-Fazit im Chat

Nach dem Report eine Zeile Fazit im Chat schreiben. Kein Fluff, kein Wiederholen des Reports. Beispiel:

> Match Score: 78%. Empfohlen für Erstgespräch mit Kim. Offene Frage zur Cybersecurity-Erfahrung unbedingt im Interview klären.

## Platzhalter im Template

Alle Platzhalter im Template sind im Format `{{GROSSBUCHSTABEN}}`. Liste:

| Platzhalter | Inhalt |
|-------------|--------|
| `{{DATE}}` | Heutiges Datum, Format `DD.MM.YYYY` |
| `{{CANDIDATE_NAME}}` | Vollständiger Name des Kandidaten |
| `{{POSITION}}` | Bezeichnung der offenen Stelle |
| `{{COMPANY}}` | Name des Kunden / Mandats |
| `{{SCORE}}` | Score als Ganzzahl (z.B. `78`) |
| `{{SCORE_COLOR}}` | Hex-Code gemäss Scoring-Kategorie (siehe `scoring-logic.md`) |
| `{{SCORE_CATEGORY}}` | Textkategorie (z.B. `Sehr guter Kandidat`) |
| `{{SCORE_VERDICT}}` | 1-2 Sätze Verdict, z.B. `Erfüllt alle Must-Haves. Offene Frage zum Cybersecurity-Track-Record.` |
| `{{CURRENT_ROLE}}` | Aktuelle Rolle |
| `{{CURRENT_COMPANY}}` | Aktueller Arbeitgeber |
| `{{EXPERIENCE_YEARS}}` | Gesamte Berufserfahrung in Jahren (z.B. `8`) |
| `{{LOCATION}}` | Standort, z.B. `Zürich, CH` |
| `{{LANGUAGES}}` | Sprachen, z.B. `DE (native), EN (C1), FR (B2)` |
| `{{EDUCATION}}` | Höchster Abschluss, z.B. `MSc Wirtschaft, ZHAW` |
| `{{MUST_HAVE_CHECKLIST}}` | HTML-Blöcke, siehe unten |
| `{{NICE_TO_HAVE_CHECKLIST}}` | HTML-Blöcke, siehe unten |
| `{{PRO_POINTS}}` | `<li>` Einträge |
| `{{CON_POINTS}}` | `<li>` Einträge |
| `{{RED_FLAGS}}` | HTML-Block, siehe unten |
| `{{INTERVIEW_QUESTIONS}}` | HTML-Blöcke, siehe unten |

### Format-Snippets

**Checklist-Item** (für Must-Have und Nice-to-Have):
```html
<div class="checklist-item">
  <div class="check-icon check-pass">✓</div>
  <div class="check-content">
    <div class="check-title">[Anforderung aus Stelle]</div>
    <div class="check-note">[Evidenz aus CV oder Begründung]</div>
  </div>
</div>
```
- `check-pass` (grün, ✓): erfüllt
- `check-partial` (gelb, ◐): teilweise erfüllt
- `check-fail` (rot, ✗): nicht erfüllt

**Pro-/Con-Points:** einfache `<li>` Listenelemente, kurz und konkret.
```html
<li>5 Jahre Key Account Management bei Microsoft (Schweiz), Portfolio CHF 12 Mio</li>
```

**Red Flags:** entweder `<ul><li>...</li></ul>` oder `<div class="none">Keine Red Flags identifiziert.</div>` wenn keine vorhanden.

**Interview-Fragen:**
```html
<div class="question">
  <div class="num">Frage 1</div>
  <div class="text">[Fragetext]</div>
</div>
```

## Stil- und Formatregeln (Alessios Vorgaben)

- **Keine Em-Dashes oder Bindestriche** (–, —, -) als Satzzeichen im Fliesstext. Normale Gedankenstrich-Funktion mit Kommas oder Klammern lösen.
- **Deutsch mit Umlauten** (ä, ö, ü). **Schweizer Orthographie**, kein ß.
- **Mandatssprache berücksichtigen:** Wenn die Stellenbeschreibung auf Englisch ist, Report auf Englisch. Sonst Deutsch.
- **Direkt, sachlich, kein Motivations-Gelaber.** Ehrlich statt nett.
- **Wenn Info fehlt:** im Report explizit als "unklar aus CV" kennzeichnen, nicht spekulieren.

## Dateien in diesem Skill

- `SKILL.md` - dieser Workflow
- `references/scoring-logic.md` - detaillierte Scoring-Regeln. Vor jeder Score-Berechnung lesen.
- `assets/template.html` - HTML-Report-Template im SalesAhead-Branding
- `assets/logo.png` - SalesAhead-Logo
