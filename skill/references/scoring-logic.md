# Scoring-Logik für CV-Job Matching

## Grundprinzip

Score von 0 bis 100. Basis-Berechnung über Must-Haves und Nice-to-Haves, dann harte Caps und qualitative Anpassungen.

Die Reihenfolge der Berechnung ist wichtig:

1. Funktionsfit-Check (erster Cap)
2. Must-Have-Prüfung (weitere Caps)
3. Punkteverteilung
4. Qualitative Zu- und Abschläge
5. Finale Kategorisierung + Farbzuweisung

---

## Schritt 1: Funktionsfit-Check (KO-Kriterium)

**Zentrale Frage:** Hat der Kandidat bereits eine vergleichbare Rolle ausgeübt?

"Vergleichbar" bedeutet:
- **Funktion:** Sales, Account Management, Business Development, etc. Gleiche oder direkt angrenzende Funktion.
- **Seniorität:** Junior, Senior, Head, VP. Matched zur ausgeschriebenen Seniorität.
- **Kontext:** B2B vs B2C, SaaS vs Hardware, Branche.

| Situation | Max-Score |
|-----------|-----------|
| Genau die Rolle mehrfach (mind. 2x) ausgeübt | kein Cap |
| Vergleichbare Rolle (gleiche Funktion und Seniorität) ausgeübt | kein Cap |
| Angrenzende Rolle (z.B. Inside Sales → Field Sales, SDR → AE) | Cap bei 70% |
| Keine vergleichbare Rolle, aber relevante Teil-Skills | **Cap bei 40%** |
| Völlig fachfremd | **Cap bei 25%** |

**Wichtig:** Dieser Cap ist absolut. Auch wenn der Kandidat alle Must-Haves formal erfüllt, aber die Rolle selbst noch nie ausgeübt hat, greift der Cap.

---

## Schritt 2: Must-Have-Prüfung

Jedes identifizierte Must-Have wird geprüft und als eines von drei Ergebnissen klassifiziert:

- ✓ **Erfüllt**: volle Punkte, klare Evidenz im CV
- ◐ **Teilweise erfüllt**: halbe Punkte, Evidenz vorhanden aber schwach (z.B. 3 Jahre Erfahrung statt geforderter 5)
- ✗ **Nicht erfüllt**: keine Punkte, keine Evidenz im CV

**Cap-Regel nach fehlenden Must-Haves:**

| Fehlende Must-Haves (✗) | Max-Score |
|--------------------------|-----------|
| 0 | kein Cap |
| 1 | Cap bei 65% |
| 2 | Cap bei 40% |
| 3 oder mehr | Cap bei 20% |

Teilweise erfüllte Must-Haves (◐) zählen nicht als "fehlend" für den Cap, aber reduzieren den Score über die Punktevergabe.

Der niedrigste aktive Cap aus Schritt 1 und Schritt 2 gilt.

---

## Schritt 3: Punkteverteilung

### Verteilungs-Formel

Bei X Must-Haves und Y Nice-to-Haves:
- **70 Punkte** werden gleichmässig auf Must-Haves verteilt (70 / X pro Must-Have)
- **30 Punkte** werden gleichmässig auf Nice-to-Haves verteilt (30 / Y pro Nice-to-Have)
- Falls keine Nice-to-Haves definiert: 100 Punkte auf Must-Haves

### Punkteberechnung pro Kriterium

- ✓ erfüllt: volle Punkte
- ◐ teilweise: 50% der Punkte
- ✗ nicht erfüllt: 0 Punkte

### Beispiel

Stelle: 5 Must-Haves, 4 Nice-to-Haves.
- Jedes Must-Have = 14 Punkte
- Jedes Nice-to-Have = 7.5 Punkte

Kandidat:
- 4 von 5 Must-Haves erfüllt, 1 teilweise → 4×14 + 0.5×14 = 56 + 7 = 63 Punkte
- 3 von 4 Nice-to-Haves erfüllt → 3×7.5 = 22.5 Punkte
- Basis-Score: 85.5%

Cap-Check:
- Funktionsfit: vergleichbare Rolle ausgeübt → kein Cap
- Must-Haves: 0 fehlende Must-Haves (teilweise zählt nicht als fehlend) → kein Cap
- → Basis-Score bleibt bei 85%

---

## Schritt 4: Qualitative Zu- und Abschläge

Nach der Grundberechnung, vor dem finalen Cap:

### Bonus (+5 bis +10 Punkte möglich)

- Quantifizierte Erfolge über mehrere Jahre (z.B. "120% Quote 3 Jahre in Folge")
- Top-Tier-Unternehmen in relevanter Rolle (Salesforce, Oracle, AWS, etc.)
- Branchennetzwerk passend zum Mandat
- Exit-, IPO- oder Hypergrowth-Erfahrung, wenn für das Mandat relevant
- Mehrsprachigkeit über das Must-Have hinaus

### Abschlag (-5 bis -15 Punkte möglich)

- Häufige Jobwechsel ohne Erklärung (mehr als 2 Wechsel in 3 Jahren)
- Unerklärte Lücken >6 Monate
- Abwärtsbewegung in der Karriere
- Überqualifikation ohne klare Motivation für kleinere Rolle
- Aktueller Job <1 Jahr und signalisiert Wechselmuster

### Finaler Cap-Check

Nach Boni und Abschlägen: finalen Score gegen die aktiven Caps aus Schritten 1 und 2 prüfen. Der Score darf den niedrigsten Cap nicht überschreiten.

---

## Schritt 5: Finale Kategorisierung

| Score | Kategorie | Farbe | Hex | Aktion |
|-------|-----------|-------|-----|--------|
| 85-100% | Top-Kandidat | Grün | `#2d7a3e` | Sofort an Kim für Erstgespräch |
| 70-84% | Sehr guter Kandidat | Hellgrün | `#6ba84f` | Empfehlung mit 1-2 offenen Fragen |
| 55-69% | Kandidat mit Lücken | Gelb | `#d9a93e` | Nur wenn Pipeline dünn, kritisch prüfen |
| 40-54% | Schwacher Match | Orange | `#d97a3e` | In der Regel ablehnen |
| 0-39% | Unpassend | Rot | `#b53a3a` | Ablehnen |

Den Hex-Code als `{{SCORE_COLOR}}` im Template verwenden.
Die Kategorie als `{{SCORE_CATEGORY}}` im Template verwenden.

---

## Verdict-Formulierung (`{{SCORE_VERDICT}}`)

1-2 Sätze. Muss enthalten:
- Kerneinschätzung (passt / passt teilweise / passt nicht)
- Die wichtigste Stärke oder Schwäche
- Empfohlener nächster Schritt

Beispiele:

**85-100%:** "Erfüllt alle Must-Haves mit starker Evidenz. Direkt für Erstgespräch mit Kim vormerken."

**70-84%:** "Erfüllt alle Must-Haves, offene Frage zum Cybersecurity-Track-Record. Empfohlen nach Klärung."

**55-69%:** "Zwei Must-Haves nur teilweise erfüllt, 3 Jahre statt 5 im Key Account Management. Kritisch prüfen, ob Mandat Kompromiss zulässt."

**40-54%:** "Fehlende SaaS-Erfahrung trotz solider Grund-Skills. In der Regel nicht weiterleiten."

**0-39%:** "Quereinsteiger ohne vergleichbare Rolle. Nicht für dieses Mandat."
