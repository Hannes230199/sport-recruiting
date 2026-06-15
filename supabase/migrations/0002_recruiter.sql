-- Sport Recruiting Platform - Recruiter-Bereich
-- Ausführen z.B. via: supabase db push  (oder im Supabase Dashboard -> SQL Editor)

-- ============================================================
-- ROLLE "RECRUITER"
-- ============================================================
-- Markiert ein candidate_profiles-Profil als Recruiter:in. Wird NICHT über
-- das Profilformular der Kandidat:innen gesetzt, sondern manuell per SQL
-- (siehe README, Abschnitt "Recruiter-Zugang vergeben").

alter table candidate_profiles
  add column is_recruiter boolean not null default false;

-- ============================================================
-- HELPER-FUNKTION für RLS-Policies
-- ============================================================
-- security definer + fest gesetzter search_path, damit die Funktion beim
-- Lesen von candidate_profiles nicht erneut durch die (sich sonst selbst
-- referenzierende) RLS-Policy "Recruiter lesen alle Profile" läuft.

create or replace function is_recruiter()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from candidate_profiles
    where id = auth.uid()
      and is_recruiter = true
  );
$$;

-- ============================================================
-- RLS: Recruiter:innen dürfen alle Profile & Bewerbungen sehen
-- und den Status/die Notizen von Bewerbungen aktualisieren.
-- ============================================================

create policy "Recruiter lesen alle Profile"
  on candidate_profiles for select
  using (is_recruiter());

create policy "Recruiter lesen alle Bewerbungen"
  on applications for select
  using (is_recruiter());

create policy "Recruiter aktualisieren alle Bewerbungen"
  on applications for update
  using (is_recruiter());
