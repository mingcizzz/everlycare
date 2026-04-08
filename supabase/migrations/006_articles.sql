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
