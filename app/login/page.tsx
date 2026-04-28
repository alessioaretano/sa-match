import { redirect } from "next/navigation";
import { auth, loginWithPassword } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  const { from, error } = await searchParams;
  if (session?.user) redirect(from ?? "/mandate");

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="bg-sa-card border-t-4 border-sa-gold rounded-md p-10 max-w-md w-full text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="SalesAhead" className="h-16 w-auto mx-auto mb-6" />
        <h1 className="text-xl font-bold text-sa-text-strong mb-2">Match-Tool</h1>
        <p className="text-sm text-sa-text-muted mb-6">Internes Tool. Passwort eingeben.</p>

        {error === "wrong" && (
          <div className="bg-sa-error/10 border-l-4 border-sa-error text-sm text-sa-error p-3 rounded mb-4 text-left">
            Falsches Passwort.
          </div>
        )}
        {error === "no-config" && (
          <div className="bg-sa-warn/10 border-l-4 border-sa-warn text-sm text-[#8a6a1a] p-3 rounded mb-4 text-left">
            APP_PASSWORD ist nicht gesetzt (server-Konfiguration).
          </div>
        )}

        <form
          action={async (formData: FormData) => {
            "use server";
            const password = String(formData.get("password") ?? "");
            const ok = await loginWithPassword(password);
            if (!ok) {
              redirect(`/login?error=${process.env.APP_PASSWORD ? "wrong" : "no-config"}`);
            }
            redirect(from ?? "/mandate");
          }}
          className="space-y-4"
        >
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="Passwort"
            className="w-full bg-white border border-sa-divider rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/40 focus:border-sa-gold"
          />
          <button
            type="submit"
            className="w-full bg-sa-gold text-white px-5 py-3 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-[#9c7c4f] transition-colors"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
