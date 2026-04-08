-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  language TEXT DEFAULT 'zh-CN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
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
-- Knowledge Base Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_zh TEXT NOT NULL,
  title_en TEXT,
  content_zh TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('incontinence', 'nutrition', 'medication', 'mental_health', 'daily_care')),
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS - articles are publicly readable when published
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authors can manage own articles"
  ON articles FOR ALL
  USING (auth.uid() = author_id);
