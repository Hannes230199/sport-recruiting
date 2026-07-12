"use client";

import { useState } from "react";
import { generateApplicationHelper, AIApplyResult } from "@/app/actions/ai-apply";

interface Props {
  jobId: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {copied ? "✓ Kopiert" : "Kopieren"}
    </button>
  );
}

export function AIApplyHelper({ jobId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<AIApplyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    const res = await generateApplicationHelper(jobId);
    if (res.success && res.data) {
      setResult(res.data);
      setStatus("done");
    } else {
      setErrorMsg(res.error ?? "Fehler");
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        onClick={handleGenerate}
        className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
      >
        ✨ KI-Bewerbungshelfer
      </button>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-600">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        KI analysiert Job & Profil…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        {errorMsg}
        <button
          onClick={() => setStatus("idle")}
          className="ml-2 underline"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-base">✨</span>
        <h3 className="text-sm font-bold text-slate-900">KI-Bewerbungshelfer</h3>
        <button
          onClick={() => { setStatus("idle"); setResult(null); }}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600"
        >
          Neu generieren
        </button>
      </div>

      {/* Highlights */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Im CV hervorheben
        </p>
        <ul className="space-y-1.5">
          {result.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-brand-500">→</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cover Letter */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anschreiben</p>
          <CopyButton text={result.coverLetter} />
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {result.coverLetter}
        </div>
      </div>

      {/* Reach Out */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            LinkedIn / E-Mail Nachricht
          </p>
          <CopyButton text={result.reachOut} />
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {result.reachOut}
        </div>
      </div>
    </div>
  );
}
