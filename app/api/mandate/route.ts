import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { commitMandat } from "@/lib/github";

export const runtime = "nodejs";
export const maxDuration = 30;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildSlug(company: string, title: string): string {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${ym}_${slugify(company)}-${slugify(title)}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return Response.json({ error: "Nur Admins dürfen Mandate anlegen." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Ungültiger Form-Body." }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const language = String(formData.get("language") ?? "de").trim();
  const status = String(formData.get("status") ?? "aktiv").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !company) {
    return Response.json({ error: "Titel und Firma sind Pflicht." }, { status: 400 });
  }
  if (!["de", "en"].includes(language)) {
    return Response.json({ error: "Sprache muss 'de' oder 'en' sein." }, { status: 400 });
  }
  if (!["aktiv", "on-hold", "gewonnen", "verloren"].includes(status)) {
    return Response.json({ error: "Status ungültig." }, { status: 400 });
  }
  if (description.length < 100) {
    return Response.json({ error: "Beschreibung zu kurz (<100 Zeichen)." }, { status: 400 });
  }

  const slug = buildSlug(company, title);
  const meta = {
    title,
    company,
    language,
    status,
    createdAt: new Date().toISOString(),
    createdBy: session.user.email,
  };

  const file = formData.get("original");
  let originalPdf: Buffer | undefined;
  let originalDocx: Buffer | undefined;
  if (file instanceof File && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (file.name.toLowerCase().endsWith(".pdf")) originalPdf = buf;
    else if (file.name.toLowerCase().endsWith(".docx")) originalDocx = buf;
  }

  try {
    const { commitUrl } = await commitMandat({
      slug,
      authorEmail: session.user.email,
      files: {
        metaJson: JSON.stringify(meta, null, 2) + "\n",
        descriptionMd: description.endsWith("\n") ? description : description + "\n",
        originalPdf,
        originalDocx,
      },
    });
    return Response.json({ slug, commitUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Commit fehlgeschlagen.";
    return Response.json({ error: message }, { status: 500 });
  }
}
