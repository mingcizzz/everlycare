-- Care Recipients
CREATE TABLE IF NOT EXISTS care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  medical_conditions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  notes TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care Team Members
CREATE TABLE IF NOT EXISTS care_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID REFERENCES care_recipients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('primary', 'member', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (care_recipient_id, user_id)
);

-- RLS
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_team_members ENABLE ROW LEVEL SECURITY;

-- Users can view recipients they are team members of
CREATE POLICY "Team members can view care recipients"
  ON care_recipients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = care_recipients.id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.accepted_at IS NOT NULL
    )
  );

-- Only creator can insert
CREATE POLICY "Creator can insert care recipients"
  ON care_recipients FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Primary caregivers can update
CREATE POLICY "Primary caregivers can update care recipients"
  ON care_recipients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = care_recipients.id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.role = 'primary'
    )
  );

-- Team member policies
CREATE POLICY "Users can view their team memberships"
  ON care_team_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM care_team_members ctm
    WHERE ctm.care_recipient_id = care_team_members.care_recipient_id
      AND ctm.user_id = auth.uid()
  ));

CREATE POLICY "Primary caregivers can manage team"
  ON care_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM care_team_members
      WHERE care_team_members.care_recipient_id = care_team_members.care_recipient_id
        AND care_team_members.user_id = auth.uid()
        AND care_team_members.role = 'primary'
    )
    OR auth.uid() = user_id  -- Allow self-insert on creation
  );
