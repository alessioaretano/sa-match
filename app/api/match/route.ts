import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getMandat } from "@/lib/mandates";
import { runMatch, type MatchModel } from "@/lib/matcher";
import { loadSkillContext } from "@/lib/skill";
import {
  matchCacheKey,
  getCachedMatch,
  storeCachedMatch,
  checkRateLimit,
  incrementRateLimit,
  checkCostCap,
  trackCost,
  recordHistory,
  storeReportHtml,
  type HistoryEntry,
} from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 60;

type MatchRequest = {
  mandateSlug: string;
  cvText: string;
  model?: MatchModel;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const userEmail = session.user.email;

  let body: MatchRequest;
  try {
    body = (await request.json()) as MatchRequest;
  } catch {
    return Response.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const { mandateSlug, cvText, model = "sonnet" } = body;
  if (!mandateSlug || typeof mandateSlug !== "string") {
    return Response.json({ error: "mandateSlug fehlt." }, { status: 400 });
  }
  if (!cvText || typeof cvText !== "string" || cvText.trim().length < 50) {
    return Response.json({ error: "cvText fehlt oder ist zu kurz (<50 Zeichen)." }, { status: 400 });
  }

  const mandat = await getMandat(mandateSlug);
  if (!mandat) {
    return Response.json({ error: `Mandat nicht gefunden: ${mandateSlug}` }, { status: 404 });
  }

  // 1. Cache-Check (vor Rate-Limit, weil cached match nichts kostet)
  const skill = await loadSkillContext();
  const cacheKey = matchCacheKey(mandateSlug, cvText, skill.version, model);
  const cached = await getCachedMatch(cacheKey);

  if (cached) {
    const reportId = crypto.randomUUID();
    const historyEntry: HistoryEntry = {
      id: reportId,
      createdAt: new Date().toISOString(),
      userEmail,
      mandateSlug,
      mandateTitle: mandat.title,
      candidateName: cached.output.result.candidate.name,
      score: cached.output.result.score.value,
      scoreColor: cached.output.result.score.color,
      scoreCategory: cached.output.result.score.category,
      model: cached.output.usage.model,
      cached: true,
    };
    await Promise.all([recordHistory(historyEntry), storeReportHtml(reportId, cached.output.reportHtml)]);
    return Response.json({ ...cached.output, cached: true, reportId });
  }

  // 2. Rate-Limit
  const rateBefore = await checkRateLimit(userEmail);
  if (rateBefore.used >= rateBefore.limit) {
    return Response.json(
      {
        error: `Tageslimit erreicht (${rateBefore.used}/${rateBefore.limit}). Reset: ${new Date(rateBefore.resetAt).toLocaleString("de-CH")}.`,
        rateLimit: rateBefore,
      },
      { status: 429 },
    );
  }

  // 3. Cost-Cap
  const cost = await checkCostCap();
  if (!cost.ok) {
    return Response.json(
      {
        error: `Tages-Cost-Cap erreicht (CHF ${cost.state.totalChf.toFixed(2)} / CHF ${cost.state.capChf}). Setze DAILY_COST_CAP_CHF in env hoch oder warte bis morgen.`,
        cost: cost.state,
      },
      { status: 429 },
    );
  }

  // 4. Anthropic-Call
  try {
    const output = await runMatch({ mandat, cvText, model });

    // 5. Side-effects: cache, rate-limit, cost, history
    const reportId = crypto.randomUUID();
    const historyEntry: HistoryEntry = {
      id: reportId,
      createdAt: new Date().toISOString(),
      userEmail,
      mandateSlug,
      mandateTitle: mandat.title,
      candidateName: output.result.candidate.name,
      score: output.result.score.value,
      scoreColor: output.result.score.color,
      scoreCategory: output.result.score.category,
      model: output.usage.model,
      cached: false,
    };
    await Promise.all([
      storeCachedMatch(cacheKey, output),
      incrementRateLimit(userEmail),
      trackCost(output.usage),
      recordHistory(historyEntry),
      storeReportHtml(reportId, output.reportHtml),
    ]);

    return Response.json({ ...output, cached: false, reportId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler beim Matchen.";
    return Response.json({ error: message }, { status: 500 });
  }
}
