"use client";

import { useState, useRef } from "react";
import { communitySignup } from "@/app/actions/community";

export function CommunitySignupForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [wantsWhatsapp, setWantsWhatsapp] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const data = new FormData(e.currentTarget);
    const result = await communitySignup(data);
    if (result.success) {
      setStatus("success");
      formRef.current?.reset();
      setWantsWhatsapp(false);
    } else {
      setErrorMsg(result.error ?? "Fehler");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-100 px-8 py-10 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-green-800">Du bist dabei!</h3>
        <p className="mt-1 text-sm text-green-700">
          Wir melden uns in Kürze bei dir. Willkommen in der Community!
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Name *</label>
          <input
            name="name"
            type="text"
            required
            placeholder="Max Mustermann"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">E-Mail *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="max@example.de"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {/* Channel selection */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Ich möchte beitreten via *</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50">
            <input type="checkbox" name="wants_newsletter" className="rounded border-slate-300 text-brand-600 focus:ring-brand-400" defaultChecked />
            <span>📧 Newsletter</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-colors has-[:checked]:border-green-400 has-[:checked]:bg-green-50">
            <input
              type="checkbox"
              name="wants_whatsapp"
              className="rounded border-slate-300 text-green-600 focus:ring-green-400"
              onChange={(e) => setWantsWhatsapp(e.target.checked)}
            />
            <span>💬 WhatsApp-Gruppe</span>
          </label>
        </div>
      </div>

      {/* Phone — only required for WhatsApp */}
      {wantsWhatsapp && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            WhatsApp-Nummer *
          </label>
          <input
            name="phone"
            type="tel"
            required={wantsWhatsapp}
            placeholder="+49 170 1234567"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}

      {status === "error" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Wird gespeichert…" : "Jetzt beitreten →"}
      </button>
    </form>
  );
}
