import fs from "node:fs/promises";
import path from "node:path";

export type MandatStatus = "aktiv" | "on-hold" | "gewonnen" | "verloren";
export type MandatLanguage = "de" | "en";

export type MandatMeta = {
  slug: string;
  title: string;
  company: string;
  language: MandatLanguage;
  status: MandatStatus;
  createdAt: string;
  createdBy?: string;
};

export type Mandat = MandatMeta & {
  description: string;
};

const MANDATES_DIR = path.join(process.cwd(), "mandates");

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listMandates(): Promise<MandatMeta[]> {
  if (!(await exists(MANDATES_DIR))) return [];
  const entries = await fs.readdir(MANDATES_DIR, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."));
  const results = await Promise.all(
    dirs.map(async (d) => {
      const metaPath = path.join(MANDATES_DIR, d.name, "meta.json");
      if (!(await exists(metaPath))) return null;
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(raw) as Omit<MandatMeta, "slug">;
      return { slug: d.name, ...meta };
    }),
  );
  return results
    .filter((m): m is MandatMeta => m !== null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getMandat(slug: string): Promise<Mandat | null> {
  const dir = path.join(MANDATES_DIR, slug);
  if (!(await exists(dir))) return null;
  const metaPath = path.join(dir, "meta.json");
  const descPath = path.join(dir, "description.md");
  if (!(await exists(metaPath)) || !(await exists(descPath))) return null;
  const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as Omit<MandatMeta, "slug">;
  const description = await fs.readFile(descPath, "utf-8");
  return { slug, ...meta, description };
}
