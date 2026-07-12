"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmploymentType } from "@/lib/types";

// ─── Company Registration ────────────────────────────────────────────────────

export async function registerCompany(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/unternehmen/registrieren");

  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim() || null;

  if (!companyName || !contactName || !contactEmail) {
    redirect("/unternehmen/registrieren?error=missing_fields");
  }

  const { error } = await supabase.from("company_profiles").upsert({
    id: authData.user.id,
    company_name: companyName,
    contact_name: contactName,
    contact_email: contactEmail,
    website,
  });

  if (error) {
    console.error("registerCompany:", error.message);
    redirect("/unternehmen/registrieren?error=save_failed");
  }

  redirect("/unternehmen/job-posten");
}

// ─── Post a Job ──────────────────────────────────────────────────────────────

export async function postJob(formData: FormData) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/unternehmen/job-posten");

  // Verify company profile exists
  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!company) redirect("/unternehmen/registrieren");

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const employmentType = (String(formData.get("employment_type") ?? "vollzeit")) as EmploymentType;
  const category = String(formData.get("category") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim();
  const salaryRange = String(formData.get("salary_range") ?? "").trim() || null;
  const sourceUrl = String(formData.get("source_url") ?? "").trim() || "https://sport-recruiting.vercel.app/jobs";

  if (!title || !description) {
    redirect("/unternehmen/job-posten?error=missing_fields");
  }

  const { error } = await supabase.from("jobs").insert({
    source: "direct",
    external_id: null,
    source_url: sourceUrl,
    title,
    company: company.company_name,
    location,
    employment_type: employmentType,
    category,
    tags: [],
    description,
    salary_range: salaryRange,
    posted_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
    is_active: true,
    is_approved: false,
    posted_by: authData.user.id,
  });

  if (error) {
    console.error("postJob:", error.message);
    redirect("/unternehmen/job-posten?error=save_failed");
  }

  redirect("/unternehmen/meine-jobs");
}
