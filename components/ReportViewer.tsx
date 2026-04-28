"use client";

import { useEffect, useRef } from "react";
import type { MatchOutput } from "@/lib/matcher";

type Props = {
  output: MatchOutput;
  onClose: () => void;
};

export function ReportViewer({ output, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleDownload() {
    const blob = new Blob([output.reportHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = output.result.candidate.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.href = url;
    a.download = `match-report-${slug || "kandidat"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  const totalInput = output.usage.inputTokens + output.usage.cacheCreationTokens + output.usage.cacheReadTokens;
  const cacheRate = totalInput > 0 ? Math.round((output.usage.cacheReadTokens / totalInput) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-sa-cream rounded-lg shadow-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-sa-divider bg-white">
          <div>
            <div className="sa-eyebrow flex items-center gap-2">
              Match-Report
              {output.cached && (
                <span className="text-[10px] bg-sa-success/15 text-sa-success px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                  Aus Cache
                </span>
              )}
            </div>
            <div className="text-sm text-sa-text-strong font-semibold">{output.result.candidate.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-sa-divider rounded hover:border-sa-gold hover:text-sa-gold transition-colors"
            >
              Drucken / PDF
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-sa-gold text-white rounded hover:bg-[#9c7c4f] transition-colors"
            >
              HTML herunterladen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sa-text-muted hover:text-sa-error transition-colors"
              title="Esc"
            >
              ✕ Schliessen
            </button>
          </div>
        </div>

        <iframe
          ref={iframeRef}
          srcDoc={output.reportHtml}
          title="Match-Report"
          className="flex-1 w-full bg-sa-cream"
        />

        <div className="px-6 py-2 border-t border-sa-divider bg-white text-xs text-sa-text-muted flex items-center justify-between">
          <span>
            Modell: <strong>{output.usage.model}</strong> · Input{" "}
            {(output.usage.inputTokens + output.usage.cacheCreationTokens).toLocaleString("de-CH")} Tok
            {output.usage.cacheReadTokens > 0 && (
              <>
                {" "}
                · Cached {output.usage.cacheReadTokens.toLocaleString("de-CH")} Tok ({cacheRate}%)
              </>
            )}{" "}
            · Output {output.usage.outputTokens.toLocaleString("de-CH")} Tok
          </span>
          <span>Score: <strong style={{ color: output.result.score.color }}>{output.result.score.value}%</strong> · {output.result.score.category}</span>
        </div>
      </div>
    </div>
  );
}
