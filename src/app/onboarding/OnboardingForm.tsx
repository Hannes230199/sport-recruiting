"use client";

import { useState } from "react";
import { EMPLOYMENT_TYPE_LABELS, EmploymentType } from "@/lib/types";
import { completeOnboarding } from "./actions";

const SPORT_SUGGESTIONS = [
  "Fußball", "Basketball", "Tennis", "Handball", "Volleyball",
  "Leichtathletik", "Schwimmen", "Radsport", "Ski", "Golf",
  "Rugby", "Hockey", "Fitness", "Kampfsport", "Turnen",
];

const ROLE_SUGGESTIONS = [
  "Trainer", "Athletiktrainer", "Sportmanager", "Eventmanager",
  "Marketing Manager", "Physiotherapeut", "Sportwissenschaftler",
  "Sportjournalist", "Social Media Manager", "Vereinsmanager",
];

const COMPANY_SUGGESTIONS = [
  "FC Bayern München", "Borussia Dortmund", "DFB", "DOSB", "DSB",
  "adidas", "PUMA", "Nike", "Decathlon", "Sport 2000",
  "SPOBIS", "Sportfive", "Lagardère Sports", "IMG", "Infront",
];

function parseList(str: string): string[] {
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

function addTag(current: string, tag: string): string {
  const items = parseList(current);
  if (items.includes(tag)) return current;
  return items.length === 0 ? tag : `${current.trimEnd()}, ${tag}`;
}

interface Props {
  defaultName: string;
  error?: string;
}

export function OnboardingForm({ defaultName, error }: Props) {
  const [sports, setSports] = useState("");
  const [roles, setRoles] = useState("");
  const [companies, setCompanies] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([]);

  function toggleEmployment(type: EmploymentType) {
    setEmploymentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  return (
    <form action={completeOnboarding} className="space-y-6">
      {/* Hidden fields for controlled values */}
      <input type="hidden" name="sports" value={sports} />
      <input type="hidden" name="desiredRoles" value={roles} />
      <input type="hidden" name="favoriteCompanies" value={companies} />
      {employmentTypes.map((t) => (
        <input key={t} type="hidden" name="employmentTypes" value={t} />
      ))}

      {/* Name */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Dein Name</label>
        <input
          name="fullName"
          type="text"
          required
          defaultValue={defaultName}
          placeholder="Max Mustermann"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Sports */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Welche Sportarten interessieren dich?
        </label>
        <p className="mb-3 text-xs text-slate-400">Klick auf einen Vorschlag oder tippe selbst</p>
        <input
          type="text"
          value={sports}
          onChange={(e) => setSports(e.target.value)}
          placeholder="Fußball, Basketball, Tennis…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SPORT_SUGGESTIONS.map((sport) => {
            const selected = parseList(sports).includes(sport);
            return (
              <button
                key={sport}
                type="button"
                onClick={() => setSports((s) => selected ? parseList(s).filter(x => x !== sport).join(", ") : addTag(s, sport))}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {sport}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desired roles */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Welche Stelle suchst du?
        </label>
        <p className="mb-3 text-xs text-slate-400">Klick auf einen Vorschlag oder tippe selbst</p>
        <input
          type="text"
          value={roles}
          onChange={(e) => setRoles(e.target.value)}
          placeholder="Trainer, Sportmanager, Marketing…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ROLE_SUGGESTIONS.map((role) => {
            const selected = parseList(roles).includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoles((r) => selected ? parseList(r).filter(x => x !== role).join(", ") : addTag(r, role))}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Favorite companies */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Bei welchen Arbeitgebern möchtest du arbeiten?
        </label>
        <p className="mb-3 text-xs text-slate-400">Klick auf einen Vorschlag oder tippe selbst</p>
        <input
          type="text"
          value={companies}
          onChange={(e) => setCompanies(e.target.value)}
          placeholder="FC Bayern, adidas, DFB…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMPANY_SUGGESTIONS.map((company) => {
            const selected = parseList(companies).includes(company);
            return (
              <button
                key={company}
                type="button"
                onClick={() => setCompanies((c) => selected ? parseList(c).filter(x => x !== company).join(", ") : addTag(c, company))}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {company}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Wo möchtest du arbeiten?
        </label>
        <input
          name="location"
          type="text"
          placeholder="z.B. München, Deutschlandweit, Remote…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Employment types */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">Welche Anstellungsart passt zu dir?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => {
            const selected = employmentTypes.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleEmployment(value)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-50 font-semibold text-brand-700"
                    : "border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        Profil erstellen →
      </button>

      <p className="text-center text-xs text-slate-400">
        Du kannst alle Angaben später in deinem Profil ändern.
      </p>
    </form>
  );
}
