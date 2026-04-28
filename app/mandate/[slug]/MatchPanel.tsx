"use client";

import { useState } from "react";
import { MatchForm } from "@/components/MatchForm";
import { ReportViewer } from "@/components/ReportViewer";
import type { MatchOutput } from "@/lib/matcher";

export function MatchPanel({ mandateSlug }: { mandateSlug: string }) {
  const [output, setOutput] = useState<MatchOutput | null>(null);

  return (
    <>
      <MatchForm mandateSlug={mandateSlug} onResult={setOutput} />
      {output && <ReportViewer output={output} onClose={() => setOutput(null)} />}
    </>
  );
}
