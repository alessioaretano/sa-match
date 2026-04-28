# sa-match

Internes CV-Job-Match-Tool im SalesAhead-Branding. Nutzt die Anthropic Claude API.

## Setup lokal

1. Repo clonen, Dependencies installieren:
   ```bash
   git clone <repo>
   cd sa-match
   npm install
   ```

2. `.env.local` anlegen (basierend auf `.env.local.example`):
   - `ANTHROPIC_API_KEY` — von https://console.anthropic.com/settings/keys
   - `AUTH_SECRET` — beliebiger zufälliger String (`openssl rand -base64 32`)
   - `APP_PASSWORD` — dein Login-Passwort
   - Optional lokal: `AUTH_DISABLED=true` umgeht das Login

3. Dev-Server starten:
   ```bash
   npm run dev
   ```
   → http://localhost:3000

## Mandate

Liegen in `mandates/<YYYY-MM>_<firma>-<rolle>/`:
- `meta.json` — Pflicht (title, company, language, status, createdAt)
- `description.md` — Pflicht
- `original.pdf` — optional

Neue Mandate entweder direkt als Files committen, oder via `/mandate/neu` (nur wenn `GITHUB_TOKEN` etc. konfiguriert).

## Deploy auf Vercel

1. GitHub-Repo (privat!) erstellen + push
2. https://vercel.com/new → Repo importieren
3. Environment Variables setzen (siehe `.env.local.example`)
4. Optional: Storage → KV-Database hinzufügen für persistente Match-History
5. Deploy

**Wichtig in Production:**
- `AUTH_DISABLED` NICHT setzen
- `APP_PASSWORD` mit langem Wert
- Spending-Cap auf https://console.anthropic.com/settings/limits
