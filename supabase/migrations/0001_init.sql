-- Sport Recruiting Platform - initiales Datenbankschema
-- Ausführen z.B. via: supabase db push  (oder im Supabase Dashboard -> SQL Editor)

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type job_source as enum (
  'jobsimsport',
  'dshs_koeln',
  'spobis_jobs',
  'sport_job',
  'joborama'
);

create type employment_type as enum (
  'vollzeit',
  'teilzeit',
  'praktikum',
  'werkstudent',
  'ausbildung',
  'freelance',
  'unbekannt'
);

create type document_type as enum (
  'cv',
  'cover_letter',
  'certificate',
  'reference',
  'other'
);

create type application_status as enum (
  'draft',
  'submitted',
  'in_review',
  'interview',
  'offer',
  'rejected',
  'withdrawn'
);

-- ============================================================
-- JOBS (von den 5 Quellen gescraped)
-- ============================================================

create table jobs (
  id uuid primary key default gen_random_uuid(),
  source job_source not null,
  external_id text,                 -- ID/Slug auf der Quell-Website (für Dedupe)
  source_url text not null,
  title text not null,
  company text,
  location text,
  employment_type employment_type not null default 'unbekannt',
  category text,                    -- z.B. "Fußball", "Marketing", "Physiotherapie"
  tags text[] not null default '{}',
  description text not null default '',
  salary_range text,
  posted_at date,
  scraped_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- verhindert doppelte Jobs beim täglichen Re-Scrape derselben Quelle
  constraint jobs_source_external_id_unique unique (source, external_id)
);

create index jobs_source_idx on jobs (source);
create index jobs_is_active_idx on jobs (is_active);
create index jobs_category_idx on jobs (category);
create index jobs_posted_at_idx on jobs (posted_at desc);

-- Volltextsuche über Titel + Beschreibung
alter table jobs add column search_vector tsvector
  generated always as (
    to_tsvector('german', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index jobs_search_idx on jobs using gin (search_vector);

-- ============================================================
-- CANDIDATE PROFILES (1:1 mit auth.users)
-- ============================================================

create table candidate_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  location text,
  bio text,
  skills text[] not null default '{}',
  sports text[] not null default '{}',
  desired_roles text[] not null default '{}',
  desired_locations text[] not null default '{}',
  employment_types employment_type[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CANDIDATE DOCUMENTS (Lebenslauf, Zeugnisse, etc.)
-- Dateien selbst liegen im Supabase Storage Bucket "candidate-documents"
-- ============================================================

create table candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidate_profiles (id) on delete cascade,
  type document_type not null default 'other',
  file_name text not null,
  storage_path text not null,       -- Pfad im Storage Bucket
  uploaded_at timestamptz not null default now()
);

create index candidate_documents_candidate_idx on candidate_documents (candidate_id);

-- ============================================================
-- APPLICATIONS (Bewerbungen)
-- ============================================================

create table applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidate_profiles (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  status application_status not null default 'draft',
  match_score smallint check (match_score between 0 and 100),
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint applications_candidate_job_unique unique (candidate_id, job_id)
);

create index applications_candidate_idx on applications (candidate_id);
create index applications_job_idx on applications (job_id);
create index applications_status_idx on applications (status);

-- ============================================================
-- updated_at TRIGGER (generisch für alle Tabellen mit updated_at)
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger jobs_set_updated_at before update on jobs
  for each row execute function set_updated_at();

create trigger candidate_profiles_set_updated_at before update on candidate_profiles
  for each row execute function set_updated_at();

create trigger applications_set_updated_at before update on applications
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table jobs enable row level security;
alter table candidate_profiles enable row level security;
alter table candidate_documents enable row level security;
alter table applications enable row level security;

-- Jobs: für alle (auch nicht eingeloggte Besucher) lesbar
create policy "Jobs sind öffentlich lesbar"
  on jobs for select
  using (true);

-- Schreibender Zugriff auf jobs erfolgt ausschließlich über den
-- Service-Role-Key im Scraper (umgeht RLS) - daher keine INSERT/UPDATE Policy
-- für reguläre Nutzer.

-- Candidate Profiles: nur der eigene Eintrag
create policy "Eigenes Profil lesen"
  on candidate_profiles for select
  using (auth.uid() = id);

create policy "Eigenes Profil anlegen"
  on candidate_profiles for insert
  with check (auth.uid() = id);

create policy "Eigenes Profil aktualisieren"
  on candidate_profiles for update
  using (auth.uid() = id);

-- Candidate Documents: nur eigene Dokumente
create policy "Eigene Dokumente lesen"
  on candidate_documents for select
  using (auth.uid() = candidate_id);

create policy "Eigene Dokumente anlegen"
  on candidate_documents for insert
  with check (auth.uid() = candidate_id);

create policy "Eigene Dokumente löschen"
  on candidate_documents for delete
  using (auth.uid() = candidate_id);

-- Applications: nur eigene Bewerbungen
create policy "Eigene Bewerbungen lesen"
  on applications for select
  using (auth.uid() = candidate_id);

create policy "Eigene Bewerbungen anlegen"
  on applications for insert
  with check (auth.uid() = candidate_id);

create policy "Eigene Bewerbungen aktualisieren"
  on applications for update
  using (auth.uid() = candidate_id);

create policy "Eigene Bewerbungen löschen"
  on applications for delete
  using (auth.uid() = candidate_id);

-- ============================================================
-- STORAGE BUCKET für Bewerbungsunterlagen
-- ============================================================
-- Hinweis: Buckets können nicht per SQL-Migration angelegt werden in
-- älteren Supabase-Projekten. Falls der folgende Insert fehlschlägt,
-- den Bucket "candidate-documents" (private) manuell im Dashboard unter
-- Storage anlegen.

insert into storage.buckets (id, name, public)
values ('candidate-documents', 'candidate-documents', false)
on conflict (id) do nothing;

create policy "Eigene Dateien lesen"
  on storage.objects for select
  using (bucket_id = 'candidate-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Eigene Dateien hochladen"
  on storage.objects for insert
  with check (bucket_id = 'candidate-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Eigene Dateien löschen"
  on storage.objects for delete
  using (bucket_id = 'candidate-documents' and auth.uid()::text = (storage.foldername(name))[1]);
