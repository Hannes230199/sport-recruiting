-- Store extracted plain text from uploaded CV for use in matching
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS cv_text text;
