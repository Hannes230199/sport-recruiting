-- Add company_url column to store the company's website URL
-- scraped from job listings (used for logo lookups in the UI)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS company_url text;
