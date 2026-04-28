# Mandate

Jedes Mandat ist ein Ordner nach dem Schema `<YYYY-MM>_<firma-slug>-<rolle-slug>/`.

Struktur pro Mandat:
- `meta.json` — Pflicht. Felder: `title`, `company`, `language` (`de`|`en`), `status` (`aktiv`|`on-hold`|`gewonnen`|`verloren`), `createdAt` (ISO), optional `createdBy`
- `description.md` — Pflicht. Volltext der Stellenbeschreibung in Markdown
- `original.pdf` — Optional. Ursprüngliches PDF, falls hochgeladen

Neue Mandate werden ab Tag 3 über `/mandate/neu` angelegt (Commit via Octokit).
