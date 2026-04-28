import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalesAhead Match",
  description: "CV-Job Match-Tool für SalesAhead-Mandate",
};

async function UserMenu() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-sa-text-muted">
      <span className="hidden sm:inline">
        {session.user.email}
        {session.user.role === "admin" && (
          <span className="ml-2 px-1.5 py-0.5 bg-sa-gold/20 text-sa-gold rounded uppercase tracking-wider font-bold text-[10px]">
            Admin
          </span>
        )}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="text-xs uppercase tracking-wider font-semibold hover:text-sa-error transition-colors"
        >
          Logout
        </button>
      </form>
    </div>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col bg-sa-cream text-sa-text">
        <header className="bg-sa-card border-b-4 border-sa-gold">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
            <Link href={isLoggedIn ? "/mandate" : "/login"} className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="SalesAhead" className="h-14 w-auto" />
            </Link>
            <div className="flex items-center gap-8">
              {isLoggedIn && (
                <nav className="flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-sa-sage">
                  <Link href="/mandate" className="hover:text-sa-gold transition-colors">
                    Mandate
                  </Link>
                  <Link href="/matches" className="hover:text-sa-gold transition-colors">
                    Matches
                  </Link>
                </nav>
              )}
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">{children}</main>

        <footer className="border-t border-sa-divider mt-16 py-6">
          <div className="max-w-6xl mx-auto px-6 text-center text-xs text-sa-text-muted tracking-wide">
            SalesAhead AG &middot; Bergstrasse 110, 8032 Zürich &middot; Internes Tool
          </div>
        </footer>
      </body>
    </html>
  );
}
