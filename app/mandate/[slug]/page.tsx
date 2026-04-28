import Link from "next/link";
import { notFound } from "next/navigation";
import { getMandat } from "@/lib/mandates";
import { MatchPanel } from "./MatchPanel";

export default async function MandatDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mandat = await getMandat(slug);
  if (!mandat) notFound();

  return (
    <div>
      <Link href="/mandate" className="text-sm text-sa-text-muted hover:text-sa-gold">
        ← Zurück zu Mandate
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-6">
        <section className="lg:col-span-3 bg-sa-card border-t-4 border-sa-gold rounded-md p-8">
          <div className="sa-eyebrow mb-2">Stellenbeschreibung</div>
          <h1 className="text-2xl font-bold text-sa-text-strong mb-1">{mandat.title}</h1>
          <p className="text-sa-text-muted mb-6">{mandat.company}</p>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-sa-text leading-relaxed">
            {mandat.description}
          </article>
        </section>

        <aside className="lg:col-span-2">
          <div className="bg-sa-card-soft border-l-4 border-sa-gold rounded-md p-6 sticky top-6">
            <h2 className="sa-h2 mb-4">CV matchen</h2>
            <MatchPanel mandateSlug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
