-- Company profiles for self-registered companies
CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_name text NOT NULL,
  website text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can manage own profile"
  ON company_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add approval flag and poster reference to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_by uuid REFERENCES auth.users;

-- Jobs posted by companies default to not approved
-- Scraped jobs keep is_approved = true (already set as DEFAULT true above,
-- so existing rows and new scraped rows are auto-approved)

CREATE INDEX IF NOT EXISTS jobs_is_approved_idx ON jobs(is_approved);
CREATE INDEX IF NOT EXISTS jobs_posted_by_idx ON jobs(posted_by);

-- RLS: companies can see their own pending jobs
CREATE POLICY "Companies can view own posted jobs"
  ON jobs FOR SELECT
  USING (posted_by = auth.uid());

-- Companies can insert their own jobs
CREATE POLICY "Companies can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (posted_by = auth.uid() AND is_approved = false);
