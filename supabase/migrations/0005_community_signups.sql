-- Community sign-up table (WhatsApp + Newsletter)
CREATE TABLE IF NOT EXISTS community_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  wants_newsletter boolean NOT NULL DEFAULT true,
  wants_whatsapp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only the service role can read; anyone (including anon) can insert
ALTER TABLE community_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up"
  ON community_signups FOR INSERT
  WITH CHECK (true);
