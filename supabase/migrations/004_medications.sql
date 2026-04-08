-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID REFERENCES care_recipients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'twice_daily', 'three_daily', 'weekly', 'as_needed')),
  schedule_times TIME[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view medications"
  ON medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = medications.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Primary/member can manage medications"
  ON medications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = medications.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.role IN ('primary', 'member')
        AND care_team_members.accepted_at IS NOT NULL
    )
  );
