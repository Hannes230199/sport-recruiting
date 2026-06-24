import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

interface OnboardingPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const userName = data.user.user_metadata?.full_name ?? "";

  return (
    <div className="mx-auto max-w-xl py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white">
          🏅
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {userName ? `Hallo, ${userName.split(" ")[0]}!` : "Willkommen!"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Erzähl uns kurz, wonach du suchst — so finden wir die passenden Jobs für dich.
        </p>
      </div>

      <form action={completeOnboarding} className="space-y-6">
        {/* Name */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Dein Name
          </label>
          <input
            name="fullName"
            type="text"
            required
            defaultValue={userName}
            placeholder="Max Mustermann"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Sports */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Welche Sportarten interessieren dich?
          </label>
          <p className="mb-3 text-xs text-slate-400">
            Kommagetrennt eingeben, z.B. &quot;Fußball, Basketball&quot;
          </p>
          <input
            name="sports"
            type="text"
            placeholder="Fußball, Basketball, Tennis…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SPORT_SUGGESTIONS.map((sport) => (
              <button
                key={sport}
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                onClick={undefined}
                data-tag-target="sports"
                data-tag-value={sport}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Desired roles */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Welche Stelle suchst du?
          </label>
          <p className="mb-3 text-xs text-slate-400">
            Kommagetrennt eingeben, z.B. &quot;Trainer, Sportmanager&quot;
          </p>
          <input
            name="desiredRoles"
            type="text"
            placeholder="Trainer, Sportmanager, Marketing…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ROLE_SUGGESTIONS.map((role) => (
              <button
                key={role}
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {role}
              </button>
            ))}
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
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Welche Anstellungsart passt zu dir?
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
              ([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <input
                    type="checkbox"
                    name="employmentTypes"
                    value={value}
                    className="accent-brand-600"
                  />
                  {label}
                </label>
              )
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Profil erstellen &rarr;
        </button>

        <p className="text-center text-xs text-slate-400">
          Du kannst alle Angaben später in deinem Profil ändern.
        </p>
      </form>
    </div>
  );
}
