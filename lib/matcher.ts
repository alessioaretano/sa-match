import Anthropic from "@anthropic-ai/sdk";
import { loadSkillContext } from "./skill";
import type { Mandat } from "./mandates";

export type MatchModel = "sonnet" | "haiku";

const MODEL_IDS: Record<MatchModel, string> = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5",
};

export type MatchInput = {
  mandat: Mandat;
  cvText: string;
  model?: MatchModel;
};

type ChecklistItem = {
  title: string;
  status: "pass" | "partial" | "fail";
  note: string;
};

export type MatchResult = {
  candidate: {
    name: string;
    currentRole: string;
    currentCompany: string;
    experienceYears: number | string;
    location: string;
    languages: string;
    education: string;
  };
  score: {
    value: number;
    category: string;
    color: string;
    verdict: string;
  };
  mustHaves: ChecklistItem[];
  niceToHaves: ChecklistItem[];
  pros: string[];
  cons: string[];
  redFlags: string[];
  questions: string[];
};

export type MatchUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  model: string;
};

export type MatchOutput = {
  result: MatchResult;
  reportHtml: string;
  usage: MatchUsage;
  cached?: boolean;
  reportId?: string;
};

const JSON_INSTRUCTION = `
ARBEITSWEISE FÜR DIESE ANFRAGE
Du bekommst eine Stellenbeschreibung und einen CV. Folge der Skill-Logik (Scoring-Caps, Funktionsfit-Check, Must-Have-Prüfung, Pro/Contra, Red Flags, Interview-Fragen).

ANTWORT-FORMAT (zwingend):
Antworte AUSSCHLIESSLICH mit einem einzigen gültigen JSON-Objekt nach folgendem Schema. Kein Markdown, keine Code-Fences, keine Einleitung, kein HTML, keine Kommentare. Nur das JSON.

{
  "candidate": {
    "name": "Vollständiger Name",
    "currentRole": "Aktuelle Rolle",
    "currentCompany": "Aktueller Arbeitgeber",
    "experienceYears": 8,
    "location": "Stadt, Land",
    "languages": "DE (native), EN (C1)",
    "education": "Höchster Abschluss"
  },
  "score": {
    "value": 78,
    "category": "Sehr guter Kandidat",
    "color": "#6ba84f",
    "verdict": "1-2 Sätze: Kerneinschätzung + wichtigste Stärke/Schwäche + nächster Schritt."
  },
  "mustHaves": [
    { "title": "Anforderung aus Stelle", "status": "pass", "note": "Evidenz aus CV oder Begründung" }
  ],
  "niceToHaves": [
    { "title": "Anforderung", "status": "partial", "note": "..." }
  ],
  "pros": ["5 Jahre Account Management bei X, Portfolio CHF 12 Mio", "..."],
  "cons": ["Keine Cybersecurity-Erfahrung", "..."],
  "redFlags": [],
  "questions": [
    "Frage 1 die eine konkrete Lücke adressiert",
    "Frage 2",
    "Frage 3"
  ]
}

Regeln für die Felder:
- "score.value": Integer 0-100, nach Caps und Boni aus scoring-logic.md
- "score.category": exakt aus der Tabelle in scoring-logic.md ("Top-Kandidat" / "Sehr guter Kandidat" / "Kandidat mit Lücken" / "Schwacher Match" / "Unpassend")
- "score.color": exakter Hex-Code aus der Tabelle (#2d7a3e / #6ba84f / #d9a93e / #d97a3e / #b53a3a)
- "mustHaves[].status" und "niceToHaves[].status": "pass" | "partial" | "fail"
- "redFlags": leeres Array [] wenn keine, sonst Liste von Strings (KEINE leeren Strings, KEIN "Keine Red Flags identifiziert" als Item)
- "questions": genau 3 Einträge
- Wenn Info fehlt: Wert "unklar aus CV", nicht spekulieren
- Sprache des Reports: DE wenn Stellenbeschreibung DE, EN wenn EN

Letzter Hinweis: Antworte AUSSCHLIESSLICH mit dem JSON. Keine Einleitung wie "Hier ist das Ergebnis:". Beginne deine Antwort direkt mit "{".
`.trim();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusClass(status: ChecklistItem["status"]): string {
  if (status === "pass") return "check-pass";
  if (status === "partial") return "check-partial";
  return "check-fail";
}

function statusIcon(status: ChecklistItem["status"]): string {
  if (status === "pass") return "✓";
  if (status === "partial") return "◐";
  return "✗";
}

