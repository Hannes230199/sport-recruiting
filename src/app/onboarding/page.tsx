import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

interface OnboardingPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const userName = (data.user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="mx-auto max-w-xl py-10">
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

      <OnboardingForm defaultName={userName} error={error} />
    </div>
  );
}
