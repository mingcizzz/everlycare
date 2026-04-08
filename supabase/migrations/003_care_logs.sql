-- Care Logs (the core data model)
CREATE TABLE IF NOT EXISTS care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID REFERENCES care_recipients(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('bowel', 'urination', 'meal', 'medication', 'mood', 'hygiene', 'activity', 'note')),
  occurred_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_care_logs_recipient_time ON care_logs(care_recipient_id, occurred_at DESC);
CREATE INDEX idx_care_logs_type ON care_logs(care_recipient_id, log_type, occurred_at DESC);

-- RLS
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

-- Team members can view logs
CREATE POLICY "Team members can view care logs"
  ON care_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = care_logs.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.accepted_at IS NOT NULL
    )
  );

-- Members and primary can insert logs
CREATE POLICY "Team members can insert care logs"
  ON care_logs FOR INSERT
  WITH CHECK (
    auth.uid() = logged_by
    AND EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = care_logs.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.role IN ('primary', 'member')
        AND care_team_members.accepted_at IS NOT NULL
    )
  );

-- Users can update their own logs
CREATE POLICY "Users can update own logs"
  ON care_logs FOR UPDATE
  USING (auth.uid() = logged_by);

-- Users can delete their own logs
CREATE POLICY "Users can delete own logs"
  ON care_logs FOR DELETE
  USING (auth.uid() = logged_by);