function renderChecklist(items: ChecklistItem[]): string {
  if (!items || items.length === 0) {
    return `<div class="check-note" style="padding:8px 0;font-style:italic;color:#6b6b6b">Keine Anforderungen definiert.</div>`;
  }
  return items
    .map(
      (it) => `
  <div class="checklist-item">
    <div class="check-icon ${statusClass(it.status)}">${statusIcon(it.status)}</div>
    <div class="check-content">
      <div class="check-title">${escapeHtml(it.title)}</div>
      <div class="check-note">${escapeHtml(it.note)}</div>
    </div>
  </div>`,
    )
    .join("\n");
}

function renderList(items: string[]): string {
  if (!items || items.length === 0) return `<li style="opacity:0.6">Keine Einträge.</li>`;
  return items.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n        ");
}

function renderRedFlags(items: string[]): string {
  const cleaned = (items || []).filter((s) => s && s.trim().length > 0);
  if (cleaned.length === 0) {
    return `<div class="none">Keine Red Flags identifiziert.</div>`;
  }
  return `<ul>\n  ${cleaned.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n  ")}\n</ul>`;
}

function renderQuestions(items: string[]): string {
  return items
    .map(
      (q, i) => `
  <div class="question">
    <div class="num">Frage ${i + 1}</div>
    <div class="text">${escapeHtml(q)}</div>
  </div>`,
    )
    .join("\n");
}

function todayCH(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function renderReport(template: string, mandat: Mandat, r: MatchResult): string {
  const placeholders: Record<string, string> = {
    DATE: todayCH(),
    CANDIDATE_NAME: escapeHtml(r.candidate.name),
    POSITION: escapeHtml(mandat.title),
    COMPANY: escapeHtml(mandat.company),
    SCORE: String(r.score.value),
    SCORE_COLOR: r.score.color,
    SCORE_CATEGORY: escapeHtml(r.score.category),
    SCORE_VERDICT: escapeHtml(r.score.verdict),
    CURRENT_ROLE: escapeHtml(r.candidate.currentRole),
    CURRENT_COMPANY: escapeHtml(r.candidate.currentCompany),
    EXPERIENCE_YEARS: String(r.candidate.experienceYears),
    LOCATION: escapeHtml(r.candidate.location),
    LANGUAGES: escapeHtml(r.candidate.languages),
    EDUCATION: escapeHtml(r.candidate.education),
    MUST_HAVE_CHECKLIST: renderChecklist(r.mustHaves),
    NICE_TO_HAVE_CHECKLIST: renderChecklist(r.niceToHaves),
    PRO_POINTS: renderList(r.pros),
    CON_POINTS: renderList(r.cons),
    RED_FLAGS: renderRedFlags(r.redFlags),
    INTERVIEW_QUESTIONS: renderQuestions(r.questions),
  };

  let out = template;
  for (const [key, value] of Object.entries(placeholders)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  // Logo wird inline embedded, weil das Iframe sonst keinen Zugriff auf /logo hat.
  out = out.replace(/<img\s+src="logo\.png"[^>]*>/i, `<img src="/logo.svg" alt="SalesAhead" style="height:44px">`);
  return out;
}

function stripJsonFences(s: string): string {
  const trimmed = s.trim();
  // Manchmal liefert das Modell trotzdem ```json ... ``` — robust parsen.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Falls Text vor dem JSON: erstes "{" suchen.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start > 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function runMatch(input: MatchInput): Promise<MatchOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt. Lege ihn in .env.local an.");
  }

  const skill = await loadSkillContext();
  const model = MODEL_IDS[input.model ?? "sonnet"];

  const client = new Anthropic({ apiKey });

  const systemBlocks = [
    {
      type: "text" as const,
      text: skill.systemMd + "\n\n---\n\n" + skill.scoringMd + "\n\n---\n\n" + JSON_INSTRUCTION,
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const userMessage = `<stellenbeschreibung mandat="${input.mandat.title}" company="${input.mandat.company}" sprache="${input.mandat.language}">
${input.mandat.description}
</stellenbeschreibung>

<cv>
${input.cvText}
</cv>

Erstelle das JSON-Match-Ergebnis.`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemBlocks,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic-Antwort enthielt keinen Text-Block.");
  }

  const raw = stripJsonFences(textBlock.text);
  let result: MatchResult;
  try {
    result = JSON.parse(raw) as MatchResult;
  } catch (e) {
    throw new Error(
      `Konnte JSON nicht parsen: ${(e as Error).message}\n\nRaw response (erste 500 Chars):\n${raw.slice(0, 500)}`,
    );
  }

  const reportHtml = renderReport(skill.templateHtml, input.mandat, result);

  return {
    result,
    reportHtml,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
      model,
    },
  };
}
