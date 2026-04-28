import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getReport } from "@/lib/limits";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const data = await getReport(id);
  if (!data) notFound();

  const isAdmin = session.user.role === "admin";
  if (!isAdmin && data.entry.userEmail !== session.user.email) {
    return (
      <div className="bg-sa-error/10 border-l-4 border-sa-error rounded-md p-6 max-w-xl">
        <h1 className="text-lg font-bold text-sa-error mb-2">Kein Zugriff</h1>
        <p className="text-sm text-sa-text">Dieser Report gehört einem anderen User.</p>
        <Link href="/matches" className="inline-block mt-4 text-sm text-sa-gold hover:underline">
          ← Zurück zu Matches
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/matches" className="text-sm text-sa-text-muted hover:text-sa-gold">
        ← Zurück zu Matches
      </Link>

      <div className="mt-6 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="sa-eyebrow mb-1">Match-Report</div>
          <h1 className="text-2xl font-bold text-sa-text-strong">{data.entry.candidateName}</h1>
          <p className="text-sm text-sa-text-muted">
            <Link href={`/mandate/${data.entry.mandateSlug}`} className="hover:text-sa-gold">
              {data.entry.mandateTitle}
            </Link>
            {" · "}
            {formatDateTime(data.entry.createdAt)}
            {" · "}
            <span style={{ color: data.entry.scoreColor }} className="font-bold">
              {data.entry.score} % {data.entry.scoreCategory}
            </span>
          </p>
        </div>
      </div>

      <iframe
        srcDoc={data.html}
        title="Match-Report"
        className="w-full h-[80vh] bg-sa-cream border border-sa-divider rounded-md"
      />
    </div>
  );
}
