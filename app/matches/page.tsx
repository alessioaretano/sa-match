import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listHistory, getTodayCost } from "@/lib/limits";
import { isKVPersistent } from "@/lib/kv";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?from=/matches");

  const isAdmin = session.user.role === "admin";
  const [history, cost] = await Promise.all([listHistory(50), getTodayCost()]);
  const persistent = isKVPersistent();

  // Non-admins sehen nur ihre eigene History
  const visible = isAdmin ? history : history.filter((h) => h.userEmail === session.user.email);

  return (
    <div>
      <div className="mb-8">
        <div className="sa-eyebrow mb-2">{isAdmin ? "Team-Übersicht" : "Meine Matches"}</div>
        <h1 className="text-3xl font-bold text-sa-text-strong tracking-tight">Match-History</h1>
        <p className="text-sa-text-muted mt-1 text-sm">
          {persistent ? "Letzte 30 Tage." : "In-Memory (kein Vercel-KV) — Daten verschwinden beim Server-Restart."}
        </p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Heute"
            value={`${cost.matches} Matches`}
            sub={`CHF ${cost.totalChf.toFixed(2)} / Cap CHF ${cost.capChf}`}
          />
          <StatCard
            label="Cost-Cap-Auslastung"
            value={`${Math.min(100, Math.round((cost.totalChf / cost.capChf) * 100))} %`}
            sub={cost.totalChf >= cost.capChf ? "Cap erreicht" : "im Limit"}
            warn={cost.totalChf >= cost.capChf * 0.8}
          />
          <StatCard
            label="Storage"
            value={persistent ? "Vercel KV" : "Memory"}
            sub={persistent ? "Persistent" : "Nicht persistent"}
            warn={!persistent}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <div className="bg-sa-card border border-sa-divider rounded-md p-12 text-center text-sa-text-muted">
          Noch keine Matches.{" "}
          <Link href="/mandate" className="text-sa-gold hover:underline">
            Zu den Mandaten
          </Link>
        </div>
      ) : (
        <div className="bg-sa-card border border-sa-divider rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sa-card-soft border-b border-sa-divider">
              <tr className="text-left text-xs uppercase tracking-wider text-sa-text-muted">
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 font-semibold">Kandidat</th>
                <th className="px-4 py-3 font-semibold">Mandat</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                {isAdmin && <th className="px-4 py-3 font-semibold">User</th>}
                <th className="px-4 py-3 font-semibold text-center">Cache</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((h, i) => (
                <tr
                  key={h.id}
                  className={`border-t border-sa-divider ${i % 2 === 1 ? "bg-sa-card-soft/40" : ""}`}
                >
                  <td className="px-4 py-3 text-sa-text-muted whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-sa-text-strong">{h.candidateName}</td>
                  <td className="px-4 py-3">
                    <Link href={`/mandate/${h.mandateSlug}`} className="hover:text-sa-gold">
                      {h.mandateTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: h.scoreColor }}>
                    {h.score} %
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-xs text-sa-text-muted">{h.userEmail}</td>}
                  <td className="px-4 py-3 text-center">
                    {h.cached ? <span className="text-xs text-sa-success">Hit</span> : <span className="text-xs text-sa-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/matches/${h.id}`} className="text-sa-gold hover:underline text-xs uppercase tracking-wider font-semibold">
                      Report ansehen →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className={`bg-sa-card border-l-4 ${warn ? "border-sa-warn" : "border-sa-gold"} rounded-md p-4`}>
      <div className="text-xs uppercase tracking-wider text-sa-text-muted font-semibold">{label}</div>
      <div className="text-2xl font-bold text-sa-text-strong mt-1">{value}</div>
      <div className={`text-xs mt-1 ${warn ? "text-sa-warn font-semibold" : "text-sa-text-muted"}`}>{sub}</div>
    </div>
  );
}
