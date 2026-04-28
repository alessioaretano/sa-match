import Link from "next/link";
import { listMandates } from "@/lib/mandates";

const statusStyles: Record<string, string> = {
  aktiv: "bg-sa-success/10 text-sa-success",
  "on-hold": "bg-sa-warn/10 text-[#8a6a1a]",
  gewonnen: "bg-sa-success-soft/20 text-sa-success",
  verloren: "bg-sa-error/10 text-sa-error",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function MandateListPage({
  searchParams,
}: {
  searchParams: Promise<{ neu?: string }>;
}) {
  const mandate = await listMandates();
  const { neu } = await searchParams;
  const justCreated = neu ? mandate.find((m) => m.slug === neu) : undefined;

  return (
    <div>
      {neu && (
        <div className="bg-sa-success/10 border-l-4 border-sa-success rounded-md p-3 mb-6 text-sm text-sa-success">
          {justCreated ? (
            <>Mandat <strong>{justCreated.title}</strong> wurde angelegt und ist live.</>
          ) : (
            <>Mandat angelegt. Vercel deployt das Repo (~30 Sek.). Wenn es nach Refresh nicht in der Liste ist, prüfe das GitHub-Commit.</>
          )}
        </div>
      )}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="sa-eyebrow mb-2">Dashboard</div>
          <h1 className="text-3xl font-bold text-sa-text-strong tracking-tight">Aktive Mandate</h1>
          <p className="text-sa-text-muted mt-1 text-sm">
            Wähle ein Mandat, um einen CV dagegen zu matchen.
          </p>
        </div>
        <Link
          href="/mandate/neu"
          className="bg-sa-gold text-white px-5 py-2.5 rounded-md font-semibold text-sm tracking-wide hover:bg-[#96763f] transition-colors"
        >
          + Neues Mandat
        </Link>
      </div>

      {mandate.length === 0 ? (
        <div className="bg-sa-card border border-sa-divider rounded-md p-12 text-center text-sa-text-muted">
          Noch keine Mandate. Lege das erste an.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mandate.map((m) => (
            <Link
              key={m.slug}
              href={`/mandate/${m.slug}`}
              className="bg-sa-card border border-sa-divider border-t-4 border-t-sa-gold rounded-md p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${statusStyles[m.status] ?? ""}`}>
                  {m.status}
                </span>
                <span className="text-xs text-sa-text-muted uppercase tracking-wider font-semibold">
                  {m.language}
                </span>
              </div>
              <h2 className="text-lg font-bold text-sa-text-strong group-hover:text-sa-gold transition-colors">
                {m.title}
              </h2>
              <p className="text-sm text-sa-text-muted mt-1">{m.company}</p>
              <div className="mt-4 pt-3 border-t border-sa-divider text-xs text-sa-text-muted">
                seit {formatDate(m.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
