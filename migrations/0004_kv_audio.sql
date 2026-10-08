ALTER TABLE drafts ADD COLUMN audio_key TEXT;
ALTER TABLE drafts ADD COLUMN audio_content_type TEXT;
ALTER TABLE drafts ADD COLUMN audio_size INTEGER;
ALTER TABLE drafts ADD COLUMN audio_uploaded_at INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drafts_audio_key ON drafts(audio_key) WHERE audio_key IS NOT NULL;
