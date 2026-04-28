import crypto from "node:crypto";
import { getKV } from "./kv";
import type { MatchOutput } from "./matcher";

const SECONDS_DAY = 24 * 60 * 60;
const SECONDS_30_DAYS = 30 * SECONDS_DAY;

// Token prices in USD per million tokens (update if pricing changes).
const PRICING = {
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
} as const;

const USD_TO_CHF = 0.88;

export function maxMatchesPerDay(): number {
  return Number(process.env.MATCHES_PER_DAY_PER_USER ?? 30);
}

export function dailyCostCapChf(): number {
  return Number(process.env.DAILY_COST_CAP_CHF ?? 5);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cvHash(cvText: string): string {
  return crypto.createHash("sha256").update(cvText).digest("hex").slice(0, 16);
}

export function matchCacheKey(mandateSlug: string, cvText: string, skillVersion: string, model: string): string {
  return `match:${mandateSlug}:${cvHash(cvText)}:${skillVersion}:${model}`;
}

export type CachedMatch = {
  output: MatchOutput;
  createdAt: string;
  cvHash: string;
};

export async function getCachedMatch(key: string): Promise<CachedMatch | null> {
  return getKV().get<CachedMatch>(key);
}

export async function storeCachedMatch(key: string, output: MatchOutput): Promise<void> {
  const entry: CachedMatch = {
    output,
    createdAt: new Date().toISOString(),
    cvHash: key.split(":")[2] ?? "",
  };
  await getKV().set(key, entry, { ex: SECONDS_30_DAYS });
}

// ---------- Rate limiting ----------

export type RateLimitState = {
  used: number;
  limit: number;
  resetAt: string; // ISO
};

export async function checkRateLimit(userId: string): Promise<RateLimitState> {
  const key = `rl:${userId}:${todayKey()}`;
  const used = (await getKV().get<number>(key)) ?? 0;
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return { used, limit: maxMatchesPerDay(), resetAt: tomorrow.toISOString() };
}

export async function incrementRateLimit(userId: string): Promise<RateLimitState> {
  const key = `rl:${userId}:${todayKey()}`;
  const kv = getKV();
  const used = await kv.incr(key);
  await kv.expire(key, SECONDS_DAY + 60);
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return { used, limit: maxMatchesPerDay(), resetAt: tomorrow.toISOString() };
}

// ---------- Cost tracking ----------

export type CostState = {
  date: string;
  totalUsd: number;
  totalChf: number;
  capChf: number;
  matches: number;
};

function priceMatch(usage: MatchOutput["usage"]): number {
  const p = PRICING[usage.model as keyof typeof PRICING];
  if (!p) return 0;
  const ipt = (usage.inputTokens / 1_000_000) * p.input;
  const opt = (usage.outputTokens / 1_000_000) * p.output;
  const cwt = (usage.cacheCreationTokens / 1_000_000) * p.cacheWrite;
  const crd = (usage.cacheReadTokens / 1_000_000) * p.cacheRead;
  return ipt + opt + cwt + crd;
}

export async function trackCost(usage: MatchOutput["usage"]): Promise<CostState> {
  const date = todayKey();
  const usd = priceMatch(usage);
  const kv = getKV();
  const totalUsdBefore = (await kv.get<number>(`cost:usd:${date}`)) ?? 0;
  const totalUsd = totalUsdBefore + usd;
  await kv.set(`cost:usd:${date}`, totalUsd, { ex: SECONDS_30_DAYS });
  await kv.incr(`cost:matches:${date}`);
  await kv.expire(`cost:matches:${date}`, SECONDS_30_DAYS);
  const matches = (await kv.get<number>(`cost:matches:${date}`)) ?? 0;
  return {
    date,
    totalUsd,
    totalChf: totalUsd * USD_TO_CHF,
    capChf: dailyCostCapChf(),
    matches,
  };
}

export async function getTodayCost(): Promise<CostState> {
  const date = todayKey();
  const kv = getKV();
  const totalUsd = (await kv.get<number>(`cost:usd:${date}`)) ?? 0;
  const matches = (await kv.get<number>(`cost:matches:${date}`)) ?? 0;
  return {
    date,
    totalUsd,
    totalChf: totalUsd * USD_TO_CHF,
    capChf: dailyCostCapChf(),
    matches,
  };
}

export async function checkCostCap(): Promise<{ ok: boolean; state: CostState }> {
  const state = await getTodayCost();
  return { ok: state.totalChf < state.capChf, state };
}

// ---------- Match history (admin/user) ----------

export type HistoryEntry = {
  id: string;
  createdAt: string;
  userEmail: string;
  mandateSlug: string;
  mandateTitle: string;
  candidateName: string;
  score: number;
  scoreColor: string;
  scoreCategory: string;
  model: string;
  cached: boolean;
};

export async function recordHistory(entry: HistoryEntry): Promise<void> {
  await getKV().set(`hist:${entry.id}`, entry, { ex: SECONDS_30_DAYS });
}

export async function listHistory(limit = 50): Promise<HistoryEntry[]> {
  const kv = getKV();
  const keys = await kv.keys("hist:*");
  const entries = await Promise.all(keys.map((k) => kv.get<HistoryEntry>(k)));
  return entries
    .filter((e): e is HistoryEntry => e !== null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export async function getReport(id: string): Promise<{ html: string; entry: HistoryEntry } | null> {
  const kv = getKV();
  const [html, entry] = await Promise.all([
    kv.get<string>(`hist:html:${id}`),
    kv.get<HistoryEntry>(`hist:${id}`),
  ]);
  if (!html || !entry) return null;
  return { html, entry };
}

export async function storeReportHtml(id: string, html: string): Promise<void> {
  await getKV().set(`hist:html:${id}`, html, { ex: SECONDS_30_DAYS });
}
