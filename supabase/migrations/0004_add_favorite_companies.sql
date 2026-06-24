-- Add favorite_companies column to candidate_profiles
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS favorite_companies text[] NOT NULL DEFAULT '{}';
