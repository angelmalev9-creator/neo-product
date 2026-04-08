ALTER TABLE demo_sessions ADD COLUMN IF NOT EXISTS custom_voice_name varchar(100) DEFAULT NULL;
ALTER TABLE demo_sessions ADD COLUMN IF NOT EXISTS voice_training_status varchar(20) DEFAULT NULL;
ALTER TABLE demo_sessions ADD COLUMN IF NOT EXISTS voice_training_submitted_at timestamptz DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload voice samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-samples');

CREATE POLICY "Users can read own voice samples"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'voice-samples');

CREATE POLICY "Users can delete own voice samples"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-samples');