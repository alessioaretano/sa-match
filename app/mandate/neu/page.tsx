import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MandatNeuForm } from "./MandatNeuForm";

export default async function NeuMandatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?from=/mandate/neu");
  if (session.user.role !== "admin") {
    return (
      <div className="bg-sa-error/10 border-l-4 border-sa-error rounded-md p-6 max-w-xl">
        <h1 className="text-lg font-bold text-sa-error mb-2">Nur Admins</h1>
        <p className="text-sm text-sa-text">
          Nur Admins dürfen Mandate anlegen. Wende dich an Alessio, falls du Adminrechte brauchst.
        </p>
        <Link href="/mandate" className="inline-block mt-4 text-sm text-sa-gold hover:underline">
          ← Zurück zu Mandate
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/mandate" className="text-sm text-sa-text-muted hover:text-sa-gold">
        ← Zurück zu Mandate
      </Link>
      <h1 className="text-3xl font-bold text-sa-text-strong mt-4 mb-2">Neues Mandat</h1>
      <p className="text-sa-text-muted mb-8 text-sm">
        Wird via Git-Commit ins Repo gepusht. Nach ~30 Sek. ist das Mandat in der Liste sichtbar.
      </p>
      <div className="bg-sa-card border-t-4 border-sa-gold rounded-md p-8 max-w-2xl">
        <MandatNeuForm />
      </div>
    </div>
  );
}
