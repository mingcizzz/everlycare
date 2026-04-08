-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID REFERENCES care_recipients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('toilet', 'medication', 'fluid', 'custom')),
  schedule JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view reminders"
  ON reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = reminders.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Primary/member can manage reminders"
  ON reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = reminders.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.role IN ('primary', 'member')
        AND care_team_members.accepted_at IS NOT NULL
    )
  );
