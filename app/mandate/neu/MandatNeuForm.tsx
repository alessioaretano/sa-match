"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MandatNeuForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [description, setDescription] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(pdf|docx|txt|md)$/i.test(file.name)) return;
    setError(null);
    setParseLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Parse fehlgeschlagen.");
      setDescription(json.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse fehlgeschlagen.");
    } finally {
      setParseLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("description", description);
      const res = await fetch("/api/mandate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Anlegen fehlgeschlagen.");
      router.push(`/mandate?neu=${encodeURIComponent(json.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Position / Titel" name="title" placeholder="VP Sales DACH" required />
        <Field label="Firma" name="company" placeholder="ACME AG" required />
        <SelectField label="Sprache" name="language" options={[["de", "Deutsch"], ["en", "English"]]} />
        <SelectField
          label="Status"
          name="status"
          options={[["aktiv", "Aktiv"], ["on-hold", "On Hold"], ["gewonnen", "Gewonnen"], ["verloren", "Verloren"]]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-sa-text-muted mb-1.5">
          Original-Datei (optional, für Beschreibungs-Auto-Fill)
        </label>
        <input
          type="file"
          name="original"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          disabled={parseLoading}
          className="block w-full text-sm text-sa-text file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-sa-gold file:text-white file:font-semibold file:cursor-pointer file:hover:bg-[#9c7c4f]"
        />
        {parseLoading && <div className="text-xs text-sa-text-muted mt-1">Datei wird gelesen ...</div>}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-sa-text-muted mb-1.5">
          Stellenbeschreibung (Markdown, mind. 100 Zeichen)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={14}
          required
          placeholder="# VP Sales DACH&#10;&#10;## Rolle&#10;..."
          className="w-full bg-white border border-sa-divider rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sa-gold/40 focus:border-sa-gold"
        />
        <div className="text-xs text-sa-text-muted mt-1">{description.length.toLocaleString("de-CH")} Zeichen</div>
      </div>

      {error && (
        <div className="bg-sa-error/10 border-l-4 border-sa-error text-sm text-sa-error p-3 rounded">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || description.length < 100}
        className="w-full bg-sa-gold text-white px-5 py-3 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-[#9c7c4f] transition-colors disabled:bg-sa-divider disabled:text-sa-text-muted disabled:cursor-not-allowed"
      >
        {loading ? "Wird committed ..." : "Mandat anlegen"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-sa-text-muted mb-1.5">
        {label}
        {required && <span className="text-sa-error ml-1">*</span>}
      </label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white border border-sa-divider rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/40 focus:border-sa-gold"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: [string, string][] }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-sa-text-muted mb-1.5">
        {label}
      </label>
      <select
        name={name}
        className="w-full bg-white border border-sa-divider rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sa-gold/40 focus:border-sa-gold"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
