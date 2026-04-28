"use client";

import { useState } from "react";
import type { MatchOutput } from "@/lib/matcher";

type Tab = "paste" | "upload";
type Model = "sonnet" | "haiku";

type Props = {
  mandateSlug: string;
  onResult: (output: MatchOutput) => void;
};

export function MatchForm({ mandateSlug, onResult }: Props) {
  const [tab, setTab] = useState<Tab>("paste");
  const [cvText, setCvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [model, setModel] = useState<Model>("sonnet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Parse fehlgeschlagen.");
      setCvText(json.text);
      setTab("paste");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse fehlgeschlagen.");
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleMatch() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mandateSlug, cvText, model }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Match fehlgeschlagen.");
      onResult(json as MatchOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  const canMatch = cvText.trim().length >= 50 && !loading;

  return (
    <div className="space-y-4">
      <div className="flex border-b border-sa-divider">
        <button
          type="button"
          onClick={() => setTab("paste")}
          className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
            tab === "paste"
              ? "text-sa-gold border-b-2 border-sa-gold -mb-px"
              : "text-sa-text-muted hover:text-sa-text"
          }`}
        >
          CV einfügen
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
            tab === "upload"
              ? "text-sa-gold border-b-2 border-sa-gold -mb-px"
              : "text-sa-text-muted hover:text-sa-text"
          }`}
        >
          Datei hochladen
        </button>
      </div>

      {tab === "paste" ? (
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="CV als Text einfügen (mind. 50 Zeichen) ..."
          rows={12}
          className="w-full bg-white border border-sa-divider rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sa-gold/40 focus:border-sa-gold"
        />
      ) : (
        <label className="block border-2 border-dashed border-sa-divider rounded-md p-6 text-center cursor-pointer hover:border-sa-gold transition-colors bg-white">
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <div className="text-sm text-sa-text">
            {fileName ? (
              <span>
                <span className="font-semibold">{fileName}</span> — {cvText.length.toLocaleString("de-CH")} Zeichen extrahiert.{" "}
                <span className="text-sa-gold">Andere Datei wählen</span>
              </span>
            ) : (
              <>
                <span className="font-semibold text-sa-gold">Datei wählen</span>
                <span className="text-sa-text-muted"> (PDF, DOCX, TXT, MD)</span>
              </>
            )}
          </div>
        </label>
      )}

      <div className="flex items-center gap-3 text-sm">
        <label className="text-sa-text-muted">Modell:</label>
        <div className="flex border border-sa-divider rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setModel("sonnet")}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              model === "sonnet" ? "bg-sa-gold text-white" : "bg-white text-sa-text-muted hover:text-sa-text"
            }`}
          >
            Sonnet
          </button>
          <button
            type="button"
            onClick={() => setModel("haiku")}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              model === "haiku" ? "bg-sa-gold text-white" : "bg-white text-sa-text-muted hover:text-sa-text"
            }`}
          >
            Haiku (Sparmodus)
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleMatch}
        disabled={!canMatch}
        className="w-full bg-sa-gold text-white px-5 py-3 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-[#9c7c4f] transition-colors disabled:bg-sa-divider disabled:text-sa-text-muted disabled:cursor-not-allowed"
      >
        {loading ? "Match läuft (10–25 Sek.)..." : "Match starten"}
      </button>

      {error && (
        <div className="bg-sa-error/10 border-l-4 border-sa-error text-sm text-sa-error p-3 rounded">
          <strong>Fehler:</strong> {error}
        </div>
      )}
    </div>
  );
}
